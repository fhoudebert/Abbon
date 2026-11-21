# Feuille de route

Ordre de travail de la branche `qcm`, après le socle (lots 0 à 5). Le cadrage d'origine est la note
« Abbon – Cadrage des modules de QCM » ; ce fichier fait foi pour l'ordre et l'état.

| Étape | Contenu | État |
|---|---|---|
| Lot 6 | Format module, outillage (`module:check`, `module:build`), pilote « Anglais : verbes irréguliers » | fait |
| Lot 6 bis | Questions à saisie : **réponse courte** et **réponse numérique** (passage, corrigé, éditeur, GIFT, sources de modules) | fait |
| Lot 6 ter | **Textes à trous** : un énoncé à plusieurs trous, chacun rempli par une réponse courte saisie ou par un choix dans une liste déroulante | fait |
| Lot 6 quater | **Révision espacée (boîtes de Leitner)** : entraînement par répétitions sur des questions choisies | fait |
| Lot 7 | Formules (LaTeX, rendu KaTeX), équations chimiques, unités, figures SVG incrustées après nettoyage | fait |
| Lot 8 | Module Informatique : 13 rubriques, environ 450 questions ; version pilote 0.1.0 (un QCM de bases par rubrique, 130 questions) | en cours |
| Lots 9 à 11 | Modules de bac : Physique-chimie, Maths spécialité, Maths expertes ; versions pilotes 0.2.0 tirées des ébauches (90 questions, 10 fiches) | en cours |
| Lot 12 | Anglais : verbes irréguliers, version complète (environ 150 verbes) | à faire |
| Technique A | **Actions GitHub et Node.js** : actions en Node 24, construction en Node 26 | fait, à valider sur GitHub |
| Technique B | **Version macOS en CI** : application universelle (Apple silicon et Intel), `.dmg`, mises à jour automatiques | fait, à valider sur GitHub |
| Lot 13 | **MathLive** : saisie visuelle des formules dans l'éditeur, puis réponses sous forme d'expression | à étudier, puis à faire |
| Lot 14 | **Molécules** : formules topologiques générées en SVG à la construction des modules ; Ketcher plus tard, si besoin | à étudier |
| Lot 15 | **Ceintures et points** : récompenser la mémorisation (questions échouées rangées dans la boîte puis acquises), et accessoirement les QCM et modules terminés | étudié, à valider |

## Lot 6 ter — textes à trous

- Type de question `cloze` : un texte à trous numérotés ; chaque trou a sa réponse attendue.
- Deux formes de trou : **saisie** (comparée comme une réponse courte : formes acceptées, majuscules ignorées par
  défaut) et **liste déroulante** (une bonne réponse parmi des propositions).
