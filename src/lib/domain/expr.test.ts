import { describe, expect, it } from 'vitest';
import { evaluate, expressionProblem, parseExpr, sameExpression, stripConstant, variablesOf } from './expr';

const val = (latex: string, vars: Record<string, number> = {}) => evaluate(parseExpr(latex), vars);

describe('lecture du LaTeX', () => {
  it.each([
    ['2+3\\times4', {}, 14],
    ['2+3\\cdot 4', {}, 14],
    ['\\frac{1}{2}', {}, 0.5],
    ['\\frac12', {}, 0.5],
    ['\\dfrac{x^3}{3}', { x: 3 }, 9],
    ['x^2+\\frac13', { x: 2 }, 4 + 1 / 3],
    ['x^{2}3', { x: 2 }, 12],
    ['x^23', { x: 2 }, 12],
    ['2x', { x: 5 }, 10],
    ['3x^2', { x: 2 }, 12],
    ['-x^2', { x: 3 }, -9],
    ['x(x+1)', { x: 3 }, 12],
    ['\\left(x+1\\right)^{2}', { x: 2 }, 9],
    ['[x+1]', { x: 1 }, 2],
    ['\\sqrt{x}', { x: 9 }, 3],
    ['\\sqrt[3]{x}', { x: -8 }, -2],
    ['e^{x}', { x: 1 }, Math.E],
    ['\\mathrm{e}^{2x}', { x: 0.5 }, Math.E],
    ['\\exp(x)', { x: 0 }, 1],
    ['\\ln x', { x: Math.E }, 1],
    ['\\ln(x)+1', { x: 1 }, 1],
    ['\\ln\\left|x\\right|', { x: -Math.E }, 1],
    ['\\log_{2}8', {}, 3],
    ['\\log 100', {}, 2],
    ['\\sin^2 x+\\cos^2 x', { x: 0.7 }, 1],
    ['\\sin 2x', { x: Math.PI / 4 }, 1],
    ['2\\pi', {}, 2 * Math.PI],
    ['\\frac{\\pi}{2}', {}, Math.PI / 2],
    ['9{,}81', {}, 9.81],
    ['0,5x', { x: 4 }, 2],
    ['1.5', {}, 1.5],
    ['x^{-1}', { x: 4 }, 0.25],
    ['2^-1', {}, 0.5],
    ['|x-3|', { x: 1 }, 2],
    ['u_{n}+1', { u_n: 2 }, 3],
    ['\\operatorname{arctan}(1)', {}, Math.PI / 4],
    ['\\alpha+1', { '\\alpha': 1 }, 2],
    ['10 \\div 4', {}, 2.5],
    ['(-1)^{n}', { n: 3 }, -1],
  ])('%s', (latex, vars, expected) => {
    expect(val(latex, vars)).toBeCloseTo(expected, 10);
  });

  it('repère les variables (e et π sont des constantes)', () => {
    expect(variablesOf(parseExpr('a x^2 + e^{t} + \\pi y_1'))).toEqual(['a', 't', 'x', 'y_1']);
  });

  it.each(['', 'x+', '\\frac{1}', '(x+1', '\\placeholder{}', '\\infty', 'x!', '\\unknown{x}', "f'(x)", '#'])('refuse « %s »', (latex) => {
    expect(() => parseExpr(latex)).toThrow();
  });

  it('refuse une expression démesurée', () => {
    expect(() => parseExpr('x+'.repeat(600) + 'x')).toThrow();
    expect(() => parseExpr('('.repeat(100) + 'x' + ')'.repeat(100))).toThrow();
  });
});

describe('comparaison de deux expressions', () => {
  it.each([
    ['3x^2', '3x^{2}'],
    ['3x^2', 'x\\cdot 3x'],
    ['\\frac{1}{x}', 'x^{-1}'],
    ['(x+1)^2', 'x^2+2x+1'],
    ['\\frac{x^3}{3}', '\\frac13x^3'],
    ['e^{2x}', '\\left(e^{x}\\right)^{2}'],
    ['\\ln(x^2)', '2\\ln x'], // égales là où ln(x²) et 2 ln x sont toutes deux définies (x > 0) — voir plus bas
    ['2\\cos(2x)', '2\\cos^2x-2\\sin^2x'],
    ['\\frac{1}{2\\sqrt{x}}', '\\frac{1}{2}x^{-\\frac{1}{2}}'],
    ['\\frac{u\'v-uv\'}{v^2}'.replace(/'/g, ''), '\\frac{uv-uv}{v^2}'], // même écriture
    ['n(n+1)', 'n^2+n'],
    ['\\frac{1-q^{n+1}}{1-q}', '\\frac{q^{n+1}-1}{q-1}'],
  ])('%s = %s', (a, b) => {
    if (a.startsWith('\\ln(x^2)')) {
      // ln(x²) est défini pour x < 0, pas 2 ln x : la réponse est refusée, à juste titre.
      expect(sameExpression(a, b)).toBe(false);
      return;
    }
    expect(sameExpression(a, b)).toBe(true);
  });

  it.each([
    ['3x^2', '3x'],
    ['3x^2', 'x^3'],
    ['(x+1)^2', 'x^2+1'],
    ['\\frac{x^3}{3}', '\\frac{x^3}{3}+1'],
    ['e^{x}', 'xe^{x-1}'],
    ['\\sin x', '\\cos x'],
    ['2x', 'x+'], // illisible
    ['2x', ''],
  ])('%s ≠ %s', (a, b) => {
    expect(sameExpression(a, b)).toBe(false);
  });

  it('à une constante près pour les primitives', () => {
    expect(sameExpression('\\frac{x^3}{3}', '\\frac{x^3}{3}+5', { constant: true })).toBe(true);
    expect(sameExpression('\\frac{x^3}{3}', '\\frac{x^3}{3}+C', { constant: true })).toBe(true);
    expect(sameExpression('\\frac{x^3}{3} + C', '\\frac{x^3+1}{3}', { constant: true })).toBe(true);
    expect(sameExpression('\\frac{x^3}{3}', 'x^3', { constant: true })).toBe(false);
    expect(sameExpression('\\frac{x^3}{3}', '\\frac{x^3}{3}+5')).toBe(false);
    expect(stripConstant('x^2 + C')).toBe('x^2');
  });

  it('variables entières pour les suites : (−1)ⁿ se compare', () => {
    expect(sameExpression('(-1)^{n}n', 'n(-1)^n')).toBe(true);
    expect(sameExpression('(-1)^{n}n', 'n')).toBe(false);
  });

  it('valeurs sans variable', () => {
    expect(sameExpression('\\frac{\\pi}{4}', '\\operatorname{arctan}(1)')).toBe(true);
    expect(sameExpression('\\frac{1}{3}', '0.333')).toBe(false);
  });

  it('signale une expression attendue illisible ou jamais définie', () => {
    expect(expressionProblem('3x^2')).toBeNull();
    expect(expressionProblem('\\frac{x^3}{3}+C', { constant: true })).toBeNull();
    expect(expressionProblem('x+')).toMatch(/incomplète/);
    expect(expressionProblem('\\ln(-x^2-1)')).toMatch(/rarement définie/);
  });
});

describe('membre de gauche écrit par l’élève', () => {
  it('est ignoré', () => {
    expect(sameExpression('x-1', 'y=x-1')).toBe(true);
    expect(sameExpression('3x^2', "f'(x)=3x^2")).toBe(true);
    expect(sameExpression('3x^2', 'y=3x')).toBe(false);
    expect(sameExpression('3x^2', 'a=b=3x^2')).toBe(false); // deux « = » : illisible
  });
});
