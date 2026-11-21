import { strToU8, unzipSync, zipSync, strFromU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { demoCategories, demoQuizzes } from '$lib/data/seed';
import type { Quiz } from '$lib/domain/types';
import { jsonSchemas } from './format';
import { buildPackage, categoriesFor, PackageError, parsePackage, sha256Hex, sniffMime, type MediaFile } from './qcmPackage';

const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
);

async function quizWithImage(): Promise<{ quiz: Quiz; media: Map<string, MediaFile> }> {
  const hash = await sha256Hex(PNG);
  const quiz = structuredClone(demoQuizzes[1]);
  quiz.questions[0].prompt.fr = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Schéma' }] },
      { type: 'image', attrs: { hash, alt: 'réseau' } },
    ],
  };
  return { quiz, media: new Map([[hash, { mime: 'image/png', bytes: PNG }]]) };
}

const rezip = (bytes: Uint8Array, patch: (files: Record<string, Uint8Array>) => void) => {
  const files = unzipSync(bytes);
  patch(files);
  return zipSync(files);
};

describe('archive .qcm', () => {
  it('aller-retour : QCM, catégories et images à l’identique', async () => {
    const { quiz, media } = await quizWithImage();
    const bytes = buildPackage(
      { quizzes: [quiz, demoQuizzes[0]], categories: demoCategories, media },
      { kind: 'content', solutions: true, appVersion: '0.1.0' },
    );
    const p = await parsePackage(bytes);
    expect(p.problems).toEqual([]);
    expect(p.quizzes).toEqual([quiz, demoQuizzes[0]]);
    // seulement les catégories utilisées
    expect(p.categories.map((c) => c.id).sort()).toEqual(['cat-culture', 'cat-it']);
    expect([...p.media.keys()]).toEqual([...media.keys()]);
    expect(p.manifest).toMatchObject({ format: 'abbon-qcm', formatVersion: 1, kind: 'content', solutions: true });
  });

  it('sans corrigé : pas de bonnes réponses ni d’explications, importé en brouillon', async () => {
    const bytes = buildPackage(
      { quizzes: [demoQuizzes[0]], categories: demoCategories, media: new Map() },
      { kind: 'content', solutions: false, appVersion: '0.1.0' },
    );
    const raw = strFromU8(unzipSync(bytes)['quizzes/demo-culture.json']);
    expect(raw).not.toContain('"correct"');
    expect(raw).not.toContain('Canberra a été choisie');
    const p = await parsePackage(bytes);
    expect(p.quizzes[0].status).toBe('draft');
    expect(p.quizzes[0].questions.flatMap((q) => q.choices).every((c) => c.correct === false)).toBe(true);
    expect(p.problems).toEqual([{ code: 'no_solutions', ref: 'demo-culture' }]);
  });

  it('rejette ce qui n’est pas une archive, ou sans manifeste', async () => {
    await expect(parsePackage(strToU8('bonjour'))).rejects.toMatchObject({ code: 'not_zip' });
    await expect(parsePackage(zipSync({ 'a.txt': strToU8('x') }))).rejects.toMatchObject({ code: 'no_manifest' });
    await expect(parsePackage(zipSync({ 'manifest.json': strToU8('{"format":"autre"}') }))).rejects.toBeInstanceOf(
      PackageError,
    );
  });

  it('refuse une version de format plus récente', async () => {
    const bytes = buildPackage({ quizzes: [], categories: [], media: new Map() }, { kind: 'content', solutions: true, appVersion: '1' });
    const newer = rezip(bytes, (f) => {
      const m = JSON.parse(strFromU8(f['manifest.json']));
      f['manifest.json'] = strToU8(JSON.stringify({ ...m, formatVersion: 99 }));
    });
    await expect(parsePackage(newer)).rejects.toMatchObject({ code: 'unsupported_version' });
  });

  it('écarte un QCM invalide et une image falsifiée, garde le reste', async () => {
    const { quiz, media } = await quizWithImage();
    const bytes = buildPackage(
      { quizzes: [quiz, demoQuizzes[0]], categories: demoCategories, media },
      { kind: 'content', solutions: true, appVersion: '1' },
    );
    const [hash] = media.keys();
    const tampered = rezip(bytes, (f) => {
      f['quizzes/demo-culture.json'] = strToU8('{"id":"demo-culture","questions":"oups"}');
      f[`media/${hash}.png`] = strToU8('pas une image');
    });
    const p = await parsePackage(tampered);
    expect(p.quizzes.map((q) => q.id)).toEqual(['demo-network']);
    expect(p.media.size).toBe(0);
    expect(p.problems.map((x) => x.code).sort()).toEqual(['media_invalid', 'media_missing', 'quiz_invalid']);
  });

  it('ignore les chemins dangereux et les JSON trop imbriqués', async () => {
    const bytes = buildPackage({ quizzes: [demoQuizzes[0]], categories: [], media: new Map() }, { kind: 'content', solutions: true, appVersion: '1' });
    let deep: unknown = 'x';
    for (let i = 0; i < 200; i++) deep = { type: 'doc', content: [deep] };
    const evil = rezip(bytes, (f) => {
      f['../evil.json'] = strToU8('{}');
      const q = JSON.parse(strFromU8(f['quizzes/demo-culture.json']));
      q.questions[0].prompt.fr = deep;
      f['quizzes/demo-culture.json'] = strToU8(JSON.stringify(q));
    });
    const p = await parsePackage(evil);
    expect(p.quizzes).toEqual([]);
    expect(p.problems[0]).toMatchObject({ code: 'quiz_invalid', ref: 'demo-culture' });
  });

  it('reconnaît les images par leur signature', () => {
    expect(sniffMime(PNG)).toBe('image/png');
    expect(sniffMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMime(strToU8('<svg>'))).toBeNull();
  });

  it('inclut les catégories parentes', () => {
    const cats = [
      { id: 'a', parentId: null, name: { fr: 'A' }, position: 0 },
      { id: 'b', parentId: 'a', name: { fr: 'B' }, position: 1 },
      { id: 'c', parentId: null, name: { fr: 'C' }, position: 2 },
    ];
    expect(categoriesFor([{ ...demoQuizzes[0], categoryId: 'b' }], cats).map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('produit des JSON Schema', () => {
    const s = jsonSchemas();
    expect(s.quiz).toMatchObject({ type: 'object' });
    expect(JSON.stringify(s.manifest)).toContain('abbon-qcm');
  });
});
