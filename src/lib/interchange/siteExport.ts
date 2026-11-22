/**
 * Export en site web : le lecteur (construction `--mode site`, embarquée dans l'application sous web/)
 * plus `donnees.js`, dans une archive .zip à décompresser sur un hébergement statique.
 */
import { strToU8, zipSync } from 'fflate';
import { bytesToB64 } from '$lib/data/bytes';
import type { Category, InstalledModule, Quiz } from '$lib/domain/types';
import { publicQuiz } from '$lib/exam/publish';
import { settingsScript, siteScript, type SiteData, type SiteSettings } from '$lib/site';
import { buildPackage, categoriesFor, quizMedia, sha256Hex, sheetMedia, type MediaFile } from './qcmPackage';

export interface SiteOptions extends SiteSettings {
  title: string;
  /** Examen corrigé par le serveur (PHP) : site sans réponses ni fiches, examen seulement (lib/exam). */
  server?: boolean;
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

/** Empreintes des images à joindre (QCM et fiches ; pas de fiches dans un examen corrigé par le serveur). */
export const siteMediaHashes = (content: ReturnType<typeof siteContent>, server = false) => [
  ...new Set([...quizMedia(content.quizzes), ...(server ? [] : sheetMedia(content.modules.map((m) => m.manifest)))]),
];

/**
 * Contenu publié dans un examen corrigé par le serveur : QCM sans réponses (`publicQuiz`), modules sans
 * fiches (elles donnent souvent les réponses).
 */
export function serverContent(content: ReturnType<typeof siteContent>): ReturnType<typeof siteContent> {
  return {
    ...content,
    quizzes: content.quizzes.map(publicQuiz),
    modules: content.modules.map((m) => ({ ...m, manifest: { ...m.manifest, sheets: undefined } })),
  };
}

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
  const published = opts.server ? serverContent(content) : content;
  const pkg = buildPackage(
    { ...published, media, attempts: [], answers: [], settings: {}, cards: [], rewards: [] },
    { kind: 'backup', solutions: true, appVersion },
  );
  return {
    format: 'abbon-site',
    version: 1,
    id: await siteIdOf(opts.title, content.quizzes.map((q) => q.id)),
    title: opts.title,
    modes: opts.server ? 'exam' : opts.modes,
    solutions: opts.solutions,
    ...(opts.server ? { server: true } : {}),
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
ce site convient à l'entraînement et aux examens blancs, pas à un examen surveillé. Pour un examen dont les
réponses ne figurent pas dans les fichiers, exporter en « Examen seulement » avec « Correction par le serveur
(PHP) ».

Modes proposés (entraînement, examen ou les deux), corrigé de l'examen, seuil de réussite et tirage au sort
des questions de l'examen : fichier reglages.js, à modifier avec un éditeur de texte puis à redéposer ; les
explications sont dans le fichier.

Pour mettre le site à jour, exporter de nouveau depuis Abbon avec le même titre et remplacer les fichiers :
la progression des visiteurs est conservée. Garder son reglages.js si on l'a modifié.
`;

export const SITE_SERVER_README = `Site Abbon — examen corrigé par le serveur
==========================================

Ce dossier est un site d'examen : les réponses attendues ne sont pas dans les fichiers lus par le
navigateur. Le corrigé est dans examen/solutions.php, et examen/corriger.php note chaque copie.

Il faut un hébergement avec PHP 7.4 ou plus récent (c'est le cas de la plupart des hébergements
mutualisés). Ni base de données ni réglage particulier.

1. Déposer tout le contenu du dossier (index.html, donnees.js, reglages.js, examen/, _app/…) par FTP ou par le
   gestionnaire de fichiers de l'hébergeur, à la racine du site ou dans un sous-dossier (/examen-svt/).
   Les dossiers examen/ et examen/copies/ contiennent des fichiers cachés .htaccess : les déposer aussi.
   Ne pas déposer ce fichier LISEZMOI.txt (il n'est pas nécessaire au site).
2. Ouvrir l'adresse correspondante dans un navigateur et passer un QCM pour vérifier que la note s'affiche.
   Sans PHP (ou en ouvrant index.html depuis son disque), le site affiche que la correction est impossible.

Espace enseignant : ouvrir examen/enseignant.php dans un navigateur (par exemple
https://exemple.fr/examen-svt/examen/enseignant.php) et saisir le mot de passe de examen/config.php. Utiliser
de préférence une adresse en https (le mot de passe passe par un formulaire).

Déroulement : l'examen est fermé tant que le surveillant ne l'a pas ouvert. Dans l'espace enseignant, « Ouvrir
l'examen », avec un code d'accès (facultatif, à écrire au tableau) et une durée en minutes (facultative ; sinon
celle de chaque QCM, s'il en a une). Les élèves ne peuvent commencer que pendant l'ouverture, avec le bon code ; le
serveur note l'heure de début de chacun, et la liste des élèves en cours s'affiche. À la fin, « Fermer l'examen » :
plus personne ne peut commencer ; une copie rendue ensuite reste acceptée, marquée « après la fermeture ». Une
copie rendue après la durée (plus une minute de marge), mesurée par le serveur, est marquée « hors délai ». Chaque
élève ne rend qu'une copie par QCM (le site ne propose pas de recommencer) ; plusieurs copies au même nom sont
signalées.

Liste de classe (facultative, dans l'espace enseignant) : un élève par ligne, « Nom Prénom » ou
« Nom Prénom ; Groupe ». Seuls ces noms peuvent alors commencer (accents, majuscules et ordre des mots ne comptent
pas : un nom mal orthographié est refusé, l'élève corrige) ; la copie porte le nom et le groupe de la liste, et
l'espace enseignant indique les élèves de la liste qui n'ont pas commencé. La liste n'est jamais envoyée aux élèves.

Corrigé : par défaut (corrige: "enseignant"), l'élève qui rend sa copie ne voit que sa note. Quand le temps de
l'épreuve est écoulé, publier le corrigé de chaque QCM dans l'espace enseignant (bouton « Publier ») : les élèves
voient alors le détail par question et le corrigé, en revenant sur leur résultat (bouton « Voir si le corrigé est
publié »). Le corrigé se retire de la même façon.

Copies : avant l'examen, chaque élève indique son nom (et, s'il le souhaite, sa classe ou son groupe). Chaque
copie corrigée est gardée sur le serveur, dans examen/copies/copies.php (illisible par le web), et s'affiche dans
l'espace enseignant : liste des copies, détail de chacune (réponses de l'élève et réponses attendues, question par
question) et, pour un QCM choisi, statistiques par question (taux de réussite, points moyens, sans réponse). La
liste se télécharge au format CSV (tableur) ; pour un QCM choisi, avec une colonne de points par question. Le serveur doit pouvoir écrire dans le
dossier examen/copies/ (c'est le cas par défaut chez la plupart des hébergeurs ; sinon, lui donner les droits
d'écriture, 755 ou 775, avec le client FTP). Pour repartir de zéro : « Supprimer toutes les copies » dans
l'espace enseignant (après avoir téléchargé le CSV). Les noms des élèves sont des données
personnelles : ne garder les copies que le temps nécessaire, et informer les élèves.

Réglages (fichier reglages.js, relu par le serveur à chaque correction) :
- corrige : "enseignant" (publié dans l'espace enseignant), "fin" (dès que l'élève rend sa copie) ou "jamais"
  (la note et le détail par question, jamais le corrigé) ;
- copies : "oui" (nom demandé, copies gardées) ou "non" (rien n'est gardé sur le serveur) ;
- seuil : seuil de réussite en % pour tous les QCM (par exemple "50") ; "" : celui de chaque QCM ;
- tirage : nombre de questions par examen, tirées au hasard par le serveur pour chaque élève parmi celles du QCM
  (par exemple "10") ; "" (par défaut) : toutes les questions. Seules les questions tirées sont notées.

Limites : un élève peut indiquer un autre nom que le sien, ou, en vidant les données de son navigateur, commencer
une seconde copie tant que l'examen est ouvert (signalée si le nom est le même) ; une fois le corrigé publié (ou
avec corrige: "fin"), les réponses peuvent circuler : fermer l'examen avant de publier le corrigé.

Pour mettre le site à jour, exporter de nouveau depuis Abbon avec le même titre et remplacer les fichiers, y
compris examen/solutions.php, mais pas le dossier examen/copies/ (les copies déjà reçues) ; garder son
examen/config.php si l'on a changé le mot de passe.
`;

/** Archive du site : `dossier/…` (lecteur, données, mode d'emploi, fichiers en plus : examen/…). */
export function zipSite(folder: string, player: Record<string, Uint8Array>, data: SiteData, extra: Record<string, string> = {}): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const [name, bytes] of Object.entries(player)) {
    if (name === 'files.json' || name === 'donnees.js' || name === 'reglages.js') continue;
    files[`${folder}/${name}`] = bytes;
  }
  files[`${folder}/donnees.js`] = strToU8(siteScript(data));
  files[`${folder}/reglages.js`] = strToU8(settingsScript({ modes: data.modes ?? 'both', solutions: data.solutions ?? 'end' }, !!data.server));
  files[`${folder}/LISEZMOI.txt`] = strToU8(data.server ? SITE_SERVER_README : SITE_README);
  for (const [name, text] of Object.entries(extra)) files[`${folder}/${name}`] = strToU8(text);
  return zipSync(files, { level: 6 });
}
