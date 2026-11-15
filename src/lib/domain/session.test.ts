import { describe, expect, it } from 'vitest';
import { demoQuizzes } from '$lib/data/seed';
import {
  canSeeSolution,
  checkAnswer,
  choicesOf,
  emptyAnswer,
  finishAttempt,
  formatDuration,
  isLocked,
  missedQuestionIds,
  outcomeOf,
  questionsOf,
  remainingSec,
  shuffled,
  startAttempt,
  toggleChoice,
} from './session';
import type { Quiz } from './types';

const quiz: Quiz = structuredClone(demoQuizzes[0]); // 3 questions : single, multiple, single
const [q1, q2, q3] = quiz.questions;
const correctIds = (qid: string) =>
  quiz.questions.find((q) => q.id === qid)!.choices.filter((c) => c.correct).map((c) => c.id);

describe('shuffled', () => {
  it('est reproductible et conserve les éléments', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffled(items, 'graine')).toEqual(shuffled(items, 'graine'));
    expect([...shuffled(items, 'graine')].sort()).toEqual(items);
  });
  it('change selon la graine', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffled(items, 'a')).not.toEqual(shuffled(items, 'b'));
  });
});

describe('startAttempt', () => {
  it('garde l’ordre des questions si le QCM n’est pas mélangé', () => {
    const a = startAttempt({ ...quiz, shuffle: false }, 'training', { id: 'x' });
    expect(a.questionOrder).toEqual([q1.id, q2.id, q3.id]);
    expect(a).toMatchObject({ status: 'in_progress', currentIndex: 0, quizVersion: quiz.version });
    expect(a.quizSnapshot?.id).toBe(quiz.id);
  });
  it('mélange de façon stable pour une même tentative', () => {
    const a = startAttempt(quiz, 'exam', { id: 'stable' });
    const b = startAttempt(quiz, 'exam', { id: 'stable' });
    expect(a.questionOrder).toEqual(b.questionOrder);
    expect([...a.questionOrder].sort()).toEqual([q1.id, q2.id, q3.id].sort());
    expect(choicesOf(quiz, a, q2).map((c) => c.id)).toEqual(choicesOf(quiz, b, q2).map((c) => c.id));
  });
  it('peut se limiter à certaines questions', () => {
    const a = startAttempt(quiz, 'training', { onlyQuestionIds: [q3.id] });
    expect(a.questionOrder).toEqual([q3.id]);
    expect(questionsOf(quiz, a).map((q) => q.id)).toEqual([q3.id]);
  });
});

describe('réponses', () => {
  it('choix unique : remplace ; choix multiples : bascule', () => {
    expect(toggleChoice(q1, ['x'], 'y')).toEqual(['y']);
    expect(toggleChoice(q2, ['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleChoice(q2, ['a', 'b'], 'a')).toEqual(['b']);
  });
  it('en entraînement, une réponse validée est verrouillée', () => {
    const a = startAttempt(quiz, 'training');
    const answer = { ...emptyAnswer(q1.id), selected: correctIds(q1.id) };
    expect(isLocked(a, answer)).toBe(false);
    const checked = checkAnswer(quiz, q1, answer);
    expect(checked).toMatchObject({ correct: true, points: 1 });
    expect(isLocked(a, checked)).toBe(true);
    expect(isLocked({ ...a, mode: 'exam' }, checked)).toBe(false);
  });
});

describe('finishAttempt', () => {
  it('corrige, note et clôt la tentative', () => {
    const a = startAttempt({ ...quiz, shuffle: false }, 'exam');
    const answers = [
      { ...emptyAnswer(q1.id), selected: correctIds(q1.id) },
      { ...emptyAnswer(q2.id), selected: correctIds(q2.id).slice(0, 1) }, // incomplet
    ];
    const f = finishAttempt(quiz, a, answers, new Date('2026-11-15T10:00:00Z'));
    expect(f.attempt).toMatchObject({ status: 'finished', score: 1, maxScore: 3 });
    expect(f.attempt.finishedAt).toBe('2026-11-15T10:00:00.000Z');
    expect(f.answers).toHaveLength(3); // la question sans réponse est enregistrée aussi
    expect(f.result.passed).toBe(false);
    expect(missedQuestionIds(f.result).sort()).toEqual([q2.id, q3.id].sort());
    expect(outcomeOf(f.answers[0], f.result.perQuestion[q1.id])).toBe('correct');
    expect(outcomeOf(f.answers[1], f.result.perQuestion[q2.id])).toBe('wrong');
    expect(outcomeOf(f.answers[2], f.result.perQuestion[q3.id])).toBe('unanswered');
  });
  it('mode partiel : réponse partielle', () => {
    const partial = { ...quiz, shuffle: false, scoring: 'partial' as const };
    const a = startAttempt(partial, 'exam');
    const f = finishAttempt(partial, a, [{ ...emptyAnswer(q2.id), selected: correctIds(q2.id).slice(0, 1) }]);
    expect(outcomeOf(f.answers[1], f.result.perQuestion[q2.id])).toBe('partial');
  });
});

describe('corrigé et chrono', () => {
  const finished = { ...startAttempt(quiz, 'exam'), status: 'finished' as const };
  it('respecte la visibilité du corrigé', () => {
    expect(canSeeSolution(quiz, startAttempt(quiz, 'exam'))).toBe(false);
    expect(canSeeSolution({ ...quiz, solutionVisibility: 'after_submit' }, finished)).toBe(true);
    expect(canSeeSolution({ ...quiz, solutionVisibility: 'never' }, finished)).toBe(false);
    expect(canSeeSolution({ ...quiz, solutionVisibility: 'after_pass' }, finished, false)).toBe(false);
    expect(canSeeSolution({ ...quiz, solutionVisibility: 'after_pass' }, finished, true)).toBe(true);
  });
  it('calcule le temps restant en examen chronométré', () => {
    const timed = { ...quiz, timeLimitSec: 600 };
    const a = { ...startAttempt(timed, 'exam'), elapsedSec: 590 };
    expect(remainingSec(timed, a)).toBe(10);
    expect(remainingSec(timed, { ...a, elapsedSec: 700 })).toBe(0);
    expect(remainingSec(timed, { ...a, mode: 'training' })).toBeNull();
    expect(remainingSec(quiz, a)).toBeNull();
  });
  it('formate les durées', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});
