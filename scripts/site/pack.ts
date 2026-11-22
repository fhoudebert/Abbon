/**
 * Prépare le lecteur du site web (sortie de `vite build --mode site`, dans build-site/) :
 *  - chemins relatifs dans index.html (le site peut être déposé dans n'importe quel dossier) ;
 *  - chargement de `donnees.js` (contenus du site) avant l'application ;
 *  - liste des fichiers (`files.json`), lue par l'application au moment de l'export ;
 *  - copie dans build/web/, embarqué dans l'application (export « Site web »).
 *
 * Usage : node scripts/site/pack.ts   (après `vite build` et `vite build --mode site`)
 */
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { relativeIndex } from './html.ts';

const SITE = 'build-site';
const APP = 'build';

if (!existsSync(join(SITE, 'index.html'))) {
  console.error(`${SITE}/index.html introuvable : lancer d'abord « vite build --mode site ».`);
  process.exit(1);
}

const index = join(SITE, 'index.html');
writeFileSync(index, relativeIndex(readFileSync(index, 'utf8')));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(SITE)
  .map((p) => relative(SITE, p).split(sep).join('/'))
  .filter((f) => f !== 'files.json' && f !== 'donnees.js' && f !== 'reglages.js')
  .sort();
writeFileSync(join(SITE, 'files.json'), JSON.stringify(files, null, 1));

if (existsSync(APP)) {
  rmSync(join(APP, 'web'), { recursive: true, force: true });
  cpSync(SITE, join(APP, 'web'), { recursive: true });
}
console.log(`Lecteur du site web : ${files.length} fichiers${existsSync(APP) ? `, copiés dans ${APP}/web/` : ''}.`);
