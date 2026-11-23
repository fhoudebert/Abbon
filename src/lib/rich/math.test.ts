import { describe, expect, it } from 'vitest';
import { DEMO_SVG, DEMO_SVG_HASH, demoScience } from '$lib/data/seed';
import { hasMath, mathSource, richToPlain, walkRich } from '$lib/domain/rich';
import { sanitizeSvg } from '$lib/domain/svg';
import { buildPackage, parsePackage, sha256Hex, sniffMime } from '$lib/interchange/qcmPackage';
import { mathError, renderMath } from './math';
import { standardLatex } from './macros';

describe('formules (KaTeX)', () => {
  it('rend une formule en HTML avec du MathML pour les lecteurs d’écran', () => {
    const html = renderMath(String.raw`\lim_{n\to+\infty} u_n`);
    expect(html).toContain('<math');
    expect(html).toContain('class="katex-html" aria-hidden="true"');
    expect(renderMath('x^2', true)).toContain('katex-display');
  });

  it('connaît la chimie et les unités (mhchem)', () => {
    expect(mathError(String.raw`\ce{CH3COOH + H2O <=> CH3COO- + H3O+}`)).toBeNull();
    expect(mathError(String.raw`\pu{9,81 m.s-2}`)).toBeNull();
  });

  it('connaît les commandes écrites par l’éditeur visuel et le clavier de MathLive', () => {
    for (const s of [String.raw`\exponentialE^{x}`, String.raw`\int_0^1 x\,\differentialD x`, String.raw`1+\imaginaryI`, String.raw`x\in\doubleStruckCapitalR`, String.raw`\placeholder{}^2`]) {
      expect(mathError(s)).toBeNull();
      expect(renderMath(s)).not.toContain('katex-error');
    }
  });

  it('LaTeX standard à partir de celui de MathLive', () => {
    expect(standardLatex(String.raw`\exponentialE^{x}+\imaginaryI\pi`)).toBe(String.raw`\mathrm{e}^{x}+\mathrm{i}\pi`);
    expect(standardLatex(String.raw`\int f\,\differentialD x`)).toBe(String.raw`\int f\,\mathrm{d} x`);
    expect(standardLatex(String.raw`\placeholder{}^2`)).toBe(String.raw`\square ^2`);
    expect(standardLatex(String.raw`\exponentialEx`)).toBe(String.raw`\exponentialEx`);
    expect(standardLatex(String.raw`\frac{a}{b}`)).toBe(String.raw`\frac{a}{b}`);
  });

  it('ne produit ni lien, ni script, ni balise venue de la source', () => {
    for (const evil of [
      String.raw`\href{javascript:alert(1)}{x}`,
      String.raw`\url{https://exemple.org}`,
      String.raw`\includegraphics{https://exemple.org/x.png}`,
      String.raw`\htmlData{onclick=alert(1)}{x}`,
      '<img src=x onerror=alert(1)>',
      String.raw`\text{<script>alert(1)</script>}`,
    ]) {
      // L'annotation TeX reprend la source, échappée, pour les lecteurs d'écran et le copier-coller : hors sujet ici.
      const html = renderMath(evil).replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '');
      expect(html, evil).not.toMatch(/<a[\s>]|<img|<script|\son\w+=|href=|javascript:/i);
      // Et dans l'annotation, aucune balise n'est ouverte par la source.
      expect(renderMath(evil).match(/<annotation[^>]*>([\s\S]*?)<\/annotation>/)?.[1] ?? '', evil).not.toMatch(/</);
    }
  });

  it('signale une formule fautive sans rien casser', () => {
    expect(mathError(String.raw`\frac{1}{`)).toMatch(/Unexpected end of input/);
    expect(mathError('  ')).toBe('formule vide');
    expect(renderMath(String.raw`\frac{1}{`)).toContain('katex-error');
  });
});

describe('QCM de démonstration « Formules et figures »', () => {
  it('toutes ses formules compilent', () => {
    const sources: string[] = [];
    for (const q of demoScience.questions)
      for (const v of [...Object.values(q.prompt), ...Object.values(q.explanation ?? {}), ...q.choices.flatMap((c) => Object.values(c.content))])
        walkRich(v, (n) => {
          if (n.type === 'math' || n.type === 'mathBlock') sources.push(mathSource(n));
        });
    expect(sources.length).toBeGreaterThan(10);
    for (const s of sources) expect(mathError(s), s).toBeNull();
    expect(hasMath(demoScience.questions[0].prompt.fr)).toBe(true);
    // Sans rendu (ancienne version, recherche, GIFT) : la source LaTeX reste lisible.
    expect(richToPlain(demoScience.questions[0].prompt.fr)).toBe('Quelle est la dérivée de f(x) = x^2 ?');
  });

  it('sa figure SVG a la bonne empreinte, est acceptée telle quelle et voyage dans un fichier .qcm', async () => {
    const bytes = new TextEncoder().encode(DEMO_SVG);
    expect(await sha256Hex(bytes)).toBe(DEMO_SVG_HASH);
    expect(sniffMime(bytes)).toBe('image/svg+xml');
    expect(sanitizeSvg(DEMO_SVG, 's1-')).toContain('stroke="currentColor"');

    const file = buildPackage(
      { quizzes: [demoScience], categories: [], media: new Map([[DEMO_SVG_HASH, { mime: 'image/svg+xml', bytes }]]) },
      { kind: 'content', solutions: true, appVersion: '0.2.0' },
    );
    const p = await parsePackage(file);
    expect(p.problems).toEqual([]);
    expect(p.media.get(DEMO_SVG_HASH)?.mime).toBe('image/svg+xml');
    expect(p.quizzes[0]).toEqual(demoScience);
  });

  it('un faux SVG est refusé à l’import', async () => {
    expect(sniffMime(new TextEncoder().encode('<svg><g></svg>'))).toBeNull();
    expect(sniffMime(new TextEncoder().encode('<html><svg/></html>'))).toBeNull();
  });
});
