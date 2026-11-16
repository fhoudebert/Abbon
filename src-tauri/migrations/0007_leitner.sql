-- Boîte de révision (Leitner) : une seule pour tous les QCM. L'apprenant y range les questions
-- qu'il veut retenir. Pas de clé étrangère vers question : la carte garde une copie de la question
-- et reste révisable si le QCM est modifié, supprimé ou désinstallé.
CREATE TABLE leitner_card (
  question_id  TEXT PRIMARY KEY,
  quiz_id      TEXT NOT NULL,
  box          INTEGER NOT NULL DEFAULT 1,
  due_at       TEXT NOT NULL,
  added_at     TEXT NOT NULL,
  last_at      TEXT,
  reviews      INTEGER NOT NULL DEFAULT 0,
  lapses       INTEGER NOT NULL DEFAULT 0,
  snapshot     TEXT NOT NULL        -- JSON : { question, quizTitle, languages }
);

CREATE INDEX IF NOT EXISTS idx_leitner_due ON leitner_card(due_at);
