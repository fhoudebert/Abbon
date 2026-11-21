import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '$lib/domain/svg';
import { imageTargets } from './markdown';
import { loadRDKit, moleculeSvg, themeMoleculeSvg } from './molecules';

describe('molécules (SMILES → SVG)', () => {
  it('réécrit le dessin de RDKit pour suivre le thème', () => {
    const raw = `<?xml version='1.0' encoding='iso-8859-1'?>
<svg version='1.1' baseProfile='full' xmlns='http://www.w3.org/2000/svg' xmlns:rdkit='http://www.rdkit.org/xml' xml:space='preserve' width='74px' height='22px' viewBox='0 0 74 22'>
<!-- END OF HEADER -->
<rect style='opacity:1.0;fill:#FFFFFF00;stroke:none' width='74.0' height='22.0' x='0.0' y='0.0'> </rect>
<path class='bond-0 atom-0 atom-1' d='M 1,2 L 3,4' style='fill:none;stroke:#000000;stroke-width:1.6px' />
<path class='atom-2' d='M 5 6 Q 7 8, 9 10' fill='#FF0000' />
</svg>`;
    const out = themeMoleculeSvg(raw);
    expect(out).not.toMatch(/<\?xml|<!--|<rect|class=|rdkit|#[0-9A-F]{6}/i);
    expect(out.match(/currentColor/g)).toHaveLength(2);
    expect(out).toMatch(/^<svg/);
    expect(sanitizeSvg(out)).toBeTruthy();
  });

  it('trouve les molécules d’un texte, parenthèses comprises', () => {
    expect(imageTargets('Voici ![acide éthanoïque](smiles:CC(=O)O) et ![x](fig.svg) ; ![b](smiles:CC(C(=O)O)N).')).toEqual([
      'smiles:CC(=O)O',
      'fig.svg',
      'smiles:CC(C(=O)O)N',
    ]);
  });

  it('dessine une molécule avec RDKit, sans couleur fixe ; refuse un SMILES illisible', async () => {
    const rdkit = await loadRDKit();
    const svg = moleculeSvg(rdkit, 'CCOC(C)=O');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(sanitizeSvg(svg!)).toBeTruthy();
    expect(moleculeSvg(rdkit, 'CCOC(C)=O')).toBe(svg); // reproductible
    expect(moleculeSvg(rdkit, 'C1CC')).toBeNull();
    expect(moleculeSvg(rdkit, '')).toBeNull();
  }, 30_000);
});

describe('taille des molécules', () => {
  it('agrandit la largeur et la hauteur, pas le viewBox', () => {
    const out = themeMoleculeSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='100px' height='50px' viewBox='0 0 100 50'><path d='M 0,0 L 1,1' /></svg>`, 2);
    expect(out).toContain("width='200px' height='100px' viewBox='0 0 100 50'");
  });
});
