/**
 * Paquet du portail d'hébergement de QCM (src/lib/exam/portail) : dist/portail/Abbon-portail-<version>.zip, à
 * déposer une fois par FTP sur un hébergement PHP. Le lecteur des sites est celui de `vite build --mode site`
 * (build-site/), le correcteur celui des examens corrigés par le serveur (src/lib/exam/*.php).
 *
 * Usage : npm run portail   (construit le lecteur, puis ce paquet)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { strToU8, zipSync } from 'fflate';

const SITE = 'build-site';
const SRC = 'src/lib/exam';
const OUT = 'dist/portail';

if (!existsSync(join(SITE, 'index.html'))) {
  console.error(`${SITE}/index.html introuvable : lancer d'abord « npm run build:site ».`);
  process.exit(1);
}
const version = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
const text = (path: string) => readFileSync(path, 'utf8').replaceAll('__VERSION__', version);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const DENY = '<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n';
const files: Record<string, Uint8Array> = {
  'LISEZMOI.txt': strToU8(text(`${SRC}/portail/LISEZMOI.txt`)),
  'questionnaires/index.php': strToU8(text(`${SRC}/portail/index.php`)),
  'questionnaires/.htaccess': strToU8('Options -Indexes\nDirectoryIndex index.php index.html\n'),
  'questionnaires/_portail/.htaccess': strToU8(DENY),
  'questionnaires/_portail/index.html': new Uint8Array(),
  'questionnaires/_portail/portail.php': strToU8(text(`${SRC}/portail/portail.php`)),
  'questionnaires/_portail/abbon/corriger.php': readFileSync(`${SRC}/corriger.php`),
  'questionnaires/_portail/abbon/enseignant.php': readFileSync(`${SRC}/enseignant.php`),
};
for (const path of walk(SITE)) {
  const name = relative(SITE, path).split(sep).join('/');
  if (name === 'files.json' || name === 'donnees.js' || name === 'reglages.js') continue;
  files[`questionnaires/_portail/abbon/lecteur/${name}`] = readFileSync(path);
}

mkdirSync(OUT, { recursive: true });
const out = join(OUT, `Abbon-portail-${version}.zip`);
writeFileSync(out, zipSync(files, { level: 6 }));
console.log(`${out} : ${Object.keys(files).length} fichiers.`);
