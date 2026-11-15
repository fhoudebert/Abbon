import { describe, expect, it } from 'vitest';
import { demoCategories, demoQuizzes } from '$lib/data/seed';
import type { QuizSummary } from '$lib/domain/types';
import { actionsFor, planImport, resolveImport } from './plan';

const summary = (i: number, version = 1): QuizSummary => {
  const { questions, ...rest } = structuredClone(demoQuizzes[i]);
  return { ...rest, version, questionCount: questions.length };
};

describe('plan d’import', () => {
  it('propose ajouter / remplacer / ignorer selon la version', () => {
    const incoming = [
      { ...structuredClone(demoQuizzes[0]), version: 3 },
      structuredClone(demoQuizzes[1]),
      { ...structuredClone(demoQuizzes[2]), id: 'nouveau' },
    ];
    const plan = planImport(incoming, [summary(0, 2), summary(1, 1)]);
    expect(plan.map((p) => p.action)).toEqual(['replace', 'skip', 'add']);
    expect(actionsFor(plan[0])).toEqual(['replace', 'duplicate', 'skip']);
    expect(actionsFor(plan[2])).toEqual(['add', 'skip']);
  });

  it('applique les choix et prépare le rapport', () => {
    const plan = planImport(
      [structuredClone(demoQuizzes[0]), structuredClone(demoQuizzes[1]), { ...structuredClone(demoQuizzes[2]), id: 'n' }],
      [summary(0, 4), summary(1)],
    );
    plan[0].action = 'replace';
    plan[1].action = 'duplicate';
    const r = resolveImport(plan, demoCategories, [], '(import)', new Date('2026-11-15T10:00:00Z'));
    expect(r.quizzes.map((q) => q.id).slice(0, 1)).toEqual(['demo-culture']);
    expect(r.quizzes[0].version).toBe(5); // toujours au-dessus de l’existant
    expect(r.quizzes[1].id).not.toBe('demo-network');
    expect(r.quizzes[1].title.fr).toBe('Réseaux – notions de base (import)');
    expect(r.report).toEqual({ added: ['n'], replaced: ['demo-culture'], duplicated: [r.quizzes[1].id], skipped: [] });
    expect(r.categories.map((c) => c.id)).toEqual(demoCategories.map((c) => c.id));
  });

  it('ne modifie pas les catégories existantes et détache les catégories inconnues', () => {
    const quiz = { ...structuredClone(demoQuizzes[0]), categoryId: 'fantome' };
    const r = resolveImport(planImport([quiz], []), [{ ...demoCategories[1], parentId: 'absent' }], [demoCategories[0]], 'x');
    expect(r.quizzes[0].categoryId).toBeNull();
    expect(r.categories).toEqual([{ ...demoCategories[1], parentId: null }]);
  });
});
