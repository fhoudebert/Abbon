/**
 * Prépare le site à déposer sur le serveur (PHP) :
 *
 *   site/
 *     index.php, .htaccess, abbon.png      page de téléchargement (dossier server/)
 *     releases/<fichiers>                  paquets de la version
 *     releases/version.json                description (page, application Android)
 *     releases/latest.json                 mises à jour Linux / Windows (si signés)
 *     releases/SHA256SUMS.txt
 *
 * Usage (Node 22.6+) :
 *   node --experimental-strip-types scripts/release/build-site.ts \
 *     --dist dist --out site --version 0.2.0 [--base-url https://exemple.fr] [--changelog CHANGELOG.md]
 *
 * Sans --base-url, latest.json n'est pas produit (le plugin updater exige des adresses complètes).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { buildLatestJson, buildVersionJson, classify, notesFromChangelog, sha256sums, type Artifact } from './manifest.ts';

const { values: args } = parseArgs({
  options: {
    dist: { type: 'string', default: 'dist' },
    out: { type: 'string', default: 'site' },
    version: { type: 'string' },
    'base-url': { type: 'string', default: '' },
    changelog: { type: 'string', default: 'CHANGELOG.md' },
    server: { type: 'string', default: 'server' },
    icon: { type: 'string', default: 'assets/abbon-icon.png' },
  },
});

const version = args.version ?? JSON.parse(readFileSync('package.json', 'utf8')).version;
const date = new Date().toISOString();
const releases = join(args.out!, 'releases');
mkdirSync(releases, { recursive: true });

// Page de téléchargement
for (const f of readdirSync(args.server!)) {
  if (statSync(join(args.server!, f)).isFile()) copyFileSync(join(args.server!, f), join(args.out!, f));
}
if (existsSync(args.icon!)) copyFileSync(args.icon!, join(args.out!, 'abbon.png'));

// Paquets (+ signatures .sig)
const names = readdirSync(args.dist!).filter((f) => statSync(join(args.dist!, f)).isFile());
const artifacts: Artifact[] = [];
for (const name of names.filter((n) => classify(n)).sort()) {
  const bytes = readFileSync(join(args.dist!, name));
  const sig = join(args.dist!, `${name}.sig`);
  artifacts.push({
    name,
    size: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    signature: existsSync(sig) ? readFileSync(sig, 'utf8') : undefined,
  });
  copyFileSync(join(args.dist!, name), join(releases, name));
}
if (!artifacts.length) throw new Error(`aucun paquet dans ${args.dist}`);

const notes = existsSync(args.changelog!) ? notesFromChangelog(readFileSync(args.changelog!, 'utf8'), version) : {};
const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';

writeFileSync(join(releases, 'version.json'), json(buildVersionJson(version, date, notes, artifacts)));
writeFileSync(join(releases, 'SHA256SUMS.txt'), sha256sums(artifacts));

const signed = artifacts.filter((a) => a.signature);
if (args['base-url'] && signed.length) {
  const text = notes.fr && notes.en ? `${notes.fr}\n\n---\n\n${notes.en}` : (notes.fr ?? notes.en ?? '');
  writeFileSync(join(releases, 'latest.json'), json(buildLatestJson(version, date, text, args['base-url'], artifacts)));
  console.log(`latest.json : ${signed.length} fichier(s) signé(s)`);
} else {
  console.warn('latest.json non produit : adresse du site (--base-url) ou signatures absentes');
}
console.log(`Site Abbon ${version} prêt dans ${args.out} (${artifacts.length} paquet(s))`);
