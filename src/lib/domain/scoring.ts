import { gapResults } from './cloze';
import { FLASH_KNOWN, isTyped, matchesExpected } from './typed';
import type { Question, ScoringRule } from './types';

/** Réponse donnée à une question : cases cochées, ou texte saisi. */
export interface Given {
  selected: readonly string[];
  text?: string | null;
  texts?: readonly string[] | null;
}

export interface QuestionScore {
  /** Points obtenus, entre 0 et question.points. */
  points: number;
  /** Vrai seulement si la sélection est exactement la bonne. */
  correct: boolean;
}

/**
 * Note une réponse.
 *
 * - Choix unique : tous les points si le seul choix coché est le bon, sinon 0.
 * - Choix multiples, « tout ou rien » (défaut) : tous les points si la sélection
 *   est exactement l'ensemble des bonnes réponses, sinon 0.
 * - Choix multiples, « partiel » : (bonnes cochées − mauvaises cochées) / bonnes
 *   attendues, plancher à 0, multiplié par les points de la question.
 * - Réponse courte ou numérique : tous les points si le texte saisi correspond à la réponse
 *   attendue (voir typed.ts), sinon 0.
 * - Texte à trous : tous les points si chaque trou est juste ; en notation « partielle », la part
 *   des trous justes.
 * - Recto-verso : tous les points si l'élève déclare qu'il savait.
 */
export function scoreQuestion(
  question: Question,
  selected: readonly string[],
  rule: ScoringRule = 'all_or_nothing',
  text?: string | null,
  texts?: readonly string[] | null,
): QuestionScore {
  if (question.type === 'cloze') {
    const results = gapResults(question, texts);
    const good = results.filter(Boolean).length;
    const all = results.length > 0 && good === results.length;
    if (rule === 'all_or_nothing' || results.length === 0) return { points: all ? question.points : 0, correct: all };
    return { points: round2((good / results.length) * question.points), correct: all };
  }
  if (question.type === 'flashcard') {
    const ok = text === FLASH_KNOWN;
    return { points: ok ? question.points : 0, correct: ok };
  }
  if (isTyped(question)) {
    const ok = matchesExpected(question, text);
    return { points: ok ? question.points : 0, correct: ok };
  }
  const known = new Set(question.choices.map((c) => c.id));
  const picked = new Set(selected.filter((id) => known.has(id)));
  const expected = new Set(question.choices.filter((c) => c.correct).map((c) => c.id));

  let good = 0;
  let bad = 0;
  for (const id of picked) {
    if (expected.has(id)) good++;
    else bad++;
  }
  const exact = bad === 0 && good === expected.size && expected.size > 0;

  if (question.type === 'single') {
    const ok = picked.size === 1 && exact;
    return { points: ok ? question.points : 0, correct: ok };
  }

  if (rule === 'all_or_nothing' || expected.size === 0) {
    return { points: exact ? question.points : 0, correct: exact };
  }

  const ratio = Math.max(0, (good - bad) / expected.size);
  return { points: round2(ratio * question.points), correct: exact };
}

export interface QuizResult {
  score: number;
  maxScore: number;
  /** Score / maximum, entre 0 et 1. */
  ratio: number;
  passed: boolean;
  perQuestion: Record<string, QuestionScore>;
}

/** Note un QCM complet à partir des réponses indexées par id de question. */
export function scoreQuiz(
  questions: readonly Question[],
  answers: Readonly<Record<string, readonly string[] | Given>>,
  rule: ScoringRule,
  passThreshold: number,
): QuizResult {
  let score = 0;
  let maxScore = 0;
  const perQuestion: Record<string, QuestionScore> = {};
  for (const q of questions) {
    const a = answers[q.id] ?? [];
    const given: Given = 'selected' in a ? a : { selected: a };
    const r = scoreQuestion(q, given.selected, rule, given.text, given.texts);
    perQuestion[q.id] = r;
    score += r.points;
    maxScore += q.points;
  }
  score = round2(score);
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return { score, maxScore, ratio, passed: ratio >= passThreshold, perQuestion };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
