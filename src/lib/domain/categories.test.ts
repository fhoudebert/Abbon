import { describe, expect, it } from 'vitest';
import { categoryTree, homeFilters, matchesFilter, withDescendants } from './categories';
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

describe('filtre de l’accueil', () => {
  const cat = (id: string, moduleId: string | null, parentId: string | null = null, position = 0) =>
    ({ id, parentId, name: { fr: id }, position, moduleId }) as Category;
  const categories = [
    cat('perso', null),
    cat('vide', null, null, 1),
    cat('ety-a', 'org.ety'),
    cat('ety-b', 'org.ety', null, 1),
    cat('physique', 'org.pc'),
    cat('meca', 'org.pc', 'physique'),
    cat('seule', 'org.seul'),
  ];
  const modules = [
    { id: 'org.pc', title: { fr: 'Physique-chimie' } },
    { id: 'org.ety', title: { fr: 'Étymologie' } },
    { id: 'org.seul', title: { fr: 'Anglais' } },
    { id: 'org.vide', title: { fr: 'Sans QCM' } },
  ];
  const quizzes = [
    { categoryId: 'perso', moduleId: null },
    { categoryId: 'ety-a', moduleId: 'org.ety' },
    { categoryId: 'ety-b', moduleId: 'org.ety' },
    { categoryId: 'meca', moduleId: 'org.pc' },
    { categoryId: 'seule', moduleId: 'org.seul' },
  ];
  const fr = (t: Record<string, string>) => t.fr;

  it('catégories personnelles, puis chaque module (par titre) avec ses catégories en retrait', () => {
    const f = homeFilters(categories, modules, quizzes, fr);
    expect(f.map((n) => `${'-'.repeat(n.depth)}${n.value}`)).toEqual([
      'perso',
      'module:org.seul', // une seule catégorie : pas de détail
      'module:org.ety',
      '-ety-a',
      '-ety-b',
      'module:org.pc', // sous-catégories en arbre
      '-physique',
      '--meca',
    ]);
  });

  it('module entier, catégorie et descendantes', () => {
    expect(matchesFilter(quizzes[1], 'module:org.ety', categories)).toBe(true);
    expect(matchesFilter(quizzes[3], 'module:org.ety', categories)).toBe(false);
    expect(matchesFilter(quizzes[3], 'physique', categories)).toBe(true);
    expect(matchesFilter(quizzes[0], '', categories)).toBe(true);
    expect(matchesFilter({ categoryId: null }, 'perso', categories)).toBe(false);
  });
});
