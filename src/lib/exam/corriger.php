<?php
/*
 * Abbon — correction des examens côté serveur.
 *
 * Le site exporté en « examen corrigé par le serveur » ne contient pas les réponses attendues : le navigateur
 * envoie ici les réponses de l'élève (POST, JSON), ce script les note avec le corrigé de solutions.php et
 * renvoie la note ; le détail par question et le corrigé suivent reglages.js (corrige: "enseignant" : quand
 * l'enseignant les publie dans enseignant.php ; "fin" : tout de suite ; "jamais"). Si reglages.js dit
 * copies: "oui", la copie (nom, note, réponses) est ajoutée à copies/copies.php, consultable dans enseignant.php
 * (mot de passe : config.php).
 *
 * Aucune base de données. PHP 7.4 ou plus récent. Ne pas modifier : ce fichier est régénéré à chaque export.
 * La notation reproduit celle de l'application (src/lib/domain/scoring.ts).
 */

const ABBON_EXAMEN = true;

function abbon_space_class() {
  return '[\s\x{00A0}\x{1680}\x{2000}-\x{200A}\x{2028}\x{2029}\x{202F}\x{205F}\x{3000}\x{FEFF}]';
}

/** Texte comparable : apostrophes et espaces unifiés, espaces superflus retirés, majuscules ignorées. */
function abbon_normalize($s, $caseSensitive) {
  $t = (string) $s;
  if (class_exists('Normalizer')) {
    $n = Normalizer::normalize($t, Normalizer::FORM_C);
    if ($n !== false) $t = $n;
  }
  $t = preg_replace('/[\x{2018}\x{2019}\x{02BC}]/u', "'", $t);
  $t = preg_replace('/' . abbon_space_class() . '+/u', ' ', $t);
  $t = trim($t, ' ');
  return $caseSensitive ? $t : mb_strtolower($t, 'UTF-8');
}

/** Nombre saisi (virgule ou point, espaces de milliers, notation scientifique) ou null. */
function abbon_parse_number($s) {
  $t = preg_replace('/[\x{2212}\x{2013}]/u', '-', (string) $s);
  $t = preg_replace('/' . abbon_space_class() . '/u', '', $t);
  $t = preg_replace('/×10\^?/iu', 'e', $t);
  if (strpos($t, ',') !== false && strpos($t, '.') === false) {
    $i = strpos($t, ',');
    $t = substr($t, 0, $i) . '.' . substr($t, $i + 1);
  }
  if (!preg_match('/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i', $t)) return null;
  $n = (float) $t;
  return is_finite($n) ? $n : null;
}

function abbon_text_matches($accepted, $given, $caseSensitive) {
  if (!is_string($given) || trim($given) === '') return false;
  $g = abbon_normalize($given, $caseSensitive);
  foreach ($accepted as $a) {
    if (is_string($a) && trim($a) !== '' && abbon_normalize($a, $caseSensitive) === $g) return true;
  }
  return false;
}

function abbon_close($a, $b) {
  return abs($a - $b) <= 1e-7 * max(1, abs($a), abs($b));
}

/** Expression : valeurs de la formule de l'élève aux points de test, comparées à celles de l'attendue. */
function abbon_same_values($expected, $given, $constant, $hasVars) {
  if (!is_array($given) || count($given) !== count($expected)) return false;
  $valid = 0;
  $diff = null;
  foreach ($expected as $i => $ev) {
    if (!is_int($ev) && !is_float($ev)) continue;
    $gv = $given[$i];
    if (!is_int($gv) && !is_float($gv)) return false;
    if ($constant) {
      $d = $gv - $ev;
      if ($diff === null) $diff = $d;
      elseif (!abbon_close($d, $diff)) return false;
    } elseif (!abbon_close($ev, $gv)) return false;
    $valid++;
  }
  return $hasVars ? $valid >= 5 : $valid === 1;
}

function abbon_round2($n) {
  return round($n * 100) / 100;
}

