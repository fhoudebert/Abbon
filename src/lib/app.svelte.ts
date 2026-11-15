import { getRepository, type Repository } from '$lib/data';
import { seedDemo } from '$lib/data/seed';
import { progressOf, type ProgressInfo } from '$lib/domain/progress';
import { createPin, verifyPin, type PinRecord } from '$lib/domain/pin';
import { cloneQuiz, newQuiz } from '$lib/domain/factory';
import { startAttempt } from '$lib/domain/session';
import type { Attempt, AttemptMode, Category, Quiz, QuizSummary } from '$lib/domain/types';
import { i18n, setLang } from '$lib/i18n/index.svelte';

export interface QuizEntry {
  quiz: QuizSummary;
  category: Category | undefined;
  info: ProgressInfo;
}

const PIN_KEY = 'admin_pin';

/** État global de l'application (Svelte 5). */
class AppState {
  ready = $state(false);
  error = $state<string | null>(null);
  backend = $state<Repository['backend'] | null>(null);
  categories = $state<Category[]>([]);
  quizzes = $state<QuizSummary[]>([]);
  attempts = $state<Attempt[]>([]);
  /** Un code PIN protège-t-il l'administration ? */
  pinSet = $state(false);
  /** Administration déverrouillée pour cette session (toujours vrai sans PIN). */
  adminUnlocked = $state(false);

  #repo: Repository | null = null;

  /** QCM publiés avec leur statut de progression. */
  entries = $derived.by<QuizEntry[]>(() => {
    const byQuiz = new Map<string, Attempt[]>();
    for (const a of this.attempts) byQuiz.set(a.quizId, [...(byQuiz.get(a.quizId) ?? []), a]);
    return this.quizzes
      .filter((q) => q.status === 'published')
      .map((quiz) => ({
        quiz,
        category: this.categories.find((c) => c.id === quiz.categoryId),
        info: progressOf(byQuiz.get(quiz.id) ?? [], quiz.questionCount),
      }));
  });

  async init() {
    if (this.#repo) return;
    try {
      const repo = await getRepository();
      this.#repo = repo;
      this.backend = repo.backend;
      const lang = await repo.getSetting('lang');
      if (lang) setLang(lang);
      else setLang(i18n.lang);
      this.pinSet = !!(await repo.getSetting(PIN_KEY));
      await seedDemo(repo);
      await this.reload();
      this.ready = true;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  async reload() {
    if (!this.#repo) return;
    const [categories, quizzes, attempts] = await Promise.all([
      this.#repo.listCategories(),
      this.#repo.listQuizzes(),
      this.#repo.listAttempts(),
    ]);
    this.categories = categories;
    this.quizzes = quizzes;
    this.attempts = attempts;
  }

  /** Accès direct au stockage (écrans de passage). */
  async repo(): Promise<Repository> {
    if (!this.#repo) await this.init();
    if (!this.#repo) throw new Error(this.error ?? 'repository unavailable');
    return this.#repo;
  }

  /** Démarre une tentative et renvoie son identifiant. */
  async startQuiz(quizId: string, mode: AttemptMode, onlyQuestionIds?: string[]): Promise<string> {
    const repo = await this.repo();
    const quiz = await repo.getQuiz(quizId);
    if (!quiz) throw new Error(`quiz ${quizId} not found`);
    const attempt = startAttempt(quiz, mode, { onlyQuestionIds });
    await repo.saveAttempt(attempt);
    await this.reload();
    return attempt.id;
  }

  /** Abandonne une tentative en cours (elle ne compte plus dans la progression). */
  async abandon(attemptId: string) {
    const repo = await this.repo();
    const attempt = await repo.getAttempt(attemptId);
    if (attempt && attempt.status === 'in_progress') {
      await repo.saveAttempt({ ...attempt, status: 'abandoned', quizSnapshot: undefined });
      await this.reload();
    }
  }

  // ---- Administration ------------------------------------------------------

  async createQuiz(): Promise<string> {
    const quiz = newQuiz(i18n.lang);
    await (await this.repo()).saveQuiz(quiz);
    await this.reload();
    return quiz.id;
  }

  async saveQuiz(quiz: Quiz) {
    await (await this.repo()).saveQuiz(quiz);
    await this.reload();
  }

  async duplicateQuiz(id: string, suffix: string): Promise<string> {
    const repo = await this.repo();
    const quiz = await repo.getQuiz(id);
    if (!quiz) throw new Error(`quiz ${id} not found`);
    const copy = cloneQuiz(quiz, suffix);
    await repo.saveQuiz(copy);
    await this.reload();
    return copy.id;
  }

  async deleteQuiz(id: string) {
    await (await this.repo()).deleteQuiz(id);
    await this.reload();
  }

  async saveCategory(c: Category) {
    await (await this.repo()).saveCategory(c);
    await this.reload();
  }

  async deleteCategory(id: string) {
    await (await this.repo()).deleteCategory(id);
    await this.reload();
  }

  /** Vrai si l'administration est accessible (pas de PIN, ou PIN déjà saisi). */
  get adminOpen() {
    return !this.pinSet || this.adminUnlocked;
  }

  async unlockAdmin(pin: string): Promise<boolean> {
    const raw = await (await this.repo()).getSetting(PIN_KEY);
    if (!raw) return (this.adminUnlocked = true);
    const ok = await verifyPin(pin, JSON.parse(raw) as PinRecord);
    if (ok) this.adminUnlocked = true;
    return ok;
  }

  lockAdmin() {
    this.adminUnlocked = false;
  }

  /** Définit, change (`pin`) ou supprime (`null`) le code PIN. */
  async setPin(pin: string | null) {
    const repo = await this.repo();
    if (pin) await repo.setSetting(PIN_KEY, JSON.stringify(await createPin(pin)));
    else await repo.deleteSetting(PIN_KEY);
    this.pinSet = !!pin;
    this.adminUnlocked = true;
  }

  async changeLang(lang: string) {
    setLang(lang);
    await this.#repo?.setSetting('lang', i18n.lang);
  }
}

export const app = new AppState();
