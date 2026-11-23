/**
 * Arbre des catégories (lot 17) : regroupements comme « Physique » au-dessus des catégories des modules ou
 * de l'utilisateur. Fonctions pures.
 */
import type { Category, I18nText } from './types';

/** La catégorie et toutes ses descendantes (protégé contre une boucle de parents). */
export function withDescendants(id: string, categories: readonly Category[]): Set<string> {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories)
      if (c.parentId && out.has(c.parentId) && !out.has(c.id)) {
        out.add(c.id);
        grew = true;
      }
  }
  return out;
}

export interface CategoryNode {
  category: Category;
  depth: number;
}

/**
 * Catégories en arbre, dans l'ordre d'affichage : les catégories personnelles d'abord, puis celles de chaque
 * module (chacun numérote ses positions à partir de 0), chaque parent suivi de ses filles. Limitées à celles
 * qui contiennent, elles ou leurs descendantes, une catégorie de `used`.
 */
export function categoryTree(categories: readonly Category[], used: ReadonlySet<string>): CategoryNode[] {
  const ids = new Set(categories.map((c) => c.id));
  const childrenOf = new Map<string | null, Category[]>();
  const ordered = [...categories].sort(
    (a, b) => (a.moduleId ?? '').localeCompare(b.moduleId ?? '') || a.position - b.position || a.id.localeCompare(b.id),
  );
  for (const c of ordered) {
    const parent = c.parentId && ids.has(c.parentId) && c.parentId !== c.id ? c.parentId : null;
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), c]);
  }
  const keep = (c: Category) => [...withDescendants(c.id, categories)].some((id) => used.has(id));
  const out: CategoryNode[] = [];
  const seen = new Set<string>();
  const visit = (parent: string | null, depth: number) => {
    for (const c of childrenOf.get(parent) ?? []) {
      if (seen.has(c.id) || !keep(c)) continue;
      seen.add(c.id);
      out.push({ category: c, depth });
      visit(c.id, depth + 1);
    }
  };
  visit(null, 0);
  return out;
}

/** Entrée du filtre de l'accueil : un module entier (« Étymologie », « Maths spécialité »…) ou une catégorie. */
export interface FilterNode {
  /** `module:<id>` pour un module, sinon l'identifiant de la catégorie. */
  value: string;
  depth: number;
  module?: { id: string; title: I18nText };
  category?: Category;
}

export const MODULE_FILTER = 'module:';

/**
 * Filtre de l'accueil : d'abord les catégories personnelles (en arbre), puis chaque module qui a des QCM, choisi
 * d'un coup ou par catégorie (ses catégories en arbre, en retrait). Seules les catégories qui contiennent des QCM
 * sont proposées ; les modules sont dans l'ordre de leur titre.
 */
export function homeFilters(
  categories: readonly Category[],
  modules: readonly { id: string; title: I18nText }[],
  quizzes: readonly { categoryId?: string | null; moduleId?: string | null }[],
  titleOf: (t: I18nText) => string,
): FilterNode[] {
  const used = new Set(quizzes.map((q) => q.categoryId).filter((id): id is string => !!id));
  const out: FilterNode[] = categoryTree(
    categories.filter((c) => !c.moduleId),
    used,
  ).map((n) => ({ value: n.category.id, depth: n.depth, category: n.category }));
  const withQuizzes = new Set(quizzes.map((q) => q.moduleId).filter((id): id is string => !!id));
  const sorted = modules.filter((m) => withQuizzes.has(m.id)).sort((a, b) => titleOf(a.title).localeCompare(titleOf(b.title)));
  for (const m of sorted) {
    out.push({ value: `${MODULE_FILTER}${m.id}`, depth: 0, module: m });
    const own = categories.filter((c) => c.moduleId === m.id);
    const usedHere = new Set(quizzes.filter((q) => q.moduleId === m.id).map((q) => q.categoryId).filter((id): id is string => !!id));
    // Une seule catégorie : le module suffit.
    const tree = categoryTree(own, usedHere);
    if (tree.length > 1) for (const n of tree) out.push({ value: n.category.id, depth: n.depth + 1, category: n.category });
  }
  return out;
}

/** Le QCM correspond-il au filtre choisi (module entier, ou catégorie et ses descendantes) ? */
export function matchesFilter(
  quiz: { categoryId?: string | null; moduleId?: string | null },
  value: string,
  categories: readonly Category[],
): boolean {
  if (!value) return true;
  if (value.startsWith(MODULE_FILTER)) return quiz.moduleId === value.slice(MODULE_FILTER.length);
  return !!quiz.categoryId && withDescendants(value, categories).has(quiz.categoryId);
}
