# Modules de contenu

Un **module** est un ensemble de QCM prêt à l'emploi (par exemple « Anglais : verbes irréguliers »), livré dans
un seul fichier `.qcm`, versionné, mis à jour et retiré d'un bloc. Ses sources sont des fichiers texte du dossier
[`modules/`](../modules), compilés et vérifiés par les commandes ci-dessous. Le format du fichier produit est
décrit dans [format-qcm/README.md](format-qcm/README.md#modules).

```sh
npm run module:check                    # vérifie tous les modules (ou : npm run module:check anglais-verbes)
npm run module:build                    # vérifie puis écrit dist/modules/Abbon-<nom>-<version>.qcm
```

La CI lance les deux à chaque push ; les fichiers `.qcm` sont joints aux releases GitHub. Dans l'application :
*Administration › Importer*, qui propose aussi le lien de téléchargement.

## Dans l'application

- **Installation** : l'import d'un fichier de module l'installe d'un bloc (une sauvegarde automatique est faite avant).
  Une version plus récente **met à jour** le module ; les tentatives passées restent lisibles grâce à la copie du
  QCM enregistrée au démarrage de chaque tentative.
- **Contenu protégé** : les QCM d'un module ne se modifient pas sur place. « Dupliquer pour modifier » en crée une
  copie personnelle, qui ne sera jamais touchée par une mise à jour.
- **Désinstallation** (*Administration › Modules*) : QCM, fiches, catégories devenues vides et images inutilisées
  sont retirés. L'historique des tentatives est, au choix, supprimé ou mis de côté ; mis de côté, il revient si le
  module est réinstallé (les identifiants sont stables).
- **Fiche de révision** : bouton « Fiche de révision » sur la page d'un QCM et dans le corrigé, quand la catégorie
  en a une.
- **Prérequis** : un module peut demander une version minimale d'Abbon ou des fonctions de rendu (`math`, `svg`…).
  S'ils manquent, l'installation est refusée avec un message, plutôt que d'afficher un contenu illisible.
- Un fichier de module ne peut pas remplacer un QCM personnel ni celui d'un autre module, même s'il porte le même
  identifiant.

## Arborescence des sources

```
modules/anglais-verbes/
  module.yaml                  métadonnées et catégories
  frequents-50/                un dossier par catégorie (même nom que son id)
    01-preterit.md             un fichier par QCM, dans l'ordre alphabétique
    02-participe-passe.md
    fiche.fr.md                fiche de révision de la catégorie, par langue (facultative)
    fiche.en.md
```

Un dossier de `modules/` sans `module.yaml` n'est pas un module : l'outillage l'ignore, avec un message. C'est
la place des ébauches et des notes, rangées par convention dans `modules/_ebauches/`.

### `module.yaml`

```yaml
id: org.abbon.anglais-verbes   # notation inversée ; ne change plus jamais
version: 0.1.0                 # SemVer
date: 2026-11-15               # date de publication (rend le fichier reproductible)
title: { fr: "Anglais : verbes irréguliers", en: "English: irregular verbs" }
description: { fr: "…", en: "…" }
level: collège-lycée
license: CC-BY-NC-SA-4.0       # identifiant SPDX
authors: [Abbon]
homepage: https://github.com/fhoudebert/Abbon
languages: [fr, en]            # la première est la langue principale ; tout texte existe dans chacune
requires: { app: ">=0.2.0", features: [] }
defaults: { passThreshold: 0.7, shuffle: true }   # facultatif, pour tous les QCM
categories:
  - id: frequents-50
    name: { fr: "…", en: "…" }
```

**Regroupements** : `parent:` range une catégorie sous une autre du même module. Un regroupement peut n'avoir
aucun QCM (ni fiche) ; dans le filtre de l'accueil, le choisir montre les QCM de toutes ses catégories filles.

```yaml
categories:
  - id: physique
    name: { fr: "Physique" }
  - id: mouvement
    parent: physique
    name: { fr: "Mouvement et interactions" }
```

**Version** : un correctif (coquille, explication) incrémente le dernier chiffre ; des questions ajoutées, le
deuxième ; une refonte, le premier. Penser à mettre `date` à jour.

### Un QCM

```markdown
---
id: preterit-01
title: { fr: "Prétérit : les incontournables", en: "Past simple: the essentials" }
level: bases                   # bases, approfondissement ou expert
tags: [anglais, prétérit]      # « v:python-3.13 » pour une question liée à une version
---

## go · single
Quel est le prétérit de *to go* (aller) ?

- [x] went
- [ ] goed
- [ ] gone

> *go – went – gone*. Le prétérit est **went** ; *gone* est le participe passé.

### en
What is the past simple of *to go*?

- [x] went
- [ ] goed
- [ ] gone

> *go – went – gone*. The past simple is **went**; *gone* is the past participle.
```

- `## identifiant · single` ou `· multiple` ouvre une question (sans type : déduit du nombre de cases cochées).
  L'identifiant ne change jamais, même si l'énoncé est corrigé : il relie l'historique aux versions suivantes.
- Viennent ensuite l'énoncé, les réponses (`- [x]` pour une bonne réponse) et l'explication (lignes `>`).
- `### en` ouvre la même question dans une autre langue : mêmes réponses, dans le même ordre, mêmes cases cochées.
- **Questions à saisie** : `· short` (réponse courte) ou `· numeric` (réponse numérique), avec une ligne
  `= réponse` à la place des cases à cocher :

  ```markdown
  ## go · short
  Écrivez le prétérit de *to go*.

  = went

  > *go – went – gone*.

  ### en
  Write the past simple of *to go*.

  > *go – went – gone*.

  ## g · numeric
  Quelle est l'intensité de la pesanteur à Paris ?

  = 9,81 ± 0,01 m/s²

  > …
  ```

  Plusieurs lignes `=` donnent plusieurs formes acceptées ; celles des autres langues s'y ajoutent (`= Londres`
  en français, `= London` en anglais : les deux sont acceptées partout). `· short · case-sensitive` fait
  respecter les majuscules. Une réponse numérique s'écrit `= valeur`, `= valeur ± écart`, avec une unité facultative
  à la fin.
