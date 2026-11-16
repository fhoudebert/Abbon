-- Questions à saisie : « réponse courte » et « réponse numérique ».
-- (Les deux nouveaux types sont aussi ajoutés à la contrainte CHECK de question.type, dans 0001 :
-- SQLite ne sait pas modifier une contrainte, et aucune base n'était encore à reprendre.)

-- Réponse attendue (JSON) : { accepted, caseSensitive } ou { value, tolerance, unit }.
ALTER TABLE question ADD COLUMN expected TEXT;

-- Texte saisi par l'apprenant.
ALTER TABLE answer ADD COLUMN text TEXT;
ALTER TABLE answer_archive ADD COLUMN text TEXT;
