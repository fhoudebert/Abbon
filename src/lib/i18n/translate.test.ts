import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { detectLang, formatPercent, translate } from './translate';

describe('i18n', () => {
  it('les catalogues fr et en ont exactement les mêmes clés', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });
  it('détecte la langue du système', () => {
    expect(detectLang(['fr-FR', 'en'])).toBe('fr');
    expect(detectLang(['de-DE', 'en-GB'])).toBe('en');
    expect(detectLang(['de-DE'])).toBe('en');
  });
  it('gère les pluriels selon la langue', () => {
    expect(translate('fr', 'quiz.questions', { n: 0 })).toBe('0 question');
    expect(translate('en', 'quiz.questions', { n: 0 })).toBe('0 questions');
    expect(translate('fr', 'quiz.questions', { n: 3 })).toBe('3 questions');
  });
  it('remplace les paramètres', () => {
    expect(translate('en', 'quiz.lastScore', { score: '80%' })).toBe('Last score: 80%');
  });
  it('formate les pourcentages', () => {
    expect(formatPercent('en', 0.75)).toBe('75%');
    expect(formatPercent('fr', 0.75).replace(/\s/g, ' ')).toBe('75 %');
  });
});
