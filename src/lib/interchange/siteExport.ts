/**
 * Export en site web : le lecteur (construction `--mode site`, embarquée dans l'application sous web/)
 * plus `donnees.js`, dans une archive .zip à décompresser sur un hébergement statique.
 */
import { strToU8, zipSync } from 'fflate';
import { bytesToB64 } from '$lib/data/bytes';
import type { Category, InstalledModule, Quiz } from '$lib/domain/types';
import { settingsScript, siteScript, type SiteData, type SiteSettings } from '$lib/site';
import { buildPackage, categoriesFor, quizMedia, sha256Hex, sheetMedia, type MediaFile } from './qcmPackage';

export interface SiteOptions extends SiteSettings {
  title: string;
}

/** QCM, catégories et modules (fiches) restreints à ce qui est exporté. */
export function siteContent(
  quizzes: readonly Quiz[],
  allCategories: readonly Category[],
  installed: readonly InstalledModule[],
) {
  // Les modes et le corrigé ne sont pas inscrits dans les QCM : ils s'appliquent au chargement du site
  // (lib/data/site.ts), pour rester modifiables dans reglages.js.
  const out: Quiz[] = quizzes.map((q) => ({ ...q, status: 'published' }));
  const ids = new Set(out.map((q) => q.id));
  const categories = categoriesFor(out, allCategories);
  const catIds = new Set(categories.map((c) => c.id));
  const modules: InstalledModule[] = installed
    .filter((m) => m.manifest.quizzes.some((id) => ids.has(id)))
    .map((m) => ({
      ...m,
      manifest: {
        ...m.manifest,
        quizzes: m.manifest.quizzes.filter((id) => ids.has(id)),
        categories: m.manifest.categories.filter((id) => catIds.has(id)),
        sheets: m.manifest.sheets
          ? Object.fromEntries(Object.entries(m.manifest.sheets).filter(([id]) => catIds.has(id)))
          : m.manifest.sheets,
      },
    }));
  return { quizzes: out, categories, modules };
}

/** Empreintes des images à joindre (QCM et fiches). */
export const siteMediaHashes = (content: ReturnType<typeof siteContent>) => [
  ...new Set([...quizMedia(content.quizzes), ...sheetMedia(content.modules.map((m) => m.manifest))]),
];

/** Identifiant stable : la progression d'un visiteur survit à une nouvelle version du même site. */
export async function siteIdOf(title: string, quizIds: readonly string[]): Promise<string> {
  const key = `${title}\n${[...quizIds].sort().join('\n')}`;
  return (await sha256Hex(strToU8(key))).slice(0, 16);
}

/** Données du site (`donnees.js`) à partir des contenus. */
export async function siteDataOf(
  content: ReturnType<typeof siteContent>,
  media: Map<string, MediaFile>,
  opts: SiteOptions,
  appVersion: string,
): Promise<SiteData> {
  const pkg = buildPackage(
    { ...content, media, attempts: [], answers: [], settings: {}, cards: [], rewards: [] },
    { kind: 'backup', solutions: true, appVersion },
  );
  return {
    format: 'abbon-site',
    version: 1,
    id: await siteIdOf(opts.title, content.quizzes.map((q) => q.id)),
    title: opts.title,
    modes: opts.modes,
    solutions: opts.solutions,
    package: bytesToB64(pkg),
  };
}

export const SITE_README = `Site Abbon — mode d'emploi
==========================

Ce dossier est un site web complet, sans base de données ni programme côté serveur.

1. Déposer le contenu du dossier (index.html, donnees.js, _app/…) sur l'hébergement, par FTP ou par le
   gestionnaire de fichiers de l'hébergeur : à la racine du site ou dans un sous-dossier (par exemple /qcm/).
2. Ouvrir l'adresse correspondante dans un navigateur (https://exemple.fr/qcm/).

Aucun réglage du serveur n'est nécessaire. Les réponses et la progression de chaque visiteur restent dans
son propre navigateur : rien n'est envoyé au serveur. Les réponses attendues figurent dans donnees.js :
ce site convient à l'entraînement et aux examens blancs, pas à un examen surveillé.

Modes proposés (entraînement, examen ou les deux) et corrigé de l'examen : fichier reglages.js, à modifier
avec un éditeur de texte puis à redéposer ; les explications sont dans le fichier.

Pour mettre le site à jour, exporter de nouveau depuis Abbon avec le même titre et remplacer les fichiers :
la progression des visiteurs est conservée. Garder son reglages.js si on l'a modifié.
`;

/** Archive du site : `dossier/…` (lecteur, données, mode d'emploi). */
export function zipSite(folder: string, player: Record<string, Uint8Array>, data: SiteData): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const [name, bytes] of Object.entries(player)) {
    if (name === 'files.json' || name === 'donnees.js' || name === 'reglages.js') continue;
    files[`${folder}/${name}`] = bytes;
  }
  files[`${folder}/donnees.js`] = strToU8(siteScript(data));
  files[`${folder}/reglages.js`] = strToU8(settingsScript({ modes: data.modes ?? 'both', solutions: data.solutions ?? 'end' }));
  files[`${folder}/LISEZMOI.txt`] = strToU8(SITE_README);
  return zipSync(files, { level: 6 });
}
