import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { demoCategories, demoModule, demoQuizzes } from '$lib/data/seed';
import type { InstalledModule, ModuleManifest } from '$lib/domain/types';
import { ManifestSchema } from './format';
import { checkRequirements, modulePrefix, ModuleSchema, planModule } from './module';
import { buildPackage, parsePackage, sha256Hex } from './qcmPackage';

const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
);

const manifest = (over: Partial<ModuleManifest> = {}): ModuleManifest => ({ ...structuredClone(demoModule), ...over });
const english = demoQuizzes.filter((q) => q.id === 'demo-english');
const nothing = { modules: [], quizzes: [], categories: [] };
const installed = (version: string): InstalledModule => ({ manifest: manifest({ version }), installedAt: 'x', updatedAt: 'x' });

const pack = (m: ModuleManifest, media = new Map()) =>
  buildPackage({ quizzes: demoQuizzes, categories: demoCategories, media, module: m }, { kind: 'content', solutions: true, appVersion: '0.2.0' });
const rezip = (bytes: Uint8Array, patch: (files: Record<string, Uint8Array>) => void) => {
  const files = unzipSync(bytes);
  patch(files);
  return zipSync(files);
};

describe('manifeste de module', () => {
  it('valide le module de démonstration', () => {
    expect(ModuleSchema.safeParse(demoModule).success).toBe(true);
  });

  it('refuse identifiant, version ou adresse invalides', () => {
    for (const bad of [{ id: 'informatique' }, { id: 'Org.Abbon.X' }, { version: '1.0' }, { homepage: 'http://exemple.org' }, { license: '' }])
      expect(ModuleSchema.safeParse(manifest(bad as Partial<ModuleManifest>)).success, JSON.stringify(bad)).toBe(false);
  });

  it('dérive un préfixe d’identifiants compatible avec le format .qcm', () => {
    expect(modulePrefix('org.abbon.anglais-verbes')).toBe('org-abbon-anglais-verbes_');
  });

  it('vérifie la version d’Abbon et les fonctions demandées', () => {
    expect(checkRequirements(manifest(), '0.1.0')).toEqual({ ok: true, appTooOld: undefined, missingFeatures: [] });
    const m = manifest({ requires: { app: '>=0.3.0', features: ['math', 'svg'] } });
    expect(checkRequirements(m, '0.2.0')).toEqual({ ok: false, appTooOld: '>=0.3.0', missingFeatures: ['math', 'svg'] });
    expect(checkRequirements(m, '0.3.0', ['math', 'svg']).ok).toBe(true);
  });
});

describe('plan d’installation', () => {
  it('ne prend que les QCM et catégories annoncés, et les marque', () => {
    const plan = planModule(manifest(), { quizzes: demoQuizzes, categories: demoCategories }, nothing);
    expect(plan.status).toBe('new');
    expect(plan.quizzes.map((q) => [q.id, q.moduleId])).toEqual([['demo-english', 'org.abbon.demo']]);
    expect(plan.categories.map((c) => [c.id, c.moduleId])).toEqual([['cat-lang', 'org.abbon.demo']]);
    expect(plan.manifest.quizzes).toEqual(['demo-english']);
  });

  it('compare les versions', () => {
    const status = (v: string) => planModule(manifest(), { quizzes: english, categories: [] }, { ...nothing, modules: [installed(v)] }).status;
    expect(status('0.9.0')).toBe('update');
    expect(status('1.0.0')).toBe('same');
    expect(status('1.0.1')).toBe('older');
  });

  it('n’écrase jamais un QCM personnel ou celui d’un autre module', () => {
    const mine = planModule(manifest(), { quizzes: english, categories: demoCategories }, { ...nothing, quizzes: [{ id: 'demo-english' }] });
    expect(mine.conflicts).toEqual(['demo-english']);
    expect(mine.quizzes).toEqual([]);
    const other = planModule(manifest(), { quizzes: english, categories: [] }, { ...nothing, quizzes: [{ id: 'demo-english', moduleId: 'org.autre.x' }] });
    expect(other.conflicts).toEqual(['demo-english']);
    const same = planModule(manifest(), { quizzes: english, categories: [] }, { ...nothing, quizzes: [{ id: 'demo-english', moduleId: 'org.abbon.demo' }] });
    expect(same.conflicts).toEqual([]);
  });

  it('laisse une catégorie personnelle de même identifiant, et y range quand même les QCM', () => {
    const plan = planModule(manifest(), { quizzes: english, categories: demoCategories }, { ...nothing, categories: [{ id: 'cat-lang' }] });
    expect(plan.categories).toEqual([]);
    expect(plan.quizzes[0].categoryId).toBe('cat-lang');
    expect(plan.manifest.categories).toEqual([]);
  });

  it('signale les QCM annoncés mais absents, et ceux à retirer', () => {
    const plan = planModule(
      manifest({ quizzes: ['demo-english', 'fantome'] }),
      { quizzes: english, categories: [] },
      { ...nothing, modules: [installed('0.9.0')], quizzes: [{ id: 'ancien', moduleId: 'org.abbon.demo' }, { id: 'perso' }] },
    );
    expect(plan.missing).toEqual(['fantome']);
    expect(plan.removedQuizIds).toEqual(['ancien']);
  });
});

