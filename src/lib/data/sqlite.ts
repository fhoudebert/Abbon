import type { Answer, Attempt, Category, Choice, InstalledModule, ModuleManifest, Question, Quiz, QuizSummary } from '$lib/domain/types';
import type { AnswerRow, FullData, Media, ModuleInstall, Repository } from './repository';

/**
 * Pilote SQL minimal. Les requêtes utilisent des paramètres numérotés `$1, $2…`.
 * - En application : le plugin SQL de Tauri (voir `tauriDriver`).
 * - En test : le SQLite intégré à Node (voir `sqlite.test.ts`).
 */
export interface SqlDriver {
  execute(sql: string, params?: unknown[]): Promise<void>;
  select<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Exécute toutes les requêtes dans une seule transaction : tout ou rien. */
  batch(statements: Statement[]): Promise<void>;
}

export interface Statement {
  sql: string;
  params: unknown[];
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
      ...(r.module_id ? { moduleId: String(r.module_id) } : {}),
    }));
  }

  async deleteCategory(id: string): Promise<void> {
    // Les QCM et sous-catégories concernés passent « sans catégorie » (ON DELETE SET NULL).
    await this.db.execute('DELETE FROM category WHERE id = $1', [id]);
  }

  async saveCategory(c: Category): Promise<void> {
    const st = categoryStatement(c);
    await this.db.execute(st.sql, st.params);
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
      ...(r.expected ? { expected: parse(r.expected, null) } : {}),
    }));
    return { ...quizFromRow(row), questions };
  }

  async saveQuiz(quiz: Quiz): Promise<void> {
    // Une seule transaction : en cas d'erreur, le QCM reste dans son état précédent.
    await this.db.batch(quizStatements(quiz));
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.db.execute('DELETE FROM quiz WHERE id = $1', [id]);
  }

  // ---- Médias -------------------------------------------------------------

  async getMedia(hash: string): Promise<Media | null> {
    const [r] = await this.db.select<Row>('SELECT * FROM media WHERE hash = $1', [hash]);
    return r
      ? {
          hash: String(r.hash),
          mime: String(r.mime),
          width: num(r.width),
          height: num(r.height),
          sizeBytes: Number(r.size_bytes),
          data: String(r.data),
        }
      : null;
  }

  async saveMedia(m: Media): Promise<void> {
    await this.db.execute(
      `INSERT INTO media (hash, mime, width, height, size_bytes, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(hash) DO NOTHING`,
      [m.hash, m.mime, m.width ?? null, m.height ?? null, m.sizeBytes, m.data, new Date().toISOString()],
    );
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
      ...(r.text != null ? { text: String(r.text) } : {}),
      ...(r.texts != null ? { texts: parse<string[]>(r.texts, []) } : {}),
      correct: r.correct == null ? null : bool(r.correct),
      points: num(r.points),
      timeSec: Number(r.time_sec),
      flagged: bool(r.flagged),
    }));
  }

  async saveAnswer(attemptId: string, a: Answer): Promise<void> {
    await this.db.execute(
      `INSERT INTO answer (attempt_id, question_id, selected, correct, points, time_sec, flagged, text, texts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected = $3, correct = $4, points = $5,
         time_sec = $6, flagged = $7, text = $8, texts = $9`,
      [
        attemptId,
        a.questionId,
        json(a.selected),
        a.correct == null ? null : a.correct ? 1 : 0,
        a.points ?? null,
        a.timeSec,
        a.flagged ? 1 : 0,
        a.text ?? null,
        a.texts ? json(a.texts) : null,
      ],
    );
  }

  // ---- Modules ------------------------------------------------------------

  async listModules(): Promise<InstalledModule[]> {
    const rows = await this.db.select<Row>('SELECT * FROM module ORDER BY installed_at, id');
    return rows.map((r) => ({
      manifest: parse<ModuleManifest>(r.manifest, null as never),
      installedAt: String(r.installed_at),
      updatedAt: String(r.updated_at),
    }));
  }

  async installModule({ manifest, quizzes, categories, removedQuizIds, now = new Date() }: ModuleInstall): Promise<void> {
    const id = manifest.id;
    const ts = now.toISOString();
    const st: Statement[] = [];
    if (removedQuizIds.length) {
      const removed = JSON.stringify(removedQuizIds);
      const where = 'quiz_id IN (SELECT value FROM json_each($2)) AND quiz_id IN (SELECT id FROM quiz WHERE module_id = $1)';
      st.push(...archiveStatements(where, [id, removed]));
      st.push({ sql: 'DELETE FROM quiz WHERE module_id = $1 AND id IN (SELECT value FROM json_each($2))', params: [id, removed] });
    }
    for (const c of orderCategories(categories)) st.push(categoryStatement({ ...c, moduleId: id }));
    for (const q of quizzes) st.push(...quizStatements({ ...q, moduleId: id }));
    // Catégories que la nouvelle version n'annonce plus : retirées si plus rien ne les utilise.
    st.push(
      {
        sql: `DELETE FROM category WHERE module_id = $1 AND id NOT IN (SELECT value FROM json_each($2))
           AND id NOT IN (SELECT category_id FROM quiz WHERE category_id IS NOT NULL)
           AND id NOT IN (SELECT parent_id FROM category WHERE parent_id IS NOT NULL)`,
        params: [id, JSON.stringify(manifest.categories)],
      },
      {
        sql: 'UPDATE category SET module_id = NULL WHERE module_id = $1 AND id NOT IN (SELECT value FROM json_each($2))',
        params: [id, JSON.stringify(manifest.categories)],
      },
    );
    // Historique mis de côté lors d'une désinstallation : remis en place pour les QCM revenus.
    const back = 'module_id = $1 AND quiz_id IN (SELECT id FROM quiz WHERE module_id = $1)';
    st.push(
      {
        sql: `INSERT OR IGNORE INTO attempt (${ATTEMPT_COLUMNS}, quiz_snapshot)
           SELECT ${ATTEMPT_COLUMNS}, quiz_snapshot FROM attempt_archive WHERE ${back}`,
        params: [id],
      },
      {
        sql: `INSERT OR IGNORE INTO answer (${ANSWER_COLUMNS})
           SELECT ${ANSWER_COLUMNS} FROM answer_archive WHERE attempt_id IN (SELECT id FROM attempt_archive WHERE ${back})`,
        params: [id],
      },
      { sql: `DELETE FROM answer_archive WHERE attempt_id IN (SELECT id FROM attempt_archive WHERE ${back})`, params: [id] },
      { sql: `DELETE FROM attempt_archive WHERE ${back}`, params: [id] },
      {
        sql: `INSERT INTO module (id, version, manifest, installed_at, updated_at) VALUES ($1, $2, $3, $4, $4)
           ON CONFLICT(id) DO UPDATE SET version = $2, manifest = $3, updated_at = $4`,
        params: [id, manifest.version, JSON.stringify(manifest), ts],
      },
    );
    await this.db.batch(st);
  }

  async uninstallModule(id: string, keepHistory: boolean): Promise<void> {
    const st: Statement[] = keepHistory
      ? archiveStatements('quiz_id IN (SELECT id FROM quiz WHERE module_id = $1)', [id])
      : [
          { sql: 'DELETE FROM answer_archive WHERE attempt_id IN (SELECT id FROM attempt_archive WHERE module_id = $1)', params: [id] },
          { sql: 'DELETE FROM attempt_archive WHERE module_id = $1', params: [id] },
        ];
    st.push(
      // Explicite plutôt que par cascade : ne dépend pas du réglage des clés étrangères.
      { sql: 'DELETE FROM answer WHERE attempt_id IN (SELECT a.id FROM attempt a JOIN quiz q ON q.id = a.quiz_id WHERE q.module_id = $1)', params: [id] },
      { sql: 'DELETE FROM attempt WHERE quiz_id IN (SELECT id FROM quiz WHERE module_id = $1)', params: [id] },
      { sql: 'DELETE FROM choice WHERE question_id IN (SELECT x.id FROM question x JOIN quiz q ON q.id = x.quiz_id WHERE q.module_id = $1)', params: [id] },
      { sql: 'DELETE FROM question WHERE quiz_id IN (SELECT id FROM quiz WHERE module_id = $1)', params: [id] },
      { sql: 'DELETE FROM quiz WHERE module_id = $1', params: [id] },
      // Une catégorie du module encore utilisée par un QCM ou une sous-catégorie personnels est gardée.
      {
        sql: `DELETE FROM category WHERE module_id = $1
           AND id NOT IN (SELECT category_id FROM quiz WHERE category_id IS NOT NULL)
           AND id NOT IN (SELECT parent_id FROM category WHERE parent_id IS NOT NULL AND module_id IS NOT $1)`,
        params: [id],
      },
      { sql: 'UPDATE category SET module_id = NULL WHERE module_id = $1', params: [id] },
      { sql: 'DELETE FROM module WHERE id = $1', params: [id] },
    );
    await this.db.batch(st);
  }

  // ---- Sauvegarde complète --------------------------------------------------

  async exportHistory(): Promise<{ attempts: Attempt[]; answers: AnswerRow[] }> {
    const rows = await this.db.select<Row>(`SELECT ${ATTEMPT_COLUMNS}, quiz_snapshot FROM attempt ORDER BY started_at`);
    const attempts = rows.map((r) => ({ ...attemptFromRow(r), quizSnapshot: parse<Quiz | null>(r.quiz_snapshot, null) }));
    const answers = (await this.db.select<Row>('SELECT * FROM answer')).map((r) => ({
      attemptId: String(r.attempt_id),
      questionId: String(r.question_id),
      selected: parse<string[]>(r.selected, []),
      ...(r.text != null ? { text: String(r.text) } : {}),
      ...(r.texts != null ? { texts: parse<string[]>(r.texts, []) } : {}),
      correct: r.correct == null ? null : bool(r.correct),
      points: num(r.points),
      timeSec: Number(r.time_sec),
      flagged: bool(r.flagged),
    }));
    return { attempts, answers };
  }

  async listSettings(): Promise<Record<string, string>> {
    const rows = await this.db.select<Row>('SELECT key, value FROM setting');
    return Object.fromEntries(rows.map((r) => [String(r.key), String(r.value)]));
  }

  async listMediaHashes(): Promise<string[]> {
    return (await this.db.select<Row>('SELECT hash FROM media')).map((r) => String(r.hash));
  }

  async deleteUnusedMedia(keep: string[]): Promise<number> {
    const before = (await this.listMediaHashes()).length;
    await this.db.execute('DELETE FROM media WHERE hash NOT IN (SELECT value FROM json_each($1))', [JSON.stringify(keep)]);
    return before - (await this.listMediaHashes()).length;
  }

  async replaceAll(data: FullData): Promise<void> {
    const st: Statement[] = [
      { sql: 'DELETE FROM answer', params: [] },
      { sql: 'DELETE FROM attempt', params: [] },
      { sql: 'DELETE FROM question', params: [] },
      { sql: 'DELETE FROM quiz', params: [] },
      { sql: 'DELETE FROM category', params: [] },
      { sql: 'DELETE FROM media', params: [] },
      { sql: 'DELETE FROM answer_archive', params: [] },
      { sql: 'DELETE FROM attempt_archive', params: [] },
      { sql: 'DELETE FROM module', params: [] },
      // Le code PIN de l'appareil est conservé.
      { sql: "DELETE FROM setting WHERE key <> 'admin_pin'", params: [] },
    ];
    const known = new Set(data.categories.map((c) => c.id));
    for (const c of orderCategories(data.categories))
      st.push(categoryStatement({ ...c, parentId: c.parentId && known.has(c.parentId) ? c.parentId : null }));
    for (const m of data.modules ?? [])
      st.push({
        sql: 'INSERT INTO module (id, version, manifest, installed_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        params: [m.manifest.id, m.manifest.version, JSON.stringify(m.manifest), m.installedAt, m.updatedAt],
      });
    for (const q of data.quizzes) st.push(...quizStatements(q));
    for (const m of data.media)
      st.push({
        sql: `INSERT INTO media (hash, mime, width, height, size_bytes, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        params: [m.hash, m.mime, m.width ?? null, m.height ?? null, m.sizeBytes, m.data, new Date().toISOString()],
      });
    const quizIds = new Set(data.quizzes.map((q) => q.id));
    const attemptIds = new Set<string>();
    for (const a of data.attempts) {
      if (!quizIds.has(a.quizId)) continue; // QCM absent : tentative ignorée
      attemptIds.add(a.id);
      st.push({
        sql: `INSERT INTO attempt (id, quiz_id, quiz_version, mode, status, started_at, finished_at,
           elapsed_sec, current_index, question_order, score, max_score, quiz_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        params: [a.id, a.quizId, a.quizVersion, a.mode, a.status, a.startedAt, a.finishedAt ?? null, a.elapsedSec,
          a.currentIndex, json(a.questionOrder), a.score ?? null, a.maxScore ?? null, json(a.quizSnapshot ?? null)],
      });
    }
    for (const r of data.answers) {
      if (!attemptIds.has(r.attemptId)) continue;
      st.push({
        sql: `INSERT INTO answer (attempt_id, question_id, selected, correct, points, time_sec, flagged, text, texts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        params: [r.attemptId, r.questionId, json(r.selected), r.correct == null ? null : r.correct ? 1 : 0, r.points ?? null, r.timeSec, r.flagged ? 1 : 0, r.text ?? null, r.texts ? json(r.texts) : null],
      });
    }
    for (const [k, v] of Object.entries(data.settings))
      if (k !== 'admin_pin') st.push({ sql: 'INSERT INTO setting (key, value) VALUES ($1, $2)', params: [k, v] });
    await this.db.batch(st);
  }

  // ---- Paramètres ---------------------------------------------------------

  async getSetting(key: string): Promise<string | null> {
    const [row] = await this.db.select<Row>('SELECT value FROM setting WHERE key = $1', [key]);
    return row ? String(row.value) : null;
  }

  async deleteSetting(key: string): Promise<void> {
    await this.db.execute('DELETE FROM setting WHERE key = $1', [key]);
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db.execute(
      'INSERT INTO setting (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
      [key, value],
    );
  }
}

/** Parents avant enfants (clé étrangère parent_id). */
function orderCategories(categories: readonly Category[]): Category[] {
  const rest = [...categories];
  const placed = new Set<string>();
  const out: Category[] = [];
  while (rest.length) {
    const i = rest.findIndex((c) => !c.parentId || placed.has(c.parentId) || !rest.some((o) => o.id === c.parentId));
    const [c] = rest.splice(i === -1 ? 0 : i, 1);
    placed.add(c.id);
    out.push(c);
  }
  return out;
}

function categoryStatement(c: Category): Statement {
  return {
    sql: `INSERT INTO category (id, parent_id, name, position, color, module_id) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(id) DO UPDATE SET parent_id = $2, name = $3, position = $4, color = $5, module_id = $6`,
    params: [c.id, c.parentId, json(c.name), c.position, c.color ?? null, c.moduleId ?? null],
  };
}

/** Copie des tentatives (et de leurs réponses) vers les tables d'archive ; `where` porte sur `attempt`. */
function archiveStatements(where: string, params: unknown[]): Statement[] {
  return [
    {
      sql: `INSERT OR REPLACE INTO attempt_archive (${ATTEMPT_COLUMNS}, quiz_snapshot, module_id)
         SELECT ${ATTEMPT_COLUMNS}, quiz_snapshot, $1 FROM attempt WHERE ${where}`,
      params,
    },
    {
      sql: `INSERT OR REPLACE INTO answer_archive (${ANSWER_COLUMNS})
         SELECT ${ANSWER_COLUMNS} FROM answer WHERE attempt_id IN (SELECT id FROM attempt WHERE ${where})`,
      params,
    },
  ];
}

function quizStatements(quiz: Quiz): Statement[] {
  const statements: Statement[] = [
    {
      sql: `INSERT INTO quiz (id, category_id, title, description, languages, level, tags, time_limit_sec,
         pass_threshold, scoring, solution_visibility, shuffle, status, version, author, created_at, updated_at,
         module_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT(id) DO UPDATE SET category_id = $2, title = $3, description = $4, languages = $5,
         level = $6, tags = $7, time_limit_sec = $8, pass_threshold = $9, scoring = $10,
         solution_visibility = $11, shuffle = $12, status = $13, version = $14, author = $15,
         updated_at = $17, module_id = $18`,
      params: [
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
        quiz.moduleId ?? null,
      ],
    },
    // Les questions sont réécrites en entier (les choix suivent par ON DELETE CASCADE).
    { sql: 'DELETE FROM question WHERE quiz_id = $1', params: [quiz.id] },
  ];
  for (const q of quiz.questions) {
    statements.push({
      sql: `INSERT INTO question (id, quiz_id, type, prompt, points, position, explanation, expected)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      params: [q.id, quiz.id, q.type, json(q.prompt), q.points, q.position, json(q.explanation), json(q.expected)],
    });
    for (const c of q.choices) {
      statements.push({
        sql: `INSERT INTO choice (id, question_id, content, correct, position, feedback)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        params: [c.id, q.id, json(c.content), c.correct ? 1 : 0, c.position, json(c.feedback)],
      });
    }
  }
  return statements;
}

const ATTEMPT_COLUMNS = `id, quiz_id, quiz_version, mode, status, started_at, finished_at,
  elapsed_sec, current_index, question_order, score, max_score`;
const ANSWER_COLUMNS = 'attempt_id, question_id, selected, correct, points, time_sec, flagged, text, texts';

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
    ...(r.module_id ? { moduleId: String(r.module_id) } : {}),
  };
}
