<?php
/**
 * Abbon — page de téléchargement.
 *
 * Lit releases/version.json (produit par la CI) et affiche les paquets de la dernière version.
 * Aucune base de données, aucune écriture : un hébergement mutualisé avec PHP 7.4+ suffit.
 * Tout le contenu affiché est échappé.
 */
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");

$texts = [
    'fr' => [
        'title' => 'Abbon — QCM hors ligne',
        'tagline' => 'Composer et passer des QCM hors ligne : certifications, langues, culture générale.',
        'version' => 'Version %s du %s',
        'notes' => 'Nouveautés',
        'none' => 'Aucune version publiée pour l’instant.',
        'linux' => 'Linux',
        'android' => 'Android',
        'windows' => 'Windows',
        'macos' => 'macOS',
        'appimage' => 'AppImage (toutes distributions)',
        'deb' => 'Paquet .deb (Debian, Ubuntu…)',
        'rpm' => 'Paquet .rpm (Fedora, openSUSE…)',
        'apk' => 'Application Android (APK)',
        'nsis' => 'Installateur (.exe)',
        'msi' => 'Installateur MSI',
        'dmg' => 'Image disque (.dmg, Apple silicon et Intel)',
        'app' => 'Archive de l’application (mises à jour)',
        'macHelp' => 'Pour Mac à processeur Apple ou Intel. L’application n’est pas notarisée par Apple : au premier lancement, clic droit sur Abbon › Ouvrir, ou Réglages › Confidentialité et sécurité › Ouvrir quand même.',
        'apkHelp' => 'Android demandera d’autoriser l’installation depuis votre navigateur. Les mises à jour suivantes se font depuis l’application (Paramètres › Mises à jour).',
        'winHelp' => 'Windows 10 ou plus récent.',
        'x86_64' => 'Intel / AMD (x86-64)',
        'aarch64' => 'ARM64',
        'armLinux' => 'ARM64 : Raspberry Pi 4 ou 5 avec un système 64 bits, ordinateurs et serveurs ARM.',
        'armWindows' => 'ARM64 : PC à processeur Snapdragon X, Surface Pro… (pas de MSI, seulement l’installateur .exe).',
        'checksums' => 'Empreintes SHA-256',
        'license' => 'Logiciel libre sous licence MIT.',
        'other' => 'English',
    ],
    'en' => [
        'title' => 'Abbon — offline quizzes',
        'tagline' => 'Write and take quizzes offline: certifications, languages, general knowledge.',
        'version' => 'Version %s of %s',
        'notes' => 'What’s new',
        'none' => 'No release published yet.',
        'linux' => 'Linux',
        'android' => 'Android',
        'windows' => 'Windows',
        'macos' => 'macOS',
        'appimage' => 'AppImage (any distribution)',
        'deb' => '.deb package (Debian, Ubuntu…)',
        'rpm' => '.rpm package (Fedora, openSUSE…)',
        'apk' => 'Android app (APK)',
        'nsis' => 'Installer (.exe)',
        'msi' => 'MSI installer',
        'dmg' => 'Disk image (.dmg, Apple silicon and Intel)',
        'app' => 'Application archive (updates)',
        'macHelp' => 'For Macs with Apple or Intel processors. The app is not notarised by Apple: on first launch, right-click Abbon › Open, or System Settings › Privacy & Security › Open Anyway.',
        'apkHelp' => 'Android will ask you to allow installs from your browser. Later updates are offered in the app (Settings › Updates).',
        'winHelp' => 'Windows 10 or later.',
        'x86_64' => 'Intel / AMD (x86-64)',
        'aarch64' => 'ARM64',
        'armLinux' => 'ARM64: Raspberry Pi 4 or 5 running a 64-bit system, ARM computers and servers.',
        'armWindows' => 'ARM64: PCs with Snapdragon X processors, Surface Pro… (no MSI, only the .exe installer).',
        'checksums' => 'SHA-256 checksums',
        'license' => 'Free software under the MIT licence.',
        'other' => 'Français',
    ],
];

// Langue : ?lang=, sinon préférence du navigateur, sinon français.
$lang = $_GET['lang'] ?? '';
if (!isset($texts[$lang])) {
    $accept = strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');
    $lang = preg_match('/^\s*en\b/', $accept) ? 'en' : 'fr';
}
$t = $texts[$lang];
$other = $lang === 'fr' ? 'en' : 'fr';

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function size(int $bytes, string $lang): string
{
    $mb = $bytes / 1000000;
    $n = $lang === 'fr' ? number_format($mb, 1, ',', ' ') . ' Mo' : number_format($mb, 1, '.', ',') . ' MB';
    return $n;
}

// Lecture et validation de version.json
$release = null;
$file = __DIR__ . '/releases/version.json';
if (is_file($file) && filesize($file) < 262144) {
    $data = json_decode((string) file_get_contents($file), true);
    if (is_array($data) && ($data['format'] ?? '') === 'abbon-release' && is_array($data['files'] ?? null)
        && preg_match('/^\d+\.\d+\.\d+(-[\w.]+)?$/', (string) ($data['version'] ?? ''))) {
        $release = $data;
    }
}

