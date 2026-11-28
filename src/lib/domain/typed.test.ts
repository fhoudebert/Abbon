import { describe, expect, it } from 'vitest';
import { newQuestion, setQuestionType } from './factory';
import { scoreQuestion, scoreQuiz } from './scoring';
import { checkAnswer, emptyAnswer, finishAttempt, isAnswered, outcomeOf, resultOf, startAttempt } from './session';
import { expectedText, matchesExpected, normalizeText, parseNumber } from './typed';
import type { Question, Quiz } from './types';
import { validateQuiz } from './validate';
import { demoQuizzes } from '$lib/data/seed';

const short = (accepted: string[], caseSensitive = false): Question => ({
  id: 's', type: 'short', prompt: { fr: 'Prétérit de go ?' }, points: 2, position: 0, explanation: null, choices: [],
  expected: { accepted, caseSensitive },
});
const numeric = (value: number, tolerance = 0, unit?: string): Question => ({
  id: 'n', type: 'numeric', prompt: { fr: 'g ?' }, points: 1, position: 1, explanation: null, choices: [],
  expected: { value, tolerance, unit },
});

describe('réponse courte', () => {
  it('ignore majuscules, espaces superflus et apostrophes typographiques, pas les accents', () => {
    expect(normalizeText('  L’Été   indien ')).toBe("l'été indien");
    const q = short(['went', "l'été"]);
    expect(matchesExpected(q, ' Went ')).toBe(true);
    expect(matchesExpected(q, 'L’ÉTÉ')).toBe(true);
    expect(matchesExpected(q, "l'ete")).toBe(false);
    expect(matchesExpected(q, 'goed')).toBe(false);
    expect(matchesExpected(q, '   ')).toBe(false);
    expect(matchesExpected(q, null)).toBe(false);
  });

  it('respecte les majuscules sur demande', () => {
    const q = short(['Python'], true);
    expect(matchesExpected(q, 'Python')).toBe(true);
    expect(matchesExpected(q, 'python')).toBe(false);
  });

  it('ignore les accents sur demande (« · accent-insensitive »), sans toucher au reste', () => {
    expect(normalizeText('Cléopâtre VII', false, true)).toBe('cleopatre vii');
    expect(normalizeText('Œuvre ÇA', false, true)).toBe('œuvre ca');
    const q: Question = { ...short(['Cléopâtre VII']), expected: { accepted: ['Cléopâtre VII'], ignoreAccents: true } };
    expect(['cleopatre vii', 'CLÉOPATRE VII', 'Cléopâtre VII', 'Cléopâtre  vii'].map((t) => matchesExpected(q, t))).toEqual([true, true, true, true]);
    expect(matchesExpected(q, 'Cleopatra VII')).toBe(false);
    expect(matchesExpected(short(['Cléopâtre VII']), 'cleopatre vii')).toBe(false);
  });

  it('une forme acceptée vide ne valide pas une réponse vide', () => {
    expect(matchesExpected(short(['']), '')).toBe(false);
  });
});

describe('réponse numérique', () => {
  it('lit virgule, point, signe typographique, milliers et notation scientifique', () => {
    expect(parseNumber('9,81')).toBe(9.81);
    expect(parseNumber('9.81')).toBe(9.81);
    expect(parseNumber('−3')).toBe(-3);
    expect(parseNumber('1 500')).toBe(1500);
    expect(parseNumber('1,5e3')).toBe(1500);
    expect(parseNumber('6,02×10^23')).toBe(6.02e23);
    expect(parseNumber('.5')).toBe(0.5);
    for (const bad of ['', 'abc', '1,2,3', '9,81 m', '1e', '--1']) expect(parseNumber(bad), bad).toBeNull();
  });

  it('accepte la valeur à l’écart près', () => {
    const q = numeric(9.81, 0.01);
    for (const ok of ['9,81', '9.80', '9,82']) expect(matchesExpected(q, ok), ok).toBe(true);
    for (const ko of ['9,79', '9,83', 'dix', '']) expect(matchesExpected(q, ko), ko).toBe(false);
    expect(matchesExpected(numeric(0.3), String(0.1 + 0.2))).toBe(true); // arrondi des flottants
    expect(matchesExpected(numeric(4), '4,0')).toBe(true);
    expect(matchesExpected(numeric(4), '4,001')).toBe(false);
  });

  it('écrit la réponse attendue dans la langue de l’interface', () => {
    expect(expectedText(numeric(9.81, 0.01, 'm/s²'), 'fr')).toBe('9,81 m/s² (± 0,01)');
    expect(expectedText(numeric(9.81), 'en')).toBe('9.81');
    expect(expectedText(short(['went', 'did go']), 'fr')).toBe('went / did go');
  });
});

