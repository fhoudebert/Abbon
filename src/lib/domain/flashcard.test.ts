import { describe, expect, it } from 'vitest';
import { compileModule } from '../../../scripts/modules/source';
import { QuestionSchema } from '$lib/interchange/format';
import { newQuestion, newQuiz, setQuestionType } from './factory';
import { dueCards, newCard } from './leitner';
import { plainToDoc } from './rich';
import { scoreQuestion } from './scoring';
import { FLASH_KNOWN, FLASH_UNKNOWN, hasChoices, isTyped } from './typed';
import type { Question } from './types';
import { validateQuiz } from './validate';

const card = (back = 'Paris'): Question => ({
  ...newQuestion('flashcard', 0),
  prompt: { fr: plainToDoc('Capitale de la France ?') },
  explanation: back ? { fr: plainToDoc(back) } : null,
});

describe('carte recto-verso', () => {
  it('n’a ni réponses à cocher ni réponse à saisir', () => {
    const q = newQuestion('flashcard', 0);
    expect([q.choices, q.expected, hasChoices(q), isTyped(q)]).toEqual([[], null, false, false]);
    const fromSingle = newQuestion('single', 0);
    setQuestionType(fromSingle, 'flashcard');
    expect([fromSingle.choices, fromSingle.expected]).toEqual([[], null]);
  });

  it('est notée d’après ce que l’élève déclare', () => {
    expect(scoreQuestion(card(), [], 'all_or_nothing', FLASH_KNOWN)).toEqual({ points: 1, correct: true });
    expect(scoreQuestion(card(), [], 'all_or_nothing', FLASH_UNKNOWN)).toEqual({ points: 0, correct: false });
    expect(scoreQuestion(card(), [], 'all_or_nothing', null).correct).toBe(false);
  });

  it('exige un verso', () => {
    const quiz = (q: Question) => ({ ...newQuiz('fr'), title: { fr: 'Cartes' }, questions: [q] });
    expect(validateQuiz(quiz(card())).filter((i) => i.level === 'error')).toEqual([]);
    expect(validateQuiz(quiz(card(''))).map((i) => i.code)).toContain('flashcard_needs_back');
  });

  it('passe par le format d’échange', () => {
    expect(QuestionSchema.safeParse(card()).success).toBe(true);
  });

  it('s’écrit dans les sources de modules (« · flashcard », verso dans « > »)', () => {
    const src = (body: string) => [
      { path: 'module.yaml', text: 'id: org.abbon.test\nversion: 1.0.0\ndate: 2026-11-21\ntitle: { fr: Test }\ndescription: { fr: Test }\nlevel: x\nlicense: CC-BY-NC-SA-4.0\nauthors: [Abbon]\nlanguages: [fr]\ncategories:\n  - id: c\n    name: { fr: C }\n' },
      { path: 'c/01.md', text: `---\nid: q-01\ntitle: { fr: Q }\nlevel: bases\n---\n\n## carte · flashcard\nThéorème de Pythagore ?\n${body}\n> Dans un triangle rectangle, $a^2 + b^2 = c^2$.\n` },
    ];
    const ok = compileModule(src(''));
    expect(ok.issues.filter((i) => i.level === 'error')).toEqual([]);
    const q = ok.quizzes[0].questions[0];
    expect([q.type, q.choices, q.expected ?? null]).toEqual(['flashcard', [], null]);
    expect(JSON.stringify(q.explanation)).toContain('triangle rectangle');
    expect(compileModule(src('\n- [x] Oui\n- [ ] Non\n')).issues.some((i) => /recto-verso/.test(i.message))).toBe(true);
  });
});

describe('ordre des cartes saisies', () => {
  it('à compartiment et date égaux, dans l’ordre d’ajout', () => {
    const quiz = { id: 'mes-cartes', title: { fr: 'Mes cartes' }, languages: ['fr' as const] };
    const now = new Date(2026, 10, 21, 10);
    const later = new Date(2026, 10, 21, 10, 5);
    const a = newCard(quiz, { ...card(), id: 'a' }, now);
    const b = newCard(quiz, { ...card(), id: 'b' }, later);
    const due = dueCards([b, a], new Date(2026, 10, 21, 12));
    expect(due.map((c) => c.questionId)).toEqual(['a', 'b']);
  });
});
