import { describe, expect, it } from 'vitest';
import { categoryTree, withDescendants } from './categories';
import type { Category } from './types';

const cat = (id: string, parentId: string | null = null, position = 0): Category => ({ id, parentId, name: { fr: id }, position });
const all = [cat('chimie'), cat('matiere', 'chimie'), cat('physique'), cat('mouvement', 'physique'), cat('ondes', 'physique'), cat('energie', 'physique'), cat('perso')];

describe('arbre des catégories', () => {
  it('un regroupement comprend toutes ses descendantes', () => {
    expect([...withDescendants('physique', all)].sort()).toEqual(['energie', 'mouvement', 'ondes', 'physique']);
    expect([...withDescendants('matiere', all)]).toEqual(['matiere']);
    const deep = [cat('a'), cat('b', 'a'), cat('c', 'b')];
    expect([...withDescendants('a', deep)].sort()).toEqual(['a', 'b', 'c']);
  });

  it('se protège d’une boucle de parents', () => {
    const loop = [cat('x', 'y'), cat('y', 'x')];
    expect([...withDescendants('x', loop)].sort()).toEqual(['x', 'y']);
    expect(categoryTree(loop, new Set(['x']))).toEqual([]);
  });

  it('range les filles sous leur parent et ne garde que ce qui contient des QCM', () => {
    const tree = categoryTree(all, new Set(['matiere', 'mouvement', 'ondes']));
    expect(tree.map((n) => `${'  '.repeat(n.depth)}${n.category.id}`)).toEqual(['chimie', '  matiere', 'physique', '  mouvement', '  ondes']);
  });

  it('catégories personnelles d’abord, puis module par module', () => {
    const mixed: Category[] = [
      { ...cat('suites', null, 0), moduleId: 'org.abbon.maths' },
      { ...cat('perso-b', null, 1) },
      { ...cat('chimie', null, 0), moduleId: 'org.abbon.pc' },
      { ...cat('perso-a', null, 0) },
      { ...cat('fonctions', null, 1), moduleId: 'org.abbon.maths' },
    ];
    const used = new Set(mixed.map((c) => c.id));
    expect(categoryTree(mixed, used).map((n) => n.category.id)).toEqual(['perso-a', 'perso-b', 'suites', 'fonctions', 'chimie']);
  });

  it('un parent inconnu ramène la catégorie au premier niveau', () => {
    expect(categoryTree([cat('orpheline', 'disparue')], new Set(['orpheline']))).toEqual([{ category: cat('orpheline', 'disparue'), depth: 0 }]);
  });
});
