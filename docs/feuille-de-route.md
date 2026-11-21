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
| Lots 9 à 11 | Modules de bac : Physique-chimie, Maths spécialité, Maths expertes ; bases et fiches faites, approfondissement fait en maths spécialité (0.3.0, 80 questions), maths expertes (0.3.0, 60 questions) et physique-chimie (0.5.0, 72 questions, catégorie énergie créée) | en cours |
| Lot 12 | Anglais : verbes irréguliers, version complète (environ 150 verbes) | à faire |
| Technique A | **Actions GitHub et Node.js** : actions en Node 24, construction en Node 26 | fait, validé sur GitHub |
| Technique B | **Version macOS en CI** : application universelle (Apple silicon et Intel), `.dmg`, mises à jour automatiques | fait, validé sur GitHub |
| Lot 13 | **MathLive** : saisie visuelle des formules dans l'éditeur, puis réponses sous forme d'expression | fait (à valider sous Linux et Android) |
| Lot 14 | **Molécules** : formules topologiques générées en SVG à la construction des modules ; Ketcher plus tard, si besoin | fait (génération au build) |
| Lot 15 | **Ceintures et points** : récompenser surtout la révision régulière, selon le planning de la boîte, et la mémorisation ; la collecte des questions échouées un peu ; les QCM et modules terminés accessoirement | fait (avant le perfectionnement des QCM) |
| Lot 16 | **Boîte de révision** : cartes personnelles (hors QCM), type recto-verso, récapitulatif imprimable de toutes les cartes | fait (impression à vérifier sur l'application construite) |
| Lot 17 | **Catégories regroupées** : Physique, Chimie… au-dessus des catégories des modules, filtre et recherche de l'accueil en tenant compte | étudié, à valider |

Ordre retenu ensuite : lot 15, le type « expression » (lot 13) et les molécules (lot 14) sont faits ; vient le
perfectionnement des QCM de bac (niveaux « approfondissement » et « expert »), qui peut s'en servir.

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
- Écran « Révision » (menu) : cinq compartiments revus après 1, 2, 4, 8 et 16 jours (le délai double d'un compartiment au suivant) ;
  une bonne réponse au compartiment 5 rend la question acquise, hors du planning (lot 15). Une bonne réponse fait
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
- **Maths spécialité 0.3.0 — approfondissement** : un QCM de 10 questions par catégorie (suites
  arithmético-géométriques et suites auxiliaires, seuil, gendarmes ; dérivées de composées, valeurs
  intermédiaires, inflexion ; intégration par parties, aire entre courbes, équations différentielles ; loi
  binomiale, probabilités inversées, Bienaymé-Tchebychev, dénombrement). 12 questions de type « expression »
  (terme général, dérivée, primitive, solution d'équation différentielle). Les QCM de bases d'intégrales et de
  probabilités passent à 10 questions. Toutes les valeurs ont été recalculées (SymPy) ; pour chaque expression,
  un test vérifie que les écritures équivalentes sont acceptées et les erreurs classiques refusées
  (`domain/expr.modules.test.ts`). Fiches complétées (suites arithmético-géométriques, anagrammes).
- **Physique-chimie 0.5.0 — approfondissement et énergie** : un QCM « approfondissement » de 10 questions pour
  la matière (pH et $\mathrm{p}K_A$, tampon, demi-équivalence, cinétique d'ordre 1, quotient de réaction,
  rendement, Beer-Lambert, pile, cétone dessinée), le mouvement (portée, hauteur, satellite, champ électrique,
  quantité de mouvement, freinage, énergie) et les ondes (interfrange, diffraction, niveaux sonores, Doppler,
  photon, effet photoélectrique, lunette, conjugaison, circuit RC). Nouvelle catégorie « L'énergie :
  conversions et transferts » : QCM de bases (gaz parfait, kelvin, premier principe, capacité thermique,
  transferts, flux et résistance thermiques, loi de Newton, albédo) et fiche. Valeurs recalculées ; fiches
  complétées. L'énergie sera rangée sous « Physique » si le lot 17 est retenu.
- **Maths expertes 0.3.0 — approfondissement** : un QCM de 10 questions par catégorie (puissances et forme
  exponentielle, second degré dans $\mathbb{C}$, racines de l'unité, médiatrice, rotation, Moivre, linéarisation ;
  Fermat, restes de puissances, Bézout, équations diophantiennes, congruences, Euclide ; inverse et système,
  puissances de matrices, point fixe d'une suite matricielle, chaînes de Markov, chaînes dans un graphe). Les
  QCM de bases passent à 10 questions ; fiches complétées. Pas de question « expression » sur les complexes :
  le comparateur traite `i` comme une variable réelle.
- Le comparateur d'expressions ignore un membre de gauche écrit par l'élève (« $y = x - 1$ », « $u_n = \dots$ »).
- Physique-chimie 0.4.0 : première molécule dessinée (lot 14). 0.3.0 : question d'oxydoréduction sur l'argenterie noircie (rôle de l'aluminium, du sel, de
  la chaleur et du bicarbonate ; d'après Médiachimie), exemple repris dans la fiche ; équations longues des
  explications écrites sur deux lignes pour tenir à 390 px.
- Étiquette `prog-2019` sur chaque QCM de maths, pour la bascule vers le programme 2026 (bac 2028).
- Version 0.2.0 : une fiche de révision par catégorie (10 fiches) — l'essentiel du cours, les formules et les
  pièges classiques, en cohérence avec les questions. Vérifiées à 390 px (aucun tableau ni formule coupés).
- Suite : approfondissement de l'énergie, puis niveau « expert » ; relecture par un
  enseignant (questions et fiches) ; physique-chimie : catégorie « L'énergie : conversions et transferts ».
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
- **Validé** : le workflow *Build* passe sur GitHub en Node 26 (21 novembre 2026).

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
- **Validé** : les jobs `macos` et `smoke-macos` passent sur GitHub (21 novembre 2026).
- **Reste** : un essai sur un vrai Mac (premier lancement, mise à jour automatique).
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
- **Fait — éditeur (MathLive 0.111.4)** : bouton « Éditeur visuel » dans la barre de formule. Chargé à la
  première ouverture (morceau de 800 Ko à part), polices de KaTeX réutilisées, aucune requête réseau, sons
  coupés. Vérifié dans Chrome (bureau et téléphone tactile, thèmes clair et sombre, axe sans violation) : les
  7 formules de démonstration et des sources `\ce`, `\pu`, `9{,}81` rouvertes puis validées sans changement
  gardent leur source exacte ; saisie au clavier et au clavier virtuel reportées dans la question.
- **Reste à vérifier** sur l'application construite : WebKitGTK (Linux), WebView Android (clavier virtuel de
  MathLive et clavier du téléphone), macOS ; puis lecteur d'écran (Orca, TalkBack).
- **Fait — type « expression »** : l'élève écrit une formule dans un champ MathLive (clavier mathématique sur
  écran tactile) ; elle est comparée à la formule attendue en calculant les deux en 24 points tirés au hasard
  (`domain/expr.ts`, sans dépendance : Compute Engine n'a pas été nécessaire). Option « à une constante près »
  pour les primitives (`+ C` dans les sources). Éditeur (LaTeX, aperçu, éditeur visuel), corrigé, aperçu,
  boîte de révision, sources de modules (`· expression`), format d'échange ; GIFT : non exporté.
  Migration 9 : reconstruction des tables de questions, sans contrainte sur le type, données conservées.
- **Vérifié** : 75 tests de l'analyseur (écritures de MathLive, équivalences, refus), compilation des sources,
  migration 9 sur des données ; dans Chrome, bureau et téléphone tactile, clair et sombre : réponses
  équivalentes acceptées (`3x^2-x^{-2}` pour $3x^2 - \frac{1}{x^2}$), « + C » accepté pour une primitive,
  réponse fausse refusée dans la boîte, formule illisible signalée dans l'éditeur, axe sans violation.
- **Limites** : la forme n'est pas jugée (factorisé ou développé), pas de factorielle, somme, limite, ni de
  dérivée notée `f'` ; les messages de l'analyseur ne sont qu'en français.
- **Ensuite** : utiliser ce type dans les modules de maths lors du perfectionnement (dérivées, primitives,
  termes généraux de suites) ; les questions des ébauches devenues des choix entre formules peuvent y revenir.

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
- **Fait — génération au build** : `![nom](smiles:…)` dans les sources ; RDKit.js 2026.9.2 (WebAssembly, en
  dépendance de développement) dessine la molécule pendant `module:check` / `module:build`
  (`scripts/modules/molecules.ts`) ; le SVG est réécrit (couleurs en `currentColor`, fond et métadonnées
  retirés, agrandi ×1,7 pour la lisibilité) puis joint comme une figure. Dessin reproductible (même fichier à
  chaque construction). L'analyseur Markdown des sources accepte les parenthèses dans la cible d'une image.
- **Premier usage** : physique-chimie 0.4.0, question « groupe caractéristique » sur l'éthanoate d'éthyle.
- **Vérifié** : tests de la réécriture, du dessin réel (RDKit chargé dans les tests), du compilateur (molécule
  résolue, SMILES illisible, texte alternatif manquant) ; dans Chrome, clair à 1100 px et sombre à 390 px : traits
  de la couleur du texte, texte alternatif lu (`role="img"`), aucun débordement, axe sans violation.
- **Reste** : Ketcher dans l'éditeur, si l'on veut un jour dessiner des molécules dans l'application.

## Lot 15 — ceintures et points

**But** : faire réviser chaque jour, selon le planning de la boîte, des questions choisies — en priorité celles
qu'on a échouées — jusqu'à les savoir. La récompense suit donc la **révision régulière** et la **mémorisation** ;
la collecte d'une carte rapporte peu, et une réponse dans un QCM ordinaire rien.

### Planning de révision

Le délai double d'un compartiment (niveau) au suivant : niveau 1 tous les jours, 2 tous les 2 jours, 3 tous les
4 jours, 4 tous les 8 jours, 5 tous les 16 jours. (Appliqué à la boîte dès cette version, à la place de 1, 2, 4,
7, 15.)

- **Carte acquise** : bonne réponse à sa révision au niveau 5, soit au moins 30 jours de bonnes réponses. Elle
  **sort alors du planning** et rejoint la liste « Acquises » de la boîte, d'où l'on peut la remettre au niveau 1.
  Sans cette sortie, les cartes s'accumuleraient au niveau 5 : avec une carte ajoutée par jour, on atteindrait
  20 révisions par jour au bout d'un an, et des points sans rapport avec ce qu'on apprend encore. Avec elle, la
  charge se stabilise vers 8 révisions par jour pour une carte ajoutée par jour (simulation sur un an).
- Le planning étant une suite de constantes, on pourra ajouter un niveau 6 (32 jours) avant l'acquisition si
  l'on veut un contrôle à plus long terme.
- **Cartes choisies** : seules les questions qu'on range soi-même entrent dans la boîte, pas toutes celles d'un
  QCM ni toutes ses erreurs.

### Barème

| Événement | Points | Condition |
|---|---|---|
| Révision faite | 1, ou 2 si la réponse est juste | Carte due (le jour prévu ou en retard) ; « Réviser quand même » ne rapporte rien |
| Journée à jour | 10 | Plus aucune carte due après la dernière révision du jour ; une fois par jour, s'il y avait au moins une carte due |
| Carte acquise | 10 | Une fois par question |
| Erreur rangée | 1 | Question échouée dans une tentative terminée, puis mise dans la boîte ; une fois par question |
| QCM réussi | 2 | Première tentative complète au-dessus du seuil du QCM |
| Module terminé | 10 | Tous ses QCM réussis au moins une fois ; un badge à son nom |

- Une carte rapporte environ 11 points de révisions sur son parcours, plus 10 à l'acquisition, contre 1 pour
  l'avoir rangée : la collecte pèse 3 à 4 % des points (simulation). C'est la régularité qui fait avancer, et
  le bonus « journée à jour » récompense le respect du planning.
- Une erreur en révision rapporte quand même 1 point : réviser est l'effort à encourager, et l'erreur renvoie
  déjà la carte au niveau 1.
- **Les points ne se perdent jamais** et chaque événement n'est compté qu'une fois (par question, par jour, par
  QCM, par module).
- Pas de série de jours consécutifs à préserver : un jour manqué fait seulement perdre le bonus de ce jour, et
  les cartes en retard restent à réviser (elles rapportent toujours leurs points).

### Ceintures

Ordre des ceintures du judo en France, d'après le total des points ; seuils calés par simulation :

| Ceinture | Blanche | Jaune | Orange | Verte | Bleue | Marron | Noire |
|---|---|---|---|---|---|---|---|
| Points | 0 | 100 | 300 | 700 | 1 500 | 3 000 | 5 000 |

Puis un **dan** de plus tous les 3 000 points. Délais simulés pour qui révise tous les jours :

| Cartes ajoutées | Révisions par jour | Verte | Bleue | Marron | Noire |
|---|---|---|---|---|---|
| 1 par jour | 8 | 5 semaines | 2 mois | 3 mois | 5 mois |
| 3 par jour | 24 | 3 semaines | 5 semaines | 2 mois | 2 mois et demi |
| 1 par jour, un jour sur trois sauté | 8 | 6 semaines | 2 mois | 3 mois et demi | 6 mois |

Ces seuils sont des constantes, à recaler après quelques semaines d'usage réel : les points étant enregistrés
événement par événement, les changer ne perd rien.

### Où cela se voit

- **Résultat d'une tentative** : un encadré « Questions à retenir » liste les questions échouées, chacune avec
  une case à cocher (aucune cochée d'avance ; celles déjà dans la boîte sont signalées), et un bouton « Ranger
  N questions dans ma boîte ». Le bouton « Ma boîte » de chaque question reste disponible pendant le QCM et dans
  le corrigé, y compris pour une question réussie (le point de collecte ne vaut que pour une question échouée).
- **Accueil** : nombre de cartes dues aujourd'hui en tête, avec le bonus à gagner (« 7 révisions pour être à
  jour : +10 »), la ceinture (petit dessin et nom en toutes lettres), les points et ce qu'il reste avant la
  suivante.
- **Écran Révision** : en fin de séance, les points gagnés et, le cas échéant, « Journée à jour » ; les cinq
  niveaux et leur rythme ; la liste des cartes acquises.
- **Passage de ceinture** : un message annoncé aux lecteurs d'écran, animation désactivée si l'appareil demande
  moins de mouvement.
- **Réglages** : « Afficher les ceintures et les points », activé par défaut. Désactivé, rien ne s'affiche, mais
  les points continuent d'être comptés.
- Le nom de la ceinture est toujours écrit (la couleur seule ne suffit pas) ; les ceintures blanche et noire ont
  un contour pour rester visibles en thème clair comme sombre.

### Écarté

- **Séries de jours consécutifs** : une série perdue décourage ; le bonus quotidien récompense la régularité
  sans rien retirer.
- **Classements** : Abbon fonctionne hors ligne, pour une seule personne.
- **Points pour chaque réponse de QCM** : récompense le volume, pas la mémorisation.
- **Contournements** (cartes trop faciles, erreurs volontaires) : pour une application personnelle hors ligne, on
  ne tricherait que contre soi-même ; aucune protection n'est prévue.

### Réalisation (faite)

- Migration `0008` : table `reward` (`kind`, `ref`, `points`, `at`), clé primaire (`kind`, `ref`) pour qu'un
  événement ne compte qu'une fois (`ref` : la question, le QCM, le module, ou la date pour « journée à jour ») ;
  colonne `acquired_at` sur `leitner_card` pour les cartes sorties du planning.
- `domain/rewards.ts`, fonctions pures et testées : barème, événements produits par une révision, une fin de
  tentative ou un ajout de carte, ceinture et dan d'après un total ; le simulateur qui a servi à caler les
  seuils devient un test.
- `domain/leitner.ts` : sortie du planning à l'acquisition, remise au niveau 1.
- Branchements dans le dépôt de données ; table comprise dans la sauvegarde complète ; les points restent si un
  module est désinstallé.
- Interface : encadré du corrigé, accueil, écran Révision, réglage, textes français et anglais ; audit
  d'accessibilité.
- **Vérifié** : tests du barème, des ceintures, de l'acquisition, des deux dépôts et de la sauvegarde ; la
  simulation, rejouée sur le code réel, donne la ceinture noire au 158e jour pour une question ajoutée par jour
  (8 révisions par jour en régime établi). Parcours complet dans Chrome avec une horloge avancée jour après jour :
  collecte depuis le résultat, séance et « journée à jour », acquisition au 30e jour, remise en révision,
  annonce du passage à la ceinture jaune, réglage masquant ; clair à 1100 px et sombre à 390 px, axe sans
  violation.
- Restent possibles : un badge visible par module terminé (les points sont comptés), un objectif hebdomadaire.

## Lot 16 — boîte de révision : cartes personnelles et récapitulatif

**Fait** (décision : avec le recto-verso ; cartes personnelles au compartiment 1, dans l'ordre de saisie) :

- Écran Révision : boutons « Nouvelle carte » et « Récapitulatif ».
- **Nouvelle carte** (`/leitner/new`) : éditeur de question limité aux types utiles (recto-verso par défaut,
  réponse courte, numérique, expression, choix unique), sans barème ; « Enregistrer la carte » ou « Enregistrer
  et en saisir une autre ». La question rejoint le QCM brouillon « Mes cartes de révision » (`mes-cartes`, créé
  à la première carte, modifiable dans l'administration, absent de l'accueil) et sa carte entre au
  compartiment 1. À compartiment et date égaux, les cartes sont proposées dans l'ordre d'ajout.
- **Recto-verso** (`flashcard`) : énoncé au recto, verso dans `explanation` ; on retourne la carte, puis « Je
  savais » ou « À revoir » (`answer.text` = `known` / `unknown`). Dans la boîte comme dans un QCM, dans le
  corrigé et l'aperçu ; éditeur (libellés Recto / Verso, bouton « + Recto-verso ») ; sources de modules
  (`· flashcard`, verso dans le bloc `>`) ; format d'échange ; GIFT : non exporté. Un export sans corrigé retire
  le verso, comme toute explication.
- **Récapitulatif** (`/leitner/recap`) : cartes par compartiment puis acquises, avec ou sans réponses ;
  « Imprimer ou enregistrer en PDF » (`window.print()`, styles d'impression en clair, sans en-tête ni
  boutons) ; « Enregistrer en HTML » : fichier autonome (styles et polices des formules inclus, environ
  400 Ko) qui s'ouvre hors ligne dans un navigateur ; sous Android, seul ce bouton est proposé.
- Au passage, correction d'un défaut de l'éditeur riche : à la perte du focus quand l'éditeur est retiré de la
  page, il modifiait un état pendant le rendu (`state_unsafe_mutation`), ce qui pouvait aussi arriver dans
  l'administration en changeant de question pendant la saisie.
- **Vérifié** : tests (notation déclarée, validation du verso, sources, format, ordre de saisie) ; dans Chrome,
  clair à 1100 px et sombre à 390 px, axe sans violation : saisie de deux cartes enregistrées sans pause
  (la carte suivante reste vierge), révision dans l'ordre de saisie, carte retournée puis notée, recto-verso
  dans une tentative, récapitulatif avec et sans réponses, impression émulée (PDF produit), fichier HTML ouvert
  seul. **Reste** : l'impression dans WebKitGTK, WebView2 et WKWebView, et l'enregistrement du fichier sous
  Android, sur l'application construite.

### Étude

### Cartes personnelles

Ajouter à la boîte, depuis l'écran Révision, une carte qui ne vient d'aucun QCM (une formule, une date, un
mot de vocabulaire…).

- **Saisie** : bouton « Nouvelle carte » ; formulaire court avec l'énoncé (éditeur riche : texte, formule,
  image), la réponse et, si l'on veut, une explication. Réponses possibles : réponse courte (variantes
  acceptées), réponse numérique, expression, ou **recto-verso** (voir ci-dessous). La carte entre au
  compartiment 1, à revoir tout de suite.
- **Stockage** : les cartes personnelles sont les questions d'un QCM personnel « Mes cartes », créé à la
  première carte. La carte de la boîte y renvoie comme les autres (`leitner_card.quiz_id` n'est pas une clé
  étrangère : aucun changement de schéma). On profite ainsi de l'existant : modification dans l'éditeur,
  sauvegarde complète, export `.qcm` pour partager ses cartes, et même passage en QCM ordinaire.
- **Recto-verso** : nouveau type de question `flashcard`, sans réponse à saisir. On lit le recto, on retourne
  la carte, puis on dit soi-même « Je savais » ou « À revoir ». Il convient à ce qui ne se vérifie pas
  automatiquement (une définition, un énoncé de théorème). Sans ce type, le lot est plus petit (réponse
  courte, numérique ou expression seulement) ; il peut venir dans un second temps.
- **Points** : ceux de la révision, comme toute carte ; pas de point de collecte (ce n'est pas une erreur
  rangée).
- Taille : petite sans le type recto-verso, moyenne avec.

### Récapitulatif imprimable

- Page « Récapitulatif », ouverte depuis l'écran Révision : toutes les cartes, groupées par compartiment
  (1 à 5, puis acquises), avec pour chacune l'énoncé, la bonne réponse, l'explication, le QCM d'origine et la
  prochaine date de révision. Formules, figures et molécules rendues comme dans l'application. Choix « avec ou
  sans les réponses » (la version sans réponses sert de feuille d'entraînement).
- Feuille de style d'impression : une colonne, sans menus ni boutons, thème clair forcé, pas de coupure au
  milieu d'une carte.
- Bouton « Imprimer ou enregistrer en PDF » : `window.print()`, que Tauri relaie à la WebView sur ordinateur.
  Sous Linux, la boîte d'impression GTK propose « Imprimer dans un fichier » (PDF) ; sous Windows, « Microsoft
  Print to PDF » ; sous macOS, le bouton PDF. À vérifier sur l'application construite, WebKitGTK en tête.
- **Android** : la WebView n'imprime pas par `window.print()` (le service d'impression d'Android n'est pas
  relié). Deux possibilités : exporter le récapitulatif en fichier HTML autonome (styles et polices des
  formules inclus, environ 400 Ko), à ouvrir dans le navigateur pour l'imprimer ou le partager ; ou un petit
  greffon Kotlin qui appelle le service d'impression (plus propre, plus long). Le fichier HTML d'abord.
- **Écarté** : fabriquer le PDF dans l'application (pdf-lib, jsPDF) ; les formules et les figures SVG
  seraient très difficiles à reproduire fidèlement.
- Taille : petite à moyenne (page, impression ; export HTML pour Android).

## Lot 17 — catégories regroupées (étude)

**Besoin** : filtrer « Physique » (Mouvement et interactions, Ondes et signaux, L'énergie) et « Chimie »
(Constitution et transformations de la matière) depuis l'accueil.

**Constat** : le modèle est déjà hiérarchique (`category.parentId`, choix du parent dans l'administration des
catégories, parents gardés à l'export), mais rien ne s'en sert vraiment : les catégories des modules sont
toujours de premier niveau, et le filtre de l'accueil compare la catégorie exacte, dans une liste à plat.

**Proposition** :

1. **Modules** : `parent:` sur une catégorie de `module.yaml`, et des catégories de regroupement sans QCM.
   Physique-chimie : *Physique* au-dessus de Mouvement et interactions, Ondes et signaux, L'énergie ; *Chimie*
   au-dessus de Constitution et transformations de la matière. Le compilateur vérifie que le parent existe et
   qu'il n'y a pas de boucle.
2. **Filtre de l'accueil** : liste en arbre (catégories filles en retrait sous leur parent) ; choisir un parent
   montre les QCM de toutes ses descendantes. Un regroupement n'apparaît que s'il contient des QCM.
3. **Recherche** : le texte cherché porte aussi sur le nom de la catégorie et de ses parents. Taper
   « physique » trouve tous les QCM de physique, « chim » ceux de chimie : c'est le « commençant par »
   demandé, sans convention de nommage.

- **Écarté** : un préfixe dans les noms (« Physique — Ondes et signaux ») : fragile, noms à rallonge, et ce
  n'est pas un vrai regroupement.
- Les catégories personnelles se regroupent déjà dans l'administration ; elles profiteront du même filtre.
  Les fiches de révision restent attachées aux catégories qui portent des QCM.
- Taille : petite (compilateur, filtre et recherche de l'accueil, tests).

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
