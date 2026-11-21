/**
 * Modèle de domaine d'Abbon.
 * Indépendant de Tauri et de l'interface : testable en TypeScript pur.
 */

/** Code de langue BCP-47 court, ex. "fr", "en". */
export type Lang = string;

/** Texte multilingue : { fr: "...", en: "..." }. */
export type I18nText = Record<Lang, string>;

/**
 * Contenu riche au format JSON de TipTap/ProseMirror :
 * { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '…' }] }] }.
 * Jamais de HTML stocké : l'affichage passe par une liste blanche de nœuds (RichContent.svelte).
 */
export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}
export type RichDoc = RichNode & { type: 'doc' };

/** Texte simple (QCM d'avant le lot 2, imports) ou document riche. */
export type RichValue = string | RichDoc;

/** Contenu riche multilingue. */
export type I18nRich = Record<Lang, RichValue>;

/**
 * single, multiple : réponses à cocher (`choices`).
 * short, numeric : réponse à saisir, comparée à `expected` (pas de `choices`).
 * cloze : texte à trous (`expected.text` et `expected.gaps`).
 * expression : formule à écrire (LaTeX), comparée à `expected.latex` par évaluation (voir `domain/expr.ts`).
 */
export type QuestionType = 'single' | 'multiple' | 'short' | 'numeric' | 'cloze' | 'expression';

/** Un trou d'un texte à trous. */
export interface ClozeGap {
  /** text : réponse à saisir ; select : réponse à choisir dans une liste déroulante. */
  kind: 'text' | 'select';
  /** Formes acceptées (saisie), ou la bonne réponse seule (liste). */
  accepted: string[];
  /** Saisie : respecter les majuscules. */
  caseSensitive?: boolean;
  /** Liste déroulante : les autres propositions. */
  options?: string[];
}

/** Réponse attendue d'une question à saisie. */
export interface ExpectedAnswer {
  /** Réponse courte : formes acceptées (toutes sont affichées dans le corrigé). */
  accepted?: string[];
  /** Réponse courte : respecter les majuscules (faux par défaut). */
  caseSensitive?: boolean;
  /** Réponse numérique : valeur exacte attendue. */
  value?: number;
  /** Réponse numérique : écart toléré, en valeur absolue (0 par défaut). */
  tolerance?: number;
  /** Réponse numérique : unité affichée à côté du champ (elle n'est pas à saisir). */
  unit?: string | null;
  /** Texte à trous : le texte par langue, où « {{1}} », « {{2}} »… marquent les trous. */
  text?: I18nText;
  /** Texte à trous : les trous, dans l'ordre de leur numéro. */
  gaps?: ClozeGap[];
  /** Expression : formule attendue, en LaTeX. */
  latex?: string;
  /** Expression : égale à une constante près (primitives) ; « + C » est alors accepté dans la réponse. */
  constant?: boolean;
}
export type ScoringRule = 'all_or_nothing' | 'partial';
export type SolutionVisibility = 'never' | 'after_submit' | 'after_pass';
export type QuizStatus = 'draft' | 'published';
export type AttemptMode = 'training' | 'exam';
export type AttemptStatus = 'in_progress' | 'finished' | 'abandoned';

export interface Category {
  id: string;
  parentId: string | null;
  name: I18nText;
  position: number;
  color?: string | null;
  /** Module qui a créé la catégorie (propre à l'appareil). */
  moduleId?: string | null;
}

export interface Choice {
  id: string;
  content: I18nRich;
  correct: boolean;
  position: number;
  feedback?: I18nRich | null;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: I18nRich;
  points: number;
  position: number;
  explanation?: I18nRich | null;
  choices: Choice[];
  /** Réponse attendue (types short et numeric). */
  expected?: ExpectedAnswer | null;
}

export interface Quiz {
  id: string;
  categoryId: string | null;
  title: I18nText;
  description?: I18nText | null;
  languages: Lang[];
  level?: string | null;
  tags: string[];
  timeLimitSec?: number | null;
  /** Seuil de réussite entre 0 et 1. */
  passThreshold: number;
  scoring: ScoringRule;
  solutionVisibility: SolutionVisibility;
  shuffle: boolean;
  status: QuizStatus;
  version: number;
  author?: string | null;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  /** Module auquel appartient le QCM (contenu protégé). Propre à l'appareil : absent du format d'échange. */
  moduleId?: string | null;
}

/** Résumé d'un QCM, sans ses questions, pour les listes. */
export type QuizSummary = Omit<Quiz, 'questions'> & { questionCount: number };

export interface Answer {
  questionId: string;
  selected: string[];
  /** Réponse saisie (types short et numeric). */
  text?: string | null;
  /** Réponses aux trous d'un texte à trous, dans l'ordre des trous. */
  texts?: string[] | null;
  correct?: boolean | null;
  points?: number | null;
  timeSec: number;
  flagged: boolean;
}

export interface Attempt {
  id: string;
  quizId: string;
  quizVersion: number;
  mode: AttemptMode;
  status: AttemptStatus;
  startedAt: string;
  finishedAt?: string | null;
  elapsedSec: number;
  currentIndex: number;
  questionOrder: string[];
  score?: number | null;
  maxScore?: number | null;
  /** Copie du QCM au démarrage (absente des listes, présente dans getAttempt). */
  quizSnapshot?: Quiz | null;
}

/**
 * Manifeste d'un module (`module.json` dans le fichier `.qcm`) : métadonnées, contenu protégé
 * et fiches de révision. Voir docs/format-qcm/README.md.
 */
export interface ModuleManifest {
  format: 'abbon-module';
  formatVersion: number;
  /** Identifiant stable en notation inversée, ex. « org.abbon.anglais-verbes ». */
  id: string;
  /** Version SemVer du contenu. */
  version: string;
  title: I18nText;
  description?: I18nText | null;
  level?: string | null;
  /** Identifiant SPDX de la licence du contenu. */
  license: string;
  authors: string[];
  homepage?: string | null;
  requires?: { app?: string; features?: string[] } | null;
  /** Identifiants des catégories et des QCM du module. */
  categories: string[];
  quizzes: string[];
  /** Fiches de révision, par identifiant de catégorie puis par langue. */
  sheets?: Record<string, I18nRich> | null;
}

/** Module installé sur l'appareil. */
export interface InstalledModule {
  manifest: ModuleManifest;
  installedAt: string;
  updatedAt: string;
}
