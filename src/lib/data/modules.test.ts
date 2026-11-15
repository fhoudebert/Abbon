/**
 * Modules : installation, mise à jour, désinstallation — mêmes attentes pour SQLite et pour la mémoire.
 */
import { describe, expect, it } from 'vitest';
import { startAttempt } from '$lib/domain/session';
import type { Category, ModuleManifest, Quiz } from '$lib/domain/types';
import { planModule } from '$lib/interchange/module';
import { MemoryRepository } from './memory';
import type { Repository } from './repository';
import { demoQuizzes } from './seed';
import { SqliteRepository } from './sqlite';
import { nodeDriver } from './sqlite.testing';

const ID = 'org.abbon.test';
const quiz = (id: string, categoryId: string | null = 'm_cat'): Quiz => ({
  ...structuredClone(demoQuizzes[0]),
  id,
  categoryId,
  questions: structuredClone(demoQuizzes[0].questions).map((q) => ({
    ...q,
    id: `${id}_${q.id}`,
    choices: q.choices.map((c) => ({ ...c, id: `${id}_${c.id}` })),
  })),
});
const category: Category = { id: 'm_cat', parentId: null, name: { fr: 'Module' }, position: 5 };
const manifest = (version: string, quizzes: string[]): ModuleManifest => ({
  format: 'abbon-module',
  formatVersion: 1,
  id: ID,
  version,
  title: { fr: 'Essai' },
  license: 'CC-BY-NC-SA-4.0',
  authors: ['Abbon'],
  categories: ['m_cat'],
  quizzes,
  sheets: { m_cat: { fr: 'Fiche' } },
});

async function install(repo: Repository, version: string, ids: string[]) {
  const plan = planModule(
    manifest(version, ids),
    { quizzes: ids.map((i) => quiz(i)), categories: [category] },
    { modules: await repo.listModules(), quizzes: await repo.listQuizzes(), categories: await repo.listCategories() },
  );
  await repo.installModule(plan);
  return plan;
}

async function attemptOn(repo: Repository, quizId: string) {
  const a = startAttempt((await repo.getQuiz(quizId))!, 'training');
  await repo.saveAttempt(a);
  await repo.saveAnswer(a.id, { questionId: a.questionOrder[0], selected: ['x'], correct: false, points: 0, timeSec: 3, flagged: false });
  return a.id;
}