$groups = [];
if ($release) {
    foreach ($release['files'] as $f) {
        $name = (string) ($f['name'] ?? '');
        $platform = (string) ($f['platform'] ?? '');
        if (!preg_match('/^[\w.+-]{1,200}$/', $name) || !isset($t[$platform])) {
            continue;
        }
        $groups[$platform][] = [
            'name' => $name,
            'kind' => (string) ($f['kind'] ?? ''),
            // Versions publiées avant ARM64 : pas d'architecture, x86-64.
            'arch' => (string) ($f['arch'] ?? (in_array($platform, ['linux', 'windows'], true) ? 'x86_64' : 'universal')),
            'size' => (int) ($f['size'] ?? 0),
            'sha256' => preg_match('/^[0-9a-f]{64}$/', (string) ($f['sha256'] ?? '')) ? $f['sha256'] : '',
        ];
    }
}
$order = ['linux', 'android', 'windows', 'macos'];
// Processeur affiché seulement quand un système en a plusieurs (x86-64 et ARM64).
$multiArch = [];
foreach ($groups as $platform => $files) {
    $multiArch[$platform] = count(array_unique(array_column($files, 'arch'))) > 1;
}
$notes = $release['notes'][$lang] ?? $release['notes']['en'] ?? $release['notes']['fr'] ?? '';
$date = $release ? substr((string) ($release['date'] ?? ''), 0, 10) : '';
?><!doctype html>
<html lang="<?= h($lang) ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title><?= h($t['title']) ?></title>
<link rel="icon" href="abbon.png">
<style>
  :root { --bg:#fbfcf9; --surface:#fff; --text:#1d2418; --muted:#5d6857; --border:#dfe5d9; --accent:#2b6e12; --soft:#e9f7e1;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif; line-height:1.5; color:var(--text); background:var(--bg); }
  @media (prefers-color-scheme: dark) { :root { --bg:#12160f; --surface:#1b2117; --text:#e8eee3; --muted:#a3ae9b; --border:#2e3729; --accent:#8fd16b; --soft:#23301c; } }
  body { margin:0; }
  main { max-width: 52rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
  header { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
  header img { width:72px; height:72px; }
  header h1 { margin:0; font-size:2rem; }
  header p { margin:.2rem 0 0; color:var(--muted); }
  .lang { margin-left:auto; color:var(--accent); }
  section { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:1rem 1.25rem; margin-top:1rem; }
  h2 { font-size:1.15rem; margin:0 0 .5rem; }
  ul { list-style:none; padding:0; margin:0; }
  li { display:flex; flex-wrap:wrap; align-items:center; gap:.25rem 1rem; padding:.5rem 0; border-top:1px solid var(--border); }
  li:first-child { border-top:0; }
  a.dl { display:inline-block; padding:.45rem 1rem; border-radius:999px; background:var(--accent); color:var(--surface); text-decoration:none; font-weight:600; }
  .muted { color:var(--muted); font-size:.9rem; }
  .notes { white-space:pre-wrap; }
  code { font-size:.75rem; word-break:break-all; color:var(--muted); }
  details { margin-top:.5rem; }
  footer { margin-top:2rem; color:var(--muted); font-size:.9rem; text-align:center; }
  a { color:var(--accent); }
</style>
</head>
<body>
<main>
  <header>
    <img src="abbon.png" alt="">
    <div>
      <h1>Abbon</h1>
      <p><?= h($t['tagline']) ?></p>
    </div>
    <a class="lang" href="?lang=<?= h($other) ?>" hreflang="<?= h($other) ?>"><?= h($t['other']) ?></a>
  </header>

<?php if (!$release): ?>
  <section><p><?= h($t['none']) ?></p></section>
<?php else: ?>
  <p class="muted"><?= h(sprintf($t['version'], (string) $release['version'], $date)) ?></p>

  <?php foreach ($order as $platform): if (empty($groups[$platform])) continue; ?>
  <section>
    <h2><?= h($t[$platform]) ?></h2>
    <ul>
      <?php foreach ($groups[$platform] as $f): ?>
      <li>
        <a class="dl" href="releases/<?= h(rawurlencode($f['name'])) ?>" download><?= h($t[$f['kind']] ?? $f['name']) ?></a>
        <?php if (!empty($multiArch[$platform]) && isset($t[$f['arch']])): ?><strong><?= h($t[$f['arch']]) ?></strong><?php endif; ?>
        <span class="muted"><?= h($f['name']) ?> · <?= h(size($f['size'], $lang)) ?></span>
      </li>
      <?php endforeach; ?>
    </ul>
    <?php if ($platform === 'android'): ?><p class="muted"><?= h($t['apkHelp']) ?></p><?php endif; ?>
    <?php if ($platform === 'linux' && !empty($multiArch['linux'])): ?><p class="muted"><?= h($t['armLinux']) ?></p><?php endif; ?>
    <?php if ($platform === 'windows'): ?><p class="muted"><?= h($t['winHelp']) ?><?php if (!empty($multiArch['windows'])): ?> <?= h($t['armWindows']) ?><?php endif; ?></p><?php endif; ?>
    <?php if ($platform === 'macos'): ?><p class="muted"><?= h($t['macHelp']) ?></p><?php endif; ?>
  </section>
  <?php endforeach; ?>

  <?php if ($notes !== ''): ?>
  <section>
    <h2><?= h($t['notes']) ?></h2>
    <div class="notes"><?= h((string) $notes) ?></div>
  </section>
  <?php endif; ?>

  <details>
    <summary><?= h($t['checksums']) ?></summary>
    <ul>
    <?php foreach ($order as $platform): foreach ($groups[$platform] ?? [] as $f): ?>
      <li><span><?= h($f['name']) ?></span> <code><?= h($f['sha256']) ?></code></li>
    <?php endforeach; endforeach; ?>
    </ul>
    <p class="muted"><a href="releases/SHA256SUMS.txt">SHA256SUMS.txt</a></p>
  </details>
<?php endif; ?>

  <footer><?= h($t['license']) ?></footer>
</main>
</body>
</html>
