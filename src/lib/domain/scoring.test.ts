import { describe, expect, it } from 'vitest';
import { scoreQuestion, scoreQuiz } from './scoring';
import type { Question } from './types';

const single: Question = {
  id: 's',
  type: 'single',
  prompt: { fr: '?' },
  points: 1,
  position: 0,
  choices: [
    { id: 'a', content: { fr: 'A' }, correct: false, position: 0 },
    { id: 'b', content: { fr: 'B' }, correct: true, position: 1 },
    { id: 'c', content: { fr: 'C' }, correct: false, position: 2 },
  ],
};

const multiple: Question = {
  id: 'm',
  type: 'multiple',
  prompt: { fr: '?' },
  points: 2,
  position: 1,
  choices: [
    { id: 'a', content: { fr: 'A' }, correct: true, position: 0 },
    { id: 'b', content: { fr: 'B' }, correct: false, position: 1 },
    { id: 'c', content: { fr: 'C' }, correct: true, position: 2 },
    { id: 'd', content: { fr: 'D' }, correct: false, position: 3 },
  ],
};

describe('scoreQuestion — choix unique', () => {
  it('donne les points pour la bonne réponse', () => {
    expect(scoreQuestion(single, ['b'])).toEqual({ points: 1, correct: true });
  });
  it('ne donne rien pour une mauvaise réponse ou aucune réponse', () => {
    expect(scoreQuestion(single, ['a']).points).toBe(0);
    expect(scoreQuestion(single, []).points).toBe(0);
  });
  it('refuse plusieurs choix cochés', () => {
    expect(scoreQuestion(single, ['a', 'b']).correct).toBe(false);
  });
  it('ignore les identifiants inconnus', () => {
    expect(scoreQuestion(single, ['b', 'zzz']).correct).toBe(true);
  });
});

describe('scoreQuestion — choix multiples, tout ou rien (défaut)', () => {
  it('sélection exacte → tous les points', () => {
    expect(scoreQuestion(multiple, ['c', 'a'])).toEqual({ points: 2, correct: true });
  });
  it('sélection incomplète → 0', () => {
    expect(scoreQuestion(multiple, ['a'])).toEqual({ points: 0, correct: false });
  });
  it('une mauvaise réponse en plus → 0', () => {
    expect(scoreQuestion(multiple, ['a', 'c', 'b']).points).toBe(0);
  });
});

describe('scoreQuestion — choix multiples, partiel', () => {
  it('moitié des bonnes réponses → moitié des points', () => {
    expect(scoreQuestion(multiple, ['a'], 'partial')).toEqual({ points: 1, correct: false });
  });
  it('les mauvaises réponses retirent des points, plancher à 0', () => {
    expect(scoreQuestion(multiple, ['a', 'b'], 'partial').points).toBe(0);
    expect(scoreQuestion(multiple, ['b', 'd'], 'partial').points).toBe(0);
  });
  it('sélection exacte → tous les points', () => {
    expect(scoreQuestion(multiple, ['a', 'c'], 'partial')).toEqual({ points: 2, correct: true });
  });
});

describe('scoreQuiz', () => {
  it('additionne les points et applique le seuil', () => {
    const r = scoreQuiz([single, multiple], { s: ['b'], m: ['a'] }, 'all_or_nothing', 0.7);
    expect(r.score).toBe(1);
    expect(r.maxScore).toBe(3);
    expect(r.passed).toBe(false);
    const ok = scoreQuiz([single, multiple], { s: ['b'], m: ['a', 'c'] }, 'all_or_nothing', 0.7);
    expect(ok.ratio).toBe(1);
    expect(ok.passed).toBe(true);
  });
});
