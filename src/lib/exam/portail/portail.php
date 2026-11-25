<?php
/*
 * Abbon — portail d'hébergement de QCM : bibliothèque (comptes, sites, dépôt des archives exportées par Abbon).
 *
 * Le portail s'installe une seule fois par FTP (dossier questionnaires/ : index.php et _portail/). Ensuite, chaque
 * enseignant dépose dans index.php l'archive .zip d'un site exporté par Abbon (Administration › Exporter › Site
 * web) ; le portail l'installe dans questionnaires/<nom>/ et la retire à la demande.
 *
 * Sécurité : le portail n'installe aucun programme venu de l'archive. Il n'en lit que les données — donnees.js,
 * reglages.js et, pour un examen corrigé par le serveur, examen/solutions.php et examen/config.php —, les vérifie
 * comme des données (JSON, base64, valeurs admises) et les réécrit lui-même. Le lecteur (index.html, _app/) et le
 * correcteur (corriger.php, enseignant.php) sont ses propres copies, dans _portail/abbon/. Un compte enseignant ne
 * peut donc déposer ni PHP, ni script, ni page HTML de son choix sur le serveur.
 * Données dans _portail/donnees/ : JSON précédé de <?php exit; ?> (illisible par le web même sans .htaccess).
 *
 * PHP 7.4 ou plus récent, extensions zip et mbstring. Ne pas modifier : remplacé à chaque mise à jour du portail.
 */

const PORTAIL_VERSION = '__VERSION__';
const PORTAIL_ENTETE = "<?php exit; ?>\n";
/** Taille maximale des données d'un site (donnees.js, avec les images), décompressées. */
const PORTAIL_MAX_OCTETS = 100000000;
/** Noms de dossiers réservés, en plus de ceux qui commencent par _ (interdits par portail_nom_valide). */
const PORTAIL_RESERVES = array('index', 'admin', 'assets', 'cgi-bin');

/** Dossier questionnaires/, où sont installés index.php et les sites. */
function portail_racine() {
  return defined('PORTAIL_RACINE') ? PORTAIL_RACINE : dirname(__DIR__);
}

function portail_dossier_donnees() {
  return portail_racine() . '/_portail/donnees';
}

function portail_dossier_abbon() {
  return portail_racine() . '/_portail/abbon';
}

// ---- Données ---------------------------------------------------------------------------------------------------

/** Lit un fichier de données (JSON après l'en-tête), ou $defaut. */
function portail_lire($nom, $defaut = array()) {
  $f = portail_dossier_donnees() . '/' . $nom . '.php';
  if (!is_file($f)) return $defaut;
  $t = (string) @file_get_contents($f);
  if (strpos($t, PORTAIL_ENTETE) === 0) $t = substr($t, strlen(PORTAIL_ENTETE));
  $d = json_decode($t, true);
  return is_array($d) ? $d : $defaut;
}

/** Écrit un fichier de données d'un coup (fichier temporaire puis renommage). */
function portail_ecrire($nom, $data) {
  $dir = portail_dossier_donnees();
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) throw new RuntimeException("Impossible de créer $dir : vérifier les droits d'écriture.");
  $f = $dir . '/' . $nom . '.php';
  $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if (@file_put_contents($tmp, PORTAIL_ENTETE . $json . "\n", LOCK_EX) === false) throw new RuntimeException("Écriture impossible dans $dir : vérifier les droits d'écriture.");
  if (!@rename($tmp, $f)) {
    @unlink($tmp);
    throw new RuntimeException("Écriture impossible : $f.");
  }
}

/** Mot de passe aléatoire lisible (sans 0/O, 1/l/I), comme ceux d'Abbon. */
function portail_mot_de_passe($n = 12) {
  $a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $s = '';
  for ($i = 0; $i < $n; $i++) $s .= $a[random_int(0, strlen($a) - 1)];
  return $s;
}

// ---- Installation et comptes -------------------------------------------------------------------------------------

/**
 * Code d'installation : créé à la première visite dans _portail/donnees/installation.php, illisible par le web.
 * Celui qui installe le portail (et a donc l'accès FTP) le lit pour créer le compte administrateur.
 */
function portail_code_installation() {
  $d = portail_lire('installation', null);
  if (is_array($d) && isset($d['code'])) return (string) $d['code'];
  $code = portail_mot_de_passe(10);
  portail_ecrire('installation', array('code' => $code));
  return $code;
}

