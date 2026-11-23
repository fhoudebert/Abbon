/**
 * Rendu des formules : LaTeX → HTML + MathML par KaTeX, avec l'extension mhchem (`\ce` pour les
 * équations chimiques, `\pu` pour les grandeurs avec unité). Hors ligne, sans script dans le résultat.
 *
 * `trust: false` : les commandes qui produiraient un lien, une image ou du HTML libre sont refusées.
 * Le résultat contient du MathML, lu par les lecteurs d'écran, et un rendu visuel masqué pour eux.
 */
import katex from 'katex';
import 'katex/contrib/mhchem';
import 'katex/dist/katex.min.css';
import { mathMacros } from './macros';

const OPTIONS = { output: 'htmlAndMathml', trust: false, strict: 'ignore', maxExpand: 500, maxSize: 20 } as const;
const cache = new Map<string, string>();

/** HTML d'une formule. Une formule fautive est affichée en rouge, avec son message, sans rien casser. */
export function renderMath(latex: string, display = false): string {
  const key = (display ? 'D' : 'I') + latex;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(latex, { ...OPTIONS, macros: mathMacros(), displayMode: display, throwOnError: false });
    if (cache.size > 2000) cache.clear();
    cache.set(key, html);
  }
  return html;
}

/** Message d'erreur d'une formule, ou null si elle compile (contrôle des sources de modules, éditeur). */
export function mathError(latex: string): string | null {
  if (!latex.trim()) return 'formule vide';
  try {
    katex.renderToString(latex, { ...OPTIONS, macros: mathMacros(), throwOnError: true });
    return null;
  } catch (e) {
    return (e as Error).message.replace(/^KaTeX parse error: /, '');
  }
}
