# Feuille de route

Ordre de travail de la branche `qcm`, après le socle (lots 0 à 5). Le cadrage d'origine est la note
« Abbon – Cadrage des modules de QCM » ; ce fichier fait foi pour l'ordre et l'état.

| Étape | Contenu | État |
|---|---|---|
| Lot 6 | Format module, outillage (`module:check`, `module:build`), pilote « Anglais : verbes irréguliers » | fait |
| Lot 6 bis | Questions à saisie : **réponse courte** et **réponse numérique** (passage, corrigé, éditeur, GIFT, sources de modules) | fait |
| Lot 6 ter | **Textes à trous** : un énoncé à plusieurs trous, chacun rempli par une réponse courte saisie ou par un choix dans une liste déroulante | fait |
| Lot 6 quater | **Révision espacée (boîtes de Leitner)** : entraînement par répétitions sur des questions choisies | fait |
| Lot 7 | Formules (LaTeX, rendu KaTeX), équations chimiques, unités, figures SVG incrustées après nettoyage | à faire |
| Lots 8 à 11 | Modules de contenu : Informatique, Anglais (version complète), Physique-chimie, Maths spécialité, Maths expertes | à faire |

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

## Décisions prises

- Licence du contenu : CC BY-NC-SA 4.0.
- Rendu des formules : KaTeX. Figures en thème sombre : SVG incrusté après nettoyage.
- Programme de maths spécialité : 2019 d'abord, puis 2026.
- Distribution des modules : fichiers `.qcm` joints aux releases GitHub, lien dans l'application, puis import.
- Tant qu'Abbon n'a pas d'autres utilisateurs, aucune reprise de données n'est exigée d'un lot à l'autre : une
  migration peut être modifiée, et la base locale effacée (`~/.config/org.abbon.app` sous Linux).
