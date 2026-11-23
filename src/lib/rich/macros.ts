/**
 * Commandes propres à MathLive, que son éditeur visuel et son clavier écrivent dans le LaTeX (touche « e » :
 * `\exponentialE`, « i » : `\imaginaryI`, « d » des intégrales : `\differentialD`…), et que KaTeX ne connaît
 * pas. Mêmes définitions que les macros par défaut de MathLive. À passer en copie (KaTeX peut les compléter).
 */
export const MATHLIVE_MACROS: Readonly<Record<string, string>> = {
  '\\exponentialE': '\\mathrm{e}',
  '\\imaginaryI': '\\mathrm{i}',
  '\\imaginaryJ': '\\mathrm{j}',
  '\\differentialD': '\\mathrm{d}',
  '\\capitalDifferentialD': '\\mathrm{D}',
  '\\rd': '\\mathrm{d}',
  '\\rD': '\\mathrm{D}',
  '\\odif': '\\mathrm{d}',
  '\\doubleStruckCapitalN': '\\mathbb{N}',
  '\\doubleStruckCapitalR': '\\mathbb{R}',
  '\\doubleStruckCapitalQ': '\\mathbb{Q}',
  '\\doubleStruckCapitalZ': '\\mathbb{Z}',
  '\\doubleStruckCapitalP': '\\mathbb{P}',
  '\\scriptCapitalE': '\\mathscr{E}',
  '\\scriptCapitalH': '\\mathscr{H}',
  '\\scriptCapitalL': '\\mathscr{L}',
  '\\gothicCapitalC': '\\mathfrak{C}',
  '\\gothicCapitalH': '\\mathfrak{H}',
  '\\gothicCapitalI': '\\mathfrak{I}',
  '\\gothicCapitalR': '\\mathfrak{R}',
  '\\nicefrac': '^{#1}\\!\\!/\\!_{#2}',
  // Case vide d'un modèle du clavier (□² avant d'écrire l'exposant).
  '\\placeholder': '\\square',
};

export const mathMacros = () => ({ ...MATHLIVE_MACROS });

/**
 * LaTeX standard : les commandes de MathLive sans argument sont remplacées par leur définition (pour LaTeX,
 * Pandoc, Moodle, MathJax…), une case vide `\placeholder{}` par `\square`.
 */
export function standardLatex(latex: string): string {
  return latex
    .replace(/\\placeholder(?:\[[^\]]*\])?\{\}/g, '\\square ')
    .replace(/\\([a-zA-Z]+)(?![a-zA-Z])/g, (m, name: string) => {
      const def = MATHLIVE_MACROS[`\\${name}`];
      return def && !def.includes('#') && name !== 'placeholder' ? def : m;
    });
}
