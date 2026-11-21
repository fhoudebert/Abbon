import { pick, richToPlain } from './rich';
import type { Lang, RichValue } from './types';

/**
 * Texte (brut) d'un champ multilingue : langue demandée, puis langue principale du QCM,
 * puis première disponible. Les contenus riches sont réduits à leur texte.
 */
export function localize(
  text: Record<Lang, RichValue> | null | undefined,
  lang: Lang,
  fallback?: Lang,
): string {
  return richToPlain(pick(text, lang, fallback) ?? '');
}

/** Identifiant unique (UUID v4) — disponible dans les webviews modernes. */
export function newId(): string {
  return crypto.randomUUID();
}
