-- Textes à trous : réponses de l'apprenant, une par trou (tableau JSON de chaînes).
-- Le texte et les trous sont dans question.expected ; le type « cloze » est ajouté à la contrainte
-- CHECK de question.type dans 0001 (aucune base n'est à reprendre).
ALTER TABLE answer ADD COLUMN texts TEXT;
ALTER TABLE answer_archive ADD COLUMN texts TEXT;