/** Note une question : ['points' => …, 'correct' => …]. */
function abbon_score_question($q, $a, $rule) {
  $points = (float) $q['points'];
  $type = $q['type'];
  $e = isset($q['expected']) && is_array($q['expected']) ? $q['expected'] : array();
  $text = isset($a['text']) && is_string($a['text']) ? $a['text'] : null;
  $ok = false;

  if ($type === 'cloze') {
    $gaps = isset($e['gaps']) && is_array($e['gaps']) ? $e['gaps'] : array();
    $texts = isset($a['texts']) && is_array($a['texts']) ? $a['texts'] : array();
    $good = 0;
    foreach ($gaps as $i => $g) {
      $select = $g['kind'] === 'select';
      $accepted = isset($g['accepted']) && is_array($g['accepted']) ? $g['accepted'] : array();
      if ($select) $accepted = array_slice($accepted, 0, 1);
      $cs = $select ? true : !empty($g['caseSensitive']);
      if (abbon_text_matches($accepted, isset($texts[$i]) ? $texts[$i] : null, $cs)) $good++;
    }
    $n = count($gaps);
    $all = $n > 0 && $good === $n;
    if ($rule === 'all_or_nothing' || $n === 0) return array('points' => $all ? $points : 0, 'correct' => $all);
    return array('points' => abbon_round2(($good / $n) * $points), 'correct' => $all);
  }
  if ($type === 'flashcard') {
    $ok = $text === 'known';
    return array('points' => $ok ? $points : 0, 'correct' => $ok);
  }
  if ($type === 'short') {
    $ok = abbon_text_matches(isset($e['accepted']) ? $e['accepted'] : array(), $text, !empty($e['caseSensitive']));
    return array('points' => $ok ? $points : 0, 'correct' => $ok);
  }
  if ($type === 'numeric') {
    $n = $text === null || trim($text) === '' ? null : abbon_parse_number($text);
    if ($n !== null && isset($e['value']) && (is_int($e['value']) || is_float($e['value']))) {
      $tol = max(0, isset($e['tolerance']) ? (float) $e['tolerance'] : 0);
      $eps = 1e-9 * max(1, abs($e['value']), $tol);
      $ok = abs($n - $e['value']) <= $tol + $eps;
    }
    return array('points' => $ok ? $points : 0, 'correct' => $ok);
  }
  if ($type === 'expression') {
    $values = isset($a['values']) ? $a['values'] : null;
    $ok = $text !== null && trim($text) !== '' && isset($q['values'])
      && abbon_same_values($q['values'], $values, !empty($e['constant']), !empty($q['hasVars']));
    return array('points' => $ok ? $points : 0, 'correct' => $ok);
  }

  // Choix unique ou multiples.
  $known = array();
  $expected = array();
  foreach ($q['choices'] as $c) {
    $known[$c['id']] = true;
    if (!empty($c['correct'])) $expected[$c['id']] = true;
  }
  $picked = array();
  foreach (isset($a['selected']) && is_array($a['selected']) ? $a['selected'] : array() as $id) {
    if (is_string($id) && isset($known[$id])) $picked[$id] = true;
  }
  $good = 0;
  $bad = 0;
  foreach (array_keys($picked) as $id) {
    if (isset($expected[$id])) $good++;
    else $bad++;
  }
  $exact = $bad === 0 && $good === count($expected) && count($expected) > 0;
  if ($type === 'single') {
    $ok = count($picked) === 1 && $exact;
    return array('points' => $ok ? $points : 0, 'correct' => $ok);
  }
  if ($rule === 'all_or_nothing' || count($expected) === 0) return array('points' => $exact ? $points : 0, 'correct' => $exact);
  $ratio = max(0, ($good - $bad) / count($expected));
  return array('points' => abbon_round2($ratio * $points), 'correct' => $exact);
}

/** Corrigé d'une question, tel que le site l'affiche (sans les valeurs de test des expressions). */
function abbon_solution($q) {
  $choices = array();
  foreach ($q['choices'] as $c) {
    $choices[] = array('id' => $c['id'], 'correct' => !empty($c['correct']), 'feedback' => isset($c['feedback']) ? $c['feedback'] : null);
  }
  return array(
    'choices' => $choices,
    'expected' => isset($q['expected']) ? $q['expected'] : null,
    'explanation' => isset($q['explanation']) ? $q['explanation'] : null,
  );
}

/**
 * Corrige une demande : ['quiz' => id, 'questions' => [ids], 'answers' => [id => réponse]].
 * Renvoie le résultat complet (note, détail par question, corrigé), ou ['error' => code] ; ce que l'élève en
 * reçoit est choisi par abbon_visible.
 */
function abbon_corriger($solutions, $request) {
  if (!is_array($request) || !isset($request['quiz']) || !is_string($request['quiz'])) return array('error' => 'requete');
  if (!isset($solutions['quizzes'][$request['quiz']])) return array('error' => 'qcm');
  $quiz = $solutions['quizzes'][$request['quiz']];
  $ids = isset($request['questions']) && is_array($request['questions']) ? $request['questions'] : array();
  $answers = isset($request['answers']) && is_array($request['answers']) ? $request['answers'] : array();
  $score = 0;
  $max = 0;
  $per = array();
  $sols = array();
  foreach ($ids as $id) {
    if (!is_string($id) || !isset($quiz['questions'][$id]) || isset($per[$id])) continue;
    $q = $quiz['questions'][$id];
    $a = isset($answers[$id]) && is_array($answers[$id]) ? $answers[$id] : array();
    $r = abbon_score_question($q, $a, $quiz['scoring']);
    $per[$id] = $r;
    $score += $r['points'];
    $max += (float) $q['points'];
    $sols[$id] = abbon_solution($q);
  }
  if (!$per) return array('error' => 'questions');
  $score = abbon_round2($score);
  $ratio = $max > 0 ? $score / $max : 0;
  $out = array(
    'score' => $score,
    'maxScore' => $max,
    'ratio' => $ratio,
    'passed' => $ratio >= $quiz['passThreshold'],
    'perQuestion' => $per,
    'solutions' => $sols,
  );
  return $out;
}

