import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { demoCategories, demoModule, demoQuizzes } from '$lib/data/seed';
import { progressKey, readProgress, SiteRepository } from '$lib/data/site';
import type { InstalledModule } from '$lib/domain/types';
import { siteScript } from '$lib/site';
import { siteContent, siteDataOf, siteIdOf, zipSite } from './siteExport';

const installed: InstalledModule[] = [{ manifest: demoModule, installedAt: 'x', updatedAt: 'x' }];
const inModule = demoQuizzes.filter((q) => demoModule.quizzes.includes(q.id));
const opts = { title: 'Mon site', examOnly: false, solutionsAtEnd: true };

/** Stockage local factice. */
function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('export en site web', () => {
  it('ne garde que les QCM choisis, leurs catégories et les fiches de leur module', () => {
    const one = inModule[0];
    const c = siteContent([{ ...one, status: 'draft' }], demoCategories, installed, opts);
    expect(c.quizzes.map((q) => q.id)).toEqual([one.id]);
    expect(c.quizzes[0].status).toBe('published');
    expect(c.categories.map((x) => x.id)).toContain(one.categoryId);
    expect(c.modules).toHaveLength(1);
    expect(c.modules[0].manifest.quizzes).toEqual([one.id]);
    for (const id of Object.keys(c.modules[0].manifest.sheets ?? {})) expect(c.categories.map((x) => x.id)).toContain(id);
    // QCM hors module : pas de module joint.
    const other = demoQuizzes.find((q) => !demoModule.quizzes.includes(q.id))!;
    expect(siteContent([other], demoCategories, installed, opts).modules).toEqual([]);
  });

  it('mode examen : corrigé à la fin, ou jamais', () => {
    const at = siteContent(inModule, demoCategories, installed, { examOnly: true, solutionsAtEnd: true });
    const never = siteContent(inModule, demoCategories, installed, { examOnly: true, solutionsAtEnd: false });
    expect(at.quizzes.every((q) => q.solutionVisibility === 'after_submit')).toBe(true);
    expect(never.quizzes.every((q) => q.solutionVisibility === 'never')).toBe(true);
  });

  it('identifiant stable, indépendant de l’ordre des QCM', async () => {
    expect(await siteIdOf('A', ['x', 'y'])).toBe(await siteIdOf('A', ['y', 'x']));
    expect(await siteIdOf('A', ['x'])).not.toBe(await siteIdOf('B', ['x']));
  });

  it('donnees.js ne peut pas fermer la balise script', () => {
    const js = siteScript({ format: 'abbon-site', version: 1, id: 'i', title: '</script><b>', examOnly: false, package: '' });
    expect(js).not.toContain('</script>');
    expect(js.startsWith('window.ABBON_SITE = ')).toBe(true);
  });

  it('le site relit ses contenus, et la progression survit à un rechargement', async () => {
    const content = siteContent(inModule, demoCategories, installed, opts);
    const data = await siteDataOf(content, new Map(), opts, '0.2.0');
    const storage = memoryStorage();

    const repo = new SiteRepository(data.id, storage);
    await repo.load(data);
    expect((await repo.listQuizzes()).map((q) => q.id).sort()).toEqual(inModule.map((q) => q.id).sort());
    expect((await repo.listModules())[0].manifest.id).toBe(demoModule.id);

    const quiz = (await repo.getQuiz(inModule[0].id))!;
    await repo.saveAttempt({
      id: 'a1', quizId: quiz.id, quizVersion: 1, mode: 'exam', status: 'finished', startedAt: 's', finishedAt: 'f',
      elapsedSec: 3, currentIndex: 0, questionOrder: [quiz.questions[0].id], score: 1, maxScore: 1, quizSnapshot: quiz,
    });
    await repo.saveAnswer('a1', { questionId: quiz.questions[0].id, selected: [], timeSec: 3, flagged: false, correct: true, points: 1 });
    await repo.setSetting('lang', 'en');
    await repo.flush();
    const saved = readProgress(storage, data.id);
    expect(saved.attempts).toHaveLength(1);
    expect(saved.attempts[0].quizSnapshot).toBeUndefined(); // copie du QCM non stockée
    expect(storage.m.has(progressKey(data.id))).toBe(true);

    const again = new SiteRepository(data.id, storage);
    await again.load(data);
    const a = await again.getAttempt('a1');
    expect(a?.quizSnapshot?.id).toBe(quiz.id); // reconstituée au chargement
    expect(await again.listAnswers('a1')).toHaveLength(1);
    expect(await again.getSetting('lang')).toBe('en');
  });

  it('progression illisible : on repart de zéro', () => {
    const storage = { getItem: () => '{pas du json' };
    expect(readProgress(storage, 'x')).toEqual({ attempts: [], answers: [], cards: [], rewards: [], settings: {} });
  });

  it('archive : lecteur, données et mode d’emploi dans un dossier', async () => {
    const content = siteContent(inModule, demoCategories, installed, opts);
    const data = await siteDataOf(content, new Map(), opts, '0.2.0');
    const zip = zipSite('Mon-site', { 'index.html': new Uint8Array([1]), 'files.json': new Uint8Array([2]), '_app/a.js': new Uint8Array([3]) }, data);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(['Mon-site/LISEZMOI.txt', 'Mon-site/_app/a.js', 'Mon-site/donnees.js', 'Mon-site/index.html']);
    expect(strFromU8(files['Mon-site/donnees.js'])).toContain('"format":"abbon-site"');
  });
});