- **Textes à trous** : `· cloze`, avec le texte sur une ou plusieurs lignes `=` et les trous entre accolades :

  ```markdown
  ## london · cloze
  Complétez avec la forme correcte.

  = Yesterday, she {went|did go} (go) to London.
  = She {has ~have ~had} two cats.

  > *go – went – gone*.

  ### en
  Complete with the correct form.

  > *go – went – gone*.
  ```

  `{went|did go}` est un trou à saisir (formes acceptées séparées par `|`) ; `{has ~have ~had}` est une liste
  déroulante : la bonne réponse d'abord, puis les autres propositions après `~`. Une langue sans ligne `=`
  reprend le texte de la langue principale ; sinon elle donne son propre texte, avec les mêmes trous. `\{` écrit
  une accolade. `scoring: partial` dans l'en-tête du QCM compte chaque trou juste.
- **Recto-verso** : `· flashcard`, sans réponses à cocher ni ligne `=` ; l'énoncé est le recto, le bloc `>` le
  verso. L'élève retourne la carte puis dit s'il savait.

  ```markdown
  ## pythagore · flashcard
  Énoncez le théorème de Pythagore.

  > Dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.
  ```

- **Expressions** : `· expression`, avec la formule attendue sur une ligne `=`, entre dollars (facultatifs).
  L'élève l'écrit dans un champ de formule (clavier mathématique sur écran tactile) ; toute écriture
  équivalente est acceptée. Pour une primitive, terminer par `+ C` : l'égalité est alors jugée à une constante
  près, et « + C » est accepté dans la réponse.

  ```markdown
  ## derivee-cube · expression
  Dérivée de $x^3 + \dfrac{1}{x}$ ?

  = $3x^2 - \frac{1}{x^2}$

  > On dérive terme à terme.

  ## primitive · expression
  Une primitive de $2x\,e^{x^2}$ ?

  = $e^{x^2} + C$

  > Forme $u'e^u$.
  ```

  La comparaison calcule les deux formules en 24 points tirés au hasard (valeurs positives puis de signe
  quelconque ; entiers de 1 à 12 pour `n`, `k`, `p`, `m`) et exige qu'elles coïncident partout où l'attendue
  est définie. Elle ne juge donc pas la *forme* : une consigne « factorisez » accepterait aussi la forme
  développée. Reconnu : `+ - \cdot \times / \frac \sqrt ^`, multiplication implicite, `\pi`, `e`,
  `\sin \cos \tan \ln \log \exp` et leurs réciproques, valeur absolue, variables d'une lettre (avec indice) ;
  pas de factorielle, de somme, de limite ni de dérivée notée `f'`. `module:check` signale une formule
  attendue illisible.
- Autres réglages possibles dans l'en-tête : `description`, `timeLimitSec`, `passThreshold`, `scoring`,
  `solutionVisibility`, `shuffle`.

Markdown reconnu : `code`, `**gras**`, `*italique*`, blocs de code (```` ```rust ````), listes, citations,
tableaux à barres verticales, titres `##` et `###` (dans les fiches), formules et images (ci-dessous). Aucun HTML
n'est interprété.

Sur téléphone, la fiche ne fait qu'environ 330 px de large : préférer des tableaux de deux colonnes (au-delà,
une liste se lit mieux), couper une longue formule en plusieurs blocs `$$…$$`, et placer ces blocs entre deux
paragraphes plutôt qu'au milieu d'une liste, qu'ils interrompraient.

### Formules, chimie, unités

Les formules s'écrivent en LaTeX et sont rendues par KaTeX, hors ligne :

```markdown
Soit $u_n = \frac{1}{n}$ pour $n \geq 1$.          formule dans le texte

$$\int_0^1 f(x)\,dx$$                             formule en bloc (sur une ou plusieurs lignes)

$\ce{CH3COOH + H2O <=> CH3COO- + H3O+}$           équation chimique (mhchem)
$\pu{9,81 m.s-2}$                                 grandeur avec son unité
```

