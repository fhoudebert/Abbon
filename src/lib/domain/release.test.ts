import { describe, expect, it } from 'vitest';
import { compareVersions, downloadFor, isNewer, isValidServer, parseRelease, releaseNotes, releaseUrl } from './release';

const sha = 'a'.repeat(64);
const release = {
  format: 'abbon-release',
  formatVersion: 1,
  version: '0.2.0',
  date: '2026-11-20T10:00:00Z',
  notes: { fr: 'Nouveautés', en: 'What’s new' },
  files: [
    { platform: 'linux', kind: 'deb', name: 'Abbon_0.2.0_amd64.deb', size: 10, sha256: sha },
    { platform: 'linux', kind: 'appimage', name: 'Abbon_0.2.0_amd64.AppImage', size: 20, sha256: sha },
    { platform: 'android', kind: 'apk', name: 'abbon-0.2.0.apk', size: 30, sha256: sha },
    { platform: 'windows', kind: 'msi', name: 'Abbon_0.2.0_x64_fr-FR.msi', size: 40, sha256: sha },
  ],
};

describe('versions', () => {
  it('compare numériquement, suffixe antérieur à la version finale', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBe(1);
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBe(-1);
    expect(compareVersions('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);
    expect(isNewer('0.2.0', '0.1.0')).toBe(true);
    expect(isNewer('0.1.0', '0.1.0')).toBe(false);
  });
});

describe('version.json', () => {
  it('valide et choisit le bon fichier par plateforme', () => {
    const r = parseRelease(release)!;
    expect(downloadFor(r, 'linux')?.kind).toBe('appimage');
    expect(downloadFor(r, 'android')?.name).toBe('abbon-0.2.0.apk');
    expect(downloadFor(r, 'windows')?.kind).toBe('msi');
    expect(downloadFor(r, 'ios')).toBeUndefined();
    expect(releaseNotes(r, 'fr')).toBe('Nouveautés');
    expect(releaseNotes(r, 'de')).toBe('What’s new');
    expect(releaseUrl('https://exemple.fr/abbon/', r.files[2])).toBe('https://exemple.fr/abbon/releases/abbon-0.2.0.apk');
  });

  it('rejette un contenu douteux', () => {
    expect(parseRelease({ ...release, files: [{ ...release.files[0], name: '../../etc/passwd' }] })).toBeNull();
    expect(parseRelease({ ...release, version: 'latest' })).toBeNull();
    expect(parseRelease('<html>')).toBeNull();
  });

  it('n’accepte que HTTPS (HTTP pour localhost)', () => {
    expect(isValidServer('https://qcm.exemple.fr')).toBe(true);
    expect(isValidServer('http://127.0.0.1:8080')).toBe(true);
    expect(isValidServer('http://qcm.exemple.fr')).toBe(false);
    expect(isValidServer('https://qcm.exemple.fr/?a=1')).toBe(false);
    expect(isValidServer('n’importe quoi')).toBe(false);
  });
});
