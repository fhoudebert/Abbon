# Journal des versions

Chaque version a une section `## X.Y.Z`, avec des sous-sections `### fr` et `### en`.
Leur contenu est repris tel quel dans les notes de version (page de téléchargement, application).

## 0.2.0

### fr
- Modules de contenu : un fichier `.qcm` s'installe, se met à jour et se retire d'un bloc ; ses QCM sont protégés (« Dupliquer pour modifier » en fait une copie personnelle).
- Fiches de révision par catégorie, depuis la page d'un QCM et depuis le corrigé.
- Premier module, en version pilote : « Anglais : verbes irréguliers » (60 questions, français et anglais).
- Désinstallation avec ou sans l'historique des tentatives ; gardé, il revient à la réinstallation.
- Deux nouveaux types de questions : réponse courte (texte à saisir) et réponse numérique (valeur, écart toléré, unité).
- Import et export GIFT des réponses courtes et numériques.
- Textes à trous : chaque trou se remplit par une saisie ou par une liste déroulante.
- Formules mathématiques (LaTeX), équations chimiques et unités, dans les énoncés, les réponses et les explications.
- Figures SVG, qui suivent le thème clair ou sombre.
- Module « Informatique », version pilote : 14 rubriques, 175 questions, dont HTML5 et CSS sans JavaScript, HTML5 avancé avec JavaScript, et une rubrique Matériel (composants, assemblage, périphériques).
- Modules de révision du bac, versions pilotes : physique-chimie (124 questions, niveaux bases, approfondissement et expert), maths spécialité (120, niveaux bases, approfondissement et expert), maths expertes (90, niveaux bases, approfondissement et expert), avec une fiche de révision par catégorie.
- Version macOS : une application pour Mac Apple silicon et Intel, avec mises à jour automatiques.
- Boîte de révision (Leitner) : rangez les questions à retenir avec « Ma boîte », révisez-les à intervalles croissants.
- Éditeur visuel de formules (MathLive) : saisie sans LaTeX, avec un clavier mathématique sur écran tactile.
- « À propos » : lien vers le code source sur GitHub.
- Modules : molécules dessinées à partir de leur notation SMILES (formules topologiques qui suivent le thème clair ou sombre).
- Nouveau type de question « expression » : l'élève écrit une formule ; toute écriture équivalente est acceptée (option « à une constante près » pour les primitives).
- Accueil : le filtre des catégories est un arbre ; choisir un regroupement (Physique, Chimie…) montre tous ses QCM. Les modules peuvent regrouper leurs catégories (`parent:`).
- Boîte de révision : nouvelles cartes saisies directement (recto-verso, réponse courte, numérique, formule…), révisées dans l'ordre de saisie ; récapitulatif de toutes les cartes, à imprimer, enregistrer en PDF ou en HTML ; une carte se retire aussi pendant une séance ou depuis le récapitulatif.
- Nouveau type de question « recto-verso » : on retourne la carte, puis on dit si l'on savait.
- Ceintures et points : la révision régulière de la boîte est récompensée (points par révision, bonus quand la journée est à jour, questions acquises), de la ceinture blanche à la noire, puis des dans ; désactivable dans les paramètres.
- Boîte de révision : délais de 1, 2, 4, 8 et 16 jours ; une question juste au dernier compartiment est acquise et sort du planning ; à la fin d'un QCM, les questions échouées se rangent dans la boîte en les cochant.

- Mises à jour depuis les releases GitHub : sans site de téléchargement, l'application (AppImage comprise) lit la dernière release publiée ; l'adresse d'un dépôt GitHub est acceptée dans les paramètres.
- Module « Anglais : grammaire et pièges des francophones », version pilote : prépositions, temps, verbes, faux amis et structures, du niveau B1 au C1 (TOEIC, Cambridge), 150 questions et 5 fiches de révision.
- Export en site web : un QCM, un module ou tous les QCM deviennent un site complet, à déposer par FTP sur un hébergement même mutualisé, sans base de données. La progression de chaque visiteur reste dans son navigateur ; boîte de révision comprise ; mode examen seulement en option.
### en
- Content modules: a `.qcm` file is installed, updated and removed as a whole; its quizzes are protected (“Duplicate to edit” makes a personal copy).
- Revision sheets per category, from the quiz page and from the answers.
- First module, pilot version: “English: irregular verbs” (60 questions, French and English).
- Uninstall with or without the attempt history; when kept, it comes back on reinstall.
- Two new question types: short answer (typed text) and numerical answer (value, tolerance, unit).
- GIFT import and export of short and numerical answers.
- Fill-in-the-gap questions: each gap is typed or picked from a drop-down list.
- Mathematical formulas (LaTeX), chemical equations and units, in questions, answers and explanations.
- SVG figures that follow the light or dark theme.
- “Computer science” module, pilot version (French only): 14 topics, 175 questions, including HTML5 and CSS without JavaScript, advanced HTML5 with JavaScript, and a Hardware topic.
- Pilot versions of the French baccalaureate revision modules (French only): physics-chemistry, mathematics, advanced mathematics, with a revision sheet for each category.
- macOS version: one app for Apple silicon and Intel Macs, with automatic updates.
- Review box (Leitner): put the questions to remember in it with “My box”, review them at growing intervals.
- Visual formula editor (MathLive): no LaTeX needed, with a math keyboard on touch screens.
- “About”: link to the source code on GitHub.
- Modules: molecules drawn from their SMILES notation (skeletal formulas that follow the light or dark theme).
- New “expression” question type: the learner writes a formula; any equivalent form is accepted (“up to a constant” option for antiderivatives).
- Home: the category filter is a tree; choosing a group (Physics, Chemistry…) shows all its quizzes. Modules can group their categories (`parent:`).
- Review box: new cards entered directly (flashcard, short answer, number, formula…), reviewed in the order entered; a summary of all cards, to print, save as PDF or as HTML; a card can also be removed during a session or from the summary.
- New “flashcard” question type: flip the card, then say whether you knew it.
- Belts and points: regular reviewing of the box is rewarded (points per review, a bonus once the day is up to date, learnt questions), from white to black belt, then dan grades; can be turned off in the settings.
- Review box: intervals of 1, 2, 4, 8 and 16 days; a question answered right in the last compartment is learnt and leaves the schedule; at the end of a quiz, tick the missed questions to put them in the box.
- Updates from GitHub releases: without a download website, the app (AppImage included) reads the latest published release; a GitHub repository address is accepted in the settings.
- “English: grammar and traps for French speakers” module, pilot version (explanations in French): prepositions, tenses, verbs, false friends and sentence structure, from B1 to C1 (TOEIC, Cambridge), 150 questions and 5 revision sheets.
- Website export: a quiz, a module or all quizzes become a complete website to upload by FTP to any host, including shared hosting, with no database. Each visitor’s progress stays in their browser, review box included; optional exam-only mode.

## 0.1.0

### fr
- Passage des QCM : entraînement (correction immédiate) ou examen (chronométré), reprise, récapitulatif, corrigé.
- Édition : éditeur riche (code coloré, tableaux, images), catégories, contrôles avant publication, code PIN facultatif.
- Échange : import / export `.qcm` et GIFT (Moodle), sauvegarde complète et restauration.
- Mises à jour : automatiques sous Linux et Windows, proposées sous Android.

### en
- Taking quizzes: practice (instant feedback) or exam (timed), resume, summary, answers.
- Editing: rich editor (highlighted code, tables, images), categories, checks before publishing, optional PIN.
- Exchange: `.qcm` and GIFT (Moodle) import / export, full backup and restore.
- Updates: automatic on Linux and Windows, offered on Android.
