import type { Question, ScoringRule } from './types';

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
 */
export function scoreQuestion(
  question: Question,
  selected: readonly string[],
  rule: ScoringRule = 'all_or_nothing',
): QuestionScore {
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
  answers: Readonly<Record<string, readonly string[]>>,
  rule: ScoringRule,
  passThreshold: number,
): QuizResult {
  let score = 0;
  let maxScore = 0;
  const perQuestion: Record<string, QuestionScore> = {};
  for (const q of questions) {
    const r = scoreQuestion(q, answers[q.id] ?? [], rule);
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
