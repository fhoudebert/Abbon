import { isTauri } from '@tauri-apps/api/core';

/** Dépôt du code source d'Abbon. */
export const REPO_URL = 'https://github.com/fhoudebert/Abbon';

/**
 * Page de téléchargement des questionnaires (.qcm), classés par langue puis par rubrique
 * (fr/langues, fr/sciences, fr/technologie). Publiée sur GitHub Pages, indépendamment des versions de
 * l'application ; pages index produites par `npm run module:catalogue`.
 */
export const MODULES_URL = 'https://fhoudebert.github.io/abbon/questionnaires/';

/**
 * Ouvre une adresse https dans le navigateur du système (plugin opener sous Tauri).
 * À brancher sur le `onclick` d'un vrai lien : dans un simple navigateur, le lien fait son travail.
 */
export async function openExternal(e: MouseEvent, url: string) {
  if (!isTauri() || !url.startsWith('https://')) return;
  e.preventDefault();
  const { openUrl } = await import('@tauri-apps/plugin-opener');
  await openUrl(url);
}
