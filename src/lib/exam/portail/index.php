<?php
/*
 * Abbon — portail d'hébergement de QCM. Voir _portail/portail.php et LISEZMOI.txt.
 * Ne pas modifier : remplacé à chaque mise à jour du portail.
 */

require __DIR__ . '/_portail/portail.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
header('Referrer-Policy: no-referrer');
@date_default_timezone_set('Europe/Paris');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$chemin = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
session_name('abbon_portail');
session_set_cookie_params(array('lifetime' => 0, 'path' => $chemin, 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict'));
session_start();

const PORTAIL_INACTIVITE = 1800;
if (isset($_SESSION['vu']) && time() - $_SESSION['vu'] > PORTAIL_INACTIVITE) $_SESSION = array();
$_SESSION['vu'] = time();
if (empty($_SESSION['jeton'])) $_SESSION['jeton'] = bin2hex(random_bytes(16));

function h($s) {
  return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function champ_jeton() {
  return '<input type="hidden" name="jeton" value="' . h($_SESSION['jeton']) . '">';
}

function p($nom) {
  return isset($_POST[$nom]) && is_string($_POST[$nom]) ? $_POST[$nom] : '';
}

function taille_lisible($t) {
  $t = trim((string) $t);
  return $t === '' ? '?' : str_replace(array('M', 'G', 'K'), array(' Mo', ' Go', ' Ko'), $t);
}

$moi = isset($_SESSION['login']) && isset(portail_comptes()[$_SESSION['login']]) ? $_SESSION['login'] : null;
$admin = $moi !== null && portail_est_admin($moi);
$message = '';
$erreur = '';
$action = p('action');
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';

/** Actions sensibles : le mot de passe du compte est redemandé (un script d'un site déposé ne le connaît pas). */
function confirmer($moi) {
  if (!portail_verifier($moi, p('confirmation'))) {
    sleep(1);
    throw new InvalidArgumentException('Mot de passe de confirmation incorrect.');
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  try {
    if (!hash_equals($_SESSION['jeton'], p('jeton'))) throw new InvalidArgumentException('Formulaire expiré : recommencer.');
    if (!portail_installe()) {
      if ($action !== 'installer') throw new InvalidArgumentException('Portail à installer.');
      if (!hash_equals(portail_code_installation(), trim(p('code')))) {
        sleep(2);
        throw new InvalidArgumentException("Code d'installation incorrect.");
      }
      if (p('motdepasse') !== p('motdepasse2')) throw new InvalidArgumentException('Les deux mots de passe diffèrent.');
      portail_creer_compte(p('login'), p('nom'), p('motdepasse'), true);
      @unlink(portail_dossier_donnees() . '/installation.php');
      session_regenerate_id(true);
      $_SESSION['login'] = p('login');
      $moi = p('login');
      $admin = true;
      $message = 'Portail installé. Créez maintenant les comptes des enseignants (Administration).';
    } elseif ($action === 'connexion') {
      if (portail_trop_d_essais($ip)) throw new InvalidArgumentException('Trop d\'essais : réessayer dans 15 minutes.');
      if (!portail_verifier(p('login'), p('motdepasse'))) {
        portail_trop_d_essais($ip, true);
        sleep(2);
        throw new InvalidArgumentException('Identifiant ou mot de passe incorrect.');
      }
      portail_trop_d_essais($ip, false);
      session_regenerate_id(true);
      $_SESSION['login'] = p('login');
      $moi = p('login');
      $admin = portail_est_admin($moi);
    } elseif ($moi === null) {
      throw new InvalidArgumentException('Session expirée : se reconnecter.');
    } elseif ($action === 'deconnexion') {
      $_SESSION = array();
      session_regenerate_id(true);
      $moi = null;
      $admin = false;
    } elseif ($action === 'deposer') {
      $f = isset($_FILES['archive']) ? $_FILES['archive'] : null;
      if (!$f || $f['error'] === UPLOAD_ERR_NO_FILE) throw new InvalidArgumentException('Choisir l\'archive .zip du site.');
      if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) throw new InvalidArgumentException('Archive trop volumineuse pour cet hébergement (limite : ' . taille_lisible(ini_get('upload_max_filesize')) . ').');
      if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) throw new InvalidArgumentException('Envoi du fichier interrompu : recommencer.');
      $nom = trim(p('dossier'));
      if ($nom === '') $nom = portail_nom_depuis(pathinfo((string) $f['name'], PATHINFO_FILENAME));
      $remplacer = p('remplacer') === '1';
      if ($remplacer) confirmer($moi);
      $site = portail_installer_site($f['tmp_name'], $nom, $moi, p('titre'), $remplacer);
      $message = ($remplacer ? 'Site remplacé' : 'Site installé') . " : $nom/" . ($site['examen'] ? ' (examen corrigé par le serveur).' : '.');
    } elseif ($action === 'reglages' || $action === 'mdp-site') {
      $nom = p('dossier');
      $sites = portail_sites();
      if (!isset($sites[$nom])) throw new InvalidArgumentException('Site inconnu.');
      if ($sites[$nom]['proprietaire'] !== $moi && !$admin) throw new InvalidArgumentException('Ce site appartient à un autre compte.');
      if ($action === 'reglages') {
        $valeurs = array();
        foreach (array('modes', 'corrige', 'copies', 'seuil', 'tirage', 'points') as $k) if (isset($_POST[$k])) $valeurs[$k] = p($k);
        portail_changer_reglages($nom, $valeurs);
        $message = "Réglages de « $nom » enregistrés.";
      } else {
        confirmer($moi);
        portail_nouveau_mot_de_passe_site($nom);
        $message = "Nouveau mot de passe pour l'espace enseignant de « $nom » (voir ci-dessous).";
      }
    } elseif ($action === 'supprimer') {
      $nom = p('dossier');
      $sites = portail_sites();
      if (!isset($sites[$nom])) throw new InvalidArgumentException('Site inconnu.');
      if ($sites[$nom]['proprietaire'] !== $moi && !$admin) throw new InvalidArgumentException('Ce site appartient à un autre compte.');
      confirmer($moi);
      portail_supprimer_site($nom);
      $message = "Site « $nom » supprimé, avec ses copies.";
    } elseif ($action === 'motdepasse') {
      confirmer($moi);
      if (p('motdepasse') !== p('motdepasse2')) throw new InvalidArgumentException('Les deux mots de passe diffèrent.');
      portail_changer_mot_de_passe($moi, p('motdepasse'));
      session_regenerate_id(true);
      $message = 'Mot de passe changé.';
    } elseif ($admin && $action === 'creer-compte') {
      confirmer($moi);
      $mdp = portail_mot_de_passe(14);
      portail_creer_compte(p('login'), p('nom'), $mdp, p('admin') === '1');
      $message = 'Compte « ' . p('login') . " » créé. Mot de passe à transmettre à son titulaire (il ne sera plus affiché) : $mdp";
    } elseif ($admin && $action === 'reinitialiser') {
      confirmer($moi);
      $mdp = portail_mot_de_passe(14);
      portail_changer_mot_de_passe(p('login'), $mdp);
      $message = 'Nouveau mot de passe de « ' . p('login') . " » (il ne sera plus affiché) : $mdp";
    } elseif ($admin && $action === 'supprimer-compte') {
      confirmer($moi);
      if (p('login') === $moi) throw new InvalidArgumentException('Impossible de supprimer son propre compte.');
      portail_supprimer_compte(p('login'), $moi);
      $message = 'Compte « ' . p('login') . ' » supprimé ; ses sites vous sont rattachés.';
    } elseif ($admin && $action === 'mettre-a-jour') {
      confirmer($moi);
      $f = isset($_FILES['paquet']) ? $_FILES['paquet'] : null;
      if (!$f || $f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) throw new InvalidArgumentException('Choisir le paquet du portail (Abbon-portail-….zip).');
      $v = portail_mettre_a_jour_portail($f['tmp_name']);
      $message = "Portail mis à jour (version $v). Mettre maintenant à jour les sites (bouton ci-dessous).";
    } elseif ($admin && $action === 'mettre-a-jour-sites') {
      confirmer($moi);
      $message = portail_mettre_a_jour_sites() . ' site(s) mis à jour.';
    } else {
      throw new InvalidArgumentException('Action inconnue.');
    }
  } catch (Throwable $e) {
    $erreur = $e instanceof InvalidArgumentException || $e instanceof RuntimeException ? $e->getMessage() : 'Erreur inattendue.';
  }
}

$page = isset($_GET['page']) && is_string($_GET['page']) ? $_GET['page'] : 'sites';
$installe = portail_installe();
if (!$installe) portail_code_installation();
$comptes = $moi ? portail_comptes() : array();
$sites = $moi ? portail_sites() : array();
$visibles = array_filter($sites, function ($s) use ($moi, $admin) { return $admin || $s['proprietaire'] === $moi; });
$limite = taille_lisible(ini_get('upload_max_filesize'));
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="data:,">
<title>Portail Abbon<?= $moi ? ' — ' . h($comptes[$moi]['nom']) : '' ?></title>
<style>
:root { --bg: #fbfcf9; --surface: #fff; --text: #1c2418; --muted: #5b6655; --border: #d5dccf; --accent: #2b6e12; --bad: #b3261e; --ok-bg: #e6f1df; --bad-bg: #fbe9e7; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root { --bg: #12160f; --surface: #1b2117; --text: #e8eee3; --muted: #a3ae9b; --border: #2e3729; --accent: #8fd16b; --bad: #ff8a80; --ok-bg: #23301c; --bad-bg: #3a1e1b; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin: 0; font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, sans-serif; background: var(--bg); color: var(--text); }
header, main { max-width: 60rem; margin: 0 auto; padding: 0 1rem; }
header { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; align-items: center; padding-block: 1rem; border-bottom: 1px solid var(--border); }
header h1 { font-size: 1.25rem; margin: 0 auto 0 0; }
nav { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
a { color: var(--accent); }
nav a[aria-current] { font-weight: 700; text-decoration: none; }
h2 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 1rem; margin: 1rem 0; }
.muted { color: var(--muted); }
.msg { padding: 0.75rem 1rem; border-radius: 8px; background: var(--ok-bg); overflow-wrap: anywhere; }
.err { padding: 0.75rem 1rem; border-radius: 8px; background: var(--bad-bg); color: var(--bad); }
label { display: block; font-weight: 600; margin: 0.75rem 0 0.25rem; }
label.inline { display: flex; gap: 0.5rem; font-weight: 400; align-items: flex-start; }
input[type=text], input[type=password], input[type=file] { font: inherit; width: 100%; max-width: 28rem; padding: 0.45rem 0.6rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); }
button { font: inherit; padding: 0.45rem 1rem; min-height: 2.5rem; border-radius: 8px; border: 1px solid var(--accent); background: var(--accent); color: var(--surface); cursor: pointer; }
button.secondaire { background: transparent; color: var(--accent); }
button.danger { background: transparent; border-color: var(--bad); color: var(--bad); }
:is(a, button, input, summary):focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border); vertical-align: top; }
code { overflow-wrap: anywhere; }
details { margin-top: 0.5rem; }
fieldset { border: 1px solid var(--border); border-radius: 8px; margin: 0.75rem 0 0; }
legend { font-weight: 600; padding: 0 0.25rem; }
input.court { max-width: 8rem; }
summary { cursor: pointer; color: var(--accent); }
.site { display: grid; gap: 0.25rem; }
.site h3 { margin: 0; font-size: 1.05rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; margin-top: 0.5rem; }
.actions input[type=password] { max-width: 14rem; }
@media (max-width: 600px) { thead { display: none; } tr, td { display: block; } td { border: none; padding: 0.15rem 0; } tr { border-bottom: 1px solid var(--border); padding: 0.5rem 0; } }
</style>
</head>
<body>
<header>
  <h1>Portail Abbon</h1>
  <?php if ($moi): ?>
  <nav aria-label="Portail">
    <a href="?page=sites"<?= $page === 'sites' ? ' aria-current="page"' : '' ?>>Mes sites</a>
    <a href="?page=deposer"<?= $page === 'deposer' ? ' aria-current="page"' : '' ?>>Déposer un site</a>
    <a href="?page=compte"<?= $page === 'compte' ? ' aria-current="page"' : '' ?>>Mon compte</a>
    <?php if ($admin): ?><a href="?page=admin"<?= $page === 'admin' ? ' aria-current="page"' : '' ?>>Administration</a><?php endif; ?>
    <form method="post"><?= champ_jeton() ?><input type="hidden" name="action" value="deconnexion"><button class="secondaire">Se déconnecter</button></form>
  </nav>
  <?php endif; ?>