describe('fichier .qcm de module', () => {
  it('reste un export ordinaire pour une version qui ignore module.json', async () => {
    const files = unzipSync(pack(manifest()));
    expect(Object.keys(files)).toContain('module.json');
    // Le manifeste du paquet n'a aucun champ nouveau : le schéma publié en version 1 l'accepte tel quel.
    const raw = JSON.parse(strFromU8(files['manifest.json']));
    expect(ManifestSchema.strict().safeParse(raw).success).toBe(true);
    expect(raw.kind).toBe('content');
    expect(JSON.parse(strFromU8(files['quizzes/demo-english.json']))).not.toHaveProperty('moduleId');
  });

  it('aller-retour : module, fiches et images des fiches', async () => {
    const hash = await sha256Hex(PNG);
    const m = manifest();
    m.sheets!['cat-lang'].fr = { type: 'doc', content: [{ type: 'image', attrs: { hash, alt: 'schéma' } }] };
    const p = await parsePackage(pack(m, new Map([[hash, { mime: 'image/png', bytes: PNG }]])));
    expect(p.problems).toEqual([]);
    expect(p.module).toEqual(m);
    expect([...p.media.keys()]).toEqual([hash]);
  });

  it('module.json invalide ou trop récent : signalé, le reste s’importe', async () => {
    const bad = await parsePackage(rezip(pack(manifest()), (f) => (f['module.json'] = strToU8('{"format":"abbon-module"}'))));
    expect(bad.module).toBeUndefined();
    expect(bad.problems.map((x) => x.code)).toEqual(['module_invalid']);
    expect(bad.quizzes).toHaveLength(demoQuizzes.length);

    const newer = await parsePackage(rezip(pack(manifest()), (f) => (f['module.json'] = strToU8(JSON.stringify({ ...manifest(), formatVersion: 2 })))));
    expect(newer.module).toBeUndefined();
    expect(newer.problems).toEqual([{ code: 'module_unsupported', detail: '2' }]);
  });

  it('sauvegarde complète : modules et appartenance des QCM conservés', async () => {
    const modules = [installed('1.0.0')];
    const quizzes = demoQuizzes.map((q) => (q.id === 'demo-english' ? { ...q, moduleId: 'org.abbon.demo' } : q));
    const bytes = buildPackage(
      { quizzes, categories: demoCategories, media: new Map(), attempts: [], answers: [], settings: {}, modules },
      { kind: 'backup', solutions: true, appVersion: '0.2.0' },
    );
    const p = await parsePackage(bytes);
    expect(p.problems).toEqual([]);
    expect(p.modules).toEqual(modules);
    expect(p.quizzes.filter((q) => q.moduleId).map((q) => q.id)).toEqual(['demo-english']);
    expect(p.categories.filter((c) => c.moduleId).map((c) => c.id)).toEqual(['cat-lang']);
  });
});
