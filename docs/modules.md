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
- Autres réglages possibles dans l'en-tête : `description`, `timeLimitSec`, `passThreshold`, `scoring`,
  `solutionVisibility`, `shuffle`.

Markdown reconnu : `code`, `**gras**`, `*italique*`, blocs de code (```` ```rust ````), listes, citations,
tableaux à barres verticales, titres `##` et `###` (dans les fiches). Aucun HTML n'est interprété.

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
réponse en choix unique et au moins une en choix multiple, au moins deux réponses, explication présente partout,
chaque texte présent dans chaque langue, réponses cohérentes d'une langue à l'autre, pas de réponses en double,
Markdown bien formé. Avertissements : moins de 3 ou plus de 5 réponses, « toutes / aucune des réponses », QCM de
moins de 10 ou plus de 15 questions, niveau absent ou inhabituel. La commande affiche aussi le nombre de QCM et de
questions par catégorie et par niveau. Après construction, le fichier est relu par le code d'import de
l'application.

À venir (lot 7 et suivants) : formules, images et figures SVG dans les sources, exécution des extraits de code
marqués `run`.

## Ligne éditoriale

Une question vaut par son corrigé : l'explication dit pourquoi la bonne réponse est juste et pourquoi les leurres
sont faux. Énoncé court et sans ambiguïté, 3 à 5 réponses, leurres plausibles tirés d'erreurs réelles, pas de
double négation. Aucun texte d'annale ou de manuel n'est recopié : tout est rédigé à neuf.

**Licence du contenu** : CC BY-NC-SA 4.0 (attribution, pas d'usage commercial, partage dans les mêmes conditions),
distincte de la licence MIT du code.
