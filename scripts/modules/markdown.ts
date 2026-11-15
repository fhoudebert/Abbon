/**
 * Sous-ensemble de Markdown → contenu riche d'Abbon (document JSON TipTap), pour les sources de modules.
 *
 * Blocs : paragraphes, titres (`##`, `###`), listes à puces et numérotées (un niveau), blocs de code
 * (``` avec langage), citations (`>`), tableaux à barres verticales, filet (`---`).
 * En ligne : `code`, **gras**, *italique*, retour à la ligne forcé (deux espaces ou `\` en fin de ligne).
 * Aucun HTML n'est interprété : une balise reste du texte.
 */
import type { RichDoc, RichNode, RichValue } from '$lib/domain/types';

type Mark = { type: 'bold' | 'italic' | 'code' };

/** Texte en ligne → nœuds `text` avec marques. */
export function parseInline(src: string): RichNode[] {
  const out: RichNode[] = [];
  let buf = '';
  let bold = false;
  let italic = false;
  const flush = (extra: Mark[] = []) => {
    if (!buf) return;
    const marks: Mark[] = [...(bold ? [{ type: 'bold' as const }] : []), ...(italic ? [{ type: 'italic' as const }] : []), ...extra];
    out.push({ type: 'text', text: buf, ...(marks.length ? { marks } : {}) });
    buf = '';
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length && /[\\`*_[\]#>|-]/.test(src[i + 1])) {
      buf += src[++i];
    } else if (ch === '`') {
      // `code` ou ``code avec ` dedans``
      const fence = /^`+/.exec(src.slice(i))![0];
      const end = src.indexOf(fence, i + fence.length);
      if (end === -1) {
        buf += ch;
        continue;
      }
      flush();
      buf = src.slice(i + fence.length, end).replace(/^ (.*) $/, '$1');
      flush([{ type: 'code' }]);
      i = end + fence.length - 1;
    } else if (ch === '*' && src[i + 1] === '*') {
      flush();
      bold = !bold;
      i++;
    } else if (ch === '*') {
      flush();
      italic = !italic;
    } else {
      buf += ch;
    }
  }
  flush();
  if (bold || italic) throw new Error(`marque * ou ** non refermée : « ${src} »`);
  return out;
}

/** Lignes d'un paragraphe → contenu en ligne (retours forcés compris). */
function inlineLines(lines: string[]): RichNode[] {
  const out: RichNode[] = [];
  lines.forEach((line, i) => {
    const hard = /( {2,}|\\)$/.test(line) && i < lines.length - 1;
    const text = line.replace(/( {2,}|\\)$/, '').trim() + (hard || i === lines.length - 1 ? '' : ' ');
    out.push(...parseInline(text));
    if (hard) out.push({ type: 'hardBreak' });
  });
  return out;
}

const paragraph = (lines: string[]): RichNode => {
  const content = inlineLines(lines);
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
};

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l: string) => /^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/.test(l);
const cells = (l: string) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replaceAll('\\|', '|'));

/** Markdown (blocs) → nœuds de document. */
export function parseBlocks(src: string): RichNode[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: RichNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = /^\s*(`{3,})\s*([\w+#-]*)(.*)$/.exec(line);
    if (fence) {
      const body: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) body.push(lines[i]);
      if (i >= lines.length) throw new Error('bloc de code non refermé');
      i++;
      const text = body.join('\n');
      out.push({
        type: 'codeBlock',
        attrs: { language: fence[2] || null },
        ...(text ? { content: [{ type: 'text', text }] } : {}),
      });
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      // `##` devient le premier niveau sous le titre de la page.
      out.push({ type: 'heading', attrs: { level: Math.max(1, heading[1].length - 1) }, content: parseInline(heading[2].trim()) });
      i++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push({ type: 'horizontalRule' });
      i++;
      continue;
    }
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const row = (l: string, type: 'tableHeader' | 'tableCell'): RichNode => ({
        type: 'tableRow',
        content: cells(l).map((c) => ({ type, content: [paragraph([c])] })),
      });
      const rows = [row(line, 'tableHeader')];
      for (i += 2; i < lines.length && isTableRow(lines[i]); i++) rows.push(row(lines[i], 'tableCell'));
      out.push({ type: 'table', content: rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      for (; i < lines.length && /^\s*>/.test(lines[i]); i++) body.push(lines[i].replace(/^\s*> ?/, ''));
      out.push({ type: 'blockquote', content: parseBlocks(body.join('\n')) });
      continue;
    }
    const bullet = /^\s*[-*+]\s+/;
    const ordered = /^\s*\d+[.)]\s+/;
    const marker = bullet.test(line) ? bullet : ordered.test(line) ? ordered : null;
    if (marker) {
      const items: string[][] = [];
      for (; i < lines.length && lines[i].trim(); i++) {
        if (marker.test(lines[i])) items.push([lines[i].replace(marker, '')]);
        else if (/^\s+\S/.test(lines[i])) items[items.length - 1].push(lines[i]);
        else break;
      }
      out.push({
        type: marker === bullet ? 'bulletList' : 'orderedList',
        content: items.map((it) => ({ type: 'listItem', content: [paragraph(it)] })),
      });
      continue;
    }
    const para: string[] = [];
    for (; i < lines.length && lines[i].trim() && !/^\s*(`{3,}|#{1,4}\s|>|\|)/.test(lines[i]); i++) para.push(lines[i]);
    if (!para.length) para.push(lines[i++]); // ligne « | » isolée : texte ordinaire
    out.push(paragraph(para));
  }
  return out;
}

export const toDocument = (src: string): RichDoc => ({ type: 'doc', content: parseBlocks(src) });

/**
 * Valeur la plus simple possible : un paragraphe sans mise en forme reste une chaîne
 * (plus lisible dans le JSON, et compatible avec l'export GIFT).
 */
export function toRich(src: string): RichValue {
  const doc = toDocument(src.trim());
  const only = doc.content?.length === 1 ? doc.content[0] : null;
  if (only?.type === 'paragraph' && (only.content ?? []).every((n) => n.type === 'text' && !n.marks)) {
    return (only.content ?? []).map((n) => n.text ?? '').join('');
  }
  return doc;
}
