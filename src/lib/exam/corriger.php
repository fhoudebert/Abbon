<?php
/*
 * Abbon — correction des examens côté serveur.
 *
 * Le site exporté en « examen corrigé par le serveur » ne contient pas les réponses attendues : le navigateur
 * envoie ici les réponses de l'élève (POST, JSON), ce script les note avec le corrigé de solutions.php et
 * renvoie le score, puis le corrigé si reglages.js le permet (corrige: "fin").
 *
 * Aucune base de données, aucun fichier écrit. PHP 7.4 ou plus récent. Ne pas modifier : ce fichier est
 * régénéré à chaque export. La notation reproduit celle de l'application (src/lib/domain/scoring.ts).
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
 * Renvoie le résultat, ou ['error' => code].
 */
function abbon_corriger($solutions, $request, $corrige) {
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
    if ($corrige === 'fin') $sols[$id] = abbon_solution($q);
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
  );
  if ($corrige === 'fin') $out['solutions'] = $sols;
  return $out;
}

/** Corrigé « fin » ou « jamais » : reglages.js (modifiable après l'export), sinon le choix de l'export. */
function abbon_corrige($default) {
  $file = __DIR__ . '/../reglages.js';
  if (is_readable($file)) {
    $js = (string) file_get_contents($file);
    $js = preg_replace('~^\s*//.*$~m', '', $js);
    if (preg_match('/corrige\s*:\s*["\']\s*(fin|jamais|end|never)\s*["\']/i', $js, $m)) {
      $v = strtolower($m[1]);
      return $v === 'fin' || $v === 'end' ? 'fin' : 'jamais';
    }
  }
  return $default === 'jamais' ? 'jamais' : 'fin';
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
  $out = abbon_corriger($solutions, $request, abbon_corrige(isset($solutions['corrige']) ? $solutions['corrige'] : 'fin'));
  $reply(isset($out['error']) ? 400 : 200, $out);
}
