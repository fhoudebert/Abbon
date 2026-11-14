import type { Attempt, Category, Quiz, QuizSummary } from '$lib/domain/types';

/**
 * Accès aux données d'Abbon. L'interface ne dépend d'aucune technologie de
 * stockage : SQLite (Tauri) aujourd'hui, IndexedDB possible pour une version web.
 */
export interface Repository {
  /** Nom du moteur, affiché dans l'écran « À propos ». */
  readonly backend: 'sqlite' | 'memory';

  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;

  listQuizzes(): Promise<QuizSummary[]>;
  getQuiz(id: string): Promise<Quiz | null>;
  /** Crée ou remplace un QCM avec toutes ses questions et ses choix. */
  saveQuiz(quiz: Quiz): Promise<void>;
  deleteQuiz(id: string): Promise<void>;

  listAttempts(quizId?: string): Promise<Attempt[]>;
  saveAttempt(attempt: Attempt): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}
