/**
 * Questions à saisie : « réponse courte » (texte) et « réponse numérique ».
 * Comparaison de la réponse saisie à la réponse attendue, en fonctions pures.
 */
import { sameExpression } from './expr';
import type { ExpectedAnswer, Question } from './types';

/** Question à saisie : pas de réponses à cocher (`choices` vide). */
export const isTyped = (q: Pick<Question, 'type'>) =>
  q.type === 'short' || q.type === 'numeric' || q.type === 'cloze' || q.type === 'expression';

/**
 * Texte ramené à une forme comparable : espaces superflus retirés, apostrophes et espaces
 * typographiques unifiés, majuscules ignorées (sauf demande contraire). Les accents comptent.
 */
export function normalizeText(s: string, caseSensitive = false): string {
  const t = s
    .normalize('NFC')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return caseSensitive ? t : t.toLocaleLowerCase();
}

/**
 * Nombre saisi → valeur, ou null s'il est illisible.
 * Accepte la virgule ou le point décimal, le signe moins typographique, les espaces de milliers
 * et la notation scientifique (« 1,5e3 »).
 */
export function parseNumber(s: string): number | null {
  let t = s
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/[\s   ]/g, '')
    .replace(/×10\^?/i, 'e');
  if (t.includes(',') && !t.includes('.')) t = t.replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** La réponse saisie est-elle juste ? */
export function matchesExpected(question: Pick<Question, 'type' | 'expected'>, text: string | null | undefined): boolean {
  const e = question.expected;
  if (!e || text == null || !text.trim()) return false;
  if (question.type === 'short') {
    const given = normalizeText(text, e.caseSensitive);
    return (e.accepted ?? []).some((a) => a.trim() !== '' && normalizeText(a, e.caseSensitive) === given);
  }
  if (question.type === 'numeric') {
    const n = parseNumber(text);
    if (n === null || typeof e.value !== 'number') return false;
    const tol = Math.max(0, e.tolerance ?? 0);
    // Marge d'arrondi des flottants (0,1 + 0,2 ≠ 0,3).
    const eps = 1e-9 * Math.max(1, Math.abs(e.value), tol);
    return Math.abs(n - e.value) <= tol + eps;
  }
  if (question.type === 'expression') return !!e.latex && sameExpression(e.latex, text, { constant: e.constant });
  return false;
}

/** Nombre écrit dans la langue de l'interface (virgule décimale en français), sans arrondi. */
export const formatNumber = (n: number, lang: string) =>
  new Intl.NumberFormat(lang, { maximumSignificantDigits: 15, useGrouping: false }).format(n);

/** Réponse attendue, lisible : « went / gone », « 9,81 m·s⁻² (± 0,01) ». */
export function expectedText(question: Pick<Question, 'type' | 'expected'>, lang: string): string {
  const e: ExpectedAnswer | null | undefined = question.expected;
  if (!e) return '';
  if (question.type === 'short') return (e.accepted ?? []).filter((a) => a.trim()).join(' / ');
  if (question.type === 'cloze') return (e.gaps ?? []).map((g) => (g.kind === 'select' ? g.accepted.slice(0, 1) : g.accepted).join(' / ')).join(' · ');
  if (question.type === 'numeric' && typeof e.value === 'number') {
    const unit = e.unit ? ` ${e.unit}` : '';
    const tol = e.tolerance ? ` (± ${formatNumber(e.tolerance, lang)})` : '';
    return `${formatNumber(e.value, lang)}${unit}${tol}`;
  }
  // Expression : la source LaTeX (les écrans l'affichent rendue, avec `renderMath`).
  if (question.type === 'expression') return e.latex ? (e.constant ? `${e.latex} + C` : e.latex) : '';
  return '';
}
