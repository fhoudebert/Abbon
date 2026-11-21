/**
 * Molécules des sources de modules : `![description](smiles:CCO)` est dessinée à la construction, en SVG,
 * par RDKit (RDKit.js, licence BSD ; outil de construction seulement, rien n'est ajouté à l'application).
 *
 * Le dessin est réécrit pour suivre le thème : toutes les couleurs passent en `currentColor` (traits et
 * symboles des atomes), le fond est retiré. Il devient ensuite une figure SVG ordinaire du module.
 */
import { createRequire } from 'node:module';

/** Préfixe d'une molécule dans `![description](smiles:…)`. */
export const SMILES_PREFIX = 'smiles:';

/** Partie de RDKit.js utilisée ici. */
interface RDKitMol {
  get_svg_with_highlights(details: string): string;
  delete(): void;
}
export interface RDKit {
  get_mol(smiles: string): RDKitMol | null;
  version(): string;
}

let loading: Promise<RDKit> | null = null;

/** Charge RDKit (WebAssembly) une fois. */
export function loadRDKit(): Promise<RDKit> {
  loading ??= (async () => {
    const require = createRequire(import.meta.url);
    const init = require('@rdkit/rdkit') as () => Promise<RDKit>;
    return init();
  })();
  return loading;
}

/** Réglages du dessin : taille selon la molécule (même échelle pour toutes), fond transparent. */
const DRAWING = {
  width: -1,
  height: -1,
  padding: 0.08,
  bondLineWidth: 1.6,
  clearBackground: false,
  addStereoAnnotation: false,
};

/**
 * Agrandissement à l'affichage : le dessin automatique de RDKit est petit (symboles d'environ 8 px).
 * Seules la largeur et la hauteur changent ; le contenu, vectoriel, est mis à l'échelle par `viewBox`.
 * Une grande molécule est ensuite réduite à la largeur de l'écran par la page.
 */
export const MOLECULE_SCALE = 1.7;

/**
 * Réécrit le SVG de RDKit : sans en-tête XML, commentaires, fond, classes ni espaces de noms propres à
 * RDKit ; toutes les couleurs en `currentColor`. Fonction pure.
 */
export function themeMoleculeSvg(svg: string, scale = MOLECULE_SCALE): string {
  const size = (v: string) => `${Math.round(Number(v) * scale)}px`;
  return svg
    .replace(/(<svg\b[^>]*?)width='([\d.]+)px' height='([\d.]+)px'/, (_m, head: string, w: string, h: string) => `${head}width='${size(w)}' height='${size(h)}'`)
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/<rect\b[^>]*>\s*<\/rect>\s*|<rect\b[^>]*\/>\s*/g, '')
    .replace(/\s+(?:class|xmlns:rdkit|xmlns:xlink|xml:space|baseProfile|version)='[^']*'/g, '')
    .replace(/#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?\b/g, 'currentColor')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Dessin d'une molécule, ou null si le SMILES est illisible. */
export function moleculeSvg(rdkit: RDKit, smiles: string): string | null {
  if (!smiles || smiles.length > 500) return null;
  const mol = rdkit.get_mol(smiles);
  if (!mol) return null;
  try {
    return themeMoleculeSvg(mol.get_svg_with_highlights(JSON.stringify(DRAWING)));
  } finally {
    mol.delete();
  }
}