function portail_comptes() {
  return portail_lire('comptes');
}

function portail_installe() {
  return count(portail_comptes()) > 0;
}

function portail_identifiant_valide($login) {
  return is_string($login) && preg_match('/^[a-z0-9][a-z0-9._-]{1,39}$/', $login) === 1;
}

/** Message d'erreur pour un mot de passe trop faible, ou null. */
function portail_mot_de_passe_faible($mdp) {
  if (!is_string($mdp) || mb_strlen($mdp, 'UTF-8') < 10) return 'Le mot de passe doit faire au moins 10 caractères.';
  if (strlen($mdp) > 200) return 'Mot de passe trop long.';
  return null;
}

function portail_creer_compte($login, $nom, $mdp, $admin = false) {
  if (!portail_identifiant_valide($login)) throw new InvalidArgumentException('Identifiant : 2 à 40 caractères, lettres minuscules sans accent, chiffres, point, tiret ou soulignement.');
  $faible = portail_mot_de_passe_faible($mdp);
  if ($faible) throw new InvalidArgumentException($faible);
  $comptes = portail_comptes();
  if (isset($comptes[$login])) throw new InvalidArgumentException("L'identifiant « $login » existe déjà.");
  $comptes[$login] = array(
    'nom' => trim((string) $nom) !== '' ? mb_substr(trim((string) $nom), 0, 80, 'UTF-8') : $login,
    'hash' => password_hash($mdp, PASSWORD_DEFAULT),
    'admin' => (bool) $admin,
    'cree' => date('c'),
  );
  portail_ecrire('comptes', $comptes);
}

function portail_verifier($login, $mdp) {
  $comptes = portail_comptes();
  if (!is_string($login) || !isset($comptes[$login]) || !is_string($mdp)) {
    password_verify('x', '$2y$10$abcdefghijklmnopqrstuuIVcBn1dVsSY1sR6nB0zH/ehF7BT8sGq'); // même durée
    return false;
  }
  return password_verify($mdp, $comptes[$login]['hash']);
}

function portail_changer_mot_de_passe($login, $mdp) {
  $faible = portail_mot_de_passe_faible($mdp);
  if ($faible) throw new InvalidArgumentException($faible);
  $comptes = portail_comptes();
  if (!isset($comptes[$login])) throw new InvalidArgumentException('Compte inconnu.');
  $comptes[$login]['hash'] = password_hash($mdp, PASSWORD_DEFAULT);
  portail_ecrire('comptes', $comptes);
}

/** Supprime un compte ; ses sites restent, rattachés à l'administrateur qui le supprime. */
function portail_supprimer_compte($login, $repreneur) {
  $comptes = portail_comptes();
  if (!isset($comptes[$login])) throw new InvalidArgumentException('Compte inconnu.');
  $admins = array_filter($comptes, function ($c) { return !empty($c['admin']); });
  if (!empty($comptes[$login]['admin']) && count($admins) < 2) throw new InvalidArgumentException('Impossible de supprimer le dernier administrateur.');
  unset($comptes[$login]);
  portail_ecrire('comptes', $comptes);
  $sites = portail_sites();
  foreach ($sites as $nom => $s) if ($s['proprietaire'] === $login) $sites[$nom]['proprietaire'] = $repreneur;
  portail_ecrire('sites', $sites);
}

/** Échecs de connexion récents par adresse : au-delà de 5 en 15 minutes, connexion refusée pendant 15 minutes. */
function portail_trop_d_essais($ip, $echec = null, $now = null) {
  $now = $now === null ? time() : $now;
  $cle = hash('sha256', 'abbon' . $ip);
  $essais = portail_lire('essais');
  foreach ($essais as $k => $liste) {
    $essais[$k] = array_values(array_filter($liste, function ($t) use ($now) { return $t > $now - 900; }));
    if (!$essais[$k]) unset($essais[$k]);
  }
  if ($echec === true) $essais[$cle][] = $now;
  if ($echec === false) unset($essais[$cle]);
  if ($echec !== null) portail_ecrire('essais', $essais);
  return isset($essais[$cle]) && count($essais[$cle]) >= 5;
}

// ---- Sites -------------------------------------------------------------------------------------------------------

function portail_sites() {
  return portail_lire('sites');
}

/** Nom de dossier d'un site : 2 à 60 caractères, minuscules sans accent, chiffres et tirets. */
function portail_nom_valide($nom) {
  return is_string($nom)
    && preg_match('/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])$/', $nom) === 1
    && !in_array($nom, PORTAIL_RESERVES, true);
}

