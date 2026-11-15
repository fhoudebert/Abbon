import { describe, expect, it } from 'vitest';
import { demoQuizzes } from '$lib/data/seed';
import { cloneQuiz, move, newQuestion, newQuiz, setQuestionType, toggleCorrect } from './factory';

describe('fabrication et édition', () => {
  it('crée un QCM brouillon vide', () => {
    const q = newQuiz('en');
    expect(q).toMatchObject({ status: 'draft', languages: ['en'], questions: [], version: 1 });
  });
  it('crée une question valide par défaut en choix unique', () => {
    const q = newQuestion('single', 0);
    expect(q.choices.map((c) => c.correct)).toEqual([true, false]);
    expect(newQuestion('multiple', 0).choices.some((c) => c.correct)).toBe(false);
  });
  it('duplique avec de nouveaux identifiants, en brouillon', () => {
    const src = demoQuizzes[0];
    const copy = cloneQuiz(src, '(copie)');
    expect(copy.id).not.toBe(src.id);
    expect(copy.status).toBe('draft');
    expect(copy.title.fr).toBe('Découverte (copie)');
    const ids = (q: typeof src) => q.questions.flatMap((x) => [x.id, ...x.choices.map((c) => c.id)]);
    expect(ids(copy).some((id) => ids(src).includes(id))).toBe(false);
    expect(copy.questions.map((q) => q.prompt)).toEqual(src.questions.map((q) => q.prompt));
  });
  it('déplace et renumérote', () => {
    const items = [{ position: 0, n: 'a' }, { position: 1, n: 'b' }, { position: 2, n: 'c' }];
    move(items, 2, -1);
    expect(items.map((i) => `${i.n}${i.position}`)).toEqual(['a0', 'c1', 'b2']);
    move(items, 0, -1); // hors limites : inchangé
    expect(items[0].n).toBe('a');
  });
  it('choix unique : une seule bonne réponse', () => {
    const q = newQuestion('single', 0);
    toggleCorrect(q, q.choices[1].id);
    expect(q.choices.map((c) => c.correct)).toEqual([false, true]);
    setQuestionType(q, 'multiple');
    toggleCorrect(q, q.choices[0].id);
    expect(q.choices.map((c) => c.correct)).toEqual([true, true]);
    setQuestionType(q, 'single');
    expect(q.choices.map((c) => c.correct)).toEqual([true, false]);
  });
});
