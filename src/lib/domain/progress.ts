import type { Attempt } from './types';

/** Statut d'un QCM vu par l'apprenant, dérivé de ses tentatives. */
export type Progress = 'todo' | 'in_progress' | 'done';

export interface ProgressInfo {
  progress: Progress;
  /** Tentative à reprendre, s'il y en a une. */
  resumable?: Attempt;
  lastScore?: number;
  bestScore?: number;
  maxScore?: number;
}

/**
 * - À faire : aucune tentative (les tentatives abandonnées ne comptent pas).
 * - En cours : au moins une tentative « en cours » (prioritaire).
 * - Fait : au moins une tentative terminée.
 */
export function progressOf(attempts: readonly Attempt[]): ProgressInfo {
  const running = attempts
    .filter((a) => a.status === 'in_progress')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const finished = attempts
    .filter((a) => a.status === 'finished')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));

  const scores = finished.length
    ? {
        lastScore: finished[0].score ?? 0,
        bestScore: Math.max(...finished.map((a) => a.score ?? 0)),
        maxScore: finished[0].maxScore ?? undefined,
      }
    : {};

  if (running.length) return { progress: 'in_progress', resumable: running[0], ...scores };
  if (finished.length) return { progress: 'done', ...scores };
  return { progress: 'todo' };
}
