import type { Answer, Attempt, Category, InstalledModule, Quiz, QuizSummary } from '$lib/domain/types';
import type { AnswerRow, FullData, Media, ModuleInstall, Repository } from './repository';

const clone = <T>(v: T): T => structuredClone(v);

/**
 * Stockage en mémoire, utilisé quand l'interface tourne dans un simple
 * navigateur (`npm run dev` sans Tauri). Rien n'est conservé au rechargement.
 */
export class MemoryRepository implements Repository {
  readonly backend = 'memory' as const;
  private categories = new Map<string, Category>();
  private quizzes = new Map<string, Quiz>();
  private attempts = new Map<string, Attempt>();
  private answers = new Map<string, Map<string, Answer>>();
  private settings = new Map<string, string>();
  private media = new Map<string, Media>();
  private modules = new Map<string, InstalledModule>();
  /** Historique mis de côté : identifiant de module → tentatives et réponses. */
  private archive = new Map<string, { attempt: Attempt; answers: Answer[] }[]>();

  async listCategories() {
    return [...this.categories.values()].map(clone).sort((a, b) => a.position - b.position);
  }
  async saveCategory(c: Category) {
    this.categories.set(c.id, clone(c));
  }
  async deleteCategory(id: string) {
    this.categories.delete(id);
    for (const c of this.categories.values()) if (c.parentId === id) c.parentId = null;
    for (const q of this.quizzes.values()) if (q.categoryId === id) q.categoryId = null;
  }