/** Proposition de nom de dossier à partir d'un titre. */
function portail_nom_depuis($texte) {
  $t = (string) $texte;
  if (function_exists('transliterator_transliterate')) $t = (string) transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $t);
  else $t = strtolower((string) @iconv('UTF-8', 'ASCII//TRANSLIT', $t));
  $t = trim((string) preg_replace('/[^a-z0-9]+/', '-', $t), '-');
  return substr($t, 0, 60) ?: 'qcm';
}


function portail_dossier_site($nom) {
  return portail_racine() . '/' . $nom;
}

function portail_est_admin($login) {
  $comptes = portail_comptes();
  return isset($comptes[$login]) && !empty($comptes[$login]['admin']);
}

// ---- Lecture d'une archive exportée par Abbon ----------------------------------------------------------------------

/**
 * Contenu utile d'une archive de site exporté par Abbon : donnees.js, reglages.js et, pour un examen corrigé par le
 * serveur, examen/solutions.php et examen/config.php. Le reste de l'archive (lecteur, LISEZMOI.txt, .htaccess,
 * fichiers PHP du correcteur) n'est pas lu : le portail installe ses propres copies.
 * Renvoie [nom => texte] ; lève une exception au message lisible.
 */
function portail_lire_zip($chemin) {
  if (!class_exists('ZipArchive')) throw new RuntimeException("L'extension PHP zip n'est pas disponible sur cet hébergement.");
  $zip = new ZipArchive();
  if ($zip->open($chemin) !== true) throw new InvalidArgumentException("Ce fichier n'est pas une archive .zip lisible.");
  try {
    // Dossier de tête (l'export d'Abbon met tout dans un dossier au nom du site), repéré par son index.html.
    $prefixe = null;
    for ($i = 0; $i < $zip->numFiles; $i++) {
      $nom = (string) $zip->getNameIndex($i);
      if (preg_match('~^([^/]+/)?donnees\.js$~', $nom, $m)) {
        if ($prefixe !== null) throw new InvalidArgumentException("L'archive contient plusieurs sites : déposer un seul site à la fois.");
        $prefixe = isset($m[1]) ? $m[1] : '';
      }
    }
    if ($prefixe === null) throw new InvalidArgumentException("Ce n'est pas un site exporté par Abbon (donnees.js manque). Dans Abbon : Administration › Exporter › Site web.");
    $out = array();
    $limites = array('donnees.js' => PORTAIL_MAX_OCTETS, 'reglages.js' => 100000, 'examen/solutions.php' => PORTAIL_MAX_OCTETS, 'examen/config.php' => 100000);
    foreach ($limites as $f => $max) {
      $st = $zip->statName($prefixe . $f);
      if ($st === false) continue;
      if ($st['size'] > $max) throw new InvalidArgumentException("Fichier trop volumineux dans l'archive : $f.");
      $t = $zip->getFromName($prefixe . $f);
      if ($t === false || strlen($t) !== (int) $st['size']) throw new InvalidArgumentException("Lecture impossible dans l'archive : $f.");
      $out[$f] = $t;
    }
    return $out;
  } finally {
    $zip->close();
  }
}

/**
 * Données du site (donnees.js : window.ABBON_SITE = {…};), relues comme du JSON et réécrites : aucun script de
 * l'archive n'est installé. Renvoie l'objet décodé.
 */
function portail_lire_donnees($texte) {
  $t = trim((string) $texte);
  if (strpos($t, "\xEF\xBB\xBF") === 0) $t = substr($t, 3);
  if (!preg_match('/^window\.ABBON_SITE\s*=\s*(\{.*\})\s*;?$/s', $t, $m)) throw new InvalidArgumentException("donnees.js illisible : exporter de nouveau le site depuis Abbon.");
  $d = json_decode($m[1]);
  if (!is_object($d) || !isset($d->format) || $d->format !== 'abbon-site' || !isset($d->package) || !is_string($d->package) || !preg_match('~^[A-Za-z0-9+/]*={0,2}$~', $d->package)) {
    throw new InvalidArgumentException("donnees.js : ce ne sont pas les données d'un site Abbon.");
  }
  if (!isset($d->version) || !is_int($d->version) || $d->version > 1) throw new InvalidArgumentException("Site exporté par une version d'Abbon plus récente que le portail : demander à l'administrateur de mettre le portail à jour.");
  return $d;
}

