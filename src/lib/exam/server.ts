/**
 * Fichiers du dossier examen/ d'un site corrigé par le serveur : `corriger.php` (notation et enregistrement des
 * copies, en PHP), `solutions.php` (corrigé), `copies.php` (consultation des copies), `config.php` (mot de passe
 * de la consultation), `copies/` (les copies) et des `.htaccess`. Chargé seulement au moment de l'export.
 */
import type { Quiz } from '$lib/domain/types';
import type { SiteSolutions } from '$lib/site';
import COPIES_PHP from './copies.php?raw';
import CORRIGER_PHP from './corriger.php?raw';
import { serverSolutions, solutionsPhp } from './publish';

export { COPIES_PHP, CORRIGER_PHP };

/** Mot de passe de la consultation des copies : 12 caractères sans ambiguïté (ni 0/O, ni 1/l/I). */
export function newPassword(length = 12): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
  let out = '';
  for (const b of bytes) {
    if (b >= 256 - (256 % alphabet.length)) continue; // pas de biais
    out += alphabet[b % alphabet.length];
    if (out.length === length) break;
  }
  return out.length === length ? out : newPassword(length);
}

/** Texte de `examen/config.php` : réglages lus seulement par le serveur. */
export const configPhp = (password: string) => `<?php
// Réglages de l'examen Abbon, lus seulement par le serveur (ouvert dans un navigateur, ce fichier ne montre rien).
// motDePasse : pour consulter les copies (examen/copies.php) ; le changer ici si besoin, '' pour désactiver.
// fuseau : fuseau horaire des dates affichées.
return array(
  'motDePasse' => '${password.replace(/[\\']/g, '')}',
  'fuseau' => 'Europe/Paris',
);
`;

/** `.htaccess` du dossier copies/ : rien n'y est servi. */
export const COPIES_HTACCESS = `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Deny from all
</IfModule>
`;

/** `.htaccess` du dossier examen/ (Apache) : pas de liste des fichiers, solutions.php et config.php jamais servis. */
export const EXAM_HTACCESS = `Options -Indexes
<FilesMatch "^(solutions|config)\\.php$">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
  <IfModule !mod_authz_core.c>
    Deny from all
  </IfModule>
</FilesMatch>
`;

/** Fichiers du dossier examen/ du site (`password` : consultation des copies). */
export function examFiles(quizzes: readonly Quiz[], solutions: SiteSolutions, password: string): Record<string, string> {
  return {
    'examen/corriger.php': CORRIGER_PHP,
    'examen/solutions.php': solutionsPhp(serverSolutions(quizzes, solutions)),
    'examen/copies.php': COPIES_PHP,
    'examen/config.php': configPhp(password),
    'examen/.htaccess': EXAM_HTACCESS,
    'examen/copies/.htaccess': COPIES_HTACCESS,
    'examen/copies/index.html': '',
  };
}
