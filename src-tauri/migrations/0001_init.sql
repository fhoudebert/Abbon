-- Abbon — schéma initial (lot 0)
-- Les champs textuels multilingues sont stockés en JSON : {"fr": "...", "en": "..."}.
-- Les énoncés riches (TipTap) sont stockés en JSON également.

CREATE TABLE IF NOT EXISTS category (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES category(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,              -- JSON i18n
  position    INTEGER NOT NULL DEFAULT 0,
  color       TEXT
);

CREATE TABLE IF NOT EXISTS quiz (
  id                  TEXT PRIMARY KEY,   -- UUID
  category_id         TEXT REFERENCES category(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,      -- JSON i18n
  description         TEXT,               -- JSON i18n
  languages           TEXT NOT NULL DEFAULT '["fr"]',  -- JSON array
  level               TEXT,
  tags                TEXT NOT NULL DEFAULT '[]',      -- JSON array
  time_limit_sec      INTEGER,
  pass_threshold      REAL NOT NULL DEFAULT 0.7,
  scoring             TEXT NOT NULL DEFAULT 'all_or_nothing'
                        CHECK (scoring IN ('all_or_nothing', 'partial')),
  solution_visibility TEXT NOT NULL DEFAULT 'after_submit'
                        CHECK (solution_visibility IN ('never', 'after_submit', 'after_pass')),
  shuffle             INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  version             INTEGER NOT NULL DEFAULT 1,
  author              TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question (
  id          TEXT PRIMARY KEY,
  quiz_id     TEXT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'short', 'numeric')),
  prompt      TEXT NOT NULL,              -- JSON i18n (document riche)
  points      REAL NOT NULL DEFAULT 1,
  position    INTEGER NOT NULL DEFAULT 0,
  explanation TEXT                        -- JSON i18n, facultatif
);

CREATE TABLE IF NOT EXISTS choice (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,              -- JSON i18n
  correct     INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0,
  feedback    TEXT                        -- JSON i18n, facultatif
);

CREATE TABLE IF NOT EXISTS attempt (
  id               TEXT PRIMARY KEY,
  quiz_id          TEXT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  quiz_version     INTEGER NOT NULL,
  mode             TEXT NOT NULL CHECK (mode IN ('training', 'exam')),
  status           TEXT NOT NULL CHECK (status IN ('in_progress', 'finished', 'abandoned')),
  started_at       TEXT NOT NULL,
  finished_at      TEXT,
  elapsed_sec      INTEGER NOT NULL DEFAULT 0,
  current_index    INTEGER NOT NULL DEFAULT 0,
  question_order   TEXT NOT NULL DEFAULT '[]',  -- JSON array d'id de questions
  score            REAL,
  max_score        REAL
);

CREATE TABLE IF NOT EXISTS answer (
  attempt_id   TEXT NOT NULL REFERENCES attempt(id) ON DELETE CASCADE,
  question_id  TEXT NOT NULL,
  selected     TEXT NOT NULL DEFAULT '[]',  -- JSON array d'id de choix
  correct      INTEGER,
  points       REAL,
  time_sec     INTEGER NOT NULL DEFAULT 0,
  flagged      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS media (
  hash        TEXT PRIMARY KEY,           -- SHA-256
  mime        TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  path        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS setting (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_category   ON quiz(category_id);
CREATE INDEX IF NOT EXISTS idx_question_quiz   ON question(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_choice_question ON choice(question_id, position);
CREATE INDEX IF NOT EXISTS idx_attempt_quiz    ON attempt(quiz_id, status);