- Chaque formule est compilée par `module:check` : une formule fautive est une erreur, avec le message de KaTeX.
- En français, une virgule entre deux chiffres est décimale (`$g = 9,81$` s'affiche sans espace après la
  virgule) ; en anglais, écrire `9.81`.
- Un dollar ordinaire s'écrit `\$`. Un `$` suivi d'une espace n'ouvre pas de formule.
- Une réponse (`- [x] $2x$`) peut être une formule.

### Images et figures

```markdown
![Circuit RC en série avec un générateur](figures/circuit-rc.svg)
```

- Le chemin est relatif au fichier Markdown. Formats : SVG, PNG, JPEG, GIF, WebP.
- Le texte alternatif est obligatoire (erreur sinon) : il décrit la figure à qui ne la voit pas.
- **SVG** : la figure est incrustée dans la page après nettoyage ; seuls les éléments de dessin sont gardés
  (formes, texte, dégradés, marqueurs), pas les scripts, styles globaux, images ou liens. Pour qu'elle suive le
  thème clair ou sombre, tracer en `currentColor` sur fond transparent
  (`stroke="currentColor"`, `fill="currentColor"` pour le texte) et donner un `viewBox`.
- Une image présente dans le dossier mais non utilisée est signalée et n'est pas jointe.

### Molécules

```markdown
![formule topologique de l'éthanoate d'éthyle](smiles:CCOC(C)=O)
```

- La cible `smiles:` donne la molécule en notation SMILES (parenthèses permises). `module:check` et
  `module:build` la dessinent avec RDKit (RDKit.js, licence BSD, dépendance de développement seulement : rien
  n'est ajouté à l'application) : formule topologique, en `currentColor` sur fond transparent, qui suit donc le
  thème. Le SVG obtenu est joint au module comme une figure ordinaire.
- Un SMILES illisible est une erreur ; le texte alternatif est obligatoire (nommer la molécule, et donner si
  utile sa formule semi-développée, que le lecteur d'écran lira).
- Toutes les molécules sont à la même échelle ; une grande molécule est réduite à la largeur de l'écran.
- Exemples : éthanol `CCO`, acide éthanoïque `CC(=O)O`, benzène `c1ccccc1`, aspirine `CC(=O)Oc1ccccc1C(=O)O`,
  but-2-ène (E) `C/C=C/C`.

Les fonctions de rendu utilisées (`math`, `svg`) sont ajoutées d'elles-mêmes à `requires.features` : une version
d'Abbon qui ne sait pas les afficher refuse d'installer le module, avec un message.

### Identifiants produits

Le format `.qcm` n'accepte que lettres, chiffres, `_` et `-` dans un identifiant. Le module
`org.abbon.anglais-verbes` produit donc :

| Élément | Identifiant |
|---|---|
| catégorie `frequents-50` | `org-abbon-anglais-verbes_frequents-50` |
| QCM `preterit-01` | `org-abbon-anglais-verbes_preterit-01` |
| question `go` | `org-abbon-anglais-verbes_preterit-01_go` |
| réponse n° 2 | `org-abbon-anglais-verbes_preterit-01_go_c2` |

La version entière de chaque QCM est déduite de celle du module (1.2.3 → 1 002 003) : une version d'Abbon qui
ne connaît pas les modules remplace correctement un QCM plus ancien.

## Ce que vérifie `module:check`

Erreurs (rien n'est construit) : schémas JSON du format, identifiants uniques et bien formés, exactement une bonne
réponse en choix unique et au moins une en choix multiple, au moins deux réponses, réponse attendue présente et
lisible pour une question à saisie, trous présents, non vides et identiques d'une langue à l'autre pour un texte à
trous, explication présente partout,
chaque texte présent dans chaque langue, réponses cohérentes d'une langue à l'autre, pas de réponses en double,
Markdown bien formé, formules qui compilent, images présentes, lisibles et décrites. Avertissements : moins de 3 ou plus de 5 réponses, « toutes / aucune des réponses », QCM de
moins de 10 ou plus de 15 questions, niveau absent ou inhabituel. La commande affiche aussi le nombre de QCM et de
questions par catégorie et par niveau. Après construction, le fichier est relu par le code d'import de
l'application.

À venir : courbes générées par script au moment de la construction, exécution des extraits de code marqués `run`.

## Ligne éditoriale

Une question vaut par son corrigé : l'explication dit pourquoi la bonne réponse est juste et pourquoi les leurres
sont faux. Énoncé court et sans ambiguïté, 3 à 5 réponses, leurres plausibles tirés d'erreurs réelles, pas de
double négation. Aucun texte d'annale ou de manuel n'est recopié : tout est rédigé à neuf.

**Licence du contenu** : CC BY-NC-SA 4.0 (attribution, pas d'usage commercial, partage dans les mêmes conditions),
distincte de la licence MIT du code.