/**
 * Ce que l'élève reçoit, selon le corrigé de reglages.js :
 *  - fin : note, détail par question et corrigé ;
 *  - jamais : note et détail par question ;
 *  - enseignant : la note seule (locked) tant que l'enseignant n'a pas publié le corrigé de ce QCM
 *    (enseignant.php), puis comme « fin ».
 */
function abbon_visible($out, $corrige, $published) {
  if ($corrige === 'enseignant' && !$published) {
    return array('score' => $out['score'], 'maxScore' => $out['maxScore'], 'ratio' => $out['ratio'], 'passed' => $out['passed'], 'locked' => true);
  }
  if ($corrige === 'jamais') unset($out['solutions']);
  return $out;
}

// ---- Publication du corrigé (mode « enseignant ») ----------------------------------------------------

/** QCM dont le corrigé est publié : [id => date]. Fichier dans copies/, illisible par le web. */
function abbon_publication($dir) {
  $file = $dir . '/publication.php';
  if (!is_readable($file)) return array();
  $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  $data = json_decode(isset($lines[1]) ? $lines[1] : '', true);
  return is_array($data) ? $data : array();
}

function abbon_publier($dir, $published) {
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) return false;
  $json = json_encode((object) $published, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  return @file_put_contents($dir . '/publication.php', "<?php exit; ?>\n" . $json . "\n", LOCK_EX) !== false;
}

/** Valeur d'un réglage de reglages.js (modifiable après l'export), ou null s'il est absent ou illisible. */
function abbon_reglage($name, $file = null) {
  $file = $file === null ? __DIR__ . '/../reglages.js' : $file;
  if (!is_readable($file)) return null;
  $js = preg_replace('~^\s*//.*$~m', '', (string) file_get_contents($file));
  if (preg_match('/\b' . preg_quote($name, '/') . '\s*:\s*["\']\s*([^"\']*?)\s*["\']/u', $js, $m)) return mb_strtolower($m[1], 'UTF-8');
  return null;
}

/** Corrigé « fin », « jamais » ou « enseignant » (publié par l'enseignant) : reglages.js, sinon le choix de l'export. */
function abbon_corrige($default, $file = null) {
  $names = array('fin' => 'fin', 'end' => 'fin', 'jamais' => 'jamais', 'never' => 'jamais', 'enseignant' => 'enseignant', 'teacher' => 'enseignant');
  $v = abbon_reglage('corrige', $file);
  if ($v !== null && isset($names[$v])) return $names[$v];
  return isset($names[$default]) ? $names[$default] : 'enseignant';
}

/** Copies gardées sur le serveur : reglages.js (copies: "oui" ou "non"), oui par défaut. */
function abbon_collecte($file = null) {
  return abbon_reglage('copies', $file) !== 'non';
}

// ---- Copies -------------------------------------------------------------------------------------------

/** Texte saisi par l'élève, nettoyé et tronqué. */
function abbon_texte($s, $max) {
  if (!is_string($s)) return '';
  $s = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s);
  $s = trim(preg_replace('/\s+/u', ' ', (string) $s));
  return mb_substr($s, 0, $max, 'UTF-8');
}

/** Réponses de l'élève, telles qu'il les a données (tronquées). */
function abbon_reponses($ids, $answers) {
  $out = array();
  foreach ($ids as $id) {
    if (!is_string($id) || !isset($answers[$id]) || !is_array($answers[$id])) continue;
    $a = $answers[$id];
    $r = array();
    if (!empty($a['selected']) && is_array($a['selected'])) $r['cases'] = array_slice(array_values(array_filter($a['selected'], 'is_string')), 0, 50);
    if (isset($a['text']) && is_string($a['text']) && $a['text'] !== '') $r['texte'] = mb_substr($a['text'], 0, 500, 'UTF-8');
    if (!empty($a['texts']) && is_array($a['texts'])) {
      $r['trous'] = array_map(function ($t) { return is_string($t) ? mb_substr($t, 0, 200, 'UTF-8') : null; }, array_slice($a['texts'], 0, 50));
    }
    if ($r) $out[$id] = $r;
  }
  return $out;
}

