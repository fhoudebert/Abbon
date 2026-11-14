import { en } from './en';
import { fr, type MessageKey, type Messages } from './fr';

export const SUPPORTED = ['fr', 'en'] as const;
export type UiLang = (typeof SUPPORTED)[number];

const catalogs: Record<UiLang, Messages> = { fr, en };

/** Langue d'interface à partir des préférences du système ; anglais si aucune n'est prise en charge. */
export function detectLang(preferred: readonly string[]): UiLang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if ((SUPPORTED as readonly string[]).includes(base)) return base as UiLang;
  }
  return 'en';
}

export function isUiLang(v: unknown): v is UiLang {
  return typeof v === 'string' && (SUPPORTED as readonly string[]).includes(v);
}

/**
 * Traduit une clé. `params.n` choisit la forme plurielle ; `{nom}` est remplacé
 * par `params.nom`. Une clé absente renvoie la clé (repérable à l'écran).
 */
export function translate(
  lang: UiLang,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  const entry = catalogs[lang][key] ?? fr[key];
  let text: string;
  if (typeof entry === 'string') text = entry;
  else if (entry) {
    const n = Number(params.n ?? 0);
    text = new Intl.PluralRules(lang).select(n) === 'one' ? entry.one : entry.other;
  } else return key;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? formatParam(lang, params[name]) : m,
  );
}

function formatParam(lang: UiLang, v: string | number): string {
  return typeof v === 'number' ? new Intl.NumberFormat(lang).format(v) : v;
}

/** Pourcentage localisé, ex. 0.75 → « 75 % » (fr) ou « 75% » (en). */
export function formatPercent(lang: UiLang, ratio: number): string {
  return new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
}