describe('notation et passage', () => {
  const quiz: Quiz = { ...structuredClone(demoQuizzes[0]), shuffle: false, questions: [short(['went']), numeric(4)] };

  it('note en tout ou rien', () => {
    expect(scoreQuestion(short(['went']), [], 'all_or_nothing', 'WENT')).toEqual({ points: 2, correct: true });
    expect(scoreQuestion(short(['went']), [], 'partial', 'goed')).toEqual({ points: 0, correct: false });
    const r = scoreQuiz(quiz.questions, { s: { selected: [], text: 'went' }, n: { selected: [], text: '5' } }, 'all_or_nothing', 0.5);
    expect([r.score, r.maxScore, r.passed]).toEqual([2, 3, true]);
  });

  it('corrige, termine et recalcule une tentative', () => {
    const attempt = startAttempt(quiz, 'training');
    const a = { ...emptyAnswer('s'), text: ' went' };
    expect(isAnswered(a)).toBe(true);
    expect(isAnswered(emptyAnswer('n'))).toBe(false);
    expect(isAnswered({ ...emptyAnswer('n'), text: '  ' })).toBe(false);
    expect(checkAnswer(quiz, quiz.questions[0], a)).toMatchObject({ correct: true, points: 2 });

    const done = finishAttempt(quiz, attempt, [a, { ...emptyAnswer('n'), text: '3' }]);
    expect(done.result.score).toBe(2);
    expect(done.answers.map((x) => x.correct)).toEqual([true, false]);
    expect(resultOf(quiz, done.attempt, done.answers).score).toBe(2);
    expect(outcomeOf(done.answers[1], done.result.perQuestion.n)).toBe('wrong');
    expect(outcomeOf(emptyAnswer('n'), done.result.perQuestion.n)).toBe('unanswered');
  });
});

describe('édition', () => {
  it('crée une question à saisie sans réponses à cocher', () => {
    expect(newQuestion('short', 0)).toMatchObject({ type: 'short', choices: [], expected: { accepted: [''] } });
    expect(newQuestion('numeric', 0)).toMatchObject({ type: 'numeric', choices: [], expected: { tolerance: 0 } });
    expect(newQuestion('single', 0).expected).toBeNull();
  });

  it('change de type dans les deux sens', () => {
    const q = newQuestion('single', 0);
    q.choices[0].content = { fr: 'went' };
    setQuestionType(q, 'short');
    expect(q).toMatchObject({ type: 'short', choices: [], expected: { accepted: ['went'] } });
    setQuestionType(q, 'multiple');
    expect(q.expected).toBeNull();
    expect(q.choices).toHaveLength(2);
  });

  it('contrôle la réponse attendue avant publication', () => {
    const codes = (questions: Question[]) => validateQuiz({ ...quizBase, languages: ['fr'], questions }).map((i) => i.code);
    const quizBase = structuredClone(demoQuizzes[0]);
    expect(codes([short(['went']), numeric(4)])).toEqual([]);
    expect(codes([short([' '])])).toEqual(['short_needs_answer']);
    expect(codes([{ ...numeric(4), expected: { tolerance: 0 } }])).toEqual(['numeric_needs_value']);
    expect(codes([numeric(4, -1)])).toEqual(['numeric_needs_value']);
  });
});
