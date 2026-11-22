/**
 * Site web exporté (lecteur autonome pour hébergement mutualisé).
 *
 * La même interface est construite une seconde fois avec `vite build --mode site` : routage par fragment
 * (`#/quiz/…`), chemins relatifs, sans administration. Les contenus arrivent par `donnees.js`, qui définit
 * `window.ABBON_SITE` avant le chargement de l'application ; la progression du visiteur reste dans son
 * navigateur (stockage local). `reglages.js`, facultatif et modifiable à la main après l'export, définit
 * `window.ABBON_SITE_SETTINGS` : modes proposés et corrigé de l'examen. Voir docs/architecture.md, « Export en site web ».
 */

/** Vrai dans la construction du site web, faux dans l'application. */
export const SITE: boolean = __SITE__;

/** Lien interne : `#/chemin` dans le site (routage par fragment), `/chemin` dans l'application. */
export const to = (path: string) => (SITE ? `#${path}` : path);

/** Contenu de `donnees.js`. */
export interface SiteData {
  format: 'abbon-site';
  version: 1;
  /** Identifiant stable du site : clé de la progression dans le navigateur. */
  id: string;
  title: string;
  /** Modes proposés (absent dans les premiers exports : voir `examOnly`). */
  modes?: SiteModes;
  /** Examen : corrigé à la fin, ou jamais. */
  solutions?: SiteSolutions;
  /** Premiers exports : examen seulement. */
  examOnly?: boolean;
  /**
   * Examen corrigé par le serveur : le paquet ne contient pas les réponses, `examen/corriger.php` note les
   * tentatives (lib/exam). Le site est alors en examen seulement.
   */
  server?: boolean;
  /** Archive .qcm (module ou sauvegarde sans historique), en base 64. */
  package: string;
}

export function isSiteData(v: unknown): v is SiteData {
  const d = v as Partial<SiteData> | null;
  return !!d && d.format === 'abbon-site' && d.version === 1 && typeof d.id === 'string' && typeof d.package === 'string';
}

/** Données du site (absentes dans l'application ou si `donnees.js` manque). */
export function siteData(): SiteData | null {
  if (!SITE || typeof window === 'undefined') return null;
  const d = (window as { ABBON_SITE?: unknown }).ABBON_SITE;
  return isSiteData(d) ? d : null;
}

/** Modes proposés : entraînement et examen, entraînement seulement (avec la boîte de révision), examen seulement. */
export type SiteModes = 'both' | 'training' | 'exam';
/**
 * Corrigé de l'examen : à la fin, jamais, ou (examen corrigé par le serveur) quand l'enseignant le publie dans
 * `examen/enseignant.php` ; sans serveur, « teacher » vaut « never ».
 */
export type SiteSolutions = 'end' | 'never' | 'teacher';

/** Réglages effectifs du site. */
export interface SiteSettings {
  modes: SiteModes;
  solutions: SiteSolutions;
}

/** Valeurs acceptées dans `reglages.js` (en français, pour une modification à la main) et en interne. */
const MODE_NAMES: Record<string, SiteModes> = {
  'les-deux': 'both',
  both: 'both',
  entrainement: 'training',
  entraînement: 'training',
  training: 'training',
  examen: 'exam',
  exam: 'exam',
};
const SOLUTION_NAMES: Record<string, SiteSolutions> = {
  fin: 'end',
  end: 'end',
  jamais: 'never',
  never: 'never',
  enseignant: 'teacher',
  teacher: 'teacher',
};
const SOLUTION_LABELS: Record<SiteSolutions, string> = { end: 'fin', never: 'jamais', teacher: 'enseignant' };

/**
 * Réglages du site : ceux de `reglages.js` s'ils sont lisibles, sinon ceux choisis à l'export.
 * Une valeur inconnue est ignorée (la valeur de l'export s'applique).
 */
export function resolveSettings(data: Pick<SiteData, 'modes' | 'solutions' | 'examOnly' | 'server'> | null, override?: unknown): SiteSettings {
  const o = (override && typeof override === 'object' ? override : {}) as { modes?: unknown; corrige?: unknown };
  const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
  return {
    // Corrigé par le serveur : sans réponses dans le site, l'entraînement est impossible.
    modes: data?.server ? 'exam' : (MODE_NAMES[norm(o.modes)] ?? data?.modes ?? (data?.examOnly ? 'exam' : 'both')),
    solutions: SOLUTION_NAMES[norm(o.corrige)] ?? data?.solutions ?? 'end',
  };
}

