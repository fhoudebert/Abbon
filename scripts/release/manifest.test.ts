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
    expect(classify('x.AppImage')).toEqual({ platform: 'linux', kind: 'appimage', arch: 'x86_64' });
    expect(classify('x-setup.exe')).toEqual({ platform: 'windows', kind: 'nsis', arch: 'x86_64' });
    expect(classify('x.apk')).toEqual({ platform: 'android', kind: 'apk', arch: 'universal' });
    expect(classify('Abbon_0.2.0_universal.dmg')).toEqual({ platform: 'macos', kind: 'dmg', arch: 'universal' });
    expect(classify('Abbon_0.2.0_universal.app.tar.gz')).toEqual({ platform: 'macos', kind: 'app', arch: 'universal' });
    expect(classify('Abbon_0.2.0_universal.app.tar.gz.sig')).toBeNull();
    expect(classify('SHA256SUMS.txt')).toBeNull();
    expect(classify('x.AppImage.sig')).toBeNull();
  });

  it('reconnaît le processeur dans les noms de Tauri', () => {
    const arch = (n: string) => classify(n)?.arch;
    expect(['Abbon-0.5.0-x86_64.AppImage', 'Abbon_0.5.0_amd64.deb', 'Abbon-0.5.0-1.x86_64.rpm', 'Abbon_0.5.0_x64-setup.exe', 'Abbon_0.5.0_x64_en-US.msi'].map(arch)).toEqual(Array(5).fill('x86_64'));
    expect(['Abbon-0.5.0-aarch64.AppImage', 'Abbon_0.5.0_arm64.deb', 'Abbon-0.5.0-1.aarch64.rpm', 'Abbon_0.5.0_arm64-setup.exe'].map(arch)).toEqual(Array(4).fill('aarch64'));
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

describe('ARM64 (Linux et Windows)', () => {
  const both = [
    { name: 'Abbon-0.5.0-aarch64.AppImage', size: 1, sha256: h('1'), signature: 'sigLA' },
    { name: 'Abbon-0.5.0-x86_64.AppImage', size: 1, sha256: h('2'), signature: 'sigLX' },
    { name: 'Abbon_0.5.0_arm64.deb', size: 1, sha256: h('3'), signature: 'sigDA' },
    { name: 'Abbon_0.5.0_amd64.deb', size: 1, sha256: h('4'), signature: 'sigDX' },
    { name: 'Abbon_0.5.0_arm64-setup.exe', size: 1, sha256: h('5'), signature: 'sigWA' },
    { name: 'Abbon_0.5.0_x64-setup.exe', size: 1, sha256: h('6'), signature: 'sigWX' },
    { name: 'Abbon_0.5.0_x64_en-US.msi', size: 1, sha256: h('7'), signature: 'sigMX' },
  ];

  it('latest.json : une entrée par processeur, valeurs par défaut pour chacun', () => {
    const p = buildLatestJson('0.5.0', 'd', 'n', 'https://exemple.fr', both).platforms;
    expect(p['linux-aarch64'].signature).toBe('sigLA');
    expect(p['linux-x86_64'].signature).toBe('sigLX');
    expect(p['linux-aarch64-deb'].signature).toBe('sigDA');
    expect(p['windows-aarch64'].signature).toBe('sigWA');
    expect(p['windows-aarch64-nsis'].signature).toBe('sigWA');
    expect(p['windows-aarch64-msi']).toBeUndefined();
    expect(p['windows-x86_64'].signature).toBe('sigWX');
  });

  it('version.json : x86_64 en premier (anciennes versions), le bon fichier pour chaque processeur', () => {
    const v = parseRelease(buildVersionJson('0.5.0', 'd', {}, both))!;
    // Une version antérieure (sans processeur) prend le premier fichier de son type : celui pour x86_64.
    expect(v.files.find((f) => f.kind === 'appimage')?.name).toBe('Abbon-0.5.0-x86_64.AppImage');
    expect(v.files.find((f) => f.kind === 'nsis')?.name).toBe('Abbon_0.5.0_x64-setup.exe');
    expect(downloadFor(v, 'linux', 'aarch64')?.name).toBe('Abbon-0.5.0-aarch64.AppImage');
    expect(downloadFor(v, 'linux', 'x86_64')?.name).toBe('Abbon-0.5.0-x86_64.AppImage');
    expect(downloadFor(v, 'windows', 'aarch64')?.name).toBe('Abbon_0.5.0_arm64-setup.exe');
    expect(downloadFor(v, 'windows', 'x86_64')?.name).toBe('Abbon_0.5.0_x64-setup.exe');
  });

  it('jamais le fichier d’un autre processeur ; anciennes releases : x86_64', () => {
    const old = parseRelease(buildVersionJson('0.4.0', 'd', {}, artifacts))!;
    for (const f of old.files) delete (f as { arch?: string }).arch;
    expect(downloadFor(old, 'linux', 'aarch64')).toBeUndefined();
    expect(downloadFor(old, 'linux', 'x86_64')?.kind).toBe('appimage');
    expect(downloadFor(old, 'android', 'aarch64')?.kind).toBe('apk');
  });
});