/** donnees.js écrit par le portail, comme Abbon (src/lib/site.ts, siteScript). */
function portail_donnees_js($d) {
  return 'window.ABBON_SITE = ' . json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . ";\n";
}

/** Valeurs admises pour chaque réglage de reglages.js. */
function portail_reglages_admis() {
  return array(
    'modes' => array('les-deux', 'entrainement', 'examen'),
    'corrige' => array('fin', 'jamais', 'enseignant'),
    'copies' => array('oui', 'non'),
  );
}

/** Réglages lus dans un reglages.js (valeurs reconnues seulement ; les autres prennent la valeur par défaut). */
function portail_lire_reglages($texte, $examen) {
  $js = preg_replace('~^\s*//.*$~m', '', (string) $texte);
  // points : réglage absent (export d'avant ce réglage) → "0" pour un examen corrigé par le serveur, comme l'export.
  $r = array('modes' => $examen ? 'examen' : 'les-deux', 'corrige' => $examen ? 'enseignant' : 'fin', 'copies' => 'oui', 'seuil' => '', 'tirage' => '', 'points' => $examen ? '0' : '');
  $alias = array('both' => 'les-deux', 'training' => 'entrainement', 'exam' => 'examen', 'end' => 'fin', 'never' => 'jamais', 'teacher' => 'enseignant');
  foreach (array_keys($r) as $k) {
    if (!preg_match('/\b' . $k . '\s*:\s*["\']\s*([^"\']*?)\s*["\']/u', $js, $m)) continue;
    $v = mb_strtolower($m[1], 'UTF-8');
    if (isset($alias[$v])) $v = $alias[$v];
    $r = portail_regler($r, $k, $v);
  }
  if ($examen) $r['modes'] = 'examen';
  elseif ($r['corrige'] === 'enseignant') $r['corrige'] = 'jamais';
  return $r;
}

/** Applique un réglage s'il est valide. */
function portail_regler($r, $k, $v) {
  $v = trim((string) $v);
  $admis = portail_reglages_admis();
  if (isset($admis[$k])) {
    if (in_array($v, $admis[$k], true)) $r[$k] = $v;
  } elseif ($k === 'seuil') {
    $v = str_replace(',', '.', $v);
    if ($v === '' || (preg_match('/^\d{1,3}(\.\d{1,2})?$/', $v) && (float) $v >= 1 && (float) $v <= 100)) $r[$k] = $v;
  } elseif ($k === 'tirage') {
    if ($v === '' || (preg_match('/^\d{1,4}$/', $v) && (int) $v >= 1)) $r[$k] = $v === '' ? '' : (string) (int) $v;
  } elseif ($k === 'points') {
    if ($v === '' || preg_match('/^\d{1,4}$/', $v)) $r[$k] = $v === '' ? '' : (string) (int) $v;
  }
  return $r;
}

/** reglages.js écrit par le portail, comme Abbon (src/lib/site.ts, settingsScript). */
function portail_reglages_js($r, $examen) {
  $s = "// Réglages du site Abbon, écrits par le portail : à modifier dans le portail (Mes sites › Réglages).\n"
    . "window.ABBON_SITE_SETTINGS = {\n";
  if ($examen) {
    $s .= "  // Examen corrigé par le serveur : le site ne contient pas les réponses, il est en examen seulement.\n"
      . "  modes: \"examen\",\n"
      . "  // Copies gardées sur le serveur : \"oui\" (nom de l'élève demandé) ou \"non\" (note seule).\n"
      . "  copies: \"{$r['copies']}\",\n"
      . "  // Corrigé : \"enseignant\" (publié dans l'espace enseignant), \"fin\" (dès la copie rendue) ou \"jamais\".\n";
  } else {
    $s .= "  // Modes proposés : \"les-deux\", \"entrainement\" ou \"examen\".\n"
      . "  modes: \"{$r['modes']}\",\n"
      . "  // Corrigé de l'examen : \"fin\" (après l'envoi des réponses) ou \"jamais\".\n";
  }
  return $s . "  corrige: \"{$r['corrige']}\",\n"
    . "  // Seuil de réussite, en % ; \"\" : celui de chaque QCM.\n"
    . "  seuil: \"{$r['seuil']}\",\n"
    . "  // Nombre de questions tirées au hasard par examen ; \"\" : toutes.\n"
    . "  tirage: \"{$r['tirage']}\",\n"
    . "  // Points (ceintures) d'un QCM réussi en mode examen : \"0\" (aucun) ou un nombre ; \"\" : comme à l'entraînement.\n"
    . "  points: \"{$r['points']}\",\n};\n";
}

