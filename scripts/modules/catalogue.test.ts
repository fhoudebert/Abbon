import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { dirName, GENERATED, readQcm, writeCatalogue } from './catalogue';

/** Fichier .qcm minimal : un module de deux QCM (3 questions) et une fiche. */
function qcm(title: string) {
  const json = (v: unknown) => strToU8(JSON.stringify(v));
  return zipSync({
    'manifest.json': json({ format: 'abbon-qcm', quizzes: [{ id: 'a', file: 'quizzes/a.json' }, { id: 'b', file: 'quizzes/b.json' }] }),
    'module.json': json({ title: { fr: title }, description: { fr: 'Pour <réviser>' }, version: '1.2.0', level: 'B1', license: 'CC-BY-4.0', sheets: { c: {} } }),
    'quizzes/a.json': json({ title: { fr: 'A' }, questions: [{}, {}] }),
    'quizzes/b.json': json({ title: { fr: 'B' }, questions: [{}] }),
  });
}

describe('catalogue des questionnaires', () => {
  it('lit un fichier .qcm', () => {
    expect(readQcm(qcm('Anglais'), 'x.qcm')).toMatchObject({ title: 'Anglais', version: '1.2.0', quizzes: 2, questions: 3, sheets: 1 });
    expect(() => readQcm(zipSync({ 'a.txt': strToU8('x') }), 'x.qcm')).toThrow(/manifest/);
  });

  it('noms des dossiers', () => {
    expect(dirName('fr')).toBe('Français');
    expect(dirName('technologie')).toBe('Technologie');
    expect(dirName('arts-plastiques')).toBe('Arts plastiques');
  });

  it('une page par dossier, liens relatifs, page écrite à la main préservée', () => {
    const root = mkdtempSync(join(tmpdir(), 'catalogue-'));
    mkdirSync(join(root, 'fr', 'langues'), { recursive: true });
    mkdirSync(join(root, 'fr', 'sciences'), { recursive: true });
    writeFileSync(join(root, 'fr', 'langues', 'Abbon-anglais.qcm'), qcm('Anglais'));
    writeFileSync(join(root, 'fr', 'sciences', 'Abbon-physique.qcm'), qcm('Physique'));
    writeFileSync(join(root, 'fr', 'sciences', 'index.html'), '<p>à la main</p>');
    const r = writeCatalogue(root, 'Questionnaires', '22 novembre 2026');
    expect(r).toMatchObject({ files: 2, questions: 6, written: 3, skipped: [join('fr', 'sciences', 'index.html')], empty: [], stray: [] });
    expect(readFileSync(join(root, 'fr', 'sciences', 'index.html'), 'utf8')).toBe('<p>à la main</p>');

    const top = readFileSync(join(root, 'index.html'), 'utf8');
    expect(top).toContain(GENERATED);
    expect(top).toContain('href="fr/"');
    const fr = readFileSync(join(root, 'fr', 'index.html'), 'utf8');
    expect(fr).toContain('href="langues/"');
    expect(fr).toContain('1 questionnaire, 3 questions');
    expect(fr).toContain('href="sciences/"');
    const langues = readFileSync(join(root, 'fr', 'langues', 'index.html'), 'utf8');
    expect(langues).toContain('href="Abbon-anglais.qcm" download');
    expect(langues).toContain('href="../../">Questionnaires</a>');
    expect(langues).toContain('Pour &lt;réviser&gt;');
    // Nouvelle exécution : les pages produites sont réécrites.
    expect(writeCatalogue(root, 'Questionnaires', 'd').written).toBe(3);
  });

  it('dossier sans .qcm (paquet décompressé par erreur) : ni listé ni indexé, signalé', () => {
    const root = mkdtempSync(join(tmpdir(), 'catalogue-'));
    mkdirSync(join(root, 'fr', 'langues', 'quizzes'), { recursive: true });
    writeFileSync(join(root, 'fr', 'langues', 'Abbon-anglais.qcm'), qcm('Anglais'));
    writeFileSync(join(root, 'fr', 'langues', 'quizzes', 'org-abbon-x_y-01.json'), '{}');
    writeFileSync(join(root, 'fr', 'langues', 'manifest.json'), '{}');
    const r = writeCatalogue(root, 'Questionnaires', 'd');
    expect(r).toMatchObject({ files: 1, written: 3 });
    expect(r.empty).toEqual([join('fr', 'langues', 'quizzes')]);
    expect(r.stray).toEqual([join('fr', 'langues', 'manifest.json'), join('fr', 'langues', 'quizzes', 'org-abbon-x_y-01.json')]);
    expect(existsSync(join(root, 'fr', 'langues', 'quizzes', 'index.html'))).toBe(false);
    expect(readFileSync(join(root, 'fr', 'langues', 'index.html'), 'utf8')).not.toContain('href="quizzes/"');
  });
});
