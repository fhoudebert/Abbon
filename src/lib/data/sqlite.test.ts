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
const MIGRATIONS = ['0001_init.sql', '0002_attempt_snapshot.sql'];

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
});
