/**
 * Catalogue de téléchargement des questionnaires (.qcm) : une page index.html dans chaque dossier, qui
 * présente ses sous-dossiers et ses fichiers (titre, description, nombre de QCM et de questions, taille).
 * Conçu pour un hébergement statique sans liste de dossiers, comme GitHub Pages :
 *
 *   abbon/questionnaires/            index : langues disponibles
 *   abbon/questionnaires/fr/         index : rubriques
 *   abbon/questionnaires/fr/sciences index : fichiers .qcm
 *
 * Usage : npm run module:catalogue -- <dossier racine> [--titre "Abbon — questionnaires"]
 *
 * Seules les pages produites par ce script (repérées par le commentaire GENERATED) sont réécrites :
 * un index.html écrit à la main est laissé intact, avec un avertissement.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';

export const GENERATED = '<!-- Page produite par Abbon (npm run module:catalogue) : elle sera réécrite. -->';

/** Noms affichés des dossiers usuels ; les autres sont affichés tels quels, avec une majuscule. */
const NAMES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  langues: 'Langues',
  sciences: 'Sciences',
  technologie: 'Technologie',
};
export const dirName = (d: string) => NAMES[d] ?? d.charAt(0).toUpperCase() + d.slice(1).replace(/[-_]/g, ' ');

export interface QcmInfo {
  file: string;
  bytes: number;
  title: string;
  description: string;
  version: string;
  level: string;
  license: string;
  quizzes: number;
  questions: number;
  /** Nombre de fiches de révision. */
  sheets: number;
}

const loc = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, string>;
    return o.fr ?? o.en ?? Object.values(o)[0] ?? '';
  }
  return '';
};

/** Lit les informations d'un fichier .qcm (module ou simple export de QCM). */
export function readQcm(bytes: Uint8Array, file: string): QcmInfo {
  const z = unzipSync(bytes);
  const json = (name: string) => (z[name] ? JSON.parse(strFromU8(z[name])) : null);
  const manifest = json('manifest.json') as { quizzes?: { file: string }[] } | null;
  if (!manifest) throw new Error(`${file} : manifest.json absent, ce n'est pas un fichier .qcm`);
  const mod = json('module.json') as Record<string, unknown> | null;
  const quizzes = (manifest.quizzes ?? []).map((q) => json(q.file) as { title?: unknown; questions?: unknown[] } | null);
  const first = quizzes[0];
  return {
    file,
    bytes: bytes.length,
    title: loc(mod?.title) || loc(first?.title) || file.replace(/\.qcm$/, ''),
    description: loc(mod?.description),
    version: typeof mod?.version === 'string' ? mod.version : '',
    level: typeof mod?.level === 'string' ? mod.level : '',
    license: typeof mod?.license === 'string' ? mod.license : '',
    quizzes: quizzes.length,
    questions: quizzes.reduce((n, q) => n + (q?.questions?.length ?? 0), 0),
    sheets: mod?.sheets && typeof mod.sheets === 'object' ? Object.keys(mod.sheets).length : 0,
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`);
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export interface DirEntry {
  name: string;
  /** Fichiers .qcm dans tout le sous-dossier. */
  files: number;
  questions: number;
}

/** Page index d'un dossier. `trail` : dossiers depuis la racine (vide pour la racine). */
export function indexPage(opts: { title: string; trail: string[]; dirs: DirEntry[]; files: QcmInfo[]; date: string }): string {
  const { title, trail, dirs, files } = opts;
  const here = trail.length ? trail.map(dirName).join(' › ') : title;
  const crumbs = [
    `<a href="${'../'.repeat(trail.length) || './'}">${esc(title)}</a>`,
    ...trail.map((d, i) =>
      i === trail.length - 1 ? `<span aria-current="page">${esc(dirName(d))}</span>` : `<a href="${'../'.repeat(trail.length - 1 - i)}">${esc(dirName(d))}</a>`,
    ),
  ];
  const dirList = dirs.length
    ? `<ul class="dirs">\n${dirs
        .map(
          (d) =>
            `<li><a href="${encodeURIComponent(d.name)}/">${esc(dirName(d.name))}</a> <span class="muted">— ${plural(d.files, 'questionnaire', 'questionnaires')}, ${plural(d.questions, 'question', 'questions')}</span></li>`,
        )
        .join('\n')}\n</ul>`
    : '';
  const fileList = files.length
    ? `<ul class="files">\n${files
        .map((f) => {
          const meta = [
            f.version && `version ${esc(f.version)}`,
            plural(f.quizzes, 'QCM', 'QCM'),
            plural(f.questions, 'question', 'questions'),
            f.sheets ? plural(f.sheets, 'fiche de révision', 'fiches de révision') : '',
            f.level && `niveau ${esc(f.level)}`,
            f.license && `licence ${esc(f.license)}`,
          ].filter(Boolean);
          return `<li>
  <div class="info">
    <h2>${esc(f.title)}</h2>
    ${f.description ? `<p>${esc(f.description)}</p>` : ''}
    <p class="muted">${meta.join(' · ')}</p>
  </div>
  <a class="get" href="${encodeURIComponent(f.file)}" download>Télécharger <span class="muted-on-button">${size(f.bytes)}</span></a>
</li>`;
        })
        .join('\n')}\n</ul>`
    : '';
  return `<!DOCTYPE html>
${GENERATED}
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(here)}${trail.length ? ` — ${esc(title)}` : ''}</title>
<style>
  :root { color-scheme: light dark; --fg: #1f2a1c; --muted: #5b6656; --bg: #f7f8f4; --card: #fff; --line: #d9dfd2; --accent: #2b6a2b; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e6ece1; --muted: #a9b4a3; --bg: #141812; --card: #1d231a; --line: #343d30; --accent: #7cc57a; } }
  body { font-family: system-ui, sans-serif; margin: 0 auto; max-width: 56rem; padding: 1.5rem 1rem 3rem; line-height: 1.5; color: var(--fg); background: var(--bg); }
  a { color: var(--accent); }
  nav { font-size: .95rem; margin-bottom: 1rem; }
  nav a, nav span { margin-right: .3rem; }
  h1 { font-size: 1.6rem; margin: .5rem 0 1rem; }
  .muted { color: var(--muted); }
  .intro { color: var(--muted); }
  ul { list-style: none; padding: 0; }
  .dirs li { padding: .6rem .8rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--card); margin-bottom: .5rem; }
  .dirs a { font-weight: 600; font-size: 1.05rem; }
  .files li { display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: .8rem 1rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--card); margin-bottom: .75rem; }
  .files h2 { font-size: 1.1rem; margin: 0 0 .25rem; }
  .files p { margin: .2rem 0; }
  .info { flex: 1 1 20rem; }
  a.get { white-space: nowrap; text-decoration: none; background: var(--accent); color: var(--bg); padding: .45rem .9rem; border-radius: .4rem; font-weight: 600; }
  a.get:hover, a.get:focus-visible { filter: brightness(1.1); }
  .muted-on-button { font-weight: 400; opacity: .85; }
  footer { margin-top: 3rem; color: var(--muted); font-size: .85rem; }
