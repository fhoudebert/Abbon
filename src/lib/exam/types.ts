/**
 * Examen corrigé par le serveur (site web exporté) : types partagés entre l'export (server.ts), le lecteur
 * (client.ts) et le script PHP (corriger.php). Voir docs/architecture.md, « Examen corrigé par le serveur ».
 */
import type { ExpectedAnswer, I18nRich } from '$lib/domain/types';

/** Chemin du script de correction, relatif à index.html du site. */
export const GRADER_PATH = 'examen/corriger.php';

/** Corrigé d'une question : ce que l'export retire du site, rendu par le serveur après l'envoi si permis. */
export interface QuestionSolution {
  choices: { id: string; correct: boolean; feedback?: I18nRich | null }[];
  expected: ExpectedAnswer | null;
  explanation: I18nRich | null;
}

/** Réponse envoyée pour une question. `values` : formule évaluée aux points de test (type expression). */
export interface GradeAnswer {
  selected: string[];
  text?: string | null;
  texts?: (string | null)[] | null;
  values?: (number | null)[] | null;
}

export interface GradeRequest {
  quiz: string;
  /** Tentative : identifiant (une copie renvoyée n'est enregistrée qu'une fois), durée. */
  attempt: { id: string; startedAt: string; elapsedSec: number };
  /** Élève, si les copies sont gardées sur le serveur. */
  candidate?: { name: string; group: string };
  /** Questions de la tentative, dans l'ordre. */
  questions: string[];
  answers: Record<string, GradeAnswer>;
}

export interface GradeResponse {
  score: number;
  maxScore: number;
  ratio: number;
  passed: boolean;
  perQuestion: Record<string, { points: number; correct: boolean }>;
  /** Vrai si la copie a été enregistrée sur le serveur (reglages.js : copies "oui"). */
  recorded?: boolean;
  /** Présent si le corrigé est montré à la fin (reglages.js : corrige "fin"). */
  solutions?: Record<string, QuestionSolution>;
}
