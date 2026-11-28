/**
 * Textes à trous : un texte par langue où « {{1}} », « {{2}} »… marquent l'emplacement des trous,
 * et une liste de trous (réponse à saisir, ou à choisir dans une liste déroulante). Fonctions pures.
 */
import { normalizeText } from './typed';
import type { ClozeGap, Question } from './types';

export type ClozeSegment = { text: string } | { gap: number };

const MARKER = /\{\{(\d{1,3})\}\}/g;

/** Découpe un texte en morceaux de texte et en trous (indice à partir de 0). */
export function clozeSegments(text: string): ClozeSegment[] {
  const out: ClozeSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKER)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ gap: Number(m[1]) - 1 });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** Chaque trou doit apparaître exactement une fois dans le texte, et aucun autre. */
export function markersMatch(text: string, gapCount: number): boolean {
  const seen = clozeSegments(text).flatMap((s) => ('gap' in s ? [s.gap] : []));
  return seen.length === gapCount && new Set(seen).size === gapCount && seen.every((g) => g >= 0 && g < gapCount);
}

/** Retire le trou n° `index` (à partir de 0) d'un texte et renumérote les suivants. */
export function removeMarker(text: string, index: number): string {
  return text.replace(MARKER, (_m, n: string) => {
    const k = Number(n) - 1;
    return k === index ? '' : k > index ? `{{${k}}}` : `{{${k + 1}}}`;
  });
}

export const isSelectGap = (gap: ClozeGap) => gap.kind === 'select';

/** Propositions d'une liste déroulante, sans doublon, bonne réponse comprise. */
export function gapOptions(gap: ClozeGap): string[] {
  return [...new Set([...(gap.accepted ?? []).slice(0, 1), ...(gap.options ?? [])].map((o) => o.trim()).filter(Boolean))];
}

export function gapMatches(gap: ClozeGap, value: string | null | undefined): boolean {
  if (value == null || !value.trim()) return false;
  // Liste déroulante : comparaison exacte avec la bonne réponse.
  const cs = isSelectGap(gap) ? true : gap.caseSensitive;
  const accepted = isSelectGap(gap) ? (gap.accepted ?? []).slice(0, 1) : (gap.accepted ?? []);
  const accents = !isSelectGap(gap) && !!gap.ignoreAccents;
  const given = normalizeText(value, cs, accents);
  return accepted.some((a) => a.trim() !== '' && normalizeText(a, cs, accents) === given);
}

/** Résultat trou par trou. */
export function gapResults(question: Pick<Question, 'expected'>, texts: readonly (string | null | undefined)[] | null | undefined): boolean[] {
  return (question.expected?.gaps ?? []).map((g, i) => gapMatches(g, texts?.[i]));
}

/** Réponse attendue d'un trou, lisible : « went / did go ». */
export const gapExpected = (gap: ClozeGap) =>
  (isSelectGap(gap) ? (gap.accepted ?? []).slice(0, 1) : (gap.accepted ?? [])).filter((a) => a.trim()).join(' / ');
