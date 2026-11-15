# Distribution et mises à jour

Abbon est distribué depuis un **site PHP** (hébergement mutualisé, n'importe quel nom de domaine) :
une page de téléchargement et un dossier `releases/` contenant les paquets et deux manifestes.

```
https://votre-domaine/chemin/
  index.php                    page de téléchargement (FR / EN)
  .htaccess                    types de fichiers, HTTPS, cache (Apache)
  abbon.png
  releases/
    Abbon_X.Y.Z_amd64.AppImage, .deb, .rpm, -setup.exe, .msi, abbon-X.Y.Z.apk
    version.json               description de la version (page, application Android)
    latest.json                mises à jour automatiques Linux / Windows (fichiers signés)
    SHA256SUMS.txt
```

| Plateforme | Mise à jour |
|---|---|
| Linux (AppImage, .deb, .rpm) | Automatique : téléchargement, vérification de la signature, installation, redémarrage. Pour .deb / .rpm, le mot de passe administrateur est demandé. |
| Windows (.exe, .msi) | Automatique, comme Linux. |
| Android (APK) | L'application signale la nouvelle version et ouvre l'APK dans le navigateur ; Android l'installe par-dessus l'ancienne (même clé de signature obligatoire). |

L'application vérifie au plus une fois par jour, au démarrage (désactivable dans *Paramètres › Mises à jour*,
où l'adresse du serveur peut aussi être changée). Les requêtes partent du code Rust, en HTTPS uniquement.

## 1. Mise en place (une fois)

### Clé de signature des mises à jour

```sh
npx tauri signer generate -w ~/.tauri/abbon.key
```

Choisir un mot de passe. **Sauvegarder la clé privée et son mot de passe hors du poste** : sans eux, plus
aucune mise à jour automatique ne pourra être publiée (les applications installées refuseraient des paquets
signés par une autre clé).

Dans le dépôt GitHub, *Settings › Secrets and variables › Actions* :

| Type | Nom | Valeur |
|---|---|---|
| Secret | `TAURI_SIGNING_PRIVATE_KEY` | contenu de `~/.tauri/abbon.key` |
| Secret | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | mot de passe de la clé |
| Variable | `TAURI_UPDATER_PUBKEY` | contenu de `~/.tauri/abbon.key.pub` |
| Variable | `ABBON_SITE_URL` | adresse du site, ex. `https://exemple.fr/abbon` (sans `/` final) |

La clé publique et l'adresse sont intégrées à la compilation. Sans clé, l'application se construit normalement
mais ne propose pas de mise à jour automatique (seulement le lien de téléchargement).

Signature de l'APK Android : voir le README (secrets `ANDROID_KEYSTORE_*`).

### Hébergement

- HTTPS obligatoire (Let's Encrypt est proposé par la plupart des hébergeurs).
- PHP 7.4 ou plus récent, sans base de données.
- Apache : le `.htaccess` fourni règle les types de fichiers, la redirection HTTPS et le cache.
  Avec nginx, reproduire ces règles dans la configuration du serveur.
- Vérifier la taille maximale des fichiers acceptée par l'hébergeur (l'AppImage fait ~80 Mo).

### Dépôt automatique (facultatif)

Secrets `FTP_URL` (`ftp://…`, `ftps://…` ou `sftp://…`), `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR` (dossier
distant, ex. `www/abbon`). Sans `FTP_URL`, le site est seulement fourni en artifact à déposer à la main.
Les paquets sont envoyés d'abord, les manifestes en dernier : les applications ne voient la nouvelle version
qu'une fois tous ses fichiers en ligne. Les anciennes versions restent sur le serveur.

## 2. Publier une version

1. Mettre à jour `version` dans `package.json` (c'est la seule source de la version).
2. Ajouter une section dans `CHANGELOG.md` :
   ```md
   ## 0.2.0

   ### fr
   - …

   ### en
   - …
   ```
3. Committer, puis créer et pousser le tag : `git tag v0.2.0 && git push origin v0.2.0`.
4. Le workflow *Build* compile les trois plateformes, signe les paquets, prépare le site
   (artifact `abbon-site-0.2.0`), crée un brouillon de release GitHub et, si configuré, dépose le site.
5. Sans dépôt automatique : télécharger l'artifact `abbon-site-0.2.0` et envoyer son contenu sur
   l'hébergement (garder `.htaccess`, fichier caché) — paquets d'abord, `releases/*.json` en dernier.
6. Publier le brouillon de release GitHub.

## Sécurité

- Chaque paquet Linux / Windows est signé (minisign) ; l'application vérifie la signature avec la clé publique
  intégrée avant d'installer.
- `requireSignedVersion` : la version est incluse dans la signature. Un serveur compromis ne peut pas faire
  installer une ancienne version signée en annonçant un numéro plus récent (vérifié : l'installation est
  refusée avec un message explicite).
- `version.json` est validé côté application (schéma, noms de fichiers, empreintes) ; la page PHP échappe tout
  ce qu'elle affiche et envoie une politique de sécurité du contenu stricte.

## Tester localement

```sh
npx tauri signer generate -w /tmp/test.key -p test --ci
export ABBON_UPDATER_PUBKEY="$(cat /tmp/test.key.pub)" ABBON_UPDATE_URL=http://127.0.0.1:8080 \
       TAURI_SIGNING_PRIVATE_KEY="$(cat /tmp/test.key)" TAURI_SIGNING_PRIVATE_KEY_PASSWORD=test
# HTTP autorisé pour ce test seulement :
CFG=$(node -p 'JSON.stringify({bundle:{createUpdaterArtifacts:true},plugins:{updater:{pubkey:process.env.ABBON_UPDATER_PUBKEY,dangerousInsecureTransportProtocol:true}}})')
npx tauri build --bundles appimage --config "$CFG"     # version A ; puis changer la version et recommencer
node --experimental-strip-types scripts/release/build-site.ts --dist <paquets de la version B> \
     --out /tmp/site --version <B> --base-url http://127.0.0.1:8080
php -S 127.0.0.1:8080 -t /tmp/site
```

Lancer la version A : le bandeau « Abbon B est disponible » apparaît ; *Installer et redémarrer* remplace
l'AppImage et relance l'application.