/** Corrigé d'un solutions.php exporté par Abbon, relu comme une donnée (jamais exécuté). */
function portail_lire_solutions($texte) {
  if (!preg_match("/return json_decode\\(base64_decode\\('([A-Za-z0-9+\\/=]+)'\\), true\\);/", (string) $texte, $m)) {
    throw new InvalidArgumentException('examen/solutions.php illisible : exporter de nouveau le site depuis Abbon.');
  }
  $data = json_decode((string) base64_decode($m[1], true), true);
  if (!is_array($data) || !isset($data['quizzes']) || !is_array($data['quizzes'])) throw new InvalidArgumentException('examen/solutions.php : corrigé invalide.');
  return $data;
}

/** solutions.php écrit par le portail, comme Abbon (src/lib/exam/publish.ts). */
function portail_solutions_php($data) {
  $b64 = base64_encode(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  return "<?php\n// Corrigé de l'examen Abbon, lu par corriger.php. Ouvert directement dans un navigateur, il ne renvoie rien.\n"
    . "if (!defined('ABBON_EXAMEN')) { http_response_code(404); exit; }\nreturn json_decode(base64_decode('$b64'), true);\n";
}

/** Mot de passe d'un config.php exporté par Abbon (lettres et chiffres), ou null. */
function portail_lire_mot_de_passe($texte) {
  return preg_match("/'motDePasse'\\s*=>\\s*'([A-Za-z0-9]{6,64})'/", (string) $texte, $m) ? $m[1] : null;
}

/** config.php écrit par le portail, comme Abbon (src/lib/exam/server.ts). */
function portail_config_php($mdp) {
  $mdp = preg_replace('/[^A-Za-z0-9]/', '', (string) $mdp);
  return "<?php\n// Réglages de l'examen Abbon, lus seulement par le serveur (ouvert dans un navigateur, ce fichier ne montre rien).\n"
    . "// motDePasse : pour l'espace enseignant (examen/enseignant.php). Installé par le portail Abbon, qui l'affiche.\n"
    . "return array(\n  'motDePasse' => '$mdp',\n  'fuseau' => 'Europe/Paris',\n);\n";
}

const PORTAIL_HTACCESS_INTERDIT = "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n";
const PORTAIL_HTACCESS_EXAMEN = "Options -Indexes\n<FilesMatch \"^(solutions|config)\\.php$\">\n  <IfModule mod_authz_core.c>\n    Require all denied\n  </IfModule>\n  <IfModule !mod_authz_core.c>\n    Deny from all\n  </IfModule>\n</FilesMatch>\n";

// ---- Installation des sites ----------------------------------------------------------------------------------------

function portail_supprimer_dossier($dir) {
  if (is_link($dir)) return @unlink($dir);
  if (!is_dir($dir)) return true;
  foreach (scandir($dir) as $f) {
    if ($f === '.' || $f === '..') continue;
    $p = $dir . '/' . $f;
    if (is_dir($p) && !is_link($p)) portail_supprimer_dossier($p);
    else @unlink($p);
  }
  return @rmdir($dir);
}

function portail_copier_dossier($src, $dest) {
  if (!is_dir($dest) && !@mkdir($dest, 0755, true)) throw new RuntimeException("Impossible de créer $dest.");
  foreach (scandir($src) as $f) {
    if ($f === '.' || $f === '..') continue;
    $p = $src . '/' . $f;
    if (is_dir($p)) portail_copier_dossier($p, $dest . '/' . $f);
    elseif (!@copy($p, $dest . '/' . $f)) throw new RuntimeException("Copie impossible : $f.");
  }
}

/** Écrit dans $dir les fichiers du portail : le lecteur et, pour un examen, les fichiers PHP du correcteur. */
function portail_ecrire_programmes($dir, $examen) {
  $lecteur = portail_dossier_abbon() . '/lecteur';
  if (!is_file($lecteur . '/index.html')) throw new RuntimeException('Fichiers du portail incomplets (_portail/abbon/lecteur/) : réinstaller le portail.');
  portail_copier_dossier($lecteur, $dir);
  @file_put_contents($dir . '/.htaccess', "Options -Indexes\n");
  if (!$examen) return;
  $ex = $dir . '/examen';
  if (!is_dir($ex . '/copies') && !@mkdir($ex . '/copies', 0755, true)) throw new RuntimeException("Impossible de créer $ex/copies.");
  foreach (array('corriger.php', 'enseignant.php') as $f) {
    if (!@copy(portail_dossier_abbon() . '/' . $f, $ex . '/' . $f)) throw new RuntimeException("Copie impossible de _portail/abbon/$f.");
  }
  file_put_contents($ex . '/.htaccess', PORTAIL_HTACCESS_EXAMEN);
  file_put_contents($ex . '/copies/.htaccess', PORTAIL_HTACCESS_INTERDIT);
  if (!is_file($ex . '/copies/index.html')) file_put_contents($ex . '/copies/index.html', '');
}

/** Bascule $tmp en $cible : l'ancien dossier est mis de côté, puis effacé. */
function portail_basculer($tmp, $cible) {
  $vieux = null;
  if (file_exists($cible)) {
    $vieux = portail_dossier_donnees() . '/ancien-' . bin2hex(random_bytes(6));
    if (!@rename($cible, $vieux)) throw new RuntimeException('Impossible de remplacer le dossier ' . basename($cible) . '.');
  }
  if (!@rename($tmp, $cible)) {
    if ($vieux) @rename($vieux, $cible);
    throw new RuntimeException('Impossible de créer le dossier ' . basename($cible) . " : vérifier les droits d'écriture dans questionnaires/.");
  }
  if ($vieux) portail_supprimer_dossier($vieux);
}

/**
 * Installe (ou remplace) le site $nom à partir de l'archive $chemin, pour le compte $login. Remplacer garde les copies
 * des élèves, l'état de l'examen, le mot de passe de l'espace enseignant et les réglages. Renvoie la fiche du site.
 */
function portail_installer_site($chemin, $nom, $login, $titre = '', $remplacer = false) {
  if (!portail_nom_valide($nom)) throw new InvalidArgumentException('Nom de dossier : 2 à 60 caractères, lettres minuscules sans accent, chiffres et tirets, sans tiret au début ni à la fin.');
  $sites = portail_sites();
  $cible = portail_dossier_site($nom);
  if (isset($sites[$nom])) {
    if (!$remplacer) throw new InvalidArgumentException("Le dossier « $nom » existe déjà : choisir un autre nom, ou cocher « Remplacer ».");
    if ($sites[$nom]['proprietaire'] !== $login && !portail_est_admin($login)) throw new InvalidArgumentException("Le site « $nom » appartient à un autre compte.");
  } elseif (file_exists($cible)) {
    throw new InvalidArgumentException("Un dossier « $nom » existe déjà sur le serveur, hors du portail : choisir un autre nom.");
  } elseif ($remplacer) {
    throw new InvalidArgumentException("Aucun site « $nom » à remplacer.");
  }
  $f = portail_lire_zip($chemin);
  $donnees = portail_lire_donnees($f['donnees.js']);
  $examen = !empty($donnees->server);
  $solutions = null;
  $mdp = null;
  if ($examen) {
    if (!isset($f['examen/solutions.php'])) throw new InvalidArgumentException("Site d'examen incomplet : examen/solutions.php manque.");
    $solutions = portail_lire_solutions($f['examen/solutions.php']);
    if (isset($f['examen/config.php'])) $mdp = portail_lire_mot_de_passe($f['examen/config.php']);
  }
  $reglages = portail_lire_reglages(isset($f['reglages.js']) ? $f['reglages.js'] : '', $examen);
  $ancien = $remplacer ? $cible : null;
  if ($ancien && is_file($ancien . '/reglages.js')) $reglages = portail_lire_reglages(file_get_contents($ancien . '/reglages.js'), $examen);
  if ($ancien && is_file($ancien . '/examen/config.php')) {
    $garde = portail_lire_mot_de_passe(file_get_contents($ancien . '/examen/config.php'));
    if ($garde) $mdp = $garde;
  }
  if ($examen && !$mdp) $mdp = portail_mot_de_passe();

  $tmp = portail_dossier_donnees() . '/depot-' . bin2hex(random_bytes(6));
  if (!@mkdir($tmp, 0755, true)) throw new RuntimeException("Impossible d'écrire dans _portail/donnees/ : vérifier les droits d'écriture.");
  try {
    portail_ecrire_programmes($tmp, $examen);
    file_put_contents($tmp . '/donnees.js', portail_donnees_js($donnees));
    file_put_contents($tmp . '/reglages.js', portail_reglages_js($reglages, $examen));
    if ($examen) {
      file_put_contents($tmp . '/examen/solutions.php', portail_solutions_php($solutions));
      file_put_contents($tmp . '/examen/config.php', portail_config_php($mdp));
      // Copies et état de l'examen (ouverture, liste de classe, publication du corrigé) : gardés au remplacement.
      if ($ancien && is_dir($ancien . '/examen/copies')) {
        foreach (scandir($ancien . '/examen/copies') as $c) {
          if (preg_match('/^[a-z0-9_-]+\.php$/i', $c)) @copy($ancien . '/examen/copies/' . $c, $tmp . '/examen/copies/' . $c);
        }
      }
    }
    portail_basculer($tmp, $cible);
  } catch (Throwable $e) {
    portail_supprimer_dossier($tmp);
    throw $e;
  }
  $titre = trim((string) $titre);
  if ($titre === '' && isset($donnees->title) && is_string($donnees->title)) $titre = trim($donnees->title);
  $avant = isset($sites[$nom]) ? $sites[$nom] : array();
  $sites[$nom] = array(
    'titre' => mb_substr($titre !== '' ? $titre : $nom, 0, 120, 'UTF-8'),
    'proprietaire' => isset($avant['proprietaire']) ? $avant['proprietaire'] : $login,
    'examen' => $examen,
    'cree' => isset($avant['cree']) ? $avant['cree'] : date('c'),
    'modifie' => date('c'),
    'version' => PORTAIL_VERSION,
  );
  ksort($sites);
  portail_ecrire('sites', $sites);
  return $sites[$nom];
}

/** Supprime un site et ses copies. */
function portail_supprimer_site($nom) {
  $sites = portail_sites();
  if (!isset($sites[$nom]) || !portail_nom_valide($nom)) throw new InvalidArgumentException('Site inconnu.');
  $cible = portail_dossier_site($nom);
  if (file_exists($cible)) {
    $vieux = portail_dossier_donnees() . '/ancien-' . bin2hex(random_bytes(6));
    if (!@rename($cible, $vieux)) throw new RuntimeException("Impossible de supprimer le dossier « $nom ».");
    portail_supprimer_dossier($vieux);
  }
  unset($sites[$nom]);
  portail_ecrire('sites', $sites);
}

/** Réglages actuels d'un site (son reglages.js). */
function portail_reglages_site($nom) {
  $sites = portail_sites();
  $f = portail_dossier_site($nom) . '/reglages.js';
  return portail_lire_reglages(is_file($f) ? file_get_contents($f) : '', !empty($sites[$nom]['examen']));
}

/** Change les réglages d'un site ($valeurs : clé => valeur ; les valeurs invalides sont ignorées). */
function portail_changer_reglages($nom, $valeurs) {
  $sites = portail_sites();
  if (!isset($sites[$nom])) throw new InvalidArgumentException('Site inconnu.');
  $examen = !empty($sites[$nom]['examen']);
  $r = portail_reglages_site($nom);
  foreach ($valeurs as $k => $v) {
    if (array_key_exists($k, $r)) $r = portail_regler($r, $k, $v);
  }
  $r = portail_lire_reglages(portail_reglages_js($r, $examen), $examen);
  $f = portail_dossier_site($nom) . '/reglages.js';
  $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (@file_put_contents($tmp, portail_reglages_js($r, $examen)) === false || !@rename($tmp, $f)) {
    @unlink($tmp);
    throw new RuntimeException('Écriture impossible : ' . $nom . '/reglages.js.');
  }
  return $r;
}

/** Mot de passe de l'espace enseignant d'un site d'examen, ou null. */
function portail_mot_de_passe_site($nom) {
  $f = portail_dossier_site($nom) . '/examen/config.php';
  return is_file($f) ? portail_lire_mot_de_passe(file_get_contents($f)) : null;
}

/** Nouveau mot de passe pour l'espace enseignant d'un site d'examen. */
function portail_nouveau_mot_de_passe_site($nom) {
  $sites = portail_sites();
  if (empty($sites[$nom]['examen'])) throw new InvalidArgumentException('Ce site n\'est pas un examen corrigé par le serveur.');
  $mdp = portail_mot_de_passe();
  $f = portail_dossier_site($nom) . '/examen/config.php';
  if (@file_put_contents($f, portail_config_php($mdp), LOCK_EX) === false) throw new RuntimeException("Écriture impossible : $nom/examen/config.php.");
  return $mdp;
}

/** Réinstalle le lecteur et les fichiers PHP du portail dans tous les sites (après une mise à jour du portail). */
function portail_mettre_a_jour_sites() {
  $n = 0;
  foreach (portail_sites() as $nom => $s) {
    $dir = portail_dossier_site($nom);
    if (!is_dir($dir)) continue;
    // Le lecteur précédent (dossier _app/ aux noms de fichiers versionnés) est remplacé entièrement.
    portail_supprimer_dossier($dir . '/_app');
    portail_ecrire_programmes($dir, !empty($s['examen']));
    $n++;
  }
  return $n;
}

/**
 * Met le portail à jour depuis son paquet (Abbon-portail-X.Y.Z.zip) : index.php, _portail/portail.php et
 * _portail/abbon/ (lecteur et correcteur). Réservé aux administrateurs : le paquet contient des fichiers PHP.
 * Renvoie la version installée.
 */
function portail_mettre_a_jour_portail($chemin) {
  if (!class_exists('ZipArchive')) throw new RuntimeException("L'extension PHP zip n'est pas disponible sur cet hébergement.");
  $zip = new ZipArchive();
  if ($zip->open($chemin) !== true) throw new InvalidArgumentException("Ce fichier n'est pas une archive .zip lisible.");
  try {
    $fichiers = array();
    $total = 0;
    for ($i = 0; $i < $zip->numFiles; $i++) {
      $st = $zip->statIndex($i);
      $nom = (string) $st['name'];
      if (substr($nom, -1) === '/' || strpos($nom, 'questionnaires/') !== 0) continue;
      $rel = substr($nom, strlen('questionnaires/'));
      if ($rel !== 'index.php' && $rel !== '_portail/portail.php' && strpos($rel, '_portail/abbon/') !== 0) continue;
      foreach (explode('/', $rel) as $m) {
        if ($m === '' || $m === '.' || $m === '..' || strpos($m, '\\') !== false || strpos($m, "\0") !== false) throw new InvalidArgumentException("Nom de fichier refusé dans le paquet : $nom.");
      }
      $total += (int) $st['size'];
      if ($total > PORTAIL_MAX_OCTETS) throw new InvalidArgumentException('Paquet trop volumineux.');
      $fichiers[$rel] = $i;
    }
    foreach (array('index.php', '_portail/portail.php', '_portail/abbon/corriger.php', '_portail/abbon/enseignant.php', '_portail/abbon/lecteur/index.html') as $a) {
      if (!isset($fichiers[$a])) throw new InvalidArgumentException("Ce n'est pas un paquet du portail Abbon (Abbon-portail-….zip) : $a manque.");
    }
    $lib = $zip->getFromIndex($fichiers['_portail/portail.php']);
    if (!preg_match("/const PORTAIL_VERSION = '([^']*)'/", $lib, $v)) throw new InvalidArgumentException('Paquet du portail invalide.');
    // Nouveau dossier abbon/ préparé à côté, puis basculé ; index.php et portail.php en dernier.
    $racine = portail_racine();
    $tmp = $racine . '/_portail/abbon-' . bin2hex(random_bytes(4));
    try {
      foreach ($fichiers as $rel => $i) {
        if (strpos($rel, '_portail/abbon/') !== 0) continue;
        $dest = $tmp . '/' . substr($rel, strlen('_portail/abbon/'));
        if (!is_dir(dirname($dest)) && !@mkdir(dirname($dest), 0755, true)) throw new RuntimeException("Impossible d'écrire dans _portail/.");
        if (@file_put_contents($dest, $zip->getFromIndex($i)) === false) throw new RuntimeException("Écriture impossible : $rel.");
      }
      portail_basculer($tmp, portail_dossier_abbon());
    } catch (Throwable $e) {
      portail_supprimer_dossier($tmp);
      throw $e;
    }
    foreach (array('_portail/portail.php', 'index.php') as $a) {
      $dest = $racine . '/' . $a;
      $t = $dest . '.' . bin2hex(random_bytes(4)) . '.tmp';
      if (@file_put_contents($t, $zip->getFromIndex($fichiers[$a])) === false || !@rename($t, $dest)) {
        @unlink($t);
        throw new RuntimeException("Écriture impossible : $a.");
      }
    }
    return $v[1];
  } finally {
    $zip->close();
  }
}
