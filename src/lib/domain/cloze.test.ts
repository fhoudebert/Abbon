import { describe, expect, it } from 'vitest';
import { demoQuizzes } from '$lib/data/seed';
import { stripSolutions } from '$lib/interchange/qcmPackage';
import { clozeSegments, gapMatches, gapOptions, gapResults, markersMatch, removeMarker } from './cloze';
import { newQuestion } from './factory';
import { scoreQuestion } from './scoring';
import { emptyAnswer, finishAttempt, isAnswered, startAttempt } from './session';
import type { Question, Quiz } from './types';
import { validateQuiz } from './validate';

const cloze: Question = {
  id: 'c', type: 'cloze', prompt: { fr: 'Complétez.' }, points: 3, position: 0, explanation: null, choices: [],
  expected: {
    text: { fr: 'She {{1}} to London and {{2}} a friend. She {{3}} two cats.' },
    gaps: [
      { kind: 'text', accepted: ['went', 'did go'] },
      { kind: 'text', accepted: ['saw'] },
      { kind: 'select', accepted: ['has'], options: ['have', 'had'] },
    ],
  },
};

describe('texte à trous', () => {
  it('découpe le texte en morceaux et en trous', () => {
    expect(clozeSegments('A {{1}} b {{2}}')).toEqual([{ text: 'A ' }, { gap: 0 }, { text: ' b ' }, { gap: 1 }]);
    expect(clozeSegments('sans trou')).toEqual([{ text: 'sans trou' }]);
  });

  it('vérifie que chaque trou apparaît une fois', () => {
    expect(markersMatch('a {{1}} b {{2}}', 2)).toBe(true);
    expect(markersMatch('a {{2}} b {{1}}', 2)).toBe(true);
    expect(markersMatch('a {{1}} b {{1}}', 2)).toBe(false);
    expect(markersMatch('a {{1}}', 2)).toBe(false);
    expect(markersMatch('a {{1}} {{3}}', 2)).toBe(false);
  });

  it('retire un trou et renumérote les suivants', () => {
    expect(removeMarker('a {{1}} b {{2}} c {{3}}', 1)).toBe('a {{1}} b  c {{2}}');
  });

  it('compare la saisie comme une réponse courte, la liste à sa bonne réponse', () => {
    const [text, , select] = cloze.expected!.gaps!;
    expect(gapMatches(text, ' Went ')).toBe(true);
    expect(gapMatches(text, 'did  go')).toBe(true);
    expect(gapMatches(text, 'goed')).toBe(false);
    expect(gapMatches(select, 'has')).toBe(true);
    expect(gapMatches(select, 'have')).toBe(false);
    expect(gapMatches(select, '')).toBe(false);
    expect(gapOptions(select)).toEqual(['has', 'have', 'had']);
    expect(gapResults(cloze, ['went', 'seen'])).toEqual([true, false, false]);
  });

  it('note en tout ou rien, ou à la part des trous justes', () => {
    const all = ['went', 'saw', 'has'];
    expect(scoreQuestion(cloze, [], 'all_or_nothing', null, all)).toEqual({ points: 3, correct: true });
    expect(scoreQuestion(cloze, [], 'all_or_nothing', null, ['went', 'saw', 'had'])).toEqual({ points: 0, correct: false });
    expect(scoreQuestion(cloze, [], 'partial', null, ['went', 'saw', 'had'])).toEqual({ points: 2, correct: false });
    expect(scoreQuestion(cloze, [], 'partial', null, null)).toEqual({ points: 0, correct: false });
  });

  it('se passe et se corrige dans une tentative', () => {
    const quiz: Quiz = { ...structuredClone(demoQuizzes[0]), scoring: 'partial', shuffle: false, questions: [cloze] };
    const attempt = startAttempt(quiz, 'exam');
    expect(isAnswered({ ...emptyAnswer('c'), texts: ['', ' '] })).toBe(false);
    expect(isAnswered({ ...emptyAnswer('c'), texts: ['', 'saw'] })).toBe(true);
    const done = finishAttempt(quiz, attempt, [{ ...emptyAnswer('c'), texts: ['went', '', 'has'] }]);
    expect([done.result.score, done.answers[0].correct]).toEqual([2, false]);
  });

  it('contrôle texte et trous avant publication', () => {
    const base = { ...structuredClone(demoQuizzes[0]), languages: ['fr', 'en'] };
    const codes = (q: Question) => validateQuiz({ ...base, questions: [q] }).filter((i) => i.level === 'error').map((i) => [i.code, i.lang]);
    expect(codes(cloze)).toEqual([]);
    expect(codes({ ...newQuestion('cloze', 0), prompt: { fr: 'x' } })).toEqual([['cloze_needs_gap', undefined]]);
    const e = cloze.expected!;
    expect(codes({ ...cloze, expected: { ...e, text: { fr: 'She {{1}} and {{2}}.' } } })).toEqual([['cloze_markers', 'fr']]);
    expect(codes({ ...cloze, expected: { ...e, text: { ...e.text, en: 'She {{1}}.' } } })).toEqual([['cloze_markers', 'en']]);
    expect(codes({ ...cloze, expected: { ...e, gaps: [{ kind: 'text', accepted: [' '] }, e.gaps![1], { kind: 'select', accepted: ['has'] }] } })).toEqual([
      ['cloze_gap_empty', undefined],
      ['cloze_select_options', undefined],
    ]);
  });

  it('sans corrigé : le texte et les listes restent, pas les bonnes réponses', () => {
    const quiz: Quiz = { ...structuredClone(demoQuizzes[0]), questions: [cloze] };
    const e = stripSolutions(quiz).questions[0].expected!;
    expect(e.text).toEqual(cloze.expected!.text);
    expect(e.gaps).toEqual([
      { kind: 'text', accepted: [] },
      { kind: 'text', accepted: [] },
      { kind: 'select', accepted: [], options: ['had', 'has', 'have'] },
    ]);
  });
});
