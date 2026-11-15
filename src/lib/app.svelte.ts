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
import { buildPackage, quizMedia, type ContentBundle, type MediaFile, type ParsedPackage } from '$lib/interchange/qcmPackage';
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
    const media = await this.#media(quizMedia([...content.quizzes, ...snapshots]));
    const { admin_pin: _pin, ...settings } = await repo.listSettings();
    return buildPackage(
      { ...content, media, ...history, settings },
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
    return repo.deleteUnusedMedia(quizMedia([...quizzes, ...snapshots]));
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
