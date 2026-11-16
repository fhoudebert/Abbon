import { getRepository, type Repository } from '$lib/data';
import { seedDemo } from '$lib/data/seed';
import { progressOf, type ProgressInfo } from '$lib/domain/progress';
import { createPin, verifyPin, type PinRecord } from '$lib/domain/pin';
import { b64ToBytes, bytesToB64 } from '$lib/data/bytes';
import { cloneQuiz, newQuiz } from '$lib/domain/factory';
import { localize } from '$lib/domain/text';
import { writeAutoBackup } from '$lib/files';
import { quizToGift } from '$lib/interchange/gift';
import type { ResolvedImport } from '$lib/interchange/plan';
import type { ModulePlan } from '$lib/interchange/module';
import { buildPackage, cardMedia, quizMedia, sheetMedia, type ContentBundle, type MediaFile, type ParsedPackage } from '$lib/interchange/qcmPackage';
import { startAttempt } from '$lib/domain/session';
import { dueCards, newCard, reviewCard, type LeitnerCard } from '$lib/domain/leitner';
import type { Attempt, AttemptMode, Category, I18nRich, InstalledModule, Question, Quiz, QuizSummary } from '$lib/domain/types';
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
  /** Modules installés (contenu protégé, fiches de révision). */
  modules = $state<InstalledModule[]>([]);
  /** Boîte de révision (Leitner) : une seule pour tous les QCM. */
  cards = $state<LeitnerCard[]>([]);
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
    const [categories, quizzes, attempts, modules, cards] = await Promise.all([
      this.#repo.listCategories(),
      this.#repo.listQuizzes(),
      this.#repo.listAttempts(),
      this.#repo.listModules(),
      this.#repo.listCards(),
    ]);
    this.modules = modules;
    this.cards = cards;
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

  // ---- Boîte de révision (Leitner) -----------------------------------------

  inBox(questionId: string): boolean {
    return this.cards.some((c) => c.questionId === questionId);
  }

  /** Nombre de cartes à revoir maintenant. */
  dueCount(now = new Date()): number {
    return dueCards(this.cards, now).length;
  }

  /** Met une question dans la boîte, ou l'en retire. Renvoie vrai si elle y est après l'appel. */
  async toggleCard(quiz: Pick<Quiz, 'id' | 'title' | 'languages'>, question: Question): Promise<boolean> {
    const repo = await this.repo();
    if (this.inBox(question.id)) {
      await repo.deleteCard(question.id);
      this.cards = this.cards.filter((c) => c.questionId !== question.id);
      return false;
    }
    const card = newCard(quiz, $state.snapshot(question) as Question);
    await repo.saveCard(card);
    this.cards = [...this.cards, card];
    return true;
  }

  async removeCard(questionId: string) {
    await (await this.repo()).deleteCard(questionId);
    this.cards = this.cards.filter((c) => c.questionId !== questionId);
  }

  /** Enregistre le résultat d'une révision : la carte change de compartiment. */
  async recordReview(card: LeitnerCard, correct: boolean): Promise<LeitnerCard> {
    const next = reviewCard($state.snapshot(card) as LeitnerCard, correct);
    await (await this.repo()).saveCard(next);
    this.cards = this.cards.map((c) => (c.questionId === next.questionId ? next : c));
    return next;
  }

  // ---- Modules -------------------------------------------------------------

  moduleOf(id: string | null | undefined): InstalledModule | undefined {
    return id ? this.modules.find((m) => m.manifest.id === id) : undefined;
  }

  /** Fiche de révision d'une catégorie, si un module installé en fournit une. */
  sheetOf(categoryId: string | null | undefined): I18nRich | undefined {
    if (!categoryId) return undefined;
    for (const m of this.modules) {
      const sheet = m.manifest.sheets?.[categoryId];
      if (sheet && Object.keys(sheet).length) return sheet;
    }
    return undefined;
  }

  /** Installe ou met à jour un module (après sauvegarde automatique, faite par l'écran d'import). */
  async installModule(plan: ModulePlan, media: Map<string, MediaFile>) {
    const repo = await this.repo();
    for (const h of new Set([...quizMedia(plan.quizzes), ...sheetMedia([plan.manifest])])) {
      const m = media.get(h);
      if (m) await repo.saveMedia({ hash: h, mime: m.mime, sizeBytes: m.bytes.length, data: bytesToB64(m.bytes) });
    }
    await repo.installModule({
      manifest: plan.manifest,
      quizzes: plan.quizzes,
      categories: plan.categories,
      removedQuizIds: plan.removedQuizIds,
    });
    await this.reload();
  }

  /** Retire un module d'un bloc : QCM, catégories vides, fiches, puis images devenues inutiles. */
  async uninstallModule(id: string, keepHistory: boolean) {
    await (await this.repo()).uninstallModule(id, keepHistory);
    await this.cleanMedia();
    await this.reload();
  }

  // ---- Échange de fichiers ------------------------------------------------

  /** QCM complets et images utilisées, prêts à exporter. */
  async #contentBundle(quizIds?: string[]): Promise<ContentBundle> {
    const repo = await this.repo();
    const ids = quizIds ?? (await repo.listQuizzes()).map((q) => q.id);
    const quizzes = (await Promise.all(ids.map((id) => repo.getQuiz(id)))).filter((q): q is Quiz => !!q);
    return { quizzes, categories: await repo.listCategories(), media: await this.#media(quizMedia(quizzes)) };
  }

  async #media(hashes: string[]): Promise<Map<string, MediaFile>> {
    const repo = await this.repo();
    const out = new Map<string, MediaFile>();
    for (const h of hashes) {
      const m = await repo.getMedia(h);
      if (m) out.set(h, { mime: m.mime, bytes: b64ToBytes(m.data) });
    }
    return out;
  }

  /** Archive .qcm de quelques QCM (ou de tous). */
  async exportQcm(quizIds: string[] | undefined, solutions: boolean): Promise<Uint8Array> {
    return buildPackage(await this.#contentBundle(quizIds), { kind: 'content', solutions, appVersion: __APP_VERSION__ });
  }

  /** Texte GIFT d'un QCM (images incluses en data:). */
  async exportGift(quizId: string, lang: string): Promise<string> {
    const { quizzes, categories, media } = await this.#contentBundle([quizId]);
    const quiz = quizzes[0];
    const cat = categories.find((c) => c.id === quiz.categoryId);
    const dataUrl = (h: string) => {
      const m = media.get(h);
      return m ? `data:${m.mime};base64,${bytesToB64(m.bytes)}` : undefined;
    };
    return quizToGift(quiz, lang, dataUrl, cat ? localize(cat.name, lang) : undefined);
  }

  /** Sauvegarde complète : contenus, historique, réglages (sauf le code PIN). */
  async exportBackup(): Promise<Uint8Array> {
    const repo = await this.repo();
    const content = await this.#contentBundle();
    const history = await repo.exportHistory();
    const snapshots = history.attempts.map((a) => a.quizSnapshot).filter((q): q is Quiz => !!q);
    const modules = await repo.listModules();
    const cards = await repo.listCards();
    const media = await this.#media([
      ...new Set([...quizMedia([...content.quizzes, ...snapshots]), ...sheetMedia(modules.map((m) => m.manifest)), ...cardMedia(cards)]),
    ]);
    const { admin_pin: _pin, ...settings } = await repo.listSettings();
    return buildPackage(
      { ...content, media, ...history, settings, modules, cards },
      { kind: 'backup', solutions: true, appVersion: __APP_VERSION__ },
    );
  }

  /** Sauvegarde automatique avant une opération risquée. */
  async autoBackup(): Promise<string | null> {
    return writeAutoBackup(await this.exportBackup());
  }

  /** Enregistre le résultat d'un import (après sauvegarde automatique). */
  async applyImport(resolved: ResolvedImport, media: Map<string, MediaFile>): Promise<{ failed: { id: string; error: string }[] }> {
    const repo = await this.repo();
    for (const c of resolved.categories) await repo.saveCategory(c);
    for (const h of quizMedia(resolved.quizzes)) {
      const m = media.get(h);
      if (m) await repo.saveMedia({ hash: h, mime: m.mime, sizeBytes: m.bytes.length, data: bytesToB64(m.bytes) });
    }
    const failed: { id: string; error: string }[] = [];
    for (const q of resolved.quizzes) {
      try {
        await repo.saveQuiz(q); // chaque QCM en tout ou rien
      } catch (e) {
        failed.push({ id: q.id, error: e instanceof Error ? e.message : String(e) });
      }
    }
    await this.reload();
    return { failed };
  }

  /** Remplace tout le contenu par celui d'une sauvegarde (le code PIN de l'appareil est conservé). */
  async restore(p: ParsedPackage) {
    const repo = await this.repo();
    await repo.replaceAll({
      categories: p.categories,
      quizzes: p.quizzes,
      attempts: p.attempts ?? [],
      answers: p.answers ?? [],
      settings: p.settings ?? {},
      modules: p.modules ?? [],
      cards: p.cards ?? [],
      media: [...p.media].map(([hash, m]) => ({ hash, mime: m.mime, sizeBytes: m.bytes.length, data: bytesToB64(m.bytes) })),
    });
    const lang = await repo.getSetting('lang');
    if (lang) setLang(lang);
    await this.reload();
  }

  /** Supprime les images qui ne servent plus (ni aux QCM, ni aux tentatives passées). */
  async cleanMedia(): Promise<number> {
    const repo = await this.repo();
    const quizzes = (await Promise.all((await repo.listQuizzes()).map((q) => repo.getQuiz(q.id)))).filter((q): q is Quiz => !!q);
    const snapshots = (await repo.exportHistory()).attempts.map((a) => a.quizSnapshot).filter((q): q is Quiz => !!q);
    const sheets = sheetMedia((await repo.listModules()).map((m) => m.manifest));
    const kept = cardMedia(await repo.listCards());
    return repo.deleteUnusedMedia([...new Set([...quizMedia([...quizzes, ...snapshots]), ...sheets, ...kept])]);
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
