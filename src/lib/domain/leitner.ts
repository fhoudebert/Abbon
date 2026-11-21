/**
 * Révision espacée par boîtes de Leitner — une seule boîte de révision pour tous les QCM.
 *
 * L'apprenant y met les questions qu'il veut retenir. Chaque question (« carte ») est rangée dans un
 * compartiment : une bonne réponse la fait avancer d'un compartiment, une erreur la renvoie dans le
 * premier ; plus le compartiment est élevé, plus la révision est espacée. Une bonne réponse dans le dernier
 * compartiment rend la carte « acquise » : elle sort du planning (on peut l'y remettre). Fonctions pures.
 */
import { scoreQuestion, type Given } from './scoring';
import type { I18nText, Lang, Question, Quiz } from './types';

/** Délai avant la prochaine révision, en jours, pour les compartiments 1 à 5 : il double à chaque compartiment. */
export const LEITNER_INTERVALS = [1, 2, 4, 8, 16] as const;
export const LEITNER_BOXES = LEITNER_INTERVALS.length;
/** Nombre de questions d'une session de révision. */
export const LEITNER_SESSION_SIZE = 20;

export interface LeitnerCard {
  questionId: string;
  /** QCM d'origine (il peut avoir été supprimé depuis : la copie ci-dessous suffit à réviser). */
  quizId: string;
  /** Compartiment, de 1 à LEITNER_BOXES. */
  box: number;
  /** Date à partir de laquelle la carte est à revoir. */
  dueAt: string;
  addedAt: string;
  lastAt: string | null;
  /** Nombre de révisions, et nombre d'erreurs. */
  reviews: number;
  lapses: number;
  /** Date d'acquisition : la carte est sortie du planning. Absente ou nulle tant qu'elle y est. */
  acquiredAt?: string | null;
  /** Copie de la question au moment de l'ajout, avec ce qu'il faut pour l'afficher. */
  snapshot: { question: Question; quizTitle: I18nText; languages: Lang[] };
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Début du jour local situé `days` jours après `now` : une carte devient due le matin. */
export function dueAfter(now: Date, days: number): string {
  const d = startOfDay(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** La carte est-elle sortie du planning ? */
export const isAcquired = (card: Pick<LeitnerCard, 'acquiredAt'>) => !!card.acquiredAt;

/** À revoir maintenant : dans le planning, et sa date est arrivée. */
export const isDue = (card: Pick<LeitnerCard, 'dueAt' | 'acquiredAt'>, now = new Date()) =>
  !isAcquired(card) && card.dueAt <= now.toISOString();

/** Nouvelle carte : compartiment 1, à revoir tout de suite. */
export function newCard(quiz: Pick<Quiz, 'id' | 'title' | 'languages'>, question: Question, now = new Date()): LeitnerCard {
  return {
    questionId: question.id,
    quizId: quiz.id,
    box: 1,
    dueAt: now.toISOString(),
    addedAt: now.toISOString(),
    lastAt: null,
    reviews: 0,
    lapses: 0,
    acquiredAt: null,
    snapshot: { question: structuredClone(question), quizTitle: { ...quiz.title }, languages: [...quiz.languages] },
  };
}

/**
 * Carte après une révision : avance d'un compartiment si la réponse est juste, retour au premier sinon.
 * Juste dans le dernier compartiment, elle est acquise et sort du planning.
 * Révisée avant sa date (« Réviser quand même »), ou déjà acquise, une carte juste ne bouge pas — sinon on
 * la ferait monter en la répétant le même jour ; une erreur, elle, compte toujours (une carte acquise
 * revient alors dans le planning, au premier compartiment).
 */
export function reviewCard(card: LeitnerCard, correct: boolean, now = new Date()): LeitnerCard {
  if (correct && !isDue(card, now)) return { ...card, lastAt: now.toISOString(), reviews: card.reviews + 1 };
  if (correct && card.box >= LEITNER_BOXES)
    return { ...card, box: LEITNER_BOXES, acquiredAt: now.toISOString(), lastAt: now.toISOString(), reviews: card.reviews + 1 };
  const box = correct ? Math.min(LEITNER_BOXES, card.box + 1) : 1;
  return {
    ...card,
    acquiredAt: null,
    box,
    dueAt: dueAfter(now, LEITNER_INTERVALS[box - 1]),
    lastAt: now.toISOString(),
    reviews: card.reviews + 1,
    lapses: card.lapses + (correct ? 0 : 1),
  };
}


/** Cartes à revoir, les compartiments les plus bas (les moins sues) d'abord, puis les plus en retard. */
export function dueCards(cards: readonly LeitnerCard[], now = new Date()): LeitnerCard[] {
  // À compartiment et date égaux, dans l'ordre d'ajout (cartes personnelles : ordre de saisie).
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.box - b.box || a.dueAt.localeCompare(b.dueAt) || a.addedAt.localeCompare(b.addedAt));
}

/** Remet une carte acquise dans le planning, au premier compartiment, à revoir tout de suite. */
export function restoreCard(card: LeitnerCard, now = new Date()): LeitnerCard {
  return { ...card, acquiredAt: null, box: 1, dueAt: now.toISOString() };
}

/** Nombre de cartes du planning par compartiment (indice 0 = compartiment 1) ; les acquises n'y sont pas. */
export function boxCounts(cards: readonly Pick<LeitnerCard, 'box' | 'acquiredAt'>[]): number[] {
  const out = Array.from({ length: LEITNER_BOXES }, () => 0);
  for (const c of cards) if (!isAcquired(c)) out[Math.min(LEITNER_BOXES, Math.max(1, c.box)) - 1]++;
  return out;
}

/** La réponse donnée est-elle entièrement juste ? (Un texte à trous compte quand tous les trous sont justes.) */
export const isCorrect = (question: Question, given: Given) =>
  scoreQuestion(question, given.selected, 'all_or_nothing', given.text, given.texts).correct;

/**
 * Question à afficher : la version actuelle du QCM si elle existe encore (un module mis à jour
 * corrige ainsi ses cartes), sinon la copie gardée à l'ajout.
 */
export function cardQuestion(card: LeitnerCard, current: Quiz | null | undefined): { question: Question; languages: Lang[]; quizTitle: I18nText } {
  const live = current?.questions.find((q) => q.id === card.questionId);
  return live && current ? { question: live, languages: current.languages, quizTitle: current.title } : card.snapshot;
}
