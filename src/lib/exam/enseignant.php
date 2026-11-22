<?php
/*
 * Abbon — espace enseignant d'un examen corrigé par le serveur.
 *
 * Ouvrir examen/enseignant.php dans un navigateur et saisir le mot de passe de config.php :
 *  - corrigé : avec corrige: "enseignant" dans reglages.js, le publier (ou le retirer) QCM par QCM, quand le temps
 *    de l'épreuve est écoulé ; les élèves voient alors le détail par question et le corrigé ;
 *  - copies : liste (nom, classe ou groupe, QCM, note, durée) et téléchargement au format CSV (tableur). Les copies
 *    sont dans copies/copies.php (une ligne JSON par copie) : les supprimer par FTP pour repartir de zéro.
 * Ne pas modifier : ce fichier est régénéré à chaque export.
 */

define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/corriger.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");
header('Referrer-Policy: no-referrer');

$config = is_readable(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : array();
$secret = is_array($config) && isset($config['motDePasse']) ? (string) $config['motDePasse'] : '';
if (is_array($config) && !empty($config['fuseau'])) @date_default_timezone_set($config['fuseau']);

function h($s) {
  return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Cellule CSV : guillemets doublés, formules neutralisées (= + - @ en tête). */
function abbon_cellule($v) {
  $v = (string) $v;
  if ($v !== '' && strpos('=+-@', $v[0]) !== false && !is_numeric($v)) $v = "'" . $v;
  return '"' . str_replace('"', '""', $v) . '"';
}

function abbon_duree($sec) {
  if ($sec === null) return '';
  $sec = (int) $sec;
  return $sec >= 3600 ? sprintf('%d:%02d:%02d', intdiv($sec, 3600), intdiv($sec % 3600, 60), $sec % 60) : sprintf('%d:%02d', intdiv($sec, 60), $sec % 60);
}

function abbon_nombre($n) {
  return str_replace('.', ',', (string) round((float) $n, 2));
}

function abbon_date($iso) {
  $t = strtotime((string) $iso);
  return $t ? date('d/m/Y H:i', $t) : (string) $iso;
}

$given = isset($_POST['motdepasse']) ? (string) $_POST['motdepasse'] : '';
$ok = $secret !== '' && $given !== '' && hash_equals($secret, $given);
if ($given !== '' && !$ok) sleep(2);

// Publication du corrigé (mode « enseignant »).
$solutions = require __DIR__ . '/solutions.php';
$corrige = abbon_corrige(is_array($solutions) && isset($solutions['corrige']) ? $solutions['corrige'] : 'enseignant');
$quizTitles = array();
if (is_array($solutions) && isset($solutions['quizzes'])) {
  foreach ($solutions['quizzes'] as $id => $q) $quizTitles[$id] = isset($q['title']) ? $q['title'] : $id;
}
$published = abbon_publication(__DIR__ . '/copies');
$notice = '';
$action = isset($_POST['action']) ? (string) $_POST['action'] : '';
if ($ok && $corrige === 'enseignant' && $action !== '') {
  $target = isset($_POST['cible']) ? (string) $_POST['cible'] : '';
  $next = $published;
  if ($action === 'publier' && isset($quizTitles[$target])) $next[$target] = gmdate('Y-m-d\TH:i:s\Z');
  elseif ($action === 'retirer') unset($next[$target]);
  elseif ($action === 'publier-tout') { foreach ($quizTitles as $id => $t) if (!isset($next[$id])) $next[$id] = gmdate('Y-m-d\TH:i:s\Z'); }
  elseif ($action === 'retirer-tout') $next = array();
  if ($next !== $published) {
    if (abbon_publier(__DIR__ . '/copies', $next)) {
      $notice = count($next) > count($published) ? 'Corrigé publié.' : 'Corrigé retiré.';
      $published = $next;
    } else {
      $notice = 'Impossible d\'écrire dans le dossier examen/copies/ : vérifier ses droits d\'écriture.';
    }
  }
}

$copies = $ok ? abbon_lire_copies(__DIR__ . '/copies') : array();
$titles = array();
foreach ($copies as $c) $titles[$c['qcm']] = $c['titre'];
asort($titles);
$filtre = isset($_POST['qcm']) && isset($titles[$_POST['qcm']]) ? $_POST['qcm'] : '';
if ($filtre !== '') $copies = array_values(array_filter($copies, function ($c) use ($filtre) { return $c['qcm'] === $filtre; }));

if ($ok && isset($_POST['format']) && $_POST['format'] === 'csv') {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="copies-' . date('Y-m-d') . '.csv"');
  $rows = array(array('Date', 'Nom', 'Classe ou groupe', 'QCM', 'Note', 'Sur', 'Pourcentage', 'Réussi', 'Durée', 'Identifiant'));
  foreach ($copies as $c) {
    $rows[] = array(
      abbon_date($c['date']), $c['nom'], $c['groupe'], $c['titre'], abbon_nombre($c['note']), abbon_nombre($c['sur']),
      $c['sur'] > 0 ? abbon_nombre(100 * $c['note'] / $c['sur']) : '', $c['reussi'] ? 'oui' : 'non', abbon_duree($c['duree']), $c['id'],
    );
  }
  echo "\xEF\xBB\xBF"; // UTF-8 reconnu par les tableurs
  foreach ($rows as $r) echo implode(';', array_map('abbon_cellule', $r)) . "\r\n";
  exit;
}

header('Content-Type: text/html; charset=utf-8');
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Espace enseignant — Abbon</title>
<style>
  :root { color-scheme: light dark; --fg: #1d2a1f; --bg: #fafaf7; --muted: #5f685a; --line: #d9dcd3; --accent: #2e6b1f; --bad: #b3261e; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e6eae2; --bg: #161a15; --muted: #a6ae9f; --line: #3a4136; --accent: #8fd06f; --bad: #ff8a80; } }
  body { font: 16px/1.5 system-ui, sans-serif; color: var(--fg); background: var(--bg); margin: 0 auto; padding: 1rem; max-width: 72rem; }
  h1 { font-size: 1.5rem; }
  form { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin-block: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 600; }
  input, select, button { font: inherit; padding: 0.4rem 0.6rem; border: 1px solid var(--line); border-radius: 0.4rem; background: transparent; color: inherit; }
  button { background: var(--accent); color: var(--bg); border-color: var(--accent); cursor: pointer; }
  button.secondary { background: transparent; color: var(--accent); }
  .table { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--line); }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: var(--muted); }
  .error { color: var(--bad); font-weight: 600; }
  h2 { font-size: 1.2rem; margin-top: 2rem; }
  form.inline { display: inline; margin: 0; }
  .ok { color: var(--accent); font-weight: 600; }
</style>
</head>
<body>
<main>
<h1>Espace enseignant</h1>
<?php if ($secret === ''): ?>
  <p class="error">Consultation désactivée : indiquer un mot de passe dans examen/config.php.</p>
<?php elseif (!$ok): ?>
  <?php if ($given !== ''): ?><p class="error" role="alert">Mot de passe incorrect.</p><?php endif; ?>
  <form method="post">
    <label>Mot de passe <input type="password" name="motdepasse" autocomplete="current-password" required autofocus></label>
    <button type="submit">Afficher les copies</button>
  </form>
  <p class="muted">Le mot de passe est dans le fichier examen/config.php (voir LISEZMOI.txt).</p>
<?php else: ?>
  <h2>Corrigé</h2>
  <?php if ($notice !== ''): ?><p class="<?= strpos($notice, 'Impossible') === 0 ? 'error' : 'ok' ?>" role="status"><?= h($notice) ?></p><?php endif; ?>
  <?php if ($corrige === 'enseignant'): ?>
    <p>Tant que le corrigé d'un QCM n'est pas publié, les élèves ne voient que leur note. Une fois publié, ils voient le
      détail par question et le corrigé (y compris ceux qui ont déjà rendu leur copie, en revenant sur leur résultat).</p>
    <div class="table" tabindex="0" role="region" aria-label="Publication du corrigé">
    <table>
      <thead><tr><th scope="col">QCM</th><th scope="col">Corrigé</th><th scope="col"><span class="muted">Action</span></th></tr></thead>
      <tbody>
      <?php foreach ($quizTitles as $id => $t): ?>
        <tr>
          <td><?= h($t) ?></td>
          <td><?= isset($published[$id]) ? 'publié le ' . h(abbon_date($published[$id])) : '<span class="muted">non publié</span>' ?></td>
          <td>
            <form method="post" class="inline">
              <input type="hidden" name="motdepasse" value="<?= h($given) ?>">
              <input type="hidden" name="cible" value="<?= h($id) ?>">
              <?php if (isset($published[$id])): ?>
                <button type="submit" name="action" value="retirer" class="secondary" aria-label="Retirer le corrigé : <?= h($t) ?>">Retirer</button>
              <?php else: ?>
                <button type="submit" name="action" value="publier" aria-label="Publier le corrigé : <?= h($t) ?>">Publier</button>
              <?php endif; ?>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    </div>
    <?php if (count($quizTitles) > 1): ?>
      <form method="post">
        <input type="hidden" name="motdepasse" value="<?= h($given) ?>">
        <button type="submit" name="action" value="publier-tout">Publier tous les corrigés</button>
        <button type="submit" name="action" value="retirer-tout" class="secondary">Tout retirer</button>
      </form>
    <?php endif; ?>
  <?php elseif ($corrige === 'fin'): ?>
    <p>reglages.js : corrige "fin" — chaque élève reçoit le détail par question et le corrigé dès qu'il rend sa copie.
      Pour les publier vous-même, une fois l'épreuve terminée, indiquer corrige: "enseignant".</p>
  <?php else: ?>
    <p>reglages.js : corrige "jamais" — les élèves voient leur note et le détail par question, jamais le corrigé.
      Pour le publier vous-même, une fois l'épreuve terminée, indiquer corrige: "enseignant".</p>
  <?php endif; ?>

  <h2>Copies</h2>
  <?php if (!abbon_collecte()): ?><p class="muted">reglages.js : copies "non" — les nouvelles copies ne sont pas gardées.</p><?php endif; ?>
  <form method="post">
    <input type="hidden" name="motdepasse" value="<?= h($given) ?>">
    <label>QCM
      <select name="qcm">
        <option value="">Tous</option>
        <?php foreach ($titles as $id => $t): ?><option value="<?= h($id) ?>"<?= $id === $filtre ? ' selected' : '' ?>><?= h($t) ?></option><?php endforeach; ?>
      </select>
    </label>
    <button type="submit" class="secondary">Afficher</button>
    <button type="submit" name="format" value="csv">Télécharger (CSV)</button>
  </form>
  <p><?= count($copies) ?> copie<?= count($copies) > 1 ? 's' : '' ?>, de la plus récente à la plus ancienne.</p>
  <?php if ($copies): ?>
  <div class="table" tabindex="0" role="region" aria-label="Copies">
  <table>
    <thead><tr><th scope="col">Date</th><th scope="col">Nom</th><th scope="col">Classe ou groupe</th><th scope="col">QCM</th><th scope="col">Note</th><th scope="col">%</th><th scope="col">Réussi</th><th scope="col">Durée</th></tr></thead>
    <tbody>
    <?php foreach ($copies as $c): ?>
      <tr>
        <td><?= h(abbon_date($c['date'])) ?></td>
        <td><?= $c['nom'] !== '' ? h($c['nom']) : '<span class="muted">(sans nom)</span>' ?></td>
        <td><?= h($c['groupe']) ?></td>
        <td><?= h($c['titre']) ?></td>
        <td class="num"><?= h(abbon_nombre($c['note'])) ?> / <?= h(abbon_nombre($c['sur'])) ?></td>
        <td class="num"><?= $c['sur'] > 0 ? h(abbon_nombre(100 * $c['note'] / $c['sur'])) : '' ?></td>
        <td><?= $c['reussi'] ? 'oui' : 'non' ?></td>
        <td class="num"><?= h(abbon_duree($c['duree'])) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  </div>
  <?php endif; ?>
<?php endif; ?>
</main>
</body>
</html>
