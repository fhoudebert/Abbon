/**
 * Questions « expression » des modules de maths : écritures équivalentes acceptées, erreurs classiques
 * refusées, avec le vrai comparateur. À compléter avec chaque nouvelle question de ce type.
 */
import { expect, it } from 'vitest';
import { sameExpression, stripConstant } from './expr';
const cases: [string, boolean, string[], string[]][] = [
  // attendue, constante, acceptées, refusées
  ['6 + 4 \\times 0{,}5^{n}', false, ['6+4\\left(\\frac{1}{2}\\right)^n', '6+\\frac{4}{2^n}', '6+4\\cdot 0.5^n', '6+2^{2-n}'], ['6+4\\times 0{,}5^{n+1}', '10\\times0{,}5^n', '6+0{,}5^n']],
  ['(n+1)^2', false, ['n^2+2n+1', '\\left(n+1\\right)^{2}', 'S_n=(n+1)^2'], ['n^2', 'n^2+1', '2n+1']],
  ['\\frac{1}{n+1}', false, ['(n+1)^{-1}', '\\frac{1}{1+n}'], ['\\frac{1}{n}', 'n+1']],
  ['(1-x)e^{-x}', false, ['e^{-x}-xe^{-x}', '\\frac{1-x}{e^x}', '-(x-1)\\exp(-x)'], ['(1+x)e^{-x}', 'e^{-x}', '-xe^{-x}']],
  ['\\frac{2x}{x^2+1}', false, ['2x(x^2+1)^{-1}', '\\frac{2x}{1+x^{2}}'], ['\\frac{1}{x^2+1}', '\\frac{2x}{x^2}']],
  ['\\frac{1}{\\sqrt{2x+1}}', false, ['(2x+1)^{-\\frac12}', '\\frac{2}{2\\sqrt{2x+1}}'], ['\\frac{1}{2\\sqrt{2x+1}}', '\\sqrt{2x+1}']],
  ['x-1', false, ['-1+x', 'y=x-1', 'y = x - 1'], ['x', 'x+1', 'y=x']],
  ['\\frac{1}{2}e^{x^2} + C', true, ['\\frac{e^{x^2}}{2}', '\\frac12e^{x^2}+C', '0{,}5e^{x^2}+3'], ['e^{x^2}', '2xe^{x^2}', '\\frac{1}{2}e^{2x}']],
  ['\\frac{1}{2}\\ln(2x+1) + C', true, ['\\frac{\\ln(2x+1)}{2}', '\\ln\\sqrt{2x+1}', '\\frac{1}{2}\\ln\\left|2x+1\\right|+C', '\\frac12\\ln(4x+2)'], ['\\ln(2x+1)', '\\frac{1}{2x+1}']],
  ['3e^{2x}', false, ['3\\exp(2x)', '3\\left(e^{x}\\right)^2', 'y(x)=3e^{2x}'], ['e^{2x}', '3e^{x}', '2e^{3x}']],
  ['4 - 3e^{-x}', false, ['-3e^{-x}+4', '4-\\frac{3}{e^{x}}'], ['4+3e^{-x}', '1', '4-e^{-x}']],
  ['\\left(\\frac{1}{2}\\right)^{n}', false, ['\\frac{1}{2^n}', '0{,}5^n', '2^{-n}'], ['\\frac{n}{2}', '\\frac12']],
  ['x^2 + 1', false, ['1+x^2', 'F(x)=x^2+1'], ['x^2', 'x^2+C', '2x']],
  ['n', false, ['a_n=n', '1+(n-1)'], ['n+1', '1', 'n^2']],
  ['20 + 70e^{-\\frac{t}{10}}', false, ['70\\exp(-0{,}1t)+20', '20+\\frac{70}{e^{t/10}}', 'T(t)=20+70e^{-0.1t}'], ['90e^{-\\frac{t}{10}}', '20+70e^{-10t}', '70e^{-\\frac{t}{10}}']],
  // Maths spécialité, niveau expert
  ['\\frac{n}{n+1}', false, ['1-\\frac{1}{n+1}', 'S_n=\\frac{n}{n+1}'], ['\\frac{1}{n+1}', '1']],
  ['\\ln x', false, ['\\ln(x)', "f'(x)=\\ln x"], ['x\\ln x', '\\frac{1}{x}']],
  ['-2xe^{-x^2}', false, ['-2x\\exp(-x^2)', '\\frac{-2x}{e^{x^2}}'], ['-2xe^{-2x}', 'e^{-x^2}', '-x^2e^{-x^2}']],
  ['ex', false, ['e\\cdot x', 'y=ex', 'e^1x'], ['x', 'e^x', 'ex+1']],
  ['x\\ln x - x + C', true, ['x(\\ln x-1)', 'x\\ln x-x+5'], ['x\\ln x', '\\frac{1}{x}']],
  ['\\frac{1}{2}\\ln(x^2+1) + C', true, ['\\ln\\sqrt{x^2+1}', '\\frac{\\ln(1+x^2)}{2}'], ['\\ln(x^2+1)', '\\frac{1}{x^2+1}']],
  ['-\\frac{1}{2}\\cos(2x) + C', true, ['\\sin^2 x', '-\\frac{\\cos 2x}{2}+1'], ['\\frac{1}{2}\\cos(2x)', '-\\cos(2x)']],
  ['3 - 3e^{-2x}', false, ['3(1-e^{-2x})'], ['3e^{-2x}', '3-3e^{2x}']],
  ['1 - 0{,}9^{n}', false, ['1-\\left(\\frac{9}{10}\\right)^n', '1-0.9^n'], ['0{,}9^n', '1-0{,}1^n', '0{,}1n']],
];
it.each(cases)('%s', (expected, constant, ok, ko) => {
  const opts = { constant };
  // La source garde « + C » ; parseExpressionAnswer le retire, comme ici.
  const exp = constant ? stripConstant(expected) : expected;
  for (const g of ok) expect([g, sameExpression(exp, g, opts)]).toEqual([g, true]);
  for (const g of ko) expect([g, sameExpression(exp, g, opts)]).toEqual([g, false]);
});
