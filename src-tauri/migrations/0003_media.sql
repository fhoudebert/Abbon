-- Lot 2 : images des QCM stockées dans la base.
-- La table `media` du schéma initial (fichiers sur disque) n'a jamais servi : on la remplace.
-- Stocker les images dans SQLite garde la sauvegarde d'un QCM atomique, évite toute
-- permission d'accès aux fichiers et simplifie l'export. Les images sont compressées à
-- l'insertion (1600 px maximum), donc de taille raisonnable.
DROP TABLE IF EXISTS media;

CREATE TABLE media (
  hash        TEXT PRIMARY KEY,     -- SHA-256 du contenu (déduplication)
  mime        TEXT NOT NULL,
  width       INTEGER,
  height      INTEGER,
  size_bytes  INTEGER NOT NULL,
  data        TEXT NOT NULL,        -- contenu encodé en base64
  created_at  TEXT NOT NULL
);
