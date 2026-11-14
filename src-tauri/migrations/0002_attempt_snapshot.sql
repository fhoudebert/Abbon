-- Lot 1 : chaque tentative garde une copie du QCM tel qu'il était au démarrage.
-- Ainsi, si l'auteur modifie le QCM, la reprise, le récapitulatif et le corrigé
-- d'une ancienne tentative restent cohérents.
ALTER TABLE attempt ADD COLUMN quiz_snapshot TEXT;

CREATE INDEX IF NOT EXISTS idx_answer_attempt ON answer(attempt_id);
