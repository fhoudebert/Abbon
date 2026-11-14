import type { MessageKey } from './fr';
import { detectLang, formatPercent, isUiLang, translate, type UiLang } from './translate';

/** Langue courante de l'interface, réactive (Svelte 5). */
export const i18n = $state<{ lang: UiLang }>({
  lang: typeof navigator !== 'undefined' ? detectLang(navigator.languages ?? [navigator.language]) : 'fr',
});

export function setLang(lang: string) {
  if (isUiLang(lang)) {
    i18n.lang = lang;
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }
}

export const t = (key: MessageKey, params?: Record<string, string | number>) =>
  translate(i18n.lang, key, params);

export const pct = (ratio: number) => formatPercent(i18n.lang, ratio);

/** Date et heure courtes dans la langue de l'interface. */
export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(i18n.lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

/** Nombre localisé (ex. 1,5 en français). */
export const fmtNum = (n: number) => new Intl.NumberFormat(i18n.lang, { maximumFractionDigits: 2 }).format(n);

export { SUPPORTED, type UiLang } from './translate';
