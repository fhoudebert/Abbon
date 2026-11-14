import type { I18nText, Lang } from './types';

/**
 * Choisit la traduction d'un texte multilingue :
 * langue demandée, puis langue principale du QCM, puis première disponible.
 */
export function localize(text: I18nText | null | undefined, lang: Lang, fallback?: Lang): string {
  if (!text) return '';
  return text[lang] ?? (fallback ? text[fallback] : undefined) ?? Object.values(text)[0] ?? '';
}

/** Identifiant unique (UUID v4) — disponible dans les webviews modernes. */
export function newId(): string {
  return crypto.randomUUID();
}
