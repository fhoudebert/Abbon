/**
 * Portail d'hébergement de QCM (portail.php) : comptes, dépôt d'une archive exportée par Abbon (seules les données
 * sont gardées et réécrites), remplacement, réglages, suppression. Avec `php` (et l'extension zip) seulement.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { demoCategories, demoQuizzes } from '$lib/data/seed';
import { siteContent, siteDataOf, zipSite } from '$lib/interchange/siteExport';
import { CORRIGER_PHP, ENSEIGNANT_PHP, examFiles } from '../server';
import PORTAIL_PHP from './portail.php?raw';
import INDEX_PHP from './index.php?raw';

const hasPhp = spawnSync('php', ['-r', 'exit(class_exists("ZipArchive") && function_exists("mb_substr") ? 0 : 1);']).status === 0;

describe.skipIf(!hasPhp)('portail d\'hébergement (PHP)', () => {
  let root: string;
  let n = 0;

  /** Exécute du PHP avec la bibliothèque du portail chargée ; renvoie la valeur JSON affichée. */
  function php(code: string): unknown {
    const file = join(root, `_t${n++}.php`);
    writeFileSync(file, `<?php\nconst PORTAIL_RACINE = ${JSON.stringify(root)};\nrequire ${JSON.stringify(join(root, '_portail/portail.php'))};\n${code}\n`);
    const r = spawnSync('php', [file], { encoding: 'utf8' });
    rmSync(file);
    if (r.status !== 0) throw new Error(r.stdout + r.stderr);
    return JSON.parse(r.stdout || 'null');
  }
  /** Message de l'exception levée par $code, ou null. */
  const error = (code: string) => php(`try { ${code}; echo 'null'; } catch (Throwable $e) { echo json_encode($e->getMessage()); }`) as string | null;
  const file = (name: string, bytes: Uint8Array) => {
    const p = join(root, '..', `${name}-${n++}.zip`);
    writeFileSync(p, bytes);
    return p;
  };

  async function trainingZip(extra: Record<string, string> = {}) {
    const content = siteContent(demoQuizzes.slice(0, 2), demoCategories, []);
    const data = await siteDataOf(content, new Map(), { title: 'Révision histoire', modes: 'both', solutions: 'end' }, '0.4.3');
    return { data, zip: zipSite('revision', { 'index.html': strToU8('<p>lecteur de l\'archive</p>'), '_app/x.js': strToU8('alert(1)') }, data, extra) };
  }
  async function examZip(password = 'MotDePasse23') {
    const content = siteContent(demoQuizzes.slice(0, 1), demoCategories, []);
    const data = await siteDataOf(content, new Map(), { title: 'Interro maths', modes: 'exam', solutions: 'teacher', server: true }, '0.4.3');
    return zipSite('interro', { 'index.html': strToU8('x') }, data, examFiles(content.quizzes, 'teacher', password));
  }

  beforeEach(() => {
    root = join(mkdtempSync(join(tmpdir(), 'abbon-portail-')), 'questionnaires');
    mkdirSync(join(root, '_portail/abbon/lecteur/_app'), { recursive: true });
    writeFileSync(join(root, '_portail/portail.php'), PORTAIL_PHP.replace('__VERSION__', '9.9.9'));
    writeFileSync(join(root, '_portail/abbon/corriger.php'), CORRIGER_PHP);
    writeFileSync(join(root, '_portail/abbon/enseignant.php'), ENSEIGNANT_PHP);
    writeFileSync(join(root, '_portail/abbon/lecteur/index.html'), '<p>lecteur du portail</p>');
    writeFileSync(join(root, '_portail/abbon/lecteur/_app/lecteur.js'), '// lecteur');
  });
  afterEach(() => rmSync(join(root, '..'), { recursive: true, force: true }));

  it('syntaxe de index.php et de portail.php', () => {
    writeFileSync(join(root, 'index.php'), INDEX_PHP);
    for (const f of ['index.php', '_portail/portail.php']) expect(execFileSync('php', ['-l', join(root, f)]).toString()).toContain('No syntax errors');
  });

  it('installation et comptes : code d\'installation, mots de passe chiffrés, dernier administrateur', () => {
    expect(php(`echo json_encode(portail_installe());`)).toBe(false);
    const code = php(`echo json_encode(portail_code_installation());`) as string;
    expect(code).toMatch(/^[a-zA-Z2-9]{10}$/);
    expect(php(`echo json_encode(portail_code_installation());`)).toBe(code);
    expect(readFileSync(join(root, '_portail/donnees/installation.php'), 'utf8')).toMatch(/^<\?php exit; \?>\n/);

    expect(error(`portail_creer_compte('admin', 'Admin', 'court', true)`)).toMatch(/10 caractères/);
    expect(error(`portail_creer_compte('Admin!', 'Admin', 'assez long mot', true)`)).toMatch(/Identifiant/);
    expect(error(`portail_creer_compte('admin', 'Admin', 'mot de passe long', true)`)).toBeNull();
    expect(error(`portail_creer_compte('m.martin', 'Mme Martin', 'autre mot de passe')`)).toBeNull();
    expect(error(`portail_creer_compte('admin', 'X', 'mot de passe long')`)).toMatch(/existe déjà/);
    expect(readFileSync(join(root, '_portail/donnees/comptes.php'), 'utf8')).not.toContain('mot de passe long');
    expect(php(`echo json_encode([portail_installe(), portail_verifier('admin', 'mot de passe long'), portail_verifier('admin', 'faux'), portail_verifier('inconnu', 'x'), portail_est_admin('m.martin')]);`)).toEqual([
      true, true, false, false, false,
    ]);
    expect(error(`portail_supprimer_compte('admin', 'admin')`)).toMatch(/dernier administrateur/);
    expect(error(`portail_changer_mot_de_passe('m.martin', 'nouveau mot de passe')`)).toBeNull();
    expect(php(`echo json_encode(portail_verifier('m.martin', 'nouveau mot de passe'));`)).toBe(true);
  });

  it('essais de connexion : bloqué après 5 échecs, débloqué par une connexion réussie ou après 15 minutes', () => {
    expect(php(`for ($i = 0; $i < 4; $i++) portail_trop_d_essais('1.2.3.4', true, 1000); echo json_encode([portail_trop_d_essais('1.2.3.4', null, 1000), portail_trop_d_essais('5.6.7.8', null, 1000)]);`)).toEqual([false, false]);
    expect(php(`portail_trop_d_essais('1.2.3.4', true, 1000); echo json_encode([portail_trop_d_essais('1.2.3.4', null, 1500), portail_trop_d_essais('1.2.3.4', null, 2000)]);`)).toEqual([true, false]);
    expect(php(`portail_trop_d_essais('1.2.3.4', false, 1000); echo json_encode(portail_trop_d_essais('1.2.3.4', null, 1000));`)).toBe(false);
  });

  it('noms de dossiers', () => {
    expect(php(`echo json_encode(array_map('portail_nom_valide', ['interro-math-decembre', 'a1', 'a', '-a', 'a-', '_portail', 'Maths', 'é', 'index', '../x', str_repeat('a', 61)]));`)).toEqual([
      true, true, false, false, false, false, false, false, false, false, false,
    ]);
    expect(php(`echo json_encode(portail_nom_depuis('Révision Histoire — décembre (2)'));`)).toBe('revision-histoire-decembre-2');
  });

  it('dépôt d\'un site d\'entraînement : données réécrites, lecteur du portail, rien d\'autre de l\'archive', async () => {
    const { data, zip } = await trainingZip({ 'evil.php': '<?php system("id");', '.htaccess': 'AddType application/x-httpd-php .js', 'page.html': '<script>x</script>' });
    const path = file('revision', zip);
    const site = php(`echo json_encode(portail_installer_site(${JSON.stringify(path)}, 'revision-histoire', 'm.martin'));`);
    expect(site).toMatchObject({ titre: 'Révision histoire', proprietaire: 'm.martin', examen: false, version: '9.9.9' });
    const dir = join(root, 'revision-histoire');
    expect(readdirSync(dir).sort()).toEqual(['.htaccess', '_app', 'donnees.js', 'index.html', 'reglages.js']);
    expect(readdirSync(join(dir, '_app'))).toEqual(['lecteur.js']);
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toBe('<p>lecteur du portail</p>');
    expect(readFileSync(join(dir, '.htaccess'), 'utf8')).toBe('Options -Indexes\n');
    const js = readFileSync(join(dir, 'donnees.js'), 'utf8');
    expect(js.startsWith('window.ABBON_SITE = ')).toBe(true);
    expect(JSON.parse(js.slice('window.ABBON_SITE = '.length, -2))).toEqual(JSON.parse(JSON.stringify(data)));
    expect(readFileSync(join(dir, 'reglages.js'), 'utf8')).toMatch(/modes: "les-deux",[\s\S]*corrige: "fin"[\s\S]*points: ""/);
    expect(error(`portail_installer_site(${JSON.stringify(path)}, 'revision-histoire', 'm.martin')`)).toMatch(/existe déjà/);
    expect(error(`portail_installer_site(${JSON.stringify(path)}, 'autre', 'm.martin', '', true)`)).toMatch(/Aucun site/);
    mkdirSync(join(root, 'hors-portail'));
    expect(error(`portail_installer_site(${JSON.stringify(path)}, 'hors-portail', 'm.martin')`)).toMatch(/hors du portail/);
    expect(readdirSync(join(root, '_portail/donnees')).filter((f) => !f.endsWith('.php'))).toEqual([]);
  });

  it('archives refusées : pas un site Abbon, données avec un script, plusieurs sites', async () => {
    const { data } = await trainingZip();
    const refuse = (files: Record<string, string>) =>
      error(`portail_installer_site(${JSON.stringify(file('x', zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])))))}, 'essai', 'a')`);
    const json = JSON.stringify(data);
    expect(refuse({ 'site/index.html': 'x' })).toMatch(/donnees\.js manque/);
    expect(refuse({ 'site/donnees.js': `window.ABBON_SITE = ${json}; fetch('/questionnaires/')` })).toMatch(/illisible/);
    expect(refuse({ 'site/donnees.js': `window.ABBON_SITE = ${json.replace('"abbon-site"', '"autre"')};` })).toMatch(/pas les données/);
    expect(refuse({ 'site/donnees.js': `window.ABBON_SITE = ${json.replace('"version":1', '"version":2')};` })).toMatch(/plus récente/);
    expect(refuse({ 'a/donnees.js': `window.ABBON_SITE = ${json};`, 'b/donnees.js': `window.ABBON_SITE = ${json};` })).toMatch(/plusieurs sites/);
    expect(error(`portail_installer_site(${JSON.stringify(file('x', strToU8('pas un zip')))}, 'essai', 'a')`)).toMatch(/pas une archive/);
    expect(existsSync(join(root, 'essai'))).toBe(false);
  });

  it('examen corrigé par le serveur : correcteur du portail, corrigé et mot de passe relus comme des données', async () => {
    const path = file('interro', await examZip());
    php(`portail_installer_site(${JSON.stringify(path)}, 'interro-math-decembre', 'm.martin', 'Interro de maths'); echo 'null';`);
    const ex = join(root, 'interro-math-decembre/examen');
    expect(readdirSync(ex).sort()).toEqual(['.htaccess', 'config.php', 'copies', 'corriger.php', 'enseignant.php', 'solutions.php']);
    expect(readFileSync(join(ex, 'corriger.php'), 'utf8')).toBe(CORRIGER_PHP);
    expect(readFileSync(join(ex, '.htaccess'), 'utf8')).toContain('(solutions|config)');
    expect(readFileSync(join(ex, 'copies/.htaccess'), 'utf8')).toContain('denied');
    expect(readFileSync(join(root, 'interro-math-decembre/reglages.js'), 'utf8')).toMatch(/modes: "examen",[\s\S]*copies: "oui",[\s\S]*corrige: "enseignant"[\s\S]*points: "0"/);
    expect(php(`echo json_encode([portail_mot_de_passe_site('interro-math-decembre'), portail_sites()['interro-math-decembre']['titre']]);`)).toEqual(['MotDePasse23', 'Interro de maths']);
    // Le corrigé réécrit est lu par le correcteur comme celui d'Abbon.
    const sol = (f: string) => {
      const r = spawnSync('php', ['-r', `define('ABBON_EXAMEN', 1); echo json_encode(require ${JSON.stringify(f)});`], { encoding: 'utf8' });
      return JSON.parse(r.stdout);
    };
    const original = join(root, '..', 'sol.php');
    writeFileSync(original, examFiles(siteContent(demoQuizzes.slice(0, 1), demoCategories, []).quizzes, 'teacher', 'x')['examen/solutions.php']);
    expect(sol(join(ex, 'solutions.php'))).toEqual(sol(original));
    // solutions.php piégé : jamais exécuté, refusé.
    const evil = zipSync({ 'i/donnees.js': strToU8(readFileSync(join(root, 'interro-math-decembre/donnees.js'), 'utf8')), 'i/examen/solutions.php': strToU8('<?php system("id");') });
    expect(error(`portail_installer_site(${JSON.stringify(file('evil', evil))}, 'piege', 'a')`)).toMatch(/solutions\.php illisible/);
    // Mot de passe absent ou invalide dans config.php : un nouveau est créé.
    const noPassword = zipSync({ 'i/donnees.js': strToU8(readFileSync(join(root, 'interro-math-decembre/donnees.js'), 'utf8')), 'i/examen/solutions.php': readFileSync(original), 'i/examen/config.php': strToU8("<?php return array('motDePasse' => 'a\\'.system(1).\\'');") });
    php(`portail_installer_site(${JSON.stringify(file('np', noPassword))}, 'sans-mdp', 'a'); echo 'null';`);
    expect(php(`echo json_encode(portail_mot_de_passe_site('sans-mdp'));`)).toMatch(/^[a-zA-Z2-9]{12}$/);
    expect(readFileSync(join(root, 'sans-mdp/examen/config.php'), 'utf8')).not.toContain('system');
  });

  it('remplacement : réglages, copies, mot de passe et état de l\'examen gardés ; propriétaire seulement', async () => {
    php(`portail_creer_compte('admin', 'A', 'mot de passe long', true); portail_creer_compte('m.martin', 'M', 'mot de passe long'); portail_creer_compte('p.durand', 'P', 'mot de passe long'); echo 'null';`);
    const path = file('interro', await examZip());
    php(`portail_installer_site(${JSON.stringify(path)}, 'interro', 'm.martin'); echo 'null';`);
    expect(php(`echo json_encode(portail_changer_reglages('interro', ['corrige' => 'fin', 'copies' => 'non', 'seuil' => '50', 'tirage' => '10', 'modes' => 'les-deux']));`)).toEqual({
      modes: 'examen', corrige: 'fin', copies: 'non', seuil: '50', tirage: '10', points: '0',
    });
    expect(php(`echo json_encode(portail_changer_reglages('interro', ['points' => '5']));`)).toMatchObject({ points: '5' });
    expect(php(`echo json_encode(portail_changer_reglages('interro', ['points' => 'x']));`)).toMatchObject({ points: '5' });
    expect(readFileSync(join(root, 'interro/reglages.js'), 'utf8')).toContain('points: "5"');
    expect(php(`echo json_encode(portail_changer_reglages('interro', ['corrige' => 'alert(1)', 'seuil' => '"; x', 'tirage' => '0']));`)).toMatchObject({ corrige: 'fin', seuil: '50', tirage: '10' });
    const ex = join(root, 'interro/examen');
    writeFileSync(join(ex, 'copies/copies.php'), '<?php exit; ?>\n{"copie":1}\n');
    writeFileSync(join(ex, 'copies/etat.php'), '<?php exit; ?>\n{}\n');
    const newPassword = php(`echo json_encode(portail_nouveau_mot_de_passe_site('interro'));`);
    expect(error(`portail_installer_site(${JSON.stringify(file('i2', await examZip('Autre23mdpxx')))}, 'interro', 'p.durand', '', true)`)).toMatch(/autre compte/);
    expect(error(`portail_installer_site(${JSON.stringify(file('i2', await examZip('Autre23mdpxx')))}, 'interro', 'admin', '', true)`)).toBeNull();
    expect(readFileSync(join(ex, 'copies/copies.php'), 'utf8')).toContain('"copie":1');
    expect(existsSync(join(ex, 'copies/etat.php'))).toBe(true);
    expect(php(`echo json_encode([portail_mot_de_passe_site('interro'), portail_sites()['interro']['proprietaire'], portail_reglages_site('interro')['corrige']]);`)).toEqual([
      newPassword, 'm.martin', 'fin',
    ]);
    // Suppression d'un compte : ses sites passent à l'administrateur ; suppression d'un site : dossier et copies.
    php(`portail_supprimer_compte('m.martin', 'admin'); echo 'null';`);
    expect(php(`echo json_encode(portail_sites()['interro']['proprietaire']);`)).toBe('admin');
    php(`portail_supprimer_site('interro'); echo 'null';`);
    expect(existsSync(join(root, 'interro'))).toBe(false);
    expect(php(`echo json_encode(portail_sites());`)).toEqual([]);
  });

  it('mise à jour : nouveau lecteur et correcteur dans tous les sites, données gardées', async () => {
    const { zip } = await trainingZip();
    php(`portail_installer_site(${JSON.stringify(file('r', zip))}, 'revision', 'a'); portail_installer_site(${JSON.stringify(file('i', await examZip()))}, 'interro', 'a'); echo 'null';`);
    writeFileSync(join(root, 'interro/examen/copies/copies.php'), '<?php exit; ?>\n');
    const lib = PORTAIL_PHP.replace('__VERSION__', '10.0.0');
    const paquet = zipSync({
      'LISEZMOI.txt': strToU8('x'),
      'questionnaires/index.php': strToU8(INDEX_PHP),
      'questionnaires/_portail/portail.php': strToU8(lib),
      'questionnaires/_portail/abbon/corriger.php': strToU8(CORRIGER_PHP + '\n// v10'),
      'questionnaires/_portail/abbon/enseignant.php': strToU8(ENSEIGNANT_PHP),
      'questionnaires/_portail/abbon/lecteur/index.html': strToU8('<p>lecteur 10</p>'),
      'questionnaires/_portail/abbon/lecteur/_app/lecteur-10.js': strToU8('// 10'),
      'questionnaires/autre/evil.php': strToU8('<?php'),
    });
    expect(php(`echo json_encode(portail_mettre_a_jour_portail(${JSON.stringify(file('p', paquet))}));`)).toBe('10.0.0');
    expect(existsSync(join(root, 'autre'))).toBe(false);
    expect(php(`echo json_encode(portail_mettre_a_jour_sites());`)).toBe(2);
    expect(readFileSync(join(root, 'revision/index.html'), 'utf8')).toBe('<p>lecteur 10</p>');
    expect(readdirSync(join(root, 'revision/_app'))).toEqual(['lecteur-10.js']);
    expect(readFileSync(join(root, 'interro/examen/corriger.php'), 'utf8')).toContain('// v10');
    expect(existsSync(join(root, 'interro/examen/copies/copies.php'))).toBe(true);
    expect(php(`echo json_encode(portail_mot_de_passe_site('interro'));`)).toBe('MotDePasse23');
    expect(error(`portail_mettre_a_jour_portail(${JSON.stringify(file('z', zipSync({ 'questionnaires/index.php': strToU8('<?php') })))})`)).toMatch(/pas un paquet/);
  });
});
