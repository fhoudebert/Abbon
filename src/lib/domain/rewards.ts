/**
 * Points et ceintures : récompenser la révision régulière des questions choisies, selon le planning de
 * la boîte, bien plus que leur collecte. Fonctions pures.
 *
 * Chaque événement a une clé (`kind`, `ref`) : il ne compte qu'une fois. Les points ne se perdent jamais.
 * Barème et seuils : voir le lot 15 de `docs/feuille-de-route.md` (calés par simulation, cf. les tests).
 */
import { isAcquired, isDue, type LeitnerCard } from './leitner';

export const POINTS = {
  /** Révision d'une carte due : 1 point, 2 si la réponse est juste. */
  review: 1,
  reviewCorrect: 2,
  /** Plus aucune carte due après la dernière révision du jour. */
  day: 10,
  /** Carte acquise (juste dans le dernier compartiment). */
  acquired: 10,
  /** Question échouée dans une tentative terminée, puis rangée dans la boîte. */
  collect: 1,
  /** Première tentative complète au-dessus du seuil du QCM. */
  quiz: 2,
  /** Tous les QCM d'un module réussis au moins une fois. */
  module: 10,
} as const;

export type RewardKind = 'review' | 'day' | 'acquired' | 'collect' | 'quiz' | 'module';

export interface Reward {
  kind: RewardKind;
  /** Ce qui est récompensé : question (« review » : question@jour), jour, QCM ou module. */
  ref: string;
  points: number;
  at: string;
}

/** Ceintures du judo (ordre en usage en France), d'après le total des points. */
export const BELTS = [
  { id: 'white', min: 0 },
  { id: 'yellow', min: 100 },
  { id: 'orange', min: 300 },
  { id: 'green', min: 700 },
  { id: 'blue', min: 1500 },
  { id: 'brown', min: 3000 },
  { id: 'black', min: 5000 },
] as const;
export type BeltId = (typeof BELTS)[number]['id'];
/** Après la ceinture noire, un dan de plus tous les `DAN_STEP` points. */
export const DAN_STEP = 3000;

export interface Rank {
  belt: BeltId;
  /** Dan, à partir de 1 pour la ceinture noire ; 0 avant. */
  dan: number;
  points: number;
  /** Seuil du rang actuel, et du suivant. */
  floor: number;
  next: number;
}

export function rankOf(points: number): Rank {
  const black = BELTS[BELTS.length - 1];
  if (points >= black.min) {
    const dan = 1 + Math.floor((points - black.min) / DAN_STEP);
    const floor = black.min + (dan - 1) * DAN_STEP;
    return { belt: 'black', dan, points, floor, next: floor + DAN_STEP };
  }
  let i = 0;
  while (i + 1 < BELTS.length && points >= BELTS[i + 1].min) i++;
  return { belt: BELTS[i].id, dan: 0, points, floor: BELTS[i].min, next: BELTS[i + 1].min };
}

/** Rang atteint en passant de `before` à `after` points, s'il a changé. */
export function promotion(before: number, after: number): Rank | null {
  const a = rankOf(before);
  const b = rankOf(after);
  return a.belt !== b.belt || a.dan !== b.dan ? b : null;
}

export const totalPoints = (rewards: readonly Pick<Reward, 'points'>[]) => rewards.reduce((s, r) => s + r.points, 0);

/** Jour local (AAAA-MM-JJ) : une journée de révision suit l'horloge de l'appareil. */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Récompenses d'une révision. `before` est la carte avant la révision, `after` après ; `remainingDue`
 * est le nombre de cartes encore dues une fois la révision enregistrée. Une carte révisée avant sa date
 * (« Réviser quand même ») ou déjà acquise ne rapporte rien.
 */
export function reviewRewards(before: LeitnerCard, after: LeitnerCard, correct: boolean, remainingDue: number, now = new Date()): Reward[] {
  if (!isDue(before, now)) return [];
  const at = now.toISOString();
  const day = localDay(now);
  const out: Reward[] = [
    { kind: 'review', ref: `${before.questionId}@${day}`, points: correct ? POINTS.reviewCorrect : POINTS.review, at },
  ];
  if (!isAcquired(before) && isAcquired(after)) out.push({ kind: 'acquired', ref: before.questionId, points: POINTS.acquired, at });
  if (remainingDue === 0) out.push({ kind: 'day', ref: day, points: POINTS.day, at });
  return out;
}

/** Récompense d'une question rangée dans la boîte : seulement si elle a été échouée. */
export function collectRewards(questionId: string, failed: boolean, now = new Date()): Reward[] {
  return failed ? [{ kind: 'collect', ref: questionId, points: POINTS.collect, at: now.toISOString() }] : [];
}

/**
 * Récompenses d'une tentative terminée : QCM réussi (tentative complète au-dessus du seuil), puis module
 * terminé si tous ses QCM sont réussis. `passedQuizIds` : QCM déjà récompensés auparavant.
 */
export function attemptRewards(
  quiz: { id: string; moduleId?: string | null },
  passed: boolean,
  complete: boolean,
  moduleQuizIds: readonly string[],
  passedQuizIds: ReadonlySet<string>,
  now = new Date(),
): Reward[] {
  if (!passed || !complete) return [];
  const at = now.toISOString();
  const out: Reward[] = [{ kind: 'quiz', ref: quiz.id, points: POINTS.quiz, at }];
  if (quiz.moduleId && moduleQuizIds.length && moduleQuizIds.every((id) => id === quiz.id || passedQuizIds.has(id)))
    out.push({ kind: 'module', ref: quiz.moduleId, points: POINTS.module, at });
  return out;
}

/** Clé d'unicité d'une récompense. */
export const rewardKey = (r: Pick<Reward, 'kind' | 'ref'>) => `${r.kind}:${r.ref}`;
