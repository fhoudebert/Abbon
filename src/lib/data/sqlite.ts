import type { Answer, Attempt, Category, Choice, Question, Quiz, QuizSummary } from '$lib/domain/types';
import type { Repository } from './repository';

/**
 * Pilote SQL minimal. Les requêtes utilisent des paramètres numérotés `$1, $2…`.
 * - En application : le plugin SQL de Tauri (voir `tauriDriver`).
 * - En test : le SQLite intégré à Node (voir `sqlite.test.ts`).
 */
export interface SqlDriver {
  execute(sql: string, params?: unknown[]): Promise<void>;
  select<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

type Row = Record<string, unknown>;

const json = (v: unknown) => (v == null ? null : JSON.stringify(v));
const parse = <T>(v: unknown, fallback: T): T =>
  typeof v === 'string' && v.length ? (JSON.parse(v) as T) : fallback;
const bool = (v: unknown) => v === 1 || v === true || v === '1';
const num = (v: unknown) => (v == null ? null : Number(v));

export class SqliteRepository implements Repository {
  readonly backend = 'sqlite' as const;

  constructor(private readonly db: SqlDriver) {}

  // ---- Catégories ---------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    const rows = await this.db.select<Row>('SELECT * FROM category ORDER BY position, id');
    return rows.map((r) => ({
      id: String(r.id),
      parentId: (r.parent_id as string) ?? null,
      name: parse(r.name, {}),
      position: Number(r.position),
      color: (r.color as string) ?? null,
    }));
  }

  async saveCategory(c: Category): Promise<void> {
    await this.db.execute(
      `INSERT INTO category (id, parent_id, name, position, color) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT(id) DO UPDATE SET parent_id = $2, name = $3, position = $4, color = $5`,
      [c.id, c.parentId, json(c.name), c.position, c.color ?? null],
    );
  }

  // ---- QCM ----------------------------------------------------------------

  async listQuizzes(): Promise<QuizSummary[]> {
    const rows = await this.db.select<Row>(
      `SELECT q.*, (SELECT count(*) FROM question WHERE quiz_id = q.id) AS question_count
       FROM quiz q ORDER BY q.updated_at DESC`,
    );
    return rows.map((r) => ({ ...quizFromRow(r), questionCount: Number(r.question_count) }));
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    const [row] = await this.db.select<Row>('SELECT * FROM quiz WHERE id = $1', [id]);
    if (!row) return null;
    const qRows = await this.db.select<Row>(
      'SELECT * FROM question WHERE quiz_id = $1 ORDER BY position',
      [id],
    );
    const cRows = await this.db.select<Row>(
      `SELECT c.* FROM choice c JOIN question q ON q.id = c.question_id
       WHERE q.quiz_id = $1 ORDER BY c.position`,
      [id],
    );
    const choicesByQuestion = new Map<string, Choice[]>();
    for (const r of cRows) {
      const list = choicesByQuestion.get(String(r.question_id)) ?? [];
      list.push({
        id: String(r.id),
        content: parse(r.content, {}),
        correct: bool(r.correct),
        position: Number(r.position),
        feedback: parse(r.feedback, null),
      });
      choicesByQuestion.set(String(r.question_id), list);
    }
    const questions: Question[] = qRows.map((r) => ({
      id: String(r.id),
      type: r.type as Question['type'],
      prompt: parse(r.prompt, {}),
      points: Number(r.points),
      position: Number(r.position),
      explanation: parse(r.explanation, null),
      choices: choicesByQuestion.get(String(r.id)) ?? [],
    }));
    return { ...quizFromRow(row), questions };
  }

