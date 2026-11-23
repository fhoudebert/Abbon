/**
 * Rassemble la construction de l'atelier en un seul fichier HTML : scripts et feuilles de style recopiés dans
 * la page. Ouvrable par double-clic, publiable tel quel.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../../dist/atelier/', import.meta.url));
const read = (file: string) => readFileSync(dir + 'build/' + file, 'utf8');
const scripts: string[] = [];

const html = read('index.html')
  .replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, file: string) => `<style>${read(file).replace(/<\/style/gi, '<\\/style')}</style>`)
  .replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, file: string) => {
    scripts.push(read(file).replace(/<\/script/gi, '<\\/script'));
    return '';
  })
  // Les scripts passent à la fin du corps : la page est en place quand ils s'exécutent.
  .replace('</body>', () => scripts.map((js) => `<script type="module">${js}</script>\n`).join('') + '</body>');

if (/(src|href)="\.\/assets\//.test(html) || !scripts.length) throw new Error('ressource non incorporée');
writeFileSync(dir + 'atelier-formules.html', html);
console.log(`dist/atelier/atelier-formules.html : ${(html.length / 1024).toFixed(0)} Ko`);
