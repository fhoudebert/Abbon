/**
 * Lecteur d'un site d'examen corrigé par le serveur : envoi des réponses à corriger.php, puis clôture de la
 * tentative avec la note reçue ; le corrigé éventuellement renvoyé complète les QCM publiés sans réponses.
 */
import { expressionValues } from '$lib/domain/expr';
import { emptyAnswer, questionsOf, type Finished } from '$lib/domain/session';
import type { Answer, Attempt, Question, Quiz } from '$lib/domain/types';
import { GRADER_PATH, type GradeAnswer, type GradeRequest, type GradeResponse, type QuestionSolution } from './types';

/** Demande de correction d'une tentative. */
export function gradeRequest(quiz: Quiz, attempt: Attempt, answers: readonly Answer[], candidate?: { name: string; group: string }): GradeRequest {
  const questions = questionsOf(quiz, attempt);
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  const out: Record<string, GradeAnswer> = {};
  for (const q of questions) {
    const a = byId.get(q.id);
    if (!a) continue;
    const g: GradeAnswer = { selected: a.selected, text: a.text ?? null, texts: a.texts ?? null };
    if (q.type === 'expression' && a.text?.trim() && q.expected?.samples?.length) {
      g.values = expressionValues(a.text, q.expected.samples, { constant: q.expected.constant });
    }
    out[q.id] = g;
  }
  return {
    quiz: quiz.id,
    attempt: { id: attempt.id, startedAt: attempt.startedAt, elapsedSec: Math.round(attempt.elapsedSec) },
    ...(candidate ? { candidate } : {}),
    questions: questions.map((q) => q.id),
    answers: out,
  };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Réponse du serveur lisible ? (sinon : PHP absent, page d'erreur de l'hébergeur…) */
export function isGradeResponse(v: unknown, questionIds: readonly string[]): v is GradeResponse {
  const r = v as Partial<GradeResponse> | null;
  if (!r || !isNum(r.score) || !isNum(r.maxScore) || typeof r.passed !== 'boolean' || !r.perQuestion || typeof r.perQuestion !== 'object') return false;
  return questionIds.every((id) => {
    const p = r.perQuestion![id];
    return !!p && isNum(p.points) && typeof p.correct === 'boolean';
  });
}

/** Clôt la tentative avec la note du serveur (comme `finishAttempt`, sans corriger sur place). */
export function finishWithGrade(quiz: Quiz, attempt: Attempt, answers: readonly Answer[], grade: GradeResponse, now = new Date()): Finished {
  const questions = questionsOf(quiz, attempt);
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  const graded = questions.map((q) => {
    const a = byId.get(q.id) ?? emptyAnswer(q.id);
    const r = grade.perQuestion[q.id];
    return { ...a, correct: r.correct, points: r.points };
  });
  const result = {
    score: grade.score,
    maxScore: grade.maxScore,
    ratio: grade.maxScore > 0 ? grade.score / grade.maxScore : 0,
    passed: grade.passed,
    perQuestion: Object.fromEntries(questions.map((q) => [q.id, grade.perQuestion[q.id]])),
  };
  return {
    attempt: { ...attempt, status: 'finished', finishedAt: now.toISOString(), score: result.score, maxScore: result.maxScore },
    answers: graded,
    result,
  };
}

/** Envoie la tentative au serveur et renvoie sa note. Erreur explicite si le serveur ne corrige pas. */
export async function gradeOnServer(
  quiz: Quiz,
  attempt: Attempt,
  answers: readonly Answer[],
  candidate?: { name: string; group: string },
  fetcher: typeof fetch = fetch,
): Promise<GradeResponse> {
  const request = gradeRequest(quiz, attempt, answers, candidate);
  let res: Response;
  try {
    res = await fetcher(GRADER_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
    });
  } catch {
    throw new GradeError('network');
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new GradeError('server');
  }
  if ((body as { error?: unknown } | null)?.error === 'copie') throw new GradeError('record');
  if (!res.ok || !isGradeResponse(body, request.questions)) throw new GradeError('server');
  return body;
}

export class GradeError extends Error {
  /** network : serveur injoignable ; server : pas de correction (PHP absent…) ; record : copie non enregistrée. */
  constructor(readonly reason: 'network' | 'server' | 'record') {
    super(reason);
  }
}

/** QCM complété par le corrigé reçu (questions absentes du corrigé : inchangées). */
export function withSolutions(quiz: Quiz, solutions: Record<string, QuestionSolution>): Quiz {
  return { ...quiz, questions: quiz.questions.map((q) => withSolution(q, solutions[q.id])) };
}

function withSolution(q: Question, s: QuestionSolution | undefined): Question {
  if (!s) return q;
  const byId = new Map(s.choices.map((c) => [c.id, c]));
  return {
    ...q,
    explanation: s.explanation ?? q.explanation ?? null,
    expected: s.expected ?? q.expected ?? null,
    choices: q.choices.map((c) => {
      const sc = byId.get(c.id);
      return sc ? { ...c, correct: sc.correct, feedback: sc.feedback ?? null } : c;
    }),
  };
}
