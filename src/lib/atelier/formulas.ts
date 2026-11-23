/**
 * Atelier de formules (page autonome, tools/atelier) : conversions pour coller une formule dans un traitement de
 * texte, et carnet de formules enregistré en Markdown. Fonctions pures, testées.
 */
import katex from 'katex';
import 'katex/contrib/mhchem';
import { mathMacros, standardLatex } from '$lib/rich/macros';

export const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

/**
 * Formule complète en LaTeX standard : la chimie est écrite en notation mhchem, entourée de `\ce{…}` ; les
 * commandes propres à MathLive (`\exponentialE`…) sont remplacées.
 */
export const toLatex = (source: string, chem: boolean) => (chem ? `\\ce{${source.trim()}}` : standardLatex(source.trim()));

/**
 * MathML d'une formule, pour le presse-papiers. Word convertit en équation un texte qui commence exactement
 * par `<math xmlns="…">` : pas d'autre attribut, pas d'annotation LaTeX. Erreur explicite si la formule est fausse.
 */
export function toMathML(latex: string): string {
  const html = katex.renderToString(latex, { output: 'mathml', displayMode: true, throwOnError: true, trust: false, strict: 'ignore', macros: mathMacros() });
  const start = html.indexOf('<math');
  const end = html.lastIndexOf('</math>');
  if (start < 0 || end < 0) throw new Error('MathML introuvable');
  let inner = html.slice(html.indexOf('>', start) + 1, end);
  inner = inner.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '').replace(/<\/?semantics>/g, '');
  return `<math xmlns="${MATHML_NS}">${inner}</math>`;
}

/** Pour LibreOffice (Outils → Importer MathML depuis le presse-papiers) : document MathML complet. */
export const toLibreOfficeMathML = (mathml: string) => `<?xml version="1.0" encoding="UTF-8"?>\n${mathml}`;

/** Rendu HTML + MathML (aperçu, carnet). La page charge elle-même la feuille de style de KaTeX. */
export const renderFormula = (latex: string, display: boolean) =>
  katex.renderToString(latex, { output: 'htmlAndMathml', displayMode: display, throwOnError: false, trust: false, strict: 'ignore', macros: mathMacros() });

/** Message d'erreur d'une formule, ou null. */
export function formulaError(latex: string): string | null {
  if (!latex.trim()) return null;
  try {
    katex.renderToString(latex, { throwOnError: true, strict: 'ignore', trust: false, macros: mathMacros() });
    return null;
  } catch (e) {
    return (e as Error).message.replace(/^KaTeX parse error: /, '');
  }
}

// ---- Carnet de formules -------------------------------------------------------------------------------

export interface Entry {
  id: string;
  title: string;
  /** Saisie : LaTeX, ou notation mhchem sans `\ce{}` pour la chimie. */
  source: string;
  chem: boolean;
}

/**
 * Carnet en Markdown : lisible et modifiable dans n'importe quel éditeur, et converti par Pandoc en `.docx`
 * avec des équations Word natives (`pandoc carnet.md -o carnet.docx`).
 */
export function toMarkdown(entries: readonly Entry[], title = 'Carnet de formules'): string {
  const blocks = entries.map((e) => `## ${e.title.trim() || 'Sans titre'}\n\n$$${toLatex(e.source, e.chem)}$$\n`);
  return `# ${title}\n\n${blocks.join('\n')}`;
}

/** Relit un carnet : chaque `## titre` suivi d'une formule `$$…$$` (ou `$…$`) ; le reste est ignoré. */
export function fromMarkdown(text: string, newId: () => string = () => crypto.randomUUID()): Entry[] {
  const out: Entry[] = [];
  const sections = text.replace(/\r\n?/g, '\n').split(/^##\s+/m).slice(1);
  for (const section of sections) {
    const nl = section.indexOf('\n');
    const title = (nl < 0 ? section : section.slice(0, nl)).trim();
    const body = nl < 0 ? '' : section.slice(nl + 1);
    const m = body.match(/\$\$([\s\S]+?)\$\$/) ?? body.match(/\$([^$\n]+)\$/);
    if (!m) continue;
    const latex = m[1].trim();
    const ce = latex.match(/^\\ce\{([\s\S]*)\}$/);
    out.push({ id: newId(), title, source: ce ? ce[1].trim() : latex, chem: !!ce });
  }
  return out;
}
