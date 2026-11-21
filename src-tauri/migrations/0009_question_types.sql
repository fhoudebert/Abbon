-- Lot 13 : type de question « expression ».
-- SQLite ne sait pas modifier la contrainte CHECK de question.type : les tables question et choice sont
-- reconstruites, données comprises. La contrainte sur le type est retirée : les types sont contrôlés par
-- l'application (schéma d'échange, validation), et un type futur n'exigera plus de reconstruction.
--
-- L'ordre évite toute suppression en cascade (les clés étrangères restent actives pendant la migration) :
-- seule la table choice dépend de question ; elle est copiée vers une table qui référence la nouvelle table
-- question, puis les anciennes tables sont supprimées (choice d'abord, qui n'a pas de dépendance), et les
-- nouvelles renommées (le renommage met à jour la référence de choice).

CREATE TABLE question_v9 (
  id          TEXT PRIMARY KEY,
  quiz_id     TEXT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  prompt      TEXT NOT NULL,              -- JSON i18n (document riche)
  points      REAL NOT NULL DEFAULT 1,
  position    INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,                       -- JSON i18n, facultatif
  expected    TEXT                        -- JSON : réponse attendue des questions à saisie
);
INSERT INTO question_v9 (id, quiz_id, type, prompt, points, position, explanation, expected)
  SELECT id, quiz_id, type, prompt, points, position, explanation, expected FROM question;

CREATE TABLE choice_v9 (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES question_v9(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,              -- JSON i18n
  correct     INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0,
  feedback    TEXT                        -- JSON i18n, facultatif
);
INSERT INTO choice_v9 (id, question_id, content, correct, position, feedback)
  SELECT id, question_id, content, correct, position, feedback FROM choice;

DROP TABLE choice;
DROP TABLE question;
ALTER TABLE question_v9 RENAME TO question;
ALTER TABLE choice_v9 RENAME TO choice;

CREATE INDEX IF NOT EXISTS idx_question_quiz   ON question(quiz_id, position);
CREATE INDEX IF NOT EXISTS idx_choice_question ON choice(question_id, position);
