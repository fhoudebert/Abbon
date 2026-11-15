/**
 * Teste le vrai SQL du dépôt (migrations + requêtes) sur le SQLite intégré à Node,
 * sans lancer Tauri.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { startAttempt } from '$lib/domain/session';
import { demoQuizzes, seedDemo } from './seed';
import { SqliteRepository, type SqlDriver } from './sqlite';

const migrationsDir = new URL('../../../src-tauri/migrations/', import.meta.url);
const MIGRATIONS = ['0001_init.sql', '0002_attempt_snapshot.sql', '0003_media.sql'];

/** Convertit `$1` (syntaxe du plugin Tauri / sqlx) en `?1` (SQLite natif). */
const toNative = (sql: string) => sql.replace(/\$(\d+)/g, '?$1');

function nodeDriver(): SqlDriver {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of MIGRATIONS) db.exec(readFileSync(new URL(file, migrationsDir), 'utf8'));
  return {
    async execute(sql, params = []) {
      db.prepare(toNative(sql)).run(...(params as never[]));
    },
    async select(sql, params = []) {
      return db.prepare(toNative(sql)).all(...(params as never[])) as never[];
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        for (const st of statements) db.prepare(toNative(st.sql)).run(...(st.params as never[]));
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

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
    expect(list).toHaveLength(demoQuizzes.length);
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
    const [a] = await repo.listAttempts('demo-english');
    expect(a.status).toBe('in_progress');
    await repo.saveAttempt({ ...a, status: 'finished', finishedAt: new Date().toISOString(), score: 1, maxScore: 1 });
    const [b] = await repo.listAttempts('demo-english');
    expect(b).toMatchObject({ status: 'finished', score: 1, maxScore: 1 });
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
});
