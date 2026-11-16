/**
 * Commandes `module:check` et `module:build` (voir cli.mjs).
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { buildPackage, parsePackage, sha256Hex, sniffMime, type MediaFile } from '$lib/interchange/qcmPackage';
import { compileModule, type Asset, type Compiled, type SourceFile } from './source';

/** Fichiers texte d'un dossier de module (récursif), chemins relatifs avec des « / ». */
function readSources(dir: string): SourceFile[] {
  const out: SourceFile[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(md|yaml)$/.test(name)) out.push({ path: relative(dir, p).split(sep).join('/'), text: readFileSync(p, 'utf8') });
    }
  };
  walk(dir);
  return out;
}

/** Images et figures d'un dossier de module (récursif) : octets, empreinte et type reconnu. */
async function readAssets(dir: string): Promise<{ assets: Asset[]; bytes: Map<string, Uint8Array> }> {
  const assets: Asset[] = [];
  const bytes = new Map<string, Uint8Array>();
  const walk = async (d: string) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) await walk(p);
      else if (/\.(svg|png|jpe?g|gif|webp)$/i.test(name)) {
        const b = new Uint8Array(readFileSync(p));
        const path = relative(dir, p).split(sep).join('/');
        bytes.set(path, b);
        assets.push({ path, hash: await sha256Hex(b), mime: sniffMime(b) });
      }
    }
  };
  await walk(dir);
  return { assets, bytes };
}

function report(name: string, c: Compiled): boolean {
  const errors = c.issues.filter((i) => i.level === 'error');
  const warnings = c.issues.filter((i) => i.level === 'warning');
  const questions = c.quizzes.reduce((n, q) => n + q.questions.length, 0);
  console.log(`\n${name} — ${c.manifest.id} ${c.manifest.version} : ${c.quizzes.length} QCM, ${questions} questions`);
  for (const s of c.stats) console.log(`  ${s.category.padEnd(28)} ${s.level.padEnd(18)} ${String(s.quizzes).padStart(3)} QCM ${String(s.questions).padStart(5)} questions`);
  const sheets = Object.keys(c.manifest.sheets ?? {}).length;
  console.log(`  fiches de révision : ${sheets} / ${c.categories.length} catégorie(s)`);
  if (c.assets.length || c.manifest.requires?.features?.length)
    console.log(`  images : ${c.assets.length} ; fonctions requises : ${c.manifest.requires?.features?.join(', ') || 'aucune'}`);
  for (const i of [...errors, ...warnings])
    console.log(`  ${i.level === 'error' ? 'ERREUR' : 'attention'}  modules/${name}/${i.file}${i.ref ? ` [${i.ref}]` : ''} : ${i.message}`);
  if (errors.length) console.log(`  → ${errors.length} erreur(s)`);
  return errors.length === 0;
}

export async function main(argv: string[], root: string): Promise<number> {
  const [command, ...names] = argv;
  if (command !== 'check' && command !== 'build') {
    console.error('usage : module:check [nom…] | module:build [nom…]');
    return 2;
  }
  const modulesDir = join(root, 'modules');
  const all = readdirSync(modulesDir).filter((n) => statSync(join(modulesDir, n)).isDirectory()).sort();
  const unknown = names.filter((n) => !all.includes(n));
  if (unknown.length) {
    console.error(`module(s) inconnu(s) : ${unknown.join(', ')} (disponibles : ${all.join(', ')})`);
    return 2;
  }
  const appVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string;
  let ok = true;
  const ids = new Map<string, string>();
  for (const name of names.length ? names : all) {
    let c: Compiled;
    let images: Awaited<ReturnType<typeof readAssets>>;
    try {
      images = await readAssets(join(modulesDir, name));
      c = compileModule(readSources(join(modulesDir, name)), images.assets);
    } catch (e) {
      console.log(`\n${name}\n  ERREUR  ${(e as Error).message}`);
      ok = false;
      continue;
    }
    let good = report(name, c);
    if (ids.has(c.manifest.id)) {
      console.log(`  ERREUR  identifiant ${c.manifest.id} déjà utilisé par modules/${ids.get(c.manifest.id)}`);
      good = false;
    }
    ids.set(c.manifest.id, name);
    ok &&= good;
    if (!good || command !== 'build') continue;

    const now = new Date(c.quizzes[0]?.createdAt ?? 0); // date de publication : fichier reproductible
    const media = new Map<string, MediaFile>();
    for (const path of c.assets) {
      const a = images.assets.find((x) => x.path === path)!;
      media.set(a.hash, { mime: a.mime!, bytes: images.bytes.get(path)! });
    }
    const bytes = buildPackage(
      { quizzes: c.quizzes, categories: c.categories, media, module: c.manifest },
      { kind: 'content', solutions: true, appVersion, now },
    );
    // Relecture par le code d'import : ce qui est publié est ce qu'Abbon saura lire.
    const back = await parsePackage(bytes);
    if (back.problems.length || !back.module || back.quizzes.length !== c.quizzes.length) {
      console.log(`  ERREUR  le fichier produit n'est pas relu correctement : ${JSON.stringify(back.problems)}`);
      ok = false;
      continue;
    }
    const out = join(root, 'dist', 'modules');
    mkdirSync(out, { recursive: true });
    const file = join(out, `Abbon-${name}-${c.manifest.version}.qcm`);
    writeFileSync(file, bytes);
    console.log(`  → ${relative(root, file)} (${(bytes.length / 1024).toFixed(1)} Ko)`);
  }
  return ok ? 0 : 1;
}