- Notation : tout ou rien, ou partielle (part des trous justes), selon le réglage du QCM.
- Éditeur (bouton « Insérer un trou »), syntaxe dans les sources de modules (`{went}`, `{has ~have ~had}`).
- Premier usage : QCM « En contexte » du module des verbes irréguliers.
- Restent possibles plus tard : mise en forme dans le texte à trous, propositions de liste traduites par langue,
  export vers le format « Cloze » de Moodle (GIFT ne décrit qu'un trou par question).

## Lot 6 quater — révision espacée (Leitner)

- **Une seule boîte pour tous les QCM**, alimentée à la main : le bouton « Ma boîte », pendant un QCM ou dans son
  corrigé, y range la question affichée (ou l'en retire).
- Écran « Révision » (menu) : cinq compartiments revus après 1, 2, 4, 7 et 15 jours. Une bonne réponse fait
  avancer la question d'un compartiment, une erreur la renvoie dans le premier.
- Session de 20 questions au plus, correction immédiate, tous types de questions. « Réviser quand même » permet de
  s'entraîner avant la date : une bonne réponse ne fait alors pas avancer la question.
- Chaque carte garde une copie de sa question : elle reste révisable si le QCM est modifié, supprimé ou
  désinstallé ; si le QCM existe encore, c'est sa version actuelle qui est affichée.
- La boîte est comprise dans la sauvegarde complète.
- Restent possibles plus tard : délais et taille de session réglables, ajout de tout un QCM d'un coup,
  statistiques de révision.

## Lot 8 — module Informatique

- **13 rubriques** : Python, Rust, Web, SQL et données, Linux, Windows et Android, Réseau, Cybersécurité,
  Algorithmique, Intelligence artificielle, 3D et graphisme, Électronique et conception d'interface, Logiciel libre
  et standards.
- **Cybersécurité** : culture générale, sans sujet exclu. Le but est de comprendre les attaques pour les
  reconnaître et s'en protéger, pas de fournir des procédures pour les mener.
- **Langues** : français d'abord. Le module est prêt à recevoir l'anglais : `languages: [fr, en]` dans
  `module.yaml`, une section `### en` par question, et `module:check` liste ce qui manque.
- **Version 0.1.0 (pilote)** : un QCM de bases de 10 questions par rubrique, soit 130 questions, à relire pour fixer
  le ton. Ensuite : niveaux « approfondissement » et « expert », puis les fiches de révision.
- Les comportements de code annoncés (Python, Rust, JavaScript, SQL) et les calculs ont été vérifiés par
  exécution ; l'exécution automatique des extraits marqués `run` reste à outiller.

## Lots 9 à 11 — modules de bac

- Ébauches de questions (fournies dans `modules/_ebauches/`) reprises, reformulées et vérifiées dans
  `physique-chimie` (30 questions), `maths-specialite` (36) et `maths-expertes` (24). Trois erreurs des ébauches
  y sont corrigées : `ln(0) = 1` (ln 0 n'est pas défini, c'est ln 1 qui vaut 0), l'équation de la tangente
  ($y = f'(a)(x - a) + f(a)$) et le résultat du titrage (0,075 mol·L⁻¹).
- Les questions qui attendent une formule en réponse (« dérivée de $u/v$ ? ») sont devenues des choix entre
  formules, en attendant un type « expression » (lot 13).
- Étiquette `prog-2019` sur chaque QCM de maths, pour la bascule vers le programme 2026 (bac 2028).
- Version 0.2.0 : une fiche de révision par catégorie (10 fiches) — l'essentiel du cours, les formules et les
  pièges classiques, en cohérence avec les questions. Vérifiées à 390 px (aucun tableau ni formule coupés).
- Suite : niveaux « approfondissement » et « expert », relecture par un enseignant (questions et fiches) ; physique-chimie : catégorie « L'énergie : conversions et transferts ».
- Un dossier de `modules/` sans `module.yaml` (ébauches, notes) est désormais ignoré par l'outillage, avec un
  message, au lieu de faire échouer la vérification.

## Technique A — actions GitHub et Node.js

- **Constat** : Abbon se construit déjà en Node 22 (`engines: >=22.13`), mais ses workflows utilisent des actions en
  v4 (`checkout`, `setup-node`, `upload-artifact`, `download-artifact`, `setup-java`…), qui déclarent le moteur
  Node 20. GitHub a retiré Node 20 de ses machines en septembre 2026 : ces actions sont exécutées de force en
  Node 24, avec des avertissements, sans garantie de bon fonctionnement.
- **Node 22** n'est plus qu'en maintenance, jusqu'au 30 avril 2027. Node 24 est maintenu jusqu'en avril 2028,
  Node 26 (LTS depuis octobre 2026) jusqu'en avril 2029.
- **Fait** : toutes les actions passent à une version en Node 24 : `checkout@v7`, `setup-node@v7`,
  `upload-artifact@v7`, `download-artifact@v8`, `setup-java@v6`, `action-gh-release@v3` ; `setup-android@v4`,
  `android-emulator-runner@v2` et `rust-cache@v2` y étaient déjà (leurs étiquettes majeures ont suivi).
  Construction en Node 26, `engines: >=24`. Le script de release s'exécute sans `--experimental-strip-types`.
- **Vérifié hors GitHub** : `actionlint` et shellcheck sans remarque ; mêmes entrées pour toutes les actions ;
  téléchargement d'un artefact par nom inchangé (dans `path`), `merge-multiple` toujours disponible.
- **Reste** : un premier passage complet du workflow *Build* sur GitHub.

## Technique B — version macOS en CI

- **Modèle** : le workflow de publication de tabulon (`.github/workflows/release.yml`), même pile technique
  (Tauri 2) : machine `macos-latest`, cibles Rust `aarch64-apple-darwin` et `x86_64-apple-darwin`,
  `tauri build --target universal-apple-darwin --bundles app,dmg`, signature ad hoc
  (`"signingIdentity": "-"`, sans laquelle macOS refuse le binaire Apple silicon), puis contrôle par
  `codesign --verify` et `lipo -archs`, et `.app` zippée par `ditto` pour garder sa structure.
- **Fait** : job `macos` (application universelle, `.dmg`, contrôle de la signature et des deux architectures),
  archive `.app.tar.gz` signée pour les mises à jour automatiques quand la clé est configurée (entrées
  `darwin-aarch64` et `darwin-x86_64` de `latest.json`), job `smoke-macos` (installation depuis le `.dmg`,
  lancement 30 s, base créée), fichiers macOS sur la page de téléchargement avec l'aide au premier lancement.
- **Reste** : premier passage sur GitHub, puis essai sur un vrai Mac (premier lancement, mise à jour).
- **Limite** : sans compte développeur Apple, l'application n'est ni signée par Apple ni notarisée ; macOS
  avertit au premier lancement. La documentation doit expliquer comment l'ouvrir (clic droit › Ouvrir, ou
  Réglages › Confidentialité et sécurité).

## Lot 13 — MathLive (formules)

- **MathLive** (licence MIT, aucune dépendance) : un champ de saisie de formules avec clavier virtuel, pensé pour
  le tactile. Environ 850 Ko de code (230 Ko compressé) et 300 Ko de polices, pour la version 0.111 ; encore en
  0.x, donc des changements possibles d'une version à l'autre.
- **Compatible avec le format actuel** : MathLive lit et produit du LaTeX, ce que contiennent déjà les nœuds de
  formule. Aucune migration.
- **Deux usages** :
  1. **Éditeur** : saisir une formule en la voyant, au lieu d'écrire du LaTeX, au clavier virtuel sur tablette.
     Bénéfice immédiat pour qui ne connaît pas LaTeX.
  2. **Réponses** : un type de question « expression », où l'élève écrit une formule (dérivée, primitive,
     factorisation). Il faut alors juger si deux expressions sont égales : comparaison par évaluation en
     plusieurs points tirés au hasard, ou calcul formel (Compute Engine, de la même équipe, licence MIT). C'est
     le point délicat, à prototyper.
- **À vérifier** : fonctionnement dans WebKitGTK (Linux) et la WebView Android, cohabitation de son clavier
  virtuel avec celui du téléphone, accessibilité, chargement à la demande (seulement dans l'éditeur et sur les
  questions « expression ») pour ne pas alourdir le démarrage. Le rendu dans le champ (moteur de MathLive)
  différera légèrement de l'affichage (KaTeX).
- **Opportunité** : réelle ; l'éditeur d'abord, le type « expression » ensuite.

## Lot 14 — molécules (Ketcher ou génération au build)

- **Ketcher** (EPAM, licence Apache 2.0, version 3.21, très actif) : éditeur complet de structures chimiques.
  Mais il est écrit avec React (un second cadre d'interface dans une application Svelte), son mode hors ligne
  embarque le moteur Indigo en WebAssembly (environ 9 Mo, plus environ 16 Mo de JavaScript), et rien n'indique
  qu'il soit utilisable au doigt sur téléphone. L'application passerait d'environ 2 Mo à plus de 15 Mo.
- **Besoin réel d'Abbon** : surtout *afficher* des molécules (formules topologiques, groupes caractéristiques)
  dans des questions écrites par les auteurs ; l'élève n'en dessine pas dans un QCM.
- **Proposition** : d'abord générer les figures **à la construction des modules**, depuis une notation SMILES dans
  les sources (par exemple `![éthanol](smiles:CCO)`), avec RDKit (licence BSD) ou Indigo. Le résultat est un SVG
  ordinaire, tracé en `currentColor`, qui passe par le nettoyage existant : rien de plus dans l'application.
- **Ketcher plus tard**, seulement si l'on veut dessiner des molécules dans l'éditeur d'Abbon : chargé à la
  demande, sur ordinateur, dans un cadre isolé (mode d'intégration prévu par Ketcher), le dessin étant enregistré
  en SVG avec sa source (molfile) pour pouvoir le modifier.
- **Opportunité** : la génération au build oui, dès que la chimie organique entre dans le module ; Ketcher dans
  l'application, non pour l'instant.

## Lot 15 — ceintures et points (étude)

**But** : inciter à ranger dans la boîte de révision les questions échouées, puis à les réviser jusqu'à les
savoir. La récompense doit donc suivre la **mémorisation**, pas le volume d'activité : des points pour chaque
réponse pousseraient à enchaîner des QCM faciles, ce qui est l'inverse de l'objectif.

### Ce qui rapporte des points

| Événement | Points | Condition |
|---|---|---|
| Erreur rangée | 1 | La question a été échouée dans une tentative terminée, puis mise dans la boîte |
| Question en progrès | 2 | Elle atteint le compartiment 3 (deux bonnes réponses, sur au moins 2 jours) |
| Question acquise | 5, ou 10 si c'était une erreur rangée | Bonne réponse à une révision due, depuis le compartiment 5 (au moins 28 jours après le premier passage) |
| QCM réussi | 2 | Première tentative complète au-dessus du seuil de réussite du QCM |
| Module terminé | 10 | Tous les QCM du module réussis au moins une fois ; un badge à son nom |

- Une erreur rangée puis acquise rapporte ainsi 13 points, contre 2 pour un QCM réussi : la boîte est le
  chemin le plus payant, ce qui est voulu.
- Le point « erreur rangée », gagné tout de suite, récompense la collecte ; les deux autres, gagnés au fil des
  révisions, récompensent la répétition. L'étape du compartiment 3 évite d'attendre un mois la première
  récompense.
- **Chaque événement ne rapporte qu'une fois** (par question, par QCM, par module) : retirer puis remettre une
  carte, ou refaire un QCM réussi, ne rapporte rien. « Réviser quand même » ne fait déjà pas avancer une carte ;
  il ne rapporte donc rien non plus.
- **Les points ne se perdent jamais**, comme une ceinture de judo ne se retire pas : une carte qui retombe au
  compartiment 1 ne coûte rien, elle pourra seulement être acquise plus tard. Perdre des points ferait redouter
  les erreurs, qui sont précisément la matière de la boîte.

### Ceintures

Ordre des ceintures du judo en France, d'après le total des points :

| Ceinture | Blanche | Jaune | Orange | Verte | Bleue | Marron | Noire |
|---|---|---|---|---|---|---|---|
| Points | 0 | 20 | 60 | 120 | 250 | 450 | 750 |

Puis un **dan** de plus tous les 500 points, pour ne pas plafonner. La ceinture jaune vient dans la première
semaine d'usage régulier ; la noire demande de l'ordre de 50 questions échouées puis acquises, en plus des QCM,
donc plusieurs mois. Ces seuils sont des constantes, à recaler après quelques semaines d'usage : les points
étant enregistrés événement par événement, les changer ne perd rien.

### Où cela se voit

- **Corrigé d'une tentative** : un bouton « Ranger mes N erreurs dans ma boîte (+N points) », en plus du bouton
  « Ma boîte » de chaque question. C'est le geste à encourager, il doit tenir en un clic. (L'ajout groupé était
  déjà noté comme évolution possible de la boîte.)
- **Accueil et écran Révision** : la ceinture (petit dessin et nom en toutes lettres), les points, ce qu'il
  reste avant la suivante, le nombre de questions acquises et de questions à revoir aujourd'hui.
- **Passage de ceinture** : un message annoncé aux lecteurs d'écran, animation désactivée si l'appareil demande
  moins de mouvement.
- **Réglages** : « Afficher les ceintures et les points », activé par défaut. Désactivé, rien ne s'affiche, mais
  les points continuent d'être comptés.
- Le nom de la ceinture est toujours écrit : la couleur seule ne suffit pas (daltonisme, lecteurs d'écran), et
  les ceintures blanche et noire ont un contour pour rester visibles en thème clair comme sombre.

### Écarté

- **Séries de jours consécutifs** : elles poussent à revenir chaque jour, mais une série perdue décourage ; la
  boîte fixe déjà le rythme par ses dates de révision. À reconsidérer sous forme d'objectif hebdomadaire.
- **Classements** : Abbon fonctionne hors ligne, pour une seule personne.
- **Points pour chaque bonne réponse** : récompense le volume, pas la mémorisation.
- **Contournements** : on pourrait gagner des points avec un QCM personnel trop facile. Pour une application
  personnelle hors ligne, on ne tricherait que contre soi-même ; aucune protection n'est prévue.

### Réalisation

- Migration `0008` : table `reward` (`kind`, `ref`, `points`, `at`), clé primaire (`kind`, `ref`) pour qu'un
  événement ne compte qu'une fois ; colonne `origin` (`error` ou `choice`) sur `leitner_card`, renseignée à
  l'ajout selon que la question a été échouée ou non.
- `domain/rewards.ts`, fonctions pures et testées : barème, événements produits par une révision, une fin de
  tentative ou un ajout de carte, ceinture et dan d'après un total.
- Branchements dans le dépôt de données (ajout de carte, révision, fin de tentative) ; table comprise dans la
  sauvegarde complète ; les points restent si un module est désinstallé.
- Interface : bouton groupé du corrigé, ceinture à l'accueil et dans l'écran Révision, réglage, textes français
  et anglais ; audit d'accessibilité.
- Taille : un lot moyen, comparable à celui de la boîte de révision.

## Décisions prises

- Licence du contenu : CC BY-NC-SA 4.0.
- Rendu des formules : KaTeX. Figures en thème sombre : SVG incrusté après nettoyage.
- Programme de maths spécialité : 2019 d'abord, puis 2026.
- Distribution des modules : fichiers `.qcm` joints aux releases GitHub, lien dans l'application, puis import.
- Module Informatique : 13 rubriques ; cybersécurité en culture générale, sans exclusion de sujet ; anglais prévu
  mais pas dans les premières versions.
- Modules de bac : français seulement ; ébauches de questions dans `modules/_ebauches/`, reprises dans les modules.
- Tant qu'Abbon n'a pas d'autres utilisateurs, aucune reprise de données n'est exigée d'un lot à l'autre : une
  migration peut être modifiée, et la base locale effacée (`~/.config/org.abbon.app` sous Linux).
