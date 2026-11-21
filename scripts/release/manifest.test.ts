import { describe, expect, it } from 'vitest';
import { downloadFor, parseRelease } from '../../src/lib/domain/release';
import { buildLatestJson, buildVersionJson, classify, notesFromChangelog, sha256sums } from './manifest';

const h = (c: string) => c.repeat(64);
const artifacts = [
  { name: 'Abbon_0.2.0_amd64.AppImage', size: 3, sha256: h('a'), signature: 'sigA\n' },
  { name: 'Abbon_0.2.0_amd64.deb', size: 2, sha256: h('b'), signature: 'sigB' },
  { name: 'Abbon-0.2.0-1.x86_64.rpm', size: 2, sha256: h('c') },
  { name: 'Abbon_0.2.0_x64-setup.exe', size: 4, sha256: h('d'), signature: 'sigD' },
  { name: 'Abbon_0.2.0_x64_fr-FR.msi', size: 5, sha256: h('e'), signature: 'sigE' },
  { name: 'abbon-0.2.0.apk', size: 6, sha256: h('f') },
];

const CHANGELOG = `# Journal

## 0.2.0 — 2026-11-20

### fr
- Mises à jour automatiques.

### en
- Automatic updates.

## 0.1.0

### fr
- Première version.
`;

describe('manifestes de release', () => {
  it('reconnaît les paquets', () => {
    expect(classify('x.AppImage')).toEqual({ platform: 'linux', kind: 'appimage' });
    expect(classify('x-setup.exe')).toEqual({ platform: 'windows', kind: 'nsis' });
    expect(classify('x.apk')).toEqual({ platform: 'android', kind: 'apk' });
    expect(classify('Abbon_0.2.0_universal.dmg')).toEqual({ platform: 'macos', kind: 'dmg' });
    expect(classify('Abbon_0.2.0_universal.app.tar.gz')).toEqual({ platform: 'macos', kind: 'app' });
    expect(classify('Abbon_0.2.0_universal.app.tar.gz.sig')).toBeNull();
    expect(classify('SHA256SUMS.txt')).toBeNull();
    expect(classify('x.AppImage.sig')).toBeNull();
  });

  it('extrait les notes du CHANGELOG par langue', () => {
    expect(notesFromChangelog(CHANGELOG, '0.2.0')).toEqual({ fr: '- Mises à jour automatiques.', en: '- Automatic updates.' });
    expect(notesFromChangelog(CHANGELOG, '0.1.0')).toEqual({ fr: '- Première version.' });
    expect(notesFromChangelog(CHANGELOG, '9.9.9')).toEqual({});
  });

  it('version.json est accepté par l’application', () => {
    const v = buildVersionJson('0.2.0', '2026-11-20T10:00:00Z', { fr: 'x' }, artifacts);
    const parsed = parseRelease(v);
    expect(parsed?.files.map((f) => f.kind)).toEqual(['appimage', 'deb', 'rpm', 'nsis', 'msi', 'apk']);
  });

  it('latest.json : clés par type d’installation, fichiers signés seulement', () => {
    const l = buildLatestJson('0.2.0', 'd', 'notes', 'https://exemple.fr/abbon/', artifacts);
    expect(Object.keys(l.platforms).sort()).toEqual([
      'linux-x86_64',
      'linux-x86_64-appimage',
      'linux-x86_64-deb',
      'windows-x86_64',
      'windows-x86_64-msi',
      'windows-x86_64-nsis',
    ]);
    expect(l.platforms['linux-x86_64-appimage']).toEqual({
      signature: 'sigA',
      url: 'https://exemple.fr/abbon/releases/Abbon_0.2.0_amd64.AppImage',
    });
    expect(l.platforms['windows-x86_64'].signature).toBe('sigD'); // NSIS par défaut
  });

  it('SHA256SUMS au format sha256sum', () => {
    expect(sha256sums(artifacts.slice(0, 1))).toBe(`${h('a')}  Abbon_0.2.0_amd64.AppImage\n`);
  });
});

describe('macOS', () => {
  const mac = [
    { name: 'Abbon_0.2.0_universal.dmg', size: 1, sha256: h('e') },
    { name: 'Abbon_0.2.0_universal.app.tar.gz', size: 1, sha256: h('f'), signature: 'sigM' },
  ];

  it('latest.json : la même archive universelle pour Apple silicon et Intel', () => {
    const l = buildLatestJson('0.2.0', 'd', 'notes', 'https://exemple.fr', mac);
    expect(Object.keys(l.platforms).sort()).toEqual(['darwin-aarch64', 'darwin-aarch64-app', 'darwin-x86_64', 'darwin-x86_64-app']);
    expect(l.platforms['darwin-aarch64']).toEqual({ signature: 'sigM', url: 'https://exemple.fr/releases/Abbon_0.2.0_universal.app.tar.gz' });
    expect(l.platforms['darwin-x86_64']).toEqual(l.platforms['darwin-aarch64']);
  });

  it('latest.json pour une release GitHub : adresse donnée par fichier', () => {
    const gh = 'https://github.com/fhoudebert/Abbon/releases/download/v0.2.0';
    const l = buildLatestJson('0.2.0', 'd', 'notes', (n) => `${gh}/${encodeURIComponent(n)}`, artifacts);
    expect(l.platforms['linux-x86_64'].url).toBe(`${gh}/Abbon_0.2.0_amd64.AppImage`);
  });

  it('version.json : l’application propose le .dmg à télécharger', () => {
    const v = parseRelease(buildVersionJson('0.2.0', 'd', {}, [...mac].reverse()))!;
    expect(v.files.map((f) => [f.platform, f.kind])).toEqual([['macos', 'app'], ['macos', 'dmg']]);
    expect(downloadFor(v, 'macos')?.name).toBe('Abbon_0.2.0_universal.dmg');
  });
});
