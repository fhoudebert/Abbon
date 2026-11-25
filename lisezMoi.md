<p align="center"><img src="assets/abbon-icon.png" width="120" alt=""></p>

# Abbon

[English version](README.md)

Application de QCM **hors ligne** pour réviser le bac, préparer une certification ou entretenir sa culture générale.
Linux, Windows, macOS et Android ; aucune inscription, aucune donnée envoyée.

## Ce que fait Abbon

- **Sept types de questions** : choix unique ou multiple, réponse courte, réponse numérique (avec unité et
  tolérance), texte à trous (saisi ou à liste déroulante), carte recto-verso, et **expression mathématique**
  saisie au clavier mathématique (toute écriture équivalente est acceptée).
- **Formules, chimie, figures** : LaTeX (KaTeX), équations et unités (mhchem), molécules et figures SVG.
- **Entraînement ou examen** : correction à chaque question, ou note et corrigé à la fin, avec chronomètre.
- **Boîte de révision** (méthode Leitner) : les questions à retenir reviennent à intervalles croissants ;
  points et ceintures de judo récompensent la régularité.
- **Modules de questionnaires** à installer en un clic depuis le
  [catalogue](https://fhoudebert.github.io/abbon/questionnaires/) : maths, physique-chimie, SVT, sciences de
  l'ingénieur, philosophie, histoire, anglais, espagnol, étymologie et toponymie… avec fiches de révision, et
  quelques modules en anglais.
- **Éditeur** de QCM (texte riche, images, formules), catégories, code PIN pour l'administration ; import et
  export `.qcm`, GIFT (Moodle), sauvegarde complète.
- **Export en site web** d'un QCM ou d'un module, pour un hébergement mutualisé : entraînement en pages
  statiques, ou **examen corrigé par le serveur** (PHP) sans les réponses dans le site, avec ouverture par le
  surveillant, code d'accès, liste de classe, tirage des questions, copies, statistiques et publication du
  corrigé. Un **portail d'hébergement** (`npm run portail`, [mode d'emploi](src/lib/exam/portail/LISEZMOI.txt))
  permet à plusieurs enseignants, chacun avec son compte, de déposer et de retirer ces sites depuis un navigateur,
  après une seule installation par FTP.
- **QCM express avec un assistant IA** : un [prompt prêt à l'emploi](docs/prompt-qcm-abbon.md) transforme quelques
  lignes de notes en fichier `.qcm` à importer, pour une fin de cours, une interrogation rapide ou une révision ;
  un [second prompt](docs/prompt-module-abbon.md) rassemble des fichiers `.qcm` en module, avec catégories et
  fiches de révision, sans les sources du dépôt.
- **Atelier de formules** (menu Outils, ou [page web](https://fhoudebert.github.io/abbon/atelier/), utilisable aussi hors
  ligne) pour écrire une formule de maths ou de chimie et la coller dans Word (équation modifiable), LibreOffice,
  en LaTeX ou en image ; les formules se gardent dans un carnet en Markdown
  ([mode d'emploi](docs/atelier.md)).
- **Accessible** (WCAG 2.1 AA, clair et sombre, taille du texte réglable), en français et en anglais,
  utilisable sur téléphone.

## Télécharger

- Application : [dernière version](https://github.com/fhoudebert/Abbon/releases/latest) (`.deb`, `.rpm`,
  AppImage, `.msi`, `.exe`, `.dmg`, `.apk`) ; Linux et Windows pour processeurs Intel/AMD (x86-64) et ARM64
  (Raspberry Pi 4/5, Snapdragon…), macOS pour Apple silicon et Intel. L'application signale les nouvelles versions.
- Questionnaires : [catalogue](https://fhoudebert.github.io/abbon/questionnaires/), ou depuis l'application
  (À propos → Questionnaires), puis Administration → Importer.

### Raccourcis clavier (passage d'un QCM)

| Touche | Action |
|---|---|
| `1` … `9` | Cocher / décocher la réponse correspondante |
| `Entrée` | Valider (entraînement), question suivante, ou terminer |

Dans l'éditeur : `Ctrl+S` enregistre ; dans une réponse, `Entrée` crée la réponse suivante (`Maj+Entrée` : retour
à la ligne).

## Pour aller plus loin

- [Développement](developpement_fr.md) : construire, tester, empaqueter, signer, intégration continue.
- [Écrire un module de questionnaires](docs/modules.md), [format `.qcm`](docs/format-qcm/README.md),
  [architecture](docs/architecture.md), [distribution et mises à jour](docs/distribution.md).
- [Historique des versions](CHANGELOG.md).

## Licences

Logiciel libre sous licence [MIT](LICENSE). Le contenu des modules (dossier `modules/`) est sous licence
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr). Le rendu des formules embarque
[KaTeX](https://katex.org) (licence MIT), et leur saisie visuelle [MathLive](https://mathlive.io) (licence MIT).
Les molécules des modules sont dessinées à leur construction par [RDKit](https://www.rdkit.org) (licence BSD), qui
n'est pas embarqué dans l'application.