  async saveQuiz(quiz: Quiz): Promise<void> {
    await this.db.execute(
      `INSERT INTO quiz (id, category_id, title, description, languages, level, tags, time_limit_sec,
         pass_threshold, scoring, solution_visibility, shuffle, status, version, author, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT(id) DO UPDATE SET category_id = $2, title = $3, description = $4, languages = $5,
         level = $6, tags = $7, time_limit_sec = $8, pass_threshold = $9, scoring = $10,
         solution_visibility = $11, shuffle = $12, status = $13, version = $14, author = $15,
         updated_at = $17`,
      [
        quiz.id,
        quiz.categoryId,
        json(quiz.title),
        json(quiz.description),
        json(quiz.languages),
        quiz.level ?? null,
        json(quiz.tags),
        quiz.timeLimitSec ?? null,
        quiz.passThreshold,
        quiz.scoring,
        quiz.solutionVisibility,
        quiz.shuffle ? 1 : 0,
        quiz.status,
        quiz.version,
        quiz.author ?? null,
        quiz.createdAt,
        quiz.updatedAt,
      ],
    );
    // Les questions sont réécrites en entier (les choix suivent par ON DELETE CASCADE).
    await this.db.execute('DELETE FROM question WHERE quiz_id = $1', [quiz.id]);
    for (const q of quiz.questions) {
      await this.db.execute(
        `INSERT INTO question (id, quiz_id, type, prompt, points, position, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [q.id, quiz.id, q.type, json(q.prompt), q.points, q.position, json(q.explanation)],
      );
      for (const c of q.choices) {
        await this.db.execute(
          `INSERT INTO choice (id, question_id, content, correct, position, feedback)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [c.id, q.id, json(c.content), c.correct ? 1 : 0, c.position, json(c.feedback)],
        );
      }
    }
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.db.execute('DELETE FROM quiz WHERE id = $1', [id]);
  }

  // ---- Tentatives ---------------------------------------------------------

  async listAttempts(quizId?: string): Promise<Attempt[]> {
    const cols = ATTEMPT_COLUMNS;
    const rows = quizId
      ? await this.db.select<Row>(`SELECT ${cols} FROM attempt WHERE quiz_id = $1 ORDER BY started_at DESC`, [quizId])
      : await this.db.select<Row>(`SELECT ${cols} FROM attempt ORDER BY started_at DESC`);
    return rows.map(attemptFromRow);
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    const [row] = await this.db.select<Row>(
      `SELECT ${ATTEMPT_COLUMNS}, quiz_snapshot FROM attempt WHERE id = $1`,
      [id],
    );
    return row ? { ...attemptFromRow(row), quizSnapshot: parse<Quiz | null>(row.quiz_snapshot, null) } : null;
  }

  async saveAttempt(a: Attempt): Promise<void> {
    await this.db.execute(
      `INSERT INTO attempt (id, quiz_id, quiz_version, mode, status, started_at, finished_at,
         elapsed_sec, current_index, question_order, score, max_score, quiz_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT(id) DO UPDATE SET status = $5, finished_at = $7, elapsed_sec = $8,
         current_index = $9, question_order = $10, score = $11, max_score = $12,
         quiz_snapshot = COALESCE($13, quiz_snapshot)`,
      [
        a.id,
        a.quizId,
        a.quizVersion,
        a.mode,
        a.status,
        a.startedAt,
        a.finishedAt ?? null,
        a.elapsedSec,
        a.currentIndex,
        json(a.questionOrder),
        a.score ?? null,
        a.maxScore ?? null,
        json(a.quizSnapshot ?? null),
      ],
    );
  }

  async listAnswers(attemptId: string): Promise<Answer[]> {
    const rows = await this.db.select<Row>('SELECT * FROM answer WHERE attempt_id = $1', [attemptId]);
    return rows.map((r) => ({
      questionId: String(r.question_id),
      selected: parse(r.selected, []),
      correct: r.correct == null ? null : bool(r.correct),
      points: num(r.points),
      timeSec: Number(r.time_sec),
      flagged: bool(r.flagged),
    }));
  }

  async saveAnswer(attemptId: string, a: Answer): Promise<void> {
    await this.db.execute(
      `INSERT INTO answer (attempt_id, question_id, selected, correct, points, time_sec, flagged)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected = $3, correct = $4, points = $5,
         time_sec = $6, flagged = $7`,
      [
        attemptId,
        a.questionId,
        json(a.selected),
        a.correct == null ? null : a.correct ? 1 : 0,
        a.points ?? null,
        a.timeSec,
        a.flagged ? 1 : 0,
      ],
    );
  }

  // ---- Paramètres ---------------------------------------------------------

  async getSetting(key: string): Promise<string | null> {
    const [row] = await this.db.select<Row>('SELECT value FROM setting WHERE key = $1', [key]);
    return row ? String(row.value) : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db.execute(
      'INSERT INTO setting (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
      [key, value],
    );
  }
}

const ATTEMPT_COLUMNS = `id, quiz_id, quiz_version, mode, status, started_at, finished_at,
  elapsed_sec, current_index, question_order, score, max_score`;

function attemptFromRow(r: Row): Attempt {
  return {
    id: String(r.id),
    quizId: String(r.quiz_id),
    quizVersion: Number(r.quiz_version),
    mode: r.mode as Attempt['mode'],
    status: r.status as Attempt['status'],
    startedAt: String(r.started_at),
    finishedAt: (r.finished_at as string) ?? null,
    elapsedSec: Number(r.elapsed_sec),
    currentIndex: Number(r.current_index),
    questionOrder: parse(r.question_order, []),
    score: num(r.score),
    maxScore: num(r.max_score),
  };
}

function quizFromRow(r: Row): Omit<Quiz, 'questions'> {
  return {
    id: String(r.id),
    categoryId: (r.category_id as string) ?? null,
    title: parse(r.title, {}),
    description: parse(r.description, null),
    languages: parse(r.languages, ['fr']),
    level: (r.level as string) ?? null,
    tags: parse(r.tags, []),
    timeLimitSec: num(r.time_limit_sec),
    passThreshold: Number(r.pass_threshold),
    scoring: r.scoring as Quiz['scoring'],
    solutionVisibility: r.solution_visibility as Quiz['solutionVisibility'],
    shuffle: bool(r.shuffle),
    status: r.status as Quiz['status'],
    version: Number(r.version),
    author: (r.author as string) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
