-- Lot 15 : points et ceintures.
-- Une récompense par événement : la clé (kind, ref) empêche qu'un même événement compte deux fois
-- (ref : question, question@jour, jour, QCM ou module). Les points ne sont jamais retirés.
CREATE TABLE reward (
  kind    TEXT NOT NULL,
  ref     TEXT NOT NULL,
  points  INTEGER NOT NULL,
  at      TEXT NOT NULL,
  PRIMARY KEY (kind, ref)
);

-- Carte acquise : sortie du planning de révision (NULL tant qu'elle y est).
ALTER TABLE leitner_card ADD COLUMN acquired_at TEXT;