</style>
</head>
<body>
<nav aria-label="Fil d’Ariane">${crumbs.join(' › ')}</nav>
<h1>${esc(here)}</h1>
${
  trail.length
    ? ''
    : `<p class="intro">Questionnaires à importer dans <a href="https://github.com/fhoudebert/Abbon">Abbon</a>, application de QCM hors ligne : télécharger un fichier <code>.qcm</code>, puis, dans Abbon, <em>Administration › Importer</em>.</p>`
}
${dirList}
${fileList}
${!dirs.length && !files.length ? '<p class="muted">Aucun questionnaire pour l’instant.</p>' : ''}
<footer>Pour installer un questionnaire : dans Abbon, <em>Administration › Importer</em>, puis choisir le fichier <code>.qcm</code> téléchargé.
Mis à jour le ${esc(opts.date)}.</footer>
</body>
</html>
`;
}

interface Walked {
  files: number;
  questions: number;
  written: number;
  skipped: string[];
}

/** Écrit un index.html dans `dir` et dans tous ses sous-dossiers ; renvoie les totaux. */
export function writeCatalogue(root: string, title: string, date: string, dir = root): Walked {
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort((a, b) => a.localeCompare(b, 'fr'));
  const out: Walked = { files: 0, questions: 0, written: 0, skipped: [] };
  const dirs: DirEntry[] = [];
  const files: QcmInfo[] = [];
  for (const name of names) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const sub = writeCatalogue(root, title, date, p);
      out.written += sub.written;
      out.skipped.push(...sub.skipped);
      out.files += sub.files;
      out.questions += sub.questions;
      dirs.push({ name, files: sub.files, questions: sub.questions });
    } else if (name.toLowerCase().endsWith('.qcm')) {
      const info = readQcm(new Uint8Array(readFileSync(p)), name);
      files.push(info);
      out.files += 1;
      out.questions += info.questions;
    }
  }
  files.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  const index = join(dir, 'index.html');
  if (existsSync(index) && !readFileSync(index, 'utf8').includes(GENERATED)) {
    out.skipped.push(relative(root, index) || 'index.html');
  } else {
    const trail = relative(root, dir).split(sep).filter(Boolean);
    writeFileSync(index, indexPage({ title, trail, dirs, files, date }));
    out.written += 1;
  }
  return out;
}

if (process.argv[1] && basename(process.argv[1]).startsWith('catalogue')) {
  const args = process.argv.slice(2);
  const t = args.indexOf('--titre');
  const title = t >= 0 ? args[t + 1] : 'Abbon — questionnaires';
  const root = args.find((a, i) => !a.startsWith('--') && (t < 0 || i !== t + 1));
  if (!root || !existsSync(root) || !statSync(root).isDirectory()) {
    console.error('usage : npm run module:catalogue -- <dossier racine> [--titre "…"]');
    process.exit(2);
  }
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const r = writeCatalogue(root, title, date);
  console.log(`Catalogue : ${r.files} questionnaire(s), ${r.questions} questions, ${r.written} page(s) index écrite(s).`);
  for (const s of r.skipped) console.warn(`  ${s} écrit à la main : laissé intact`);
}
