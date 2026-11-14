import { describe, expect, it } from 'vitest';
import { progressOf } from './progress';
import type { Attempt } from './types';

const attempt = (over: Partial<Attempt>): Attempt => ({
  id: crypto.randomUUID(),
  quizId: 'q',
  quizVersion: 1,
  mode: 'training',
  status: 'finished',
  startedAt: '2026-11-01T10:00:00Z',
  finishedAt: '2026-11-01T10:10:00Z',
  elapsedSec: 600,
  currentIndex: 0,
  questionOrder: [],
  score: 5,
  maxScore: 10,
  ...over,
});

describe('progressOf', () => {
  it('aucune tentative → à faire', () => {
    expect(progressOf([]).progress).toBe('todo');
  });
  it('une tentative abandonnée seule → à faire', () => {
    expect(progressOf([attempt({ status: 'abandoned' })]).progress).toBe('todo');
  });
  it('une tentative en cours est prioritaire et reprenable', () => {
    const running = attempt({ status: 'in_progress', finishedAt: null, startedAt: '2026-11-02T09:00:00Z' });
    const info = progressOf([attempt({}), running]);
    expect(info.progress).toBe('in_progress');
    expect(info.resumable?.id).toBe(running.id);
    expect(info.bestScore).toBe(5);
  });
  it('tentatives terminées → fait, avec dernier et meilleur score', () => {
    const info = progressOf([
      attempt({ score: 8, finishedAt: '2026-11-01T10:10:00Z' }),
      attempt({ score: 6, finishedAt: '2026-11-03T10:10:00Z' }),
    ]);
    expect(info).toMatchObject({ progress: 'done', lastScore: 6, bestScore: 8, maxScore: 10 });
  });
  it('ignore les tentatives partielles pour les scores', () => {
    const info = progressOf(
      [
        attempt({ score: 1, maxScore: 1, questionOrder: ['a'], finishedAt: '2026-11-05T10:00:00Z' }),
        attempt({ score: 2, maxScore: 3, questionOrder: ['a', 'b', 'c'], finishedAt: '2026-11-04T10:00:00Z' }),
      ],
      3,
    );
    expect(info).toMatchObject({ progress: 'done', lastScore: 2, bestScore: 2, maxScore: 3 });
  });
});
