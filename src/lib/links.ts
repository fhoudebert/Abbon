import { isTauri } from '@tauri-apps/api/core';

/** Page où les modules de contenu sont publiés (fichiers .qcm joints aux versions). */
export const MODULES_URL = 'https://github.com/fhoudebert/Abbon/releases';

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
