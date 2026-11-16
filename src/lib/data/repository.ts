import type { LeitnerCard } from '$lib/domain/leitner';
import type { Answer, Attempt, Category, InstalledModule, ModuleManifest, Quiz, QuizSummary } from '$lib/domain/types';

/**
 * Accès aux données d'Abbon. L'interface ne dépend d'aucune technologie de
 * stockage : SQLite (Tauri) aujourd'hui, IndexedDB possible pour une version web.
 */
export interface Repository {
  /** Nom du moteur, affiché dans l'écran « À propos ». */
  readonly backend: 'sqlite' | 'memory';

  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  listQuizzes(): Promise<QuizSummary[]>;
  getQuiz(id: string): Promise<Quiz | null>;
  /** Crée ou remplace un QCM avec toutes ses questions et ses choix. */
  saveQuiz(quiz: Quiz): Promise<void>;
  deleteQuiz(id: string): Promise<void>;

  /** Tentatives sans l'instantané du QCM (plus léger pour les listes). */
  listAttempts(quizId?: string): Promise<Attempt[]>;
  /** Tentative complète, instantané du QCM compris. */
  getAttempt(id: string): Promise<Attempt | null>;
  /** Crée ou met à jour une tentative ; l'instantané n'est écrit que s'il est fourni. */
  saveAttempt(attempt: Attempt): Promise<void>;

  listAnswers(attemptId: string): Promise<Answer[]>;
  saveAnswer(attemptId: string, answer: Answer): Promise<void>;

  getMedia(hash: string): Promise<Media | null>;
  /** Enregistre une image (sans effet si la même empreinte existe déjà). */
  saveMedia(media: Media): Promise<void>;

  // ---- Modules ----
  listModules(): Promise<InstalledModule[]>;
  /**
   * Installe ou met à jour un module, dans une seule transaction : catégories et QCM du module
   * écrits (contenu protégé), QCM retirés de la nouvelle version supprimés (leur historique est mis
   * de côté), historique mis de côté lors d'une désinstallation précédente remis en place.
   */
  installModule(install: ModuleInstall): Promise<void>;
  /**
   * Retire un module d'un bloc (QCM, catégories devenues vides, fiches). L'historique des tentatives
   * est mis de côté (`keepHistory`) pour une réinstallation future, ou supprimé.
   */
  uninstallModule(id: string, keepHistory: boolean): Promise<void>;

  // ---- Boîte de révision (Leitner) ----
  listCards(): Promise<LeitnerCard[]>;
  /** Crée ou remplace une carte (clé : identifiant de la question). */
  saveCard(card: LeitnerCard): Promise<void>;
  deleteCard(questionId: string): Promise<void>;

  // ---- Sauvegarde complète ----
  /** Toutes les tentatives (avec l'instantané du QCM) et toutes les réponses. */
  exportHistory(): Promise<{ attempts: Attempt[]; answers: AnswerRow[] }>;
  listSettings(): Promise<Record<string, string>>;
  listMediaHashes(): Promise<string[]>;
  /** Supprime les images qui ne figurent pas dans `keep` ; renvoie le nombre supprimé. */
  deleteUnusedMedia(keep: string[]): Promise<number>;
  /** Remplace tout le contenu, dans une seule transaction (le code PIN est conservé). */
  replaceAll(data: FullData): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  deleteSetting(key: string): Promise<void>;
}

/** Image stockée dans la base. */
export interface Media {
  /** SHA-256 du contenu, en hexadécimal. */
  hash: string;
  mime: string;
  width?: number | null;
  height?: number | null;
  sizeBytes: number;
  /** Contenu encodé en base64. */
  data: string;
}

/** Réponse avec sa tentative (sauvegarde complète). */
export interface AnswerRow extends Answer {
  attemptId: string;
}

/** Ce qu'il faut écrire pour installer un module (voir `planModule`). */
export interface ModuleInstall {
  manifest: ModuleManifest;
  quizzes: Quiz[];
  categories: Category[];
  removedQuizIds: string[];
  now?: Date;
}

/** Tout le contenu d'un appareil (sauvegarde / restauration). */
export interface FullData {
  categories: Category[];
  quizzes: Quiz[];
  attempts: Attempt[];
  answers: AnswerRow[];
  settings: Record<string, string>;
  media: Media[];
  modules?: InstalledModule[];
  cards?: LeitnerCard[];
}
