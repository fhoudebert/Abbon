import type { Lang, RichDoc, RichNode, RichValue } from './types';

/** Texte simple → document riche (un paragraphe par ligne), sans interpréter de HTML. */
export function plainToDoc(text: string): RichDoc {
  const lines = text.split('\n');
  return {
    type: 'doc',
    content: lines.map((line) => ({
      type: 'paragraph',
      ...(line ? { content: [{ type: 'text', text: line }] } : {}),
    })),
  };
}

export function toDoc(value: RichValue | null | undefined): RichDoc {
  if (!value) return { type: 'doc', content: [{ type: 'paragraph' }] };
  return typeof value === 'string' ? plainToDoc(value) : value;
}

const BLOCKS = new Set([
  'paragraph',
  'heading',
  'listItem',
  'codeBlock',
  'mathBlock',
  'blockquote',
  'tableRow',
  'bulletList',
  'orderedList',
]);

/** Texte brut d'un contenu riche (listes, recherche, validation). */
export function richToPlain(value: RichValue | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const out: string[] = [];
  const walk = (n: RichNode) => {
    if (n.type === 'text') out.push(n.text ?? '');
    else if (n.type === 'hardBreak') out.push('\n');
    else if (n.type === 'image') out.push(String(n.attrs?.alt ?? ''));
    else if (n.type === 'tableCell' || n.type === 'tableHeader') {
      n.content?.forEach(walk);
      out.push(' ');
      return;
    }
    n.content?.forEach(walk);
    if (BLOCKS.has(n.type)) out.push('\n');
  };
  walk(value);
  return out
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Parcourt tous les nœuds d'un contenu riche. */
export function walkRich(value: RichValue | null | undefined, visit: (n: RichNode) => void) {
  if (!value || typeof value === 'string') return;
  const walk = (n: RichNode) => {
    visit(n);
    n.content?.forEach(walk);
  };
  walk(value);
}

export function hasImage(value: RichValue | null | undefined): boolean {
  let found = false;
  walkRich(value, (n) => {
    if (n.type === 'image') found = true;
  });
  return found;
}

/** Vide si ni texte ni image. */
export function isEmptyRich(value: RichValue | null | undefined): boolean {
  return richToPlain(value).trim() === '' && !hasImage(value);
}

/** Empreintes des images référencées (pour précharger ou exporter les médias). */
export function mediaHashes(values: Iterable<RichValue | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values)
    walkRich(v, (n) => {
      if (n.type === 'image' && typeof n.attrs?.hash === 'string') set.add(n.attrs.hash);
    });
  return [...set];
}

/** Le contenu comporte-t-il une formule (nœuds `math` ou `mathBlock`) ? */
export function hasMath(value: RichValue | null | undefined): boolean {
  let found = false;
  walkRich(value, (n) => {
    if (n.type === 'math' || n.type === 'mathBlock') found = true;
  });
  return found;
}

/**
 * Nom accessible à donner à une case dont le libellé contient une formule : la source LaTeX en clair.
 * Les outils d'audit (axe) et certains lecteurs d'écran ne tirent aucun texte du MathML d'un libellé ;
 * sans formule, renvoie undefined et le libellé visible sert de nom, comme d'habitude.
 */
export const mathLabel = (value: RichValue | null | undefined) => (hasMath(value) ? richToPlain(value) : undefined);

/** Source LaTeX d'un nœud de formule (son contenu textuel). */
export const mathSource = (node: RichNode) => (node.content ?? []).map((c) => c.text ?? '').join('');

/** Images sans texte alternatif. */
export function imagesWithoutAlt(value: RichValue | null | undefined): number {
  let n = 0;
  walkRich(value, (node) => {
    if (node.type === 'image' && !String(node.attrs?.alt ?? '').trim()) n++;
  });
  return n;
}

/** Choisit la valeur dans la langue voulue, sinon la langue principale, sinon la première. */
export function pick<T>(rec: Record<Lang, T> | null | undefined, lang: Lang, fallback?: Lang): T | undefined {
  if (!rec) return undefined;
  return rec[lang] ?? (fallback ? rec[fallback] : undefined) ?? Object.values(rec)[0];
}