</header>
<main>
<?php if ($message): ?><p class="msg" role="status"><?= h($message) ?></p><?php endif; ?>
<?php if ($erreur): ?><p class="err" role="alert"><?= h($erreur) ?></p><?php endif; ?>

<?php if (!$installe): ?>
  <h2>Installation</h2>
  <p>Créez le compte administrateur du portail. Le <strong>code d'installation</strong> se trouve dans le fichier
  <code>_portail/donnees/installation.php</code>, sur le serveur : l'ouvrir par FTP (ou le gestionnaire de fichiers de
  l'hébergeur) et recopier le code. Il ne sert qu'une fois.</p>
  <form method="post" class="panel">
    <?= champ_jeton() ?><input type="hidden" name="action" value="installer">
    <label for="code">Code d'installation</label><input type="text" id="code" name="code" required autocomplete="off">
    <label for="login">Identifiant de l'administrateur</label><input type="text" id="login" name="login" required autocomplete="username" pattern="[a-z0-9][a-z0-9._\-]{1,39}" aria-describedby="login-aide">
    <p id="login-aide" class="muted">Lettres minuscules sans accent, chiffres, point, tiret.</p>
    <label for="nom">Nom affiché</label><input type="text" id="nom" name="nom">
    <label for="mdp">Mot de passe (10 caractères au moins)</label><input type="password" id="mdp" name="motdepasse" required minlength="10" autocomplete="new-password">
    <label for="mdp2">Mot de passe, de nouveau</label><input type="password" id="mdp2" name="motdepasse2" required minlength="10" autocomplete="new-password">
    <p><button>Installer le portail</button></p>
  </form>

