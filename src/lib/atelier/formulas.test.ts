import { describe, expect, it } from 'vitest';
import { formulaError, fromMarkdown, toLatex, toLibreOfficeMathML, toMarkdown, toMathML } from './formulas';

describe('atelier de formules', () => {
  it('MathML pour Word : en-tête exacte, sans annotation ni semantics', () => {
    const m = toMathML('\\frac{a}{b}');
    expect(m.startsWith('<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>')).toBe(true);
    expect(m.endsWith('</math>')).toBe(true);
    expect(m).toContain('<mfrac>');
    expect(m).not.toMatch(/annotation|semantics/);
  });

  it('chimie : mhchem converti en MathML', () => {
    const latex = toLatex(' 2H2 + O2 -> 2H2O ', true);
    expect(latex).toBe('\\ce{2H2 + O2 -> 2H2O}');
    const m = toMathML(latex);
    expect(m).toContain('<mi mathvariant="normal">H</mi>');
    expect(m).toContain('→');
  });

  it('commandes de MathLive (touche e du clavier) : MathML standard', () => {
    expect(formulaError('\\exponentialE^{x}')).toBeNull();
    expect(toMathML('\\exponentialE^{x}')).toContain('<mi mathvariant="normal">e</mi>');
  });

  it('LibreOffice : prologue XML', () => {
    expect(toLibreOfficeMathML('<math/>')).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<math/>');
  });

  it('erreurs', () => {
    expect(formulaError('\\frac{1}{')).toBeTruthy();
    expect(formulaError('x^2')).toBeNull();
    expect(() => toMathML('\\frac{1}{')).toThrow();
  });

  it('carnet en Markdown, aller et retour', () => {
    const entries = [
      { id: '1', title: 'Pythagore', source: 'a^2+b^2=c^2', chem: false },
      { id: '2', title: 'Eau', source: '2H2 + O2 -> 2H2O', chem: true },
    ];
    const md = toMarkdown(entries);
    expect(md).toBe('# Carnet de formules\n\n## Pythagore\n\n$$a^2+b^2=c^2$$\n\n## Eau\n\n$$\\ce{2H2 + O2 -> 2H2O}$$\n');
    let n = 0;
    expect(fromMarkdown(md, () => String(++n))).toEqual(entries);
    // Formule en ligne, texte autour, section sans formule ignorée.
    expect(fromMarkdown('intro\n## A\nvoir $x+1$ ici\n## B\nrien\n', () => 'x')).toEqual([{ id: 'x', title: 'A', source: 'x+1', chem: false }]);
  });
});
