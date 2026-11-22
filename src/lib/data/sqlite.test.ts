/**
 * Teste le vrai SQL du dépôt (migrations + requêtes) sur le SQLite intégré à Node,
 * sans lancer Tauri.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { startAttempt } from '$lib/domain/session';
import { demoCategories, demoQuizzes, demoScience, installedDemoQuizzes, seedDemo, tidyDemo } from './seed';
import { SqliteRepository } from './sqlite';
import { nodeDriver } from './sqlite.testing';

describe('SqliteRepository', () => {
  let repo: SqliteRepository;
  beforeEach(() => {
    repo = new SqliteRepository(nodeDriver());
  });

  it('enregistre puis relit un QCM complet à l’identique', async () => {
    await seedDemo(repo);
    const original = demoQuizzes[0];
    const read = await repo.getQuiz(original.id);
    expect(read).toEqual(original);
  });

  it('liste les QCM avec le nombre de questions', async () => {
    await seedDemo(repo);
    const list = await repo.listQuizzes();
    expect(list).toHaveLength(installedDemoQuizzes.length);
    // « Anglais – verbes irréguliers » : aperçu dans un navigateur seulement.
    expect(list.map((q) => q.id)).not.toContain('demo-english');
    expect(list.find((q) => q.id === 'demo-science')?.title.fr).toBe('Formules et figures (démonstration)');
    const network = list.find((q) => q.id === 'demo-network');
    expect(network?.questionCount).toBe(2);
  });

  it('remplace les questions lors d’une nouvelle sauvegarde', async () => {
    await seedDemo(repo);
    const quiz = (await repo.getQuiz('demo-culture'))!;
    quiz.questions = quiz.questions.slice(0, 1);
    quiz.version = 2;
    await repo.saveQuiz(quiz);
    const read = (await repo.getQuiz('demo-culture'))!;
    expect(read.questions).toHaveLength(1);
    expect(read.version).toBe(2);
  });

  it('supprime en cascade questions, choix et tentatives', async () => {
    await seedDemo(repo);
    await repo.deleteQuiz('demo-network');
    expect(await repo.getQuiz('demo-network')).toBeNull();
    expect(await repo.listAttempts('demo-network')).toEqual([]);
  });

  it('enregistre et met à jour une tentative', async () => {
    await seedDemo(repo);
    const [a] = await repo.listAttempts('demo-network');
    expect(a.status).toBe('finished');
    await repo.saveAttempt({ ...a, status: 'abandoned', score: 2, maxScore: 2 });
    const [b] = await repo.listAttempts('demo-network');
    expect(b).toMatchObject({ status: 'abandoned', score: 2, maxScore: 2 });
  });

  it('n’installe la démonstration qu’une fois', async () => {
    expect(await seedDemo(repo)).toBe(true);
    expect(await seedDemo(repo)).toBe(false);
  });

  it('lit et écrit les paramètres', async () => {
    expect(await repo.getSetting('lang')).toBeNull();
    await repo.setSetting('lang', 'en');
    await repo.setSetting('lang', 'fr');
    expect(await repo.getSetting('lang')).toBe('fr');
    await repo.deleteSetting('lang');
    expect(await repo.getSetting('lang')).toBeNull();
  });

  it('garde l’instantané du QCM et ne l’écrase pas lors des mises à jour', async () => {
    await seedDemo(repo);
    const quiz = (await repo.getQuiz('demo-culture'))!;
    const attempt = startAttempt(quiz, 'exam');
    await repo.saveAttempt(attempt);
    // Mise à jour sans instantané (comme le fait l'écran de passage)
    await repo.saveAttempt({ ...attempt, quizSnapshot: undefined, currentIndex: 2, elapsedSec: 42 });
    const read = (await repo.getAttempt(attempt.id))!;
    expect(read.quizSnapshot).toEqual(quiz);
    expect(read).toMatchObject({ currentIndex: 2, elapsedSec: 42 });
    const [listed] = await repo.listAttempts('demo-culture');
    expect(listed.quizSnapshot).toBeUndefined();
  });

  it('enregistre et met à jour les réponses', async () => {
    await seedDemo(repo);
    const quiz = (await repo.getQuiz('demo-culture'))!;
    const attempt = startAttempt(quiz, 'training');
    await repo.saveAttempt(attempt);
    const qid = quiz.questions[1].id;
    await repo.saveAnswer(attempt.id, { questionId: qid, selected: ['x'], correct: null, points: null, timeSec: 3, flagged: true });
    await repo.saveAnswer(attempt.id, { questionId: qid, selected: ['x', 'y'], correct: false, points: 0, timeSec: 9, flagged: false });
    expect(await repo.listAnswers(attempt.id)).toEqual([
      { questionId: qid, selected: ['x', 'y'], correct: false, points: 0, timeSec: 9, flagged: false },
    ]);
    await repo.deleteQuiz('demo-culture');
    expect(await repo.listAnswers(attempt.id)).toEqual([]);
  });

  it('sauvegarde un QCM en tout ou rien', async () => {
    await seedDemo(repo);
    const quiz = (await repo.getQuiz('demo-culture'))!;
    const broken = structuredClone(quiz);
    broken.title = { fr: 'Modifié' };
    // Deux questions avec le même identifiant : la seconde insertion échoue.
    broken.questions[1].id = broken.questions[0].id;
    await expect(repo.saveQuiz(broken)).rejects.toThrow();
    expect(await repo.getQuiz('demo-culture')).toEqual(quiz);
  });

  it('enregistre un contenu riche et le relit à l’identique', async () => {
    await seedDemo(repo);
    const quiz = (await repo.getQuiz('demo-network'))!;
    quiz.questions[0].prompt.fr = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Code ', marks: [{ type: 'bold' }] }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'curl -I' }] },
        { type: 'image', attrs: { hash: 'abc', alt: 'schéma' } },
      ],
    };
    await repo.saveQuiz(quiz);
    expect((await repo.getQuiz('demo-network'))!.questions[0].prompt.fr).toEqual(quiz.questions[0].prompt.fr);
  });

  it('enregistre les images une seule fois par empreinte', async () => {
    const m = { hash: 'h1', mime: 'image/png', width: 2, height: 1, sizeBytes: 3, data: 'AAEC' };
    await repo.saveMedia(m);
    await repo.saveMedia({ ...m, data: 'autre' });
    expect(await repo.getMedia('h1')).toEqual(m);
    expect(await repo.getMedia('absent')).toBeNull();
  });

  it('supprimer une catégorie laisse ses QCM sans catégorie', async () => {
    await seedDemo(repo);
    await repo.deleteCategory('cat-it');
    expect((await repo.getQuiz('demo-network'))!.categoryId).toBeNull();
    expect((await repo.listCategories()).map((c) => c.id)).not.toContain('cat-it');
  });

  it('sauvegarde complète puis restauration à l’identique (le PIN de l’appareil est conservé)', async () => {
    await seedDemo(repo);
    const quiz = (await repo.getQuiz('demo-culture'))!;
    const attempt = startAttempt(quiz, 'exam');
    await repo.saveAttempt(attempt);
    await repo.saveAnswer(attempt.id, { questionId: quiz.questions[0].id, selected: ['x'], correct: true, points: 1, timeSec: 4, flagged: true });
    await repo.saveMedia({ hash: 'h1', mime: 'image/png', width: 1, height: 1, sizeBytes: 3, data: 'AAEC' });
    await repo.setSetting('admin_pin', 'pin-a');
    const data = {
      categories: await repo.listCategories(),
      quizzes: await Promise.all((await repo.listQuizzes()).map(async (q) => (await repo.getQuiz(q.id))!)),
      ...(await repo.exportHistory()),
      settings: await repo.listSettings(),
      media: [(await repo.getMedia('h1'))!],
    };
    expect(data.attempts.find((a) => a.id === attempt.id)?.quizSnapshot).toEqual(quiz);

    // Un autre appareil : contenu différent, autre PIN
    const other = new SqliteRepository(nodeDriver());
    await other.saveCategory({ id: 'x', parentId: null, name: { fr: 'X' }, position: 0 });
    await other.setSetting('admin_pin', 'pin-b');
    await other.replaceAll(data);

    expect(await other.listCategories()).toEqual(data.categories);
    expect(await other.getQuiz('demo-culture')).toEqual(quiz);
    const h = await other.exportHistory();
    expect(h.attempts).toEqual(data.attempts);
    expect(h.answers).toEqual(data.answers);
    expect(await other.getMedia('h1')).toEqual(data.media[0]);
    expect(await other.getSetting('admin_pin')).toBe('pin-b');
    expect(await other.getSetting('lang')).toBe(data.settings.lang ?? null);
  });

  it('restaure les sous-catégories quel que soit leur ordre', async () => {
    await repo.replaceAll({
      categories: [
        { id: 'enfant', parentId: 'parent', name: { fr: 'E' }, position: 1 },
        { id: 'parent', parentId: null, name: { fr: 'P' }, position: 0 },
      ],
      quizzes: [], attempts: [], answers: [], settings: {}, media: [],
    });
    expect((await repo.listCategories()).map((c) => `${c.id}<${c.parentId}`)).toEqual(['parent<null', 'enfant<parent']);
  });

  it('supprime les images inutilisées', async () => {
    for (const hash of ['a', 'b', 'c']) await repo.saveMedia({ hash, mime: 'image/png', sizeBytes: 1, data: 'AA==' });
    expect(await repo.deleteUnusedMedia(['b'])).toBe(2);
    expect(await repo.listMediaHashes()).toEqual(['b']);
  });

  it('installation précédente : QCM de démonstration retirés ou renommés s’ils sont intacts, une seule fois', async () => {
    // Données d'une version précédente : « Anglais – verbes irréguliers » et l'ancien titre.
    const english = demoQuizzes.find((q) => q.id === 'demo-english')!;
    const oldScience = { ...demoScience, title: { fr: 'Formules et figures', en: 'Formulas and figures' } };
    for (const c of demoCategories) await repo.saveCategory(c);
    await repo.saveQuiz(english);
    await repo.saveQuiz(oldScience);
    await tidyDemo(repo);
    expect(await repo.getQuiz('demo-english')).toBeNull();
    expect((await repo.getQuiz('demo-science'))?.title).toEqual(demoScience.title);
    // Déjà fait : un QCM recréé ensuite n'est plus touché.
    await repo.saveQuiz(english);
    await tidyDemo(repo);
    expect(await repo.getQuiz('demo-english')).not.toBeNull();
  });

  it('installation précédente : un QCM de démonstration modifié est gardé', async () => {
    const english = { ...demoQuizzes.find((q) => q.id === 'demo-english')!, version: 2 };
    for (const c of demoCategories) await repo.saveCategory(c);
    await repo.saveQuiz(english);
    await tidyDemo(repo);
    expect(await repo.getQuiz('demo-english')).not.toBeNull();
  });
});
