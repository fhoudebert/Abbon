/**
 * Fichiers du dossier examen/ d'un site corrigé par le serveur : `corriger.php` (notation, en PHP),
 * `solutions.php` (corrigé) et `.htaccess`. Chargé seulement au moment de l'export.
 */
import type { Quiz } from '$lib/domain/types';
import type { SiteSolutions } from '$lib/site';
import CORRIGER_PHP from './corriger.php?raw';
import { serverSolutions, solutionsPhp } from './publish';

export { CORRIGER_PHP };

/** `.htaccess` du dossier examen/ (Apache) : pas de liste des fichiers, solutions.php jamais servi. */
export const EXAM_HTACCESS = `Options -Indexes
<Files "solutions.php">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
    Deny from all
  </IfModule>
</Files>
`;

/** Fichiers du dossier examen/ du site. */
export function examFiles(quizzes: readonly Quiz[], solutions: SiteSolutions): Record<string, string> {
  return {
    'examen/corriger.php': CORRIGER_PHP,
    'examen/solutions.php': solutionsPhp(serverSolutions(quizzes, solutions)),
    'examen/.htaccess': EXAM_HTACCESS,
  };
}
