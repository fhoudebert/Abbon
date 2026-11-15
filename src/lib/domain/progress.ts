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
 *
 * Si `questionCount` est fourni, les tentatives partielles (ex. « refaire les erreurs »)
 * comptent pour le statut mais pas pour le dernier et le meilleur score.
 */
export function progressOf(attempts: readonly Attempt[], questionCount?: number): ProgressInfo {
  const running = attempts
    .filter((a) => a.status === 'in_progress')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const finished = attempts
    .filter((a) => a.status === 'finished')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));

  const full = questionCount
    ? finished.filter((a) => a.questionOrder.length >= questionCount)
    : finished;
  const ratio = (a: Attempt) => (a.maxScore ? (a.score ?? 0) / a.maxScore : 0);
  const best = full.reduce<Attempt | undefined>((b, a) => (!b || ratio(a) > ratio(b) ? a : b), undefined);
  const scores = full.length
    ? {
        lastScore: full[0].score ?? 0,
        bestScore: best?.score ?? 0,
        maxScore: full[0].maxScore ?? undefined,
      }
    : {};

  if (running.length) return { progress: 'in_progress', resumable: running[0], ...scores };
  if (finished.length) return { progress: 'done', ...scores };
  return { progress: 'todo' };
}