<?php elseif (!$moi): ?>
  <h2>Connexion</h2>
  <form method="post" class="panel">
    <?= champ_jeton() ?><input type="hidden" name="action" value="connexion">
    <label for="login">Identifiant</label><input type="text" id="login" name="login" required autocomplete="username">
    <label for="mdp">Mot de passe</label><input type="password" id="mdp" name="motdepasse" required autocomplete="current-password">
    <p><button>Se connecter</button></p>
  </form>
  <p class="muted">Les comptes sont créés par l'administrateur du portail.</p>

<?php elseif ($page === 'deposer'): ?>
  <h2>Déposer un site</h2>
  <p>Dans Abbon : <em>Administration › Exporter</em>, choisir les QCM, puis <em>Site web</em> (entraînement, ou examen
  corrigé par le serveur). Déposer ici l'archive <code>.zip</code> obtenue, sans la décompresser. Le portail n'en garde
  que les données (questions, images, corrigé, mot de passe de l'espace enseignant) : le lecteur et le correcteur
  installés sont ceux du portail.</p>
  <form method="post" enctype="multipart/form-data" class="panel">
    <?= champ_jeton() ?><input type="hidden" name="action" value="deposer">
    <label for="archive">Archive du site (.zip, <?= h($limite) ?> au plus)</label>
    <input type="file" id="archive" name="archive" accept=".zip,application/zip" required>
    <label for="dossier">Nom du dossier</label>
    <input type="text" id="dossier" name="dossier" pattern="[a-z0-9][a-z0-9\-]{0,58}[a-z0-9]" placeholder="interro-math-decembre" aria-describedby="dossier-aide" value="<?= h(isset($_GET['dossier']) ? $_GET['dossier'] : '') ?>">
    <p id="dossier-aide" class="muted">Adresse du site : <code><?= h($chemin) ?><em>nom-du-dossier</em>/</code> — minuscules sans accent, chiffres et tirets. Vide : d'après le nom de l'archive.</p>
    <label for="titre">Titre affiché dans le portail (facultatif)</label><input type="text" id="titre" name="titre" maxlength="120">
    <label class="inline"><input type="checkbox" name="remplacer" value="1"<?= isset($_GET['dossier']) ? ' checked' : '' ?>> Remplacer le site de ce nom (nouvelle version : réglages, copies des élèves, mot de passe de l'espace enseignant et état de l'examen sont gardés)</label>
    <label for="confirmation-depot">Votre mot de passe (seulement pour remplacer)</label><input type="password" id="confirmation-depot" name="confirmation" autocomplete="current-password">
    <p><button>Déposer</button></p>
  </form>

<?php elseif ($page === 'compte'): ?>
  <h2>Mon compte</h2>
  <p>Identifiant : <strong><?= h($moi) ?></strong><?= $admin ? ' (administrateur)' : '' ?>.</p>
  <form method="post" class="panel">
    <?= champ_jeton() ?><input type="hidden" name="action" value="motdepasse">
    <label for="ancien">Mot de passe actuel</label><input type="password" id="ancien" name="confirmation" required autocomplete="current-password">
    <label for="nouveau">Nouveau mot de passe (10 caractères au moins)</label><input type="password" id="nouveau" name="motdepasse" required minlength="10" autocomplete="new-password">
    <label for="nouveau2">Nouveau mot de passe, de nouveau</label><input type="password" id="nouveau2" name="motdepasse2" required minlength="10" autocomplete="new-password">
    <p><button>Changer le mot de passe</button></p>
  </form>

<?php elseif ($page === 'admin' && $admin): ?>
  <h2>Comptes</h2>
  <table>
    <thead><tr><th>Identifiant</th><th>Nom</th><th>Sites</th><th>Actions</th></tr></thead>
    <tbody>
    <?php foreach ($comptes as $login => $c): $n = count(array_filter($sites, function ($s) use ($login) { return $s['proprietaire'] === $login; })); ?>
      <tr>
        <td><?= h($login) ?><?= !empty($c['admin']) ? ' <span class="muted">(admin)</span>' : '' ?></td>
        <td><?= h($c['nom']) ?></td>
        <td><?= $n ?></td>
        <td><?php if ($login !== $moi): ?>
          <details><summary>Gérer</summary>
            <form method="post" class="actions"><?= champ_jeton() ?><input type="hidden" name="login" value="<?= h($login) ?>">
              <label for="conf-<?= h($login) ?>" class="muted">Votre mot de passe</label>
              <input type="password" id="conf-<?= h($login) ?>" name="confirmation" required autocomplete="current-password">
              <button name="action" value="reinitialiser" class="secondaire">Nouveau mot de passe</button>
              <button name="action" value="supprimer-compte" class="danger">Supprimer le compte</button>
            </form>
          </details>
        <?php endif; ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <form method="post" class="panel">
    <h3>Créer un compte</h3>
    <?= champ_jeton() ?><input type="hidden" name="action" value="creer-compte">
    <label for="nlogin">Identifiant</label><input type="text" id="nlogin" name="login" required pattern="[a-z0-9][a-z0-9._\-]{1,39}" placeholder="m.martin">
    <label for="nnom">Nom affiché</label><input type="text" id="nnom" name="nom" placeholder="Mme Martin">
    <label class="inline"><input type="checkbox" name="admin" value="1"> Administrateur (gère les comptes, voit et supprime tous les sites, met le portail à jour)</label>
    <label for="nconf">Votre mot de passe</label><input type="password" id="nconf" name="confirmation" required autocomplete="current-password">
    <p class="muted">Un mot de passe est créé et affiché une seule fois, à transmettre au titulaire, qui pourra le changer.</p>
    <p><button>Créer le compte</button></p>
  </form>

  <h2>Mise à jour</h2>
  <p>Portail version <strong><?= h(PORTAIL_VERSION) ?></strong>. Le portail installe dans chaque site son propre
  lecteur et son propre correcteur : il doit être au moins aussi récent que la version d'Abbon des enseignants. Pour
  passer à une nouvelle version, déposer ici le paquet <code>Abbon-portail-X.Y.Z.zip</code> de cette version, puis
  mettre à jour les sites (leurs données, réglages, copies et mots de passe ne changent pas).</p>
  <form method="post" enctype="multipart/form-data" class="panel">
    <?= champ_jeton() ?><input type="hidden" name="action" value="mettre-a-jour">
    <label for="paquet">Paquet du portail (.zip)</label><input type="file" id="paquet" name="paquet" accept=".zip" required>
    <label for="mconf">Votre mot de passe</label><input type="password" id="mconf" name="confirmation" required autocomplete="current-password">
    <p><button>Mettre le portail à jour</button></p>
  </form>
  <form method="post" class="panel">
    <?= champ_jeton() ?><input type="hidden" name="action" value="mettre-a-jour-sites">
    <label for="sconf">Votre mot de passe</label><input type="password" id="sconf" name="confirmation" required autocomplete="current-password">
    <p><button class="secondaire">Mettre à jour tous les sites</button></p>
  </form>

<?php else: ?>
  <h2><?= $admin ? 'Tous les sites' : 'Mes sites' ?> (<?= count($visibles) ?>)</h2>
  <?php if (!$visibles): ?><p>Aucun site pour l'instant. <a href="?page=deposer">Déposer un site</a> exporté par Abbon.</p><?php endif; ?>
  <?php foreach ($visibles as $nom => $s): $url = $chemin . $nom . '/'; $mdp = $s['examen'] ? portail_mot_de_passe_site($nom) : null; ?>
  <section class="panel site" aria-labelledby="s-<?= h($nom) ?>">
    <h3 id="s-<?= h($nom) ?>"><?= h($s['titre']) ?></h3>
    <p class="muted"><?= $s['examen'] ? 'Examen corrigé par le serveur' : 'Site d\'entraînement' ?> · <?= h(date('d/m/Y H:i', strtotime($s['modifie']))) ?><?= $admin ? ' · ' . h(isset($comptes[$s['proprietaire']]) ? $comptes[$s['proprietaire']]['nom'] : $s['proprietaire']) : '' ?></p>
    <p>Site : <a href="<?= h($url) ?>"><?= h($url) ?></a></p>
    <?php if ($s['examen']): ?>
      <p>Espace enseignant : <a href="<?= h($url) ?>examen/enseignant.php"><?= h($url) ?>examen/enseignant.php</a></p>
      <details<?= $action === 'mdp-site' && p('dossier') === $nom && !$erreur ? ' open' : '' ?>><summary>Mot de passe de l'espace enseignant</summary>
        <p><code><?= h($mdp) ?></code></p>
        <form method="post" class="actions"><?= champ_jeton() ?><input type="hidden" name="action" value="mdp-site"><input type="hidden" name="dossier" value="<?= h($nom) ?>">
          <label for="mdps-<?= h($nom) ?>" class="muted">Votre mot de passe</label>
          <input type="password" id="mdps-<?= h($nom) ?>" name="confirmation" required autocomplete="current-password">
          <button class="secondaire">Changer ce mot de passe</button>
        </form>
      </details>
    <?php endif; ?>
    <?php $r = portail_reglages_site($nom); ?>
    <details><summary>Réglages</summary>
      <form method="post" class="panel"><?= champ_jeton() ?><input type="hidden" name="action" value="reglages"><input type="hidden" name="dossier" value="<?= h($nom) ?>">
        <?php if ($s['examen']): ?>
          <fieldset><legend>Corrigé</legend>
            <?php foreach (array('enseignant' => 'publié dans l\'espace enseignant', 'fin' => 'dès que l\'élève rend sa copie', 'jamais' => 'jamais (note et détail seulement)') as $v => $l): ?>
            <label class="inline"><input type="radio" name="corrige" value="<?= $v ?>"<?= $r['corrige'] === $v ? ' checked' : '' ?>> <?= h($l) ?></label>
            <?php endforeach; ?>
          </fieldset>
          <fieldset><legend>Copies gardées sur le serveur</legend>
            <label class="inline"><input type="radio" name="copies" value="oui"<?= $r['copies'] === 'oui' ? ' checked' : '' ?>> oui (nom de l'élève demandé)</label>
            <label class="inline"><input type="radio" name="copies" value="non"<?= $r['copies'] === 'non' ? ' checked' : '' ?>> non (note seule)</label>
          </fieldset>
        <?php else: ?>
          <fieldset><legend>Modes</legend>
            <?php foreach (array('les-deux' => 'entraînement et examen', 'entrainement' => 'entraînement seulement', 'examen' => 'examen seulement') as $v => $l): ?>
            <label class="inline"><input type="radio" name="modes" value="<?= $v ?>"<?= $r['modes'] === $v ? ' checked' : '' ?>> <?= h($l) ?></label>
            <?php endforeach; ?>
          </fieldset>
          <fieldset><legend>Corrigé de l'examen</legend>
            <label class="inline"><input type="radio" name="corrige" value="fin"<?= $r['corrige'] === 'fin' ? ' checked' : '' ?>> après l'envoi des réponses</label>
            <label class="inline"><input type="radio" name="corrige" value="jamais"<?= $r['corrige'] === 'jamais' ? ' checked' : '' ?>> jamais</label>
          </fieldset>
        <?php endif; ?>
        <label for="seuil-<?= h($nom) ?>">Seuil de réussite en % (vide : celui de chaque QCM)</label>
        <input type="text" inputmode="decimal" id="seuil-<?= h($nom) ?>" name="seuil" value="<?= h($r['seuil']) ?>" class="court">
        <label for="tirage-<?= h($nom) ?>">Questions tirées au hasard par examen (vide : toutes)</label>
        <input type="text" inputmode="numeric" id="tirage-<?= h($nom) ?>" name="tirage" value="<?= h($r['tirage']) ?>" class="court">
        <label for="points-<?= h($nom) ?>">Points (ceintures) d'un QCM réussi en mode examen : 0 pour aucun (vide : comme à l'entraînement)</label>
        <input type="text" inputmode="numeric" id="points-<?= h($nom) ?>" name="points" value="<?= h($r['points']) ?>" class="court">
        <p><button>Enregistrer les réglages</button></p>
      </form>
    </details>
    <div class="actions">
      <a href="?page=deposer&amp;dossier=<?= h(urlencode($nom)) ?>">Remplacer par une nouvelle version</a>
    </div>
    <details><summary>Supprimer ce site</summary>
      <form method="post" class="actions"><?= champ_jeton() ?><input type="hidden" name="action" value="supprimer"><input type="hidden" name="dossier" value="<?= h($nom) ?>">
        <p class="muted">Le site et toutes ses copies d'élèves seront supprimés<?= $s['examen'] ? ' : télécharger d\'abord les copies (CSV) dans l\'espace enseignant' : '' ?>.</p>
        <label for="del-<?= h($nom) ?>" class="muted">Votre mot de passe</label>
        <input type="password" id="del-<?= h($nom) ?>" name="confirmation" required autocomplete="current-password">
        <button class="danger">Supprimer « <?= h($nom) ?> »</button>
      </form>
    </details>
  </section>
  <?php endforeach; ?>
<?php endif; ?>
</main>
</body>
</html>