describe.each<[string, () => Repository]>([
  ['SQLite', () => new SqliteRepository(nodeDriver())],
  ['mémoire', () => new MemoryRepository()],
])('modules (%s)', (_name, make) => {
  it('installe un module : QCM et catégories marqués, fiche conservée', async () => {
    const repo = make();
    const plan = await install(repo, '1.0.0', ['m_a', 'm_b']);
    expect(plan.status).toBe('new');
    const [m] = await repo.listModules();
    expect(m.manifest.version).toBe('1.0.0');
    expect(m.manifest.sheets?.m_cat.fr).toBe('Fiche');
    expect((await repo.listQuizzes()).map((q) => [q.id, q.moduleId]).sort()).toEqual([['m_a', ID], ['m_b', ID]]);
    expect((await repo.getQuiz('m_a'))?.moduleId).toBe(ID);
    expect((await repo.listCategories()).find((c) => c.id === 'm_cat')?.moduleId).toBe(ID);
  });

  it('laisse le contenu personnel sans marque', async () => {
    const repo = make();
    await repo.saveQuiz(quiz('perso', null));
    await install(repo, '1.0.0', ['m_a']);
    const mine = await repo.getQuiz('perso');
    expect(mine && 'moduleId' in mine && mine.moduleId).toBeFalsy();
  });

  it('met à jour : QCM retirés supprimés, tentatives des autres conservées, date d’installation gardée', async () => {
    const repo = make();
    await install(repo, '1.0.0', ['m_a', 'm_b']);
    const kept = await attemptOn(repo, 'm_a');
    const gone = await attemptOn(repo, 'm_b');
    const before = (await repo.listModules())[0].installedAt;

    const plan = await install(repo, '1.1.0', ['m_a', 'm_c']);
    expect(plan.status).toBe('update');
    expect(plan.removedQuizIds).toEqual(['m_b']);
    expect((await repo.listQuizzes()).map((q) => q.id).sort()).toEqual(['m_a', 'm_c']);
    expect(await repo.getAttempt(kept)).not.toBeNull();
    expect((await repo.listAnswers(kept))).toHaveLength(1);
    expect(await repo.getAttempt(gone)).toBeNull();
    const [m] = await repo.listModules();
    expect(m.manifest.version).toBe('1.1.0');
    expect(m.installedAt).toBe(before);

    // Le QCM revient dans une version suivante : son historique aussi.
    await install(repo, '1.2.0', ['m_a', 'm_b', 'm_c']);
    expect((await repo.getAttempt(gone))?.quizSnapshot?.id).toBe('m_b');
    expect(await repo.listAnswers(gone)).toHaveLength(1);
  });

  it('désinstalle d’un bloc en gardant l’historique, qui revient à la réinstallation', async () => {
    const repo = make();
    await repo.saveQuiz(quiz('perso', null));
    await install(repo, '1.0.0', ['m_a', 'm_b']);
    const a = await attemptOn(repo, 'm_a');
    const mine = await attemptOn(repo, 'perso');

    await repo.uninstallModule(ID, true);
    expect(await repo.listModules()).toEqual([]);
    expect((await repo.listQuizzes()).map((q) => q.id)).toEqual(['perso']);
    expect(await repo.listCategories()).toEqual([]);
    expect(await repo.getAttempt(a)).toBeNull();
    expect(await repo.getAttempt(mine)).not.toBeNull();

    await install(repo, '1.0.0', ['m_a', 'm_b']);
    const back = await repo.getAttempt(a);
    expect(back?.quizId).toBe('m_a');
    expect(back?.quizSnapshot?.id).toBe('m_a');
    expect(await repo.listAnswers(a)).toHaveLength(1);
    expect((await repo.listAttempts('m_a')).map((x) => x.id)).toEqual([a]);
  });

  it('désinstalle en supprimant l’historique', async () => {
    const repo = make();
    await install(repo, '1.0.0', ['m_a']);
    const a = await attemptOn(repo, 'm_a');
    await repo.uninstallModule(ID, true); // mis de côté…
    await install(repo, '1.0.0', ['m_a']);
    await repo.uninstallModule(ID, false); // … puis supprimé pour de bon
    await install(repo, '1.0.0', ['m_a']);
    expect(await repo.getAttempt(a)).toBeNull();
    expect(await repo.listAttempts()).toEqual([]);
  });

  it('garde une catégorie du module encore utilisée par un QCM personnel', async () => {
    const repo = make();
    await install(repo, '1.0.0', ['m_a']);
    await repo.saveQuiz(quiz('perso', 'm_cat'));
    await repo.uninstallModule(ID, false);
    const cats = await repo.listCategories();
    expect(cats.map((c) => c.id)).toEqual(['m_cat']);
    expect(cats[0].moduleId ?? null).toBeNull();
    expect((await repo.getQuiz('perso'))?.categoryId).toBe('m_cat');
  });

  it('restaure les modules d’une sauvegarde complète', async () => {
    const repo = make();
    await install(repo, '1.0.0', ['m_a']);
    const modules = await repo.listModules();
    const quizzes = [(await repo.getQuiz('m_a'))!];
    const target = make();
    await install(target, '0.9.0', ['m_z']);
    await target.replaceAll({ categories: await repo.listCategories(), quizzes, attempts: [], answers: [], settings: {}, media: [], modules });
    expect((await target.listModules()).map((m) => m.manifest.version)).toEqual(['1.0.0']);
    expect((await target.listQuizzes()).map((q) => [q.id, q.moduleId])).toEqual([['m_a', ID]]);
    expect((await target.listCategories())[0].moduleId).toBe(ID);
  });
});
