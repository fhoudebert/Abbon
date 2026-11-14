import type { Attempt, Category, Quiz, QuizSummary } from '$lib/domain/types';
import type { Repository } from './repository';

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
  private settings = new Map<string, string>();

  async listCategories() {
    return [...this.categories.values()].map(clone).sort((a, b) => a.position - b.position);
  }
  async saveCategory(c: Category) {
    this.categories.set(c.id, clone(c));
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
    for (const [k, a] of this.attempts) if (a.quizId === id) this.attempts.delete(k);
  }

  async listAttempts(quizId?: string) {
    return [...this.attempts.values()]
      .filter((a) => !quizId || a.quizId === quizId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map(clone);
  }
  async saveAttempt(a: Attempt) {
    this.attempts.set(a.id, clone(a));
  }

  async getSetting(key: string) {
    return this.settings.get(key) ?? null;
  }
  async setSetting(key: string, value: string) {
    this.settings.set(key, value);
  }
}
