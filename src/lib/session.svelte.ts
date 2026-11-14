import { app } from '$lib/app.svelte';
import {
  checkAnswer,
  choicesOf,
  emptyAnswer,
  finishAttempt,
  isLocked,
  questionsOf,
  quizOf,
  remainingSec,
  toggleChoice,
} from '$lib/domain/session';
import type { Answer, Attempt, Choice, Question, Quiz } from '$lib/domain/types';

/** Intervalle d'enregistrement du chrono, en secondes. */
const PERSIST_EVERY = 5;

/**
 * État d'une tentative ouverte à l'écran (Svelte 5).
 * Chaque réponse est enregistrée immédiatement : fermer l'application ne perd rien.
 */
export class AttemptSession {
  quiz = $state<Quiz | null>(null);
  attempt = $state<Attempt | null>(null);
  answers = $state<Record<string, Answer>>({});
  error = $state<string | null>(null);

  questions = $derived(this.quiz && this.attempt ? questionsOf(this.quiz, this.attempt) : []);
  index = $derived(this.attempt?.currentIndex ?? 0);
  question = $derived<Question | undefined>(this.questions[this.index]);
  answer = $derived<Answer | undefined>(this.question ? this.answers[this.question.id] : undefined);
  choices = $derived<Choice[]>(
    this.quiz && this.attempt && this.question ? choicesOf(this.quiz, this.attempt, this.question) : [],
  );
  locked = $derived(this.attempt ? isLocked(this.attempt, this.answer) : true);
  answeredCount = $derived(this.questions.filter((q) => (this.answers[q.id]?.selected.length ?? 0) > 0).length);
  remaining = $derived(this.quiz && this.attempt ? remainingSec(this.quiz, this.attempt) : null);

  #timer: ReturnType<typeof setInterval> | null = null;
  #ticks = 0;
  #finishing = false;

  async load(attemptId: string) {
    try {
      const repo = await app.repo();
      const attempt = await repo.getAttempt(attemptId);
      if (!attempt) throw new Error('attempt not found');
      const quiz = quizOf(attempt, await repo.getQuiz(attempt.quizId));
      if (!quiz) throw new Error('quiz not found');
      const answers: Record<string, Answer> = {};
      for (const a of await repo.listAnswers(attemptId)) answers[a.questionId] = a;
      // Pas d'instantané (tentatives d'avant le lot 1) : on le fige maintenant.
      if (!attempt.quizSnapshot) {
        attempt.quizSnapshot = quiz;
        await repo.saveAttempt(attempt);
      }
      this.quiz = quiz;
      this.attempt = attempt;
      this.answers = answers;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  /** Lance le chrono (temps total et temps par question). */
  startClock() {
    this.stopClock();
    this.#timer = setInterval(() => this.#tick(), 1000);
  }

  async stopClock() {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
    await this.persist();
  }

  async #tick() {
    const a = this.attempt;
    if (!a || a.status !== 'in_progress') return;
    a.elapsedSec += 1;
    const q = this.question;
    if (q) {
      const ans = this.answers[q.id] ?? emptyAnswer(q.id);
      this.answers[q.id] = { ...ans, timeSec: ans.timeSec + 1 };
    }
    if (++this.#ticks % PERSIST_EVERY === 0) await this.persist();
    if (this.remaining === 0) await this.finish();
  }

  /** Enregistre l'avancement (sans réécrire l'instantané du QCM). */
  async persist() {
    const a = this.attempt;
    if (!a) return;
    const repo = await app.repo();
    await repo.saveAttempt({ ...$state.snapshot(a), quizSnapshot: undefined });
    const q = this.question;
    if (q && this.answers[q.id]) await repo.saveAnswer(a.id, $state.snapshot(this.answers[q.id]));
  }

  async #saveAnswer(answer: Answer) {
    if (!this.attempt) return;
    this.answers[answer.questionId] = answer;
    const repo = await app.repo();
    await repo.saveAnswer(this.attempt.id, $state.snapshot(answer));
  }

  async choose(choiceId: string) {
    const q = this.question;
    if (!q || this.locked) return;
    const current = this.answers[q.id] ?? emptyAnswer(q.id);
    await this.#saveAnswer({ ...current, selected: toggleChoice(q, current.selected, choiceId) });
  }

  async toggleFlag() {
    const q = this.question;
    if (!q || this.attempt?.status !== 'in_progress') return;
    const current = this.answers[q.id] ?? emptyAnswer(q.id);
    await this.#saveAnswer({ ...current, flagged: !current.flagged });
  }

  /** Entraînement : corrige la question courante et la verrouille. */
  async validate() {
    const q = this.question;
    if (!q || !this.quiz || this.locked) return;
    const current = this.answers[q.id] ?? emptyAnswer(q.id);
    if (!current.selected.length) return;
    await this.#saveAnswer(checkAnswer(this.quiz, q, current));
  }

  async go(index: number) {
    const a = this.attempt;
    if (!a) return;
    await this.persist(); // temps passé sur la question qu'on quitte
    a.currentIndex = Math.min(Math.max(0, index), this.questions.length - 1);
    await this.persist();
  }

  /** Termine la tentative ; renvoie vrai si elle vient d'être close. */
  async finish(): Promise<boolean> {
    if (!this.quiz || !this.attempt || this.#finishing || this.attempt.status !== 'in_progress') return false;
    this.#finishing = true;
    try {
      if (this.#timer) clearInterval(this.#timer);
      this.#timer = null;
      const done = finishAttempt(this.quiz, $state.snapshot(this.attempt) as Attempt, Object.values($state.snapshot(this.answers)));
      const repo = await app.repo();
      for (const ans of done.answers) await repo.saveAnswer(done.attempt.id, ans);
      await repo.saveAttempt({ ...done.attempt, quizSnapshot: undefined });
      this.attempt = done.attempt;
      this.answers = Object.fromEntries(done.answers.map((a) => [a.questionId, a]));
      await app.reload();
      return true;
    } finally {
      this.#finishing = false;
    }
  }
}