export function siteSettings(): SiteSettings {
  const w = typeof window === 'undefined' ? {} : (window as { ABBON_SITE_SETTINGS?: unknown });
  return resolveSettings(siteData(), w.ABBON_SITE_SETTINGS);
}

/** Site en mode examen seulement : ni entraînement, ni boîte de révision. */
export const examOnly = () => SITE && siteSettings().modes === 'exam';
/** Examen corrigé par le serveur (PHP) : les tentatives sont notées par `examen/corriger.php`. */
export const serverGrading = () => SITE && !!siteData()?.server;

/**
 * Examen corrigé par le serveur : copies gardées sur le serveur (nom de l'élève demandé avant l'examen) ?
 * `reglages.js`, `copies: "oui" | "non"` ; oui par défaut. Le serveur relit le même réglage.
 */
export function resolveCollect(data: Pick<SiteData, 'server'> | null, override?: unknown): boolean {
  if (!data?.server) return false;
  const v = (override as { copies?: unknown } | null)?.copies;
  return !(typeof v === 'string' && v.trim().toLowerCase() === 'non');
}
export const collectCopies = () =>
  SITE && resolveCollect(siteData(), typeof window === 'undefined' ? null : (window as { ABBON_SITE_SETTINGS?: unknown }).ABBON_SITE_SETTINGS);

/** Réglage du navigateur : nom et classe de l'élève, rappelés d'un examen à l'autre (JSON `Candidate`). */
export const CANDIDATE_SETTING = 'exam_candidate';
export interface Candidate {
  name: string;
  group: string;
}
export function parseCandidate(raw: string | null | undefined): Candidate {
  try {
    const c = JSON.parse(raw ?? '') as Partial<Candidate>;
    return { name: typeof c.name === 'string' ? c.name : '', group: typeof c.group === 'string' ? c.group : '' };
  } catch {
    return { name: '', group: '' };
  }
}
/** Site en mode entraînement seulement : pas d'examen. */
export const trainingOnly = () => SITE && siteSettings().modes === 'training';

const MODE_LABELS: Record<SiteModes, string> = { both: 'les-deux', training: 'entrainement', exam: 'examen' };

/** Texte de `reglages.js`, commenté pour être modifié à la main après l'export. */
export const settingsScript = (s: SiteSettings, server = false) => `// Réglages du site Abbon : modifiables après l'export, sans rien reconstruire.
// Enregistrer ce fichier (encodage UTF-8), le redéposer, puis recharger la page dans le navigateur.
window.ABBON_SITE_SETTINGS = {
${
  server
    ? `  // Examen corrigé par le serveur : le site ne contient pas les réponses, il est en examen seulement.
  modes: "examen",
  // Copies gardées sur le serveur : "oui" (nom de l'élève demandé avant l'examen ; copies consultables dans
  // examen/enseignant.php avec le mot de passe de examen/config.php) ou "non" (note seule, rien n'est gardé).
  copies: "oui",
  // Corrigé et détail par question :
  //   "enseignant"  l'élève voit sa note ; le détail et le corrigé, quand l'enseignant les publie (examen/enseignant.php) ;
  //   "fin"         dès que l'élève rend sa copie ;
  //   "jamais"      la note et le détail par question, jamais le corrigé.
  // Le serveur (examen/corriger.php) relit ce fichier à chaque correction.`
    : `  // Modes proposés aux visiteurs :
  //   "les-deux"      entraînement (correction à chaque question, boîte de révision) et examen ;
  //   "entrainement"  entraînement seulement ;
  //   "examen"        examen seulement (ni entraînement ni boîte de révision).
  modes: "${MODE_LABELS[s.modes]}",
  // Corrigé de l'examen : "fin" (après l'envoi des réponses) ou "jamais".`
}
  corrige: "${SOLUTION_LABELS[server ? s.solutions : s.solutions === 'teacher' ? 'never' : s.solutions]}",
};
`;

/** Texte de `donnees.js`. Le JSON est échappé pour ne jamais fermer la balise script. */
export const siteScript = (data: SiteData) =>
  `window.ABBON_SITE = ${JSON.stringify(data).replace(/</g, '\\u003c')};\n`;
