-- Lot 6 : modules de contenu.
-- Un module est un fichier .qcm accompagné de module.json (métadonnées, fiches de révision).
-- Ses QCM et ses catégories sont du contenu protégé, mis à jour ou retiré d'un bloc.

CREATE TABLE module (
  id            TEXT PRIMARY KEY,     -- notation inversée, ex. org.abbon.anglais-verbes
  version       TEXT NOT NULL,        -- SemVer
  manifest      TEXT NOT NULL,        -- module.json complet (JSON), fiches comprises
  installed_at  TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Appartenance (NULL : contenu personnel). Pas de clé étrangère : la désinstallation
-- supprime explicitement le contenu, dans la même transaction.
ALTER TABLE quiz ADD COLUMN module_id TEXT;
ALTER TABLE category ADD COLUMN module_id TEXT;
CREATE INDEX IF NOT EXISTS idx_quiz_module ON quiz(module_id);

-- Historique mis de côté quand un QCM de module est retiré (désinstallation « en gardant
-- l'historique », ou QCM absent d'une nouvelle version). Les tentatives de la table `attempt`
-- disparaissent avec leur QCM (ON DELETE CASCADE) : elles sont d'abord copiées ici, puis
-- remises en place si le module est réinstallé (les identifiants de QCM sont stables).
CREATE TABLE attempt_archive (
  id               TEXT PRIMARY KEY,
  module_id        TEXT NOT NULL,
  quiz_id          TEXT NOT NULL,
  quiz_version     INTEGER NOT NULL,
  mode             TEXT NOT NULL,
  status           TEXT NOT NULL,
  started_at       TEXT NOT NULL,
  finished_at      TEXT,
  elapsed_sec      INTEGER NOT NULL DEFAULT 0,
  current_index    INTEGER NOT NULL DEFAULT 0,
  question_order   TEXT NOT NULL DEFAULT '[]',
  score            REAL,
  max_score        REAL,
  quiz_snapshot    TEXT
);

CREATE TABLE answer_archive (
  attempt_id   TEXT NOT NULL REFERENCES attempt_archive(id) ON DELETE CASCADE,
  question_id  TEXT NOT NULL,
  selected     TEXT NOT NULL DEFAULT '[]',
  correct      INTEGER,
  points       REAL,
  time_sec     INTEGER NOT NULL DEFAULT 0,
  flagged      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_archive_quiz ON attempt_archive(quiz_id);
