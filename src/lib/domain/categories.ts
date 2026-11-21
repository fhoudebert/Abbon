/**
 * Arbre des catégories (lot 17) : regroupements comme « Physique » au-dessus des catégories des modules ou
 * de l'utilisateur. Fonctions pures.
 */
import type { Category } from './types';

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
