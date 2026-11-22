/**
 * Moteur de passage d'un QCM : démarrage, ordre des questions et des choix,
 * correction immédiate (entraînement), fin de tentative, accès au corrigé, chrono.
 * Fonctions pures : aucune dépendance au stockage ni à l'interface.
 */
import { scoreQuestion, scoreQuiz, type Given, type QuestionScore, type QuizResult } from './scoring';
import type { Answer, Attempt, AttemptMode, Choice, Question, Quiz } from './types';

// ---- Hasard reproductible -------------------------------------------------

/** Empreinte 32 bits d'une chaîne (FNV-1a). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire mulberry32 : même graine, même suite. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mélange de Fisher-Yates déterministe : pour une même graine, le même ordre.
 * Une tentative reprise retrouve donc exactement le même ordre de questions et de choix,
 * sans avoir à le stocker.
 */
export function shuffled<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  const next = rng(hash(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---- Démarrage ------------------------------------------------------------

export interface StartOptions {
  id?: string;
  now?: Date;
  /** Limiter la tentative à ces questions (ex. « refaire les erreurs »). */
  onlyQuestionIds?: readonly string[];
}

export function startAttempt(quiz: Quiz, mode: AttemptMode, opts: StartOptions = {}): Attempt {
  const id = opts.id ?? crypto.randomUUID();
  const keep = opts.onlyQuestionIds ? new Set(opts.onlyQuestionIds) : null;
  const ids = [...quiz.questions]
    .sort((a, b) => a.position - b.position)
    .map((q) => q.id)
    .filter((qid) => !keep || keep.has(qid));
  return {
    id,
    quizId: quiz.id,
    quizVersion: quiz.version,
    mode,
    status: 'in_progress',
    startedAt: (opts.now ?? new Date()).toISOString(),
    finishedAt: null,
    elapsedSec: 0,
    currentIndex: 0,
    questionOrder: quiz.shuffle ? shuffled(ids, id) : ids,
    score: null,
    maxScore: null,
    quizSnapshot: quiz,
  };
}

/** Le QCM tel qu'il était au démarrage de la tentative (sinon la version actuelle). */
export function quizOf(attempt: Attempt, current: Quiz | null): Quiz | null {
  return attempt.quizSnapshot ?? current;
}

/** Questions de la tentative, dans l'ordre de passage. */
export function questionsOf(quiz: Quiz, attempt: Attempt): Question[] {
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  return attempt.questionOrder.map((id) => byId.get(id)).filter((q): q is Question => !!q);
}

/** Choix d'une question dans l'ordre d'affichage (mélangés si le QCM le demande). */
export function choicesOf(quiz: Quiz, attempt: Attempt, question: Question): Choice[] {
  const sorted = [...question.choices].sort((a, b) => a.position - b.position);
  return quiz.shuffle ? shuffled(sorted, `${attempt.id}:${question.id}`) : sorted;
}

// ---- Réponses -------------------------------------------------------------

export function emptyAnswer(questionId: string): Answer {
  return { questionId, selected: [], correct: null, points: null, timeSec: 0, flagged: false };
}

/** Une réponse a-t-elle été donnée (case cochée ou texte saisi) ? */
export function isAnswered(answer: Pick<Answer, 'selected' | 'text' | 'texts'> | undefined | null): boolean {
  return !!answer && (answer.selected.length > 0 || !!answer.text?.trim() || !!answer.texts?.some((t) => t?.trim()));
}

const given = (a: Answer | undefined): Given => ({ selected: a?.selected ?? [], text: a?.text, texts: a?.texts });

/** Nouvelle sélection après un clic : remplace (choix unique) ou bascule (choix multiples). */
export function toggleChoice(question: Question, selected: readonly string[], choiceId: string): string[] {
  if (question.type === 'single') return [choiceId];
  return selected.includes(choiceId) ? selected.filter((id) => id !== choiceId) : [...selected, choiceId];
}

/** En entraînement : une réponse validée est corrigée et ne peut plus changer. */
export function isLocked(attempt: Attempt, answer: Answer | undefined): boolean {
  return attempt.status !== 'in_progress' || (attempt.mode === 'training' && answer?.correct != null);
}

/** Corrige une seule réponse (bouton « Valider » en entraînement). */
export function checkAnswer(quiz: Quiz, question: Question, answer: Answer): Answer {
  const r = scoreQuestion(question, answer.selected, quiz.scoring, answer.text, answer.texts);
  return { ...answer, correct: r.correct, points: r.points };
}

export type QuestionOutcome = 'correct' | 'partial' | 'wrong' | 'unanswered';

export function outcomeOf(answer: Answer | undefined, score: QuestionScore | undefined): QuestionOutcome {
  if (!isAnswered(answer)) return 'unanswered';
  if (!score) return 'unanswered';
  if (score.correct) return 'correct';
  return score.points > 0 ? 'partial' : 'wrong';
}

// ---- Fin de tentative -----------------------------------------------------

export interface Finished {
  attempt: Attempt;
  answers: Answer[];
  result: QuizResult;
}

/** Corrige toutes les réponses et clôt la tentative. */
export function finishAttempt(quiz: Quiz, attempt: Attempt, answers: readonly Answer[], now = new Date()): Finished {
  const questions = questionsOf(quiz, attempt);
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const selected = Object.fromEntries(questions.map((q) => [q.id, given(byQuestion.get(q.id))]));
  const result = scoreQuiz(questions, selected, quiz.scoring, quiz.passThreshold);
  const graded = questions.map((q) => {
    const a = byQuestion.get(q.id) ?? emptyAnswer(q.id);
    const r = result.perQuestion[q.id];
    return { ...a, correct: r.correct, points: r.points };
  });
  return {
    attempt: {
      ...attempt,
      status: 'finished',
      finishedAt: now.toISOString(),
      score: result.score,
      maxScore: result.maxScore,
    },
    answers: graded,
    result,
  };
}

/**
 * Recalcule le résultat d'une tentative terminée (récapitulatif, corrigé). `stored` : reprend les notes
 * enregistrées avec les réponses, sans corriger (examen d'un site corrigé par le serveur, sans réponses).
 */
export function resultOf(quiz: Quiz, attempt: Attempt, answers: readonly Answer[], stored = false): QuizResult {
  const questions = questionsOf(quiz, attempt);
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  if (stored) {
    // Détail par question pas encore publié (examen corrigé par le serveur) : la note de la tentative seule.
    if (attempt.score != null && questions.some((q) => byQuestion.get(q.id)?.points == null)) {
      const maxScore = attempt.maxScore ?? questions.reduce((s, q) => s + q.points, 0);
      const ratio = maxScore > 0 ? attempt.score / maxScore : 0;
      return { score: attempt.score, maxScore, ratio, passed: ratio >= quiz.passThreshold, perQuestion: {} };
    }
    const perQuestion = Object.fromEntries(
      questions.map((q) => {
        const a = byQuestion.get(q.id);
        return [q.id, { points: a?.points ?? 0, correct: a?.correct === true }];
      }),
    );
    const score = Math.round(Object.values(perQuestion).reduce((s, r) => s + r.points, 0) * 100) / 100;
    const maxScore = questions.reduce((s, q) => s + q.points, 0);
    const ratio = maxScore > 0 ? score / maxScore : 0;
    return { score, maxScore, ratio, passed: ratio >= quiz.passThreshold, perQuestion };
  }
  const selected = Object.fromEntries(questions.map((q) => [q.id, given(byQuestion.get(q.id))]));
  return scoreQuiz(questions, selected, quiz.scoring, quiz.passThreshold);
}

/** Questions ratées ou sans réponse, pour « refaire les erreurs ». */
export function missedQuestionIds(result: QuizResult): string[] {
  return Object.entries(result.perQuestion)
    .filter(([, r]) => !r.correct)
    .map(([id]) => id);
}

// ---- Corrigé et chrono ----------------------------------------------------

/**
 * Le corrigé est-il visible ?
 * - never : jamais ;
 * - after_submit : une fois la tentative terminée ;
 * - after_pass : une fois la tentative terminée ET réussie.
 * En entraînement, la correction question par question est toujours montrée,
 * sauf si le QCM interdit tout corrigé.
 */
export function canSeeSolution(quiz: Quiz, attempt: Attempt, passed?: boolean): boolean {
  if (quiz.solutionVisibility === 'never') return false;
  if (attempt.status !== 'finished') return false;
  if (quiz.solutionVisibility === 'after_pass') return passed === true;
  return true;
}

/** Correction immédiate en entraînement (bonne réponse et explication après « Valider »). */
export function showsInstantFeedback(quiz: Quiz, attempt: Attempt): boolean {
  return attempt.mode === 'training' && quiz.solutionVisibility !== 'never';
}

/** Secondes restantes en examen chronométré, sinon null. */
export function remainingSec(quiz: Quiz, attempt: Attempt): number | null {
  if (attempt.mode !== 'exam' || !quiz.timeLimitSec) return null;
  return Math.max(0, quiz.timeLimitSec - attempt.elapsedSec);
}

/** Durée lisible : 75 → « 1:15 », 3725 → « 1:02:05 ». */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