/** Fiche d'une copie corrigée, à enregistrer. */
function abbon_copie($solutions, $request, $result, $now = null) {
  $quizId = $request['quiz'];
  $c = isset($request['candidate']) && is_array($request['candidate']) ? $request['candidate'] : array();
  $a = isset($request['attempt']) && is_array($request['attempt']) ? $request['attempt'] : array();
  $id = isset($a['id']) && is_string($a['id']) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $a['id']) ? $a['id'] : bin2hex(random_bytes(8));
  $points = array();
  foreach ($result['perQuestion'] as $qid => $r) $points[$qid] = $r['points'];
  $quiz = $solutions['quizzes'][$quizId];
  return array(
    'id' => $id,
    'date' => gmdate('Y-m-d\TH:i:s\Z', $now === null ? time() : $now),
    'nom' => abbon_texte(isset($c['name']) ? $c['name'] : '', 100),
    'groupe' => abbon_texte(isset($c['group']) ? $c['group'] : '', 60),
    'qcm' => $quizId,
    'titre' => isset($quiz['title']) ? $quiz['title'] : $quizId,
    'note' => $result['score'],
    'sur' => $result['maxScore'],
    'reussi' => $result['passed'],
    'duree' => isset($a['elapsedSec']) && is_numeric($a['elapsedSec']) ? max(0, min(86400 * 7, (int) $a['elapsedSec'])) : null,
    'points' => $points,
    'reponses' => abbon_reponses(isset($request['questions']) ? $request['questions'] : array(), isset($request['answers']) ? $request['answers'] : array()),
  );
}

const ABBON_COPIES_ENTETE = "<?php exit; ?>\n";

/**
 * Ajoute une copie à $dir/copies.php (une ligne JSON par copie ; la première ligne empêche de lire le fichier par
 * le web). Une copie déjà enregistrée (même identifiant de tentative, envoi répété) n'est pas ajoutée deux fois.
 */
function abbon_enregistrer($dir, $copie) {
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) return false;
  $file = $dir . '/copies.php';
  $h = @fopen($file, 'c+');
  if (!$h) return false;
  $ok = false;
  if (flock($h, LOCK_EX)) {
    $content = stream_get_contents($h);
    if ($content === '' || $content === false) {
      fwrite($h, ABBON_COPIES_ENTETE);
      $content = '';
    }
    if (strpos((string) $content, '"id":' . json_encode($copie['id']) . ',') !== false) {
      $ok = true;
    } else {
      fseek($h, 0, SEEK_END);
      $ok = fwrite($h, json_encode($copie, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION) . "\n") !== false;
    }
    fflush($h);
    flock($h, LOCK_UN);
  }
  fclose($h);
  return $ok;
}

/** Copies enregistrées, de la plus récente à la plus ancienne. */
function abbon_lire_copies($dir) {
  $file = $dir . '/copies.php';
  if (!is_readable($file)) return array();
  $out = array();
  foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $i => $line) {
    if ($i === 0 && strpos($line, '<?php') === 0) continue;
    $c = json_decode($line, true);
    if (is_array($c) && isset($c['id'])) $out[] = $c;
  }
  return array_reverse($out);
}

if (!defined('ABBON_CORRIGER_BIBLIOTHEQUE')) {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
  $reply = function ($status, $data) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
    exit;
  };
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') $reply(405, array('error' => 'methode'));
  $raw = file_get_contents('php://input', false, null, 0, 1048576);
  $request = json_decode((string) $raw, true);
  if (!is_array($request)) $reply(400, array('error' => 'requete'));
  $solutions = require __DIR__ . '/solutions.php';
  if (!is_array($solutions) || !isset($solutions['quizzes'])) $reply(500, array('error' => 'solutions'));
  $out = abbon_corriger($solutions, $request);
  if (isset($out['error'])) $reply(400, $out);
  $corrige = abbon_corrige(isset($solutions['corrige']) ? $solutions['corrige'] : 'enseignant');
  $published = isset(abbon_publication(__DIR__ . '/copies')[$request['quiz']]);
  $visible = abbon_visible($out, $corrige, $published);
  // Demande du corrigé après coup (« Vérifier ») : rien n'est enregistré.
  if (isset($request['action']) && $request['action'] === 'corrige') $reply(200, $visible);
  if (abbon_collecte()) {
    // Copie non enregistrée (dossier copies/ non accessible en écriture…) : l'élève est prévenu, sa tentative
    // reste ouverte et pourra être renvoyée.
    if (!abbon_enregistrer(__DIR__ . '/copies', abbon_copie($solutions, $request, $out))) $reply(500, array('error' => 'copie'));
    $visible['recorded'] = true;
  }
  $reply(200, $visible);
}
