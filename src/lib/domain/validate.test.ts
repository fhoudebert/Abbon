import { describe, expect, it } from 'vitest';
import { demoQuizzes } from '$lib/data/seed';
import type { Quiz } from './types';
import { canPublish, validateQuiz } from './validate';

const base = (): Quiz => structuredClone(demoQuizzes[0]); // fr + en, 3 questions valides
const codes = (q: Quiz) => validateQuiz(q).map((i) => `${i.level}:${i.code}${i.questionNumber ? `#${i.questionNumber}` : ''}`);

describe('validateQuiz', () => {
  it('accepte un QCM complet', () => {
    expect(validateQuiz(base())).toEqual([]);
    expect(canPublish(validateQuiz(base()))).toBe(true);
  });
  it('exige un titre et au moins une question', () => {
    const q = { ...base(), title: { fr: ' ', en: 'x' }, questions: [] };
    expect(codes(q)).toEqual(['error:title_empty', 'error:no_question']);
    expect(canPublish(validateQuiz(q))).toBe(false);
  });
  it('contrôle les bonnes réponses selon le type', () => {
    const q = base();
    q.questions[0].choices.forEach((c) => (c.correct = true)); // single avec 3 bonnes
    q.questions[1].choices.forEach((c) => (c.correct = false)); // multiple sans bonne
    expect(codes(q)).toEqual(['error:single_needs_one_correct#1', 'error:multiple_needs_correct#2']);
  });
  it('exige un énoncé, deux choix non vides et des points positifs', () => {
    const q = base();
    q.questions[0].prompt = { fr: { type: 'doc', content: [{ type: 'paragraph' }] }, en: 'x' };
    q.questions[1].choices = q.questions[1].choices.slice(0, 1);
    q.questions[1].choices[0].correct = true;
    q.questions[2].choices[0].content = { fr: '', en: 'x' };
    q.questions[2].points = 0;
    expect(codes(q)).toEqual([
      'error:prompt_empty#1',
      'error:too_few_choices#2',
      'error:choice_empty#3',
      'error:points_invalid#3',
    ]);
  });
  it('signale traductions manquantes et images sans texte alternatif', () => {
    const q = base();
    delete q.questions[2].prompt.en;
    q.questions[0].explanation = { fr: { type: 'doc', content: [{ type: 'image', attrs: { hash: 'h' } }] } };
    expect(codes(q)).toEqual(['warning:image_without_alt#1', 'warning:translation_missing#3']);
    expect(canPublish(validateQuiz(q))).toBe(true);
  });
});
