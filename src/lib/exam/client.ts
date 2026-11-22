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
  if (!r || !isNum(r.score) || !isNum(r.maxScore) || typeof r.passed !== 'boolean') return false;
  if (r.locked === true) return true;
  if (!r.perQuestion || typeof r.perQuestion !== 'object') return false;
  return questionIds.every((id) => {
    const p = r.perQuestion![id];
    return !!p && isNum(p.points) && typeof p.correct === 'boolean';
  });
}

/**
 * Clôt la tentative avec la note du serveur (comme `finishAttempt`, sans corriger sur place). Détail par question
 * pas encore publié : les réponses restent sans note (`points` null), voir `detailLocked`.
 */
export function finishWithGrade(quiz: Quiz, attempt: Attempt, answers: readonly Answer[], grade: GradeResponse, now = new Date()): Finished {
  const graded = withDetail(quiz, attempt, answers, grade.perQuestion);
  const result = {
    score: grade.score,
    maxScore: grade.maxScore,
    ratio: grade.maxScore > 0 ? grade.score / grade.maxScore : 0,
    passed: grade.passed,
    perQuestion: grade.perQuestion ? Object.fromEntries(graded.map((a) => [a.questionId, { points: a.points ?? 0, correct: a.correct === true }])) : {},
  };
  return {
    attempt: { ...attempt, status: 'finished', finishedAt: now.toISOString(), score: result.score, maxScore: result.maxScore },
    answers: graded,
    result,
  };
}

/** Réponses de la tentative avec le détail par question du serveur (ou sans note, s'il n'est pas publié). */
export function withDetail(
  quiz: Quiz,
  attempt: Attempt,
  answers: readonly Answer[],
  perQuestion: GradeResponse['perQuestion'],
): Answer[] {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  return questionsOf(quiz, attempt).map((q) => {
    const a = byId.get(q.id) ?? emptyAnswer(q.id);
    const r = perQuestion?.[q.id];
    return { ...a, correct: r ? r.correct : null, points: r ? r.points : null };
  });
}

/** Tentative terminée dont le détail par question n'est pas encore publié par l'enseignant. */
export function detailLocked(quiz: Quiz, attempt: Attempt, answers: readonly Answer[]): boolean {
  if (attempt.status !== 'finished') return false;
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  return questionsOf(quiz, attempt).some((q) => byId.get(q.id)?.points == null);
}

/** Envoie la tentative au serveur et renvoie sa note. Erreur explicite si le serveur ne corrige pas. */
export async function gradeOnServer(
  quiz: Quiz,
  attempt: Attempt,
  answers: readonly Answer[],
  candidate?: { name: string; group: string },
  fetcher: typeof fetch = fetch,
  action?: 'corrige',
): Promise<GradeResponse> {
  const request = { ...(action ? { action } : {}), ...gradeRequest(quiz, attempt, answers, candidate) };
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
  if ((body as { error?: unknown } | null)?.error === 'debut') throw new GradeError('start');
  if (!res.ok || !isGradeResponse(body, request.questions)) throw new GradeError('server');
  return body;
}

/**
 * Corrigé publié depuis la copie ? Redemande au serveur le détail et le corrigé d'une tentative terminée ;
 * null tant que l'enseignant ne les a pas publiés.
 */
export async function fetchCorrection(quiz: Quiz, attempt: Attempt, answers: readonly Answer[], fetcher: typeof fetch = fetch): Promise<GradeResponse | null> {
  const grade = await gradeOnServer(quiz, attempt, answers, undefined, fetcher, 'corrige');
  return grade.locked || !grade.perQuestion ? null : grade;
}

/** POST JSON à corriger.php ; réponse JSON (ou erreur explicite). */
async function post(body: unknown, fetcher: typeof fetch): Promise<{ ok: boolean; body: Record<string, unknown> | null }> {
  let res: Response;
  try {
    res = await fetcher(GRADER_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  } catch {
    throw new GradeError('network');
  }
  try {
    const json = (await res.json()) as unknown;
    return { ok: res.ok, body: json && typeof json === 'object' ? (json as Record<string, unknown>) : null };
  } catch {
    throw new GradeError('server');
  }
}

/** État de l'examen avant de commencer : ouvert, code d'accès demandé, durée fixée par le surveillant (minutes). */
export interface ExamState {
  open: boolean;
  code: boolean;
  minutes: number | null;
  /** Liste de classe : le nom doit y figurer (vérifié par le serveur au début). */
  classList: boolean;
}

export async function examState(fetcher: typeof fetch = fetch): Promise<ExamState> {
  const r = await post({ action: 'etat' }, fetcher);
  if (!r.ok || !r.body || typeof r.body.ouvert !== 'boolean') throw new GradeError('server');
  return {
    open: r.body.ouvert,
    code: r.body.code === true,
    minutes: typeof r.body.duree === 'number' ? r.body.duree : null,
    classList: r.body.classe === true,
  };
}

/**
 * Début d'une tentative auprès du serveur (examen ouvert, bon code) : il note l'heure, qui fait foi pour la
 * durée. Renvoie la durée allouée en secondes (null : aucune).
 */
export async function startOnServer(
  quizId: string,
  attemptId: string,
  candidate: { name: string; group: string } | undefined,
  code: string,
  fetcher: typeof fetch = fetch,
): Promise<number | null> {
  const r = await post({ action: 'debut', quiz: quizId, attempt: { id: attemptId }, code, ...(candidate ? { candidate } : {}) }, fetcher);
  const error = r.body?.error;
  if (error === 'ferme') throw new GradeError('closed');
  if (error === 'code') throw new GradeError('code');
  if (error === 'nom') throw new GradeError('name');
  if (error === 'copie') throw new GradeError('record');
  if (!r.ok || r.body?.ok !== true) throw new GradeError('server');
  return typeof r.body.limitSec === 'number' && r.body.limitSec > 0 ? r.body.limitSec : null;
}

export class GradeError extends Error {
  /**
   * network : serveur injoignable ; server : pas de correction (PHP absent…) ; record : copie non enregistrée ;
   * closed : examen fermé ; code : mauvais code d'accès ; start : tentative non commencée auprès du serveur ;
   * name : nom absent de la liste de classe.
   */
  constructor(readonly reason: 'network' | 'server' | 'record' | 'closed' | 'code' | 'start' | 'name') {
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
