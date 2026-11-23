# Journal des versions

Chaque version a une section `## X.Y.Z`, avec des sous-sections `### fr` et `### en`.
Leur contenu est repris tel quel dans les notes de version (page de téléchargement, application).

## 0.2.0

### fr
- Correction : « Dupliquer pour modifier » un QCM de module ouvrait une copie encore protégée, impossible à modifier (et qui aurait disparu avec le module). La copie est désormais un QCM personnel, ouvert directement dans l'éditeur avec le message « Copie créée » ; les copies déjà faites sont réparées au démarrage.
- QCM livrés avec l'application : « Formules et figures » est signalé comme questionnaire de démonstration ; « Anglais – verbes irréguliers » (une question) n'est plus installé, et il est retiré d'une installation existante s'il n'a pas été modifié.
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
- Export en site web : un QCM, un module ou tous les QCM deviennent un site complet, à déposer par FTP sur un hébergement même mutualisé, sans base de données. La progression de chaque visiteur reste dans son navigateur, boîte de révision comprise. Modes proposés au choix : entraînement et examen, entraînement seulement, examen seulement ; modifiables après l'export dans reglages.js.
- Export en site web, examen corrigé par le serveur (PHP) : les réponses attendues ne sont plus dans les fichiers du site ; chaque copie est notée par un petit script PHP déposé avec le site, qui renvoie la note puis, si reglages.js le permet, le corrigé. Le site d'entraînement reste sans programme côté serveur.
- Examen corrigé par le serveur : copies gardées sur le serveur. L'élève indique son nom (et sa classe) avant l'examen ; l'enseignant consulte les copies dans l'espace enseignant (examen/enseignant.php), protégée par un mot de passe tiré au hasard à l'export, et les télécharge au format CSV pour un tableur. Désactivable dans reglages.js (copies: "non").
- Examen corrigé par le serveur : par défaut, l'élève ne voit que sa note. Quand le temps de l'épreuve est écoulé, l'enseignant publie le corrigé de chaque QCM dans l'espace enseignant, protégé par mot de passe ; les élèves voient alors le détail par question et le corrigé, y compris ceux qui ont déjà rendu leur copie. Autres choix : corrigé dès la copie rendue, ou jamais.
- Examen corrigé par le serveur : le surveillant ouvre et ferme l'examen dans l'espace enseignant, avec un code d'accès et une durée facultatifs ; le serveur note l'heure de début de chaque élève, signale les copies hors délai ou rendues après la fermeture, liste les élèves en cours et les copies multiples au même nom ; une seule copie par QCM ; suppression des copies depuis l'espace enseignant.
- Espace enseignant : liste de classe facultative (seuls ces noms peuvent commencer, sans tenir compte des accents ni de l'ordre des mots ; absents signalés), détail de chaque copie question par question, statistiques par question d'un QCM (réussite, points moyens, sans réponse) et CSV avec les points de chaque question.
- Site web : seuil de réussite commun à tous les QCM, réglable après l'export dans reglages.js (seuil).
- Site web : tirage au sort de N questions parmi celles du QCM pour chaque examen, désactivé par défaut, réglable dans reglages.js (tirage) ; avec la correction par le serveur, le tirage est fait et contrôlé par le serveur.
- Questionnaires publiés à part, sur https://fhoudebert.github.io/abbon/questionnaires/ (par langue et par rubrique) : lien dans « À propos » et sur la page d'import ; pages index produites par `npm run module:catalogue`. L'application se construit et se publie sans eux.
- Modules « Espagnol : pièges des francophones » (31 questions : faux amis, grammaire et conjugaison, expressions) et « Histoire : dates insolites ou méconnues » (33 questions, de la domestication des animaux au premier iPhone), en version pilote, avec leurs fiches de révision.
- Module « Enseignement scientifique, terminale générale », en version pilote : un QCM d'entraînement par thème du programme (climat, énergies, histoire du vivant), 36 questions et leurs fiches de révision.
- Module « Biologie, SVT spécialité terminale », en version pilote : révision du bac sur les parties biologiques du programme (génétique et évolution, de la plante sauvage à la plante domestiquée, corps humain et santé), 36 questions et leurs fiches de révision.
- Module « Sciences de l'ingénieur, spécialité terminale », en version pilote : révision du bac (analyse des systèmes, mécanique et énergie, commande et information), 36 questions et leurs fiches de révision.
- Module « Étymologie : curiosités méconnues », en version pilote : argent et travail, mots voyageurs, noms propres et fausses pistes, 36 questions et leurs fiches.
- Modules de révision du bac « Philosophie, terminale générale » (notions par perspective, auteurs, repères) et « Histoire, terminale générale » (les quatre thèmes du tronc commun, avec une frise par thème), en version pilote : 40 questions chacun, avec leurs fiches.
- Maths spécialité 0.5.0 : géométrie dans l'espace, logique et raisonnement, algorithmique et méthodes numériques (32 questions), communes au programme de 2019 et au nouveau programme de terminale (rentrée 2027). Physique-chimie 0.9.0 : mécanique des fluides (10 questions).
### en
- Fix: “Duplicate to edit” on a module quiz opened a copy that was still protected and could not be edited (and would have disappeared with the module). The copy is now a personal quiz, opened straight in the editor with a “Copy created” message; existing copies are repaired at startup.
- Quizzes shipped with the app: “Formulas and figures” is labelled as a demo quiz; “English – irregular verbs” (a single question) is no longer installed, and is removed from an existing installation if it was not modified.
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
- Website export: a quiz, a module or all quizzes become a complete website to upload by FTP to any host, including shared hosting, with no database. Each visitor’s progress stays in their browser, review box included. Modes offered: practice and exam, practice only, or exam only; can be changed after export in reglages.js.
- Website export, exam graded by the server (PHP): the expected answers are no longer in the website files; each submission is graded by a small PHP script uploaded with the site, which returns the score and then, if reglages.js allows it, the answers. The practice website still needs no server-side program.
- Server-graded exam: submissions kept on the server. Students enter their name (and class) before the exam; the teacher views the submissions in the teacher area (examen/enseignant.php), protected by a password generated at export, and downloads them as CSV for a spreadsheet. Can be turned off in reglages.js (copies: "non").
- Server-graded exam: by default, students only see their score. Once the exam time is over, the teacher publishes the answers for each quiz in the password-protected teacher area; students then see the question-by-question details and the answers, including those who have already submitted. Other choices: answers as soon as the student submits, or never.
- Server-graded exam: the invigilator opens and closes the exam in the teacher area, with an optional access code and duration; the server records each student's start time, flags late submissions and those received after closing, lists students in progress and several submissions under the same name; one submission per quiz; submissions can be deleted from the teacher area.
- Teacher area: optional class list (only these names can start, ignoring accents and word order; absent students listed), question-by-question detail of each submission, per-question statistics for a quiz (success rate, average points, unanswered) and CSV with each question's points.
- Website: a pass mark common to all quizzes, adjustable after export in reglages.js (seuil).
- Website: random draw of N questions from the quiz for each exam, off by default, set in reglages.js (tirage); with server grading, the draw is made and enforced by the server.
- Quizzes published separately at https://fhoudebert.github.io/abbon/questionnaires/ (by language and topic): link in “About” and on the import page; index pages produced by `npm run module:catalogue`. The app is built and released without them.
- “Spanish: traps for French speakers” (31 questions) and “History: unusual or little-known dates” (33 questions) modules, pilot versions with revision sheets (French only).
- “Enseignement scientifique” (French final-year general science) module, pilot version: one practice quiz per syllabus theme, 36 questions with revision sheets (French only).
- “Biology, SVT specialty” module (French final year), pilot version: exam revision on the biology parts of the syllabus (genetics and evolution, plant domestication, human body and health), 36 questions with revision sheets (French only).
- “Engineering science, specialty” module (French final year), pilot version: exam revision (systems analysis, mechanics and energy, control and information), 36 questions with revision sheets (French only).
- “Étymologie” (French word origins) module, pilot version: 36 questions with revision sheets (French only).
- “Philosophie” and “Histoire” French final-year exam revision modules, pilot versions: 40 questions each, with revision sheets (French only).
- Maths spécialité 0.5.0: space geometry, logic and reasoning, algorithms and numerical methods (32 questions), common to the 2019 syllabus and the new final-year syllabus (from September 2027). Physique-chimie 0.9.0: fluid mechanics (10 questions).

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
