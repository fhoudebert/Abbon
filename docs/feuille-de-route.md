# Feuille de route

Ordre de travail de la branche `qcm`, après le socle (lots 0 à 5). Le cadrage d'origine est la note
« Abbon – Cadrage des modules de QCM » ; ce fichier fait foi pour l'ordre et l'état.

| Étape | Contenu | État |
|---|---|---|
| Lot 6 | Format module, outillage (`module:check`, `module:build`), pilote « Anglais : verbes irréguliers » | fait |
| Lot 6 bis | Questions à saisie : **réponse courte** et **réponse numérique** (passage, corrigé, éditeur, GIFT, sources de modules) | fait |
| Lot 6 ter | **Textes à trous** : un énoncé à plusieurs trous, chacun rempli par une réponse courte saisie ou par un choix dans une liste déroulante | fait |
| Lot 6 quater | **Révision espacée (boîtes de Leitner)** : entraînement par répétitions sur des questions choisies dans les modules | à faire |
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

Vient après les textes à trous, pour que la révision porte d'emblée sur tous les types de questions.

- Un état par question (boîte, date de prochaine révision), relié aux identifiants stables des modules ; il suit les
  mises à jour d'un module et est gardé ou supprimé avec l'historique à la désinstallation.
- Une bonne réponse fait avancer la question d'une boîte, une erreur la renvoie dans la première ; plus la boîte
  est élevée, plus la révision est espacée (nombre de boîtes et délais à fixer, par exemple 5 boîtes à 1, 2, 4, 7
  et 15 jours).
- Une session « Réviser » par module ou par catégorie, avec correction immédiate, qui pioche les questions dues dans
  tous les QCM ; choix des questions ou des QCM à inclure ; compteur « à revoir » sur l'accueil.
- Réglage du nombre de questions par jour ; état compris dans la sauvegarde complète.

## Décisions prises

- Licence du contenu : CC BY-NC-SA 4.0.
- Rendu des formules : KaTeX. Figures en thème sombre : SVG incrusté après nettoyage.
- Programme de maths spécialité : 2019 d'abord, puis 2026.
- Distribution des modules : fichiers `.qcm` joints aux releases GitHub, lien dans l'application, puis import.
- Tant qu'Abbon n'a pas d'autres utilisateurs, aucune reprise de données n'est exigée d'un lot à l'autre : une
  migration peut être modifiée, et la base locale effacée (`~/.config/org.abbon.app` sous Linux).