  async listQuizzes(): Promise<QuizSummary[]> {
    return [...this.quizzes.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ questions, ...rest }) => ({ ...clone(rest), questionCount: questions.length }));
  }
  async getQuiz(id: string) {
    const q = this.quizzes.get(id);
    return q ? clone(q) : null;
  }
  async saveQuiz(quiz: Quiz) {
    this.quizzes.set(quiz.id, clone(quiz));
  }
  async deleteQuiz(id: string) {
    this.quizzes.delete(id);
    for (const [k, a] of this.attempts)
      if (a.quizId === id) {
        this.attempts.delete(k);
        this.answers.delete(k);
      }
  }

  async listAttempts(quizId?: string) {
    return [...this.attempts.values()]
      .filter((a) => !quizId || a.quizId === quizId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map(({ quizSnapshot: _snapshot, ...rest }) => clone(rest));
  }
  async getAttempt(id: string) {
    const a = this.attempts.get(id);
    return a ? clone(a) : null;
  }
  async saveAttempt(a: Attempt) {
    const previous = this.attempts.get(a.id);
    this.attempts.set(a.id, clone({ ...a, quizSnapshot: a.quizSnapshot ?? previous?.quizSnapshot ?? null }));
  }

  async listAnswers(attemptId: string) {
    return [...(this.answers.get(attemptId)?.values() ?? [])].map(clone);
  }
  async saveAnswer(attemptId: string, answer: Answer) {
    const map = this.answers.get(attemptId) ?? new Map<string, Answer>();
    map.set(answer.questionId, clone(answer));
    this.answers.set(attemptId, map);
  }

  async getMedia(hash: string) {
    const m = this.media.get(hash);
    return m ? clone(m) : null;
  }
  async saveMedia(m: Media) {
    if (!this.media.has(m.hash)) this.media.set(m.hash, clone(m));
  }

  async listModules() {
    return [...this.modules.values()].map(clone);
  }

  #archive(moduleId: string, quizIds: Set<string>) {
    const kept = this.archive.get(moduleId) ?? [];
    for (const [k, a] of this.attempts)
      if (quizIds.has(a.quizId)) kept.push({ attempt: a, answers: [...(this.answers.get(k)?.values() ?? [])] });
    this.archive.set(moduleId, kept);
  }

  async installModule({ manifest, quizzes, categories, removedQuizIds, now = new Date() }: ModuleInstall) {
    const id = manifest.id;
    const removed = new Set(removedQuizIds.filter((q) => this.quizzes.get(q)?.moduleId === id));
    this.#archive(id, removed);
    for (const q of removed) await this.deleteQuiz(q);
    for (const c of categories) this.categories.set(c.id, clone({ ...c, moduleId: id }));
    for (const q of quizzes) this.quizzes.set(q.id, clone({ ...q, moduleId: id }));
    const declared = new Set(manifest.categories);
    for (const c of [...this.categories.values()]) {
      if (c.moduleId !== id || declared.has(c.id)) continue;
      const used =
        [...this.quizzes.values()].some((q) => q.categoryId === c.id) ||
        [...this.categories.values()].some((o) => o.parentId === c.id);
      if (used) c.moduleId = null;
      else this.categories.delete(c.id);
    }
    const back = this.archive.get(id) ?? [];
    this.archive.set(id, back.filter((e) => !this.quizzes.has(e.attempt.quizId)));
    for (const { attempt, answers } of back) {
      if (!this.quizzes.has(attempt.quizId) || this.attempts.has(attempt.id)) continue;
      this.attempts.set(attempt.id, attempt);
      this.answers.set(attempt.id, new Map(answers.map((a) => [a.questionId, a])));
    }
    const ts = now.toISOString();
    this.modules.set(id, { manifest: clone(manifest), installedAt: this.modules.get(id)?.installedAt ?? ts, updatedAt: ts });
  }

  async uninstallModule(id: string, keepHistory: boolean) {
    const ids = new Set([...this.quizzes.values()].filter((q) => q.moduleId === id).map((q) => q.id));
    if (keepHistory) this.#archive(id, ids);
    else this.archive.delete(id);
    for (const q of ids) await this.deleteQuiz(q);
    for (const c of [...this.categories.values()]) {
      if (c.moduleId !== id) continue;
      const used =
        [...this.quizzes.values()].some((q) => q.categoryId === c.id) ||
        [...this.categories.values()].some((o) => o.parentId === c.id && o.moduleId !== id);
      if (used) c.moduleId = null;
      else await this.deleteCategory(c.id);
    }
    this.modules.delete(id);
  }

  async exportHistory() {
    const answers: AnswerRow[] = [];
    for (const [attemptId, map] of this.answers) for (const a of map.values()) answers.push({ ...clone(a), attemptId });
    return { attempts: [...this.attempts.values()].map(clone), answers };
  }
  async listSettings() {
    return Object.fromEntries(this.settings);
  }
  async listMediaHashes() {
    return [...this.media.keys()];
  }
  async deleteUnusedMedia(keep: string[]) {
    const k = new Set(keep);
    let n = 0;
    for (const h of [...this.media.keys()])
      if (!k.has(h)) {
        this.media.delete(h);
        n++;
      }
    return n;
  }
  async replaceAll(data: FullData) {
    const pin = this.settings.get('admin_pin');
    this.categories = new Map(data.categories.map((c) => [c.id, clone(c)]));
    this.quizzes = new Map(data.quizzes.map((q) => [q.id, clone(q)]));
    this.attempts = new Map(data.attempts.filter((a) => this.quizzes.has(a.quizId)).map((a) => [a.id, clone(a)]));
    this.answers = new Map();
    for (const { attemptId, ...a } of data.answers) {
      if (!this.attempts.has(attemptId)) continue;
      const m = this.answers.get(attemptId) ?? new Map<string, Answer>();
      m.set(a.questionId, clone(a));
      this.answers.set(attemptId, m);
    }
    this.media = new Map(data.media.map((m) => [m.hash, clone(m)]));
    this.modules = new Map((data.modules ?? []).map((m) => [m.manifest.id, clone(m)]));
    this.archive = new Map();
    this.settings = new Map(Object.entries(data.settings).filter(([k]) => k !== 'admin_pin'));
    if (pin) this.settings.set('admin_pin', pin);
  }

  async getSetting(key: string) {
    return this.settings.get(key) ?? null;
  }
  async deleteSetting(key: string) {
    this.settings.delete(key);
  }
  async setSetting(key: string, value: string) {
    this.settings.set(key, value);
  }
}
