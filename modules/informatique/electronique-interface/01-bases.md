---
id: electronique-interface-01
title: { fr: "Électronique et conception d'interface : les bases" }
description: { fr: "Loi d'Ohm, logique booléenne, capteurs, microcontrôleurs ; ergonomie et accessibilité" }
level: bases
tags: [électronique, ergonomie, accessibilité]
---

## ohm · numeric
Une résistance de 220 Ω est traversée par un courant de 0,02 A. Quelle est la tension à ses bornes, en volts ?

= 4,4 ± 0,01 V

> Loi d'Ohm : $U = R \times I = 220 \times 0{,}02 = 4{,}4$ V.

## resistance-led · numeric
Une LED, alimentée sous 5 V, a une tension de seuil de 2 V et doit être traversée par 15 mA. Quelle résistance mettre en série, en ohms ?

= 200 ± 1 Ω

> La résistance doit encaisser $5 - 2 = 3$ V. $R = \frac{U}{I} = \frac{3}{0{,}015} = 200$ Ω. On choisit la valeur normalisée immédiatement supérieure, par exemple 220 Ω, pour ne pas dépasser le courant prévu.

## porte-et · single
Que vaut la sortie d'une porte logique ET dont les entrées valent 1 et 0 ?

- [x] 0
- [ ] 1
- [ ] Elle n'est pas définie

> La porte ET ne donne 1 que si toutes ses entrées valent 1. La porte OU donne 1 dès qu'une entrée vaut 1 ; la porte OU exclusif (XOR), quand les entrées diffèrent.

## binaire · numeric
Quelle est la valeur décimale du nombre binaire `1011` ?

= 11

> $1 \times 8 + 0 \times 4 + 1 \times 2 + 1 \times 1 = 11$. Chaque chiffre binaire (bit) a un poids qui double de droite à gauche : 1, 2, 4, 8…

## analogique · single
Un microcontrôleur lit un capteur de température qui fournit une tension variable. Quel composant convertit cette tension en nombre ?

- [x] Un convertisseur analogique-numérique (CAN)
- [ ] Un convertisseur numérique-analogique (CNA)
- [ ] Une diode
- [ ] Un transistor seul

> Le CAN échantillonne la tension et la traduit en un nombre : avec 10 bits, entre 0 et 1 023. Le CNA fait l'inverse, d'un nombre vers une tension.

## microcontroleur · single
Qu'est-ce qui distingue un microcontrôleur (Arduino, micro:bit) d'un ordinateur comme le Raspberry Pi ?

- [x] Il réunit sur une puce processeur, mémoire et entrées-sorties, et exécute un seul programme, sans système d'exploitation complet
- [ ] Il est toujours plus puissant
- [ ] Il ne peut lire aucun capteur
- [ ] Il ne se programme qu'en assembleur

> Peu gourmand et réactif, le microcontrôleur pilote capteurs et moteurs dans les objets du quotidien. Le Raspberry Pi est un vrai ordinateur sous Linux, plus puissant mais plus gourmand. Les microcontrôleurs se programment en C, C++, MicroPython ou Rust.

## contraste · single
Selon les règles d'accessibilité WCAG (niveau AA), quel contraste minimal doit avoir un texte de taille normale avec son fond ?

- [x] 4,5:1
- [ ] 1,5:1
- [ ] 2:1
- [ ] 10:1

> Un contraste d'au moins 4,5:1 (3:1 pour un grand texte) garde le texte lisible pour les personnes malvoyantes ou en plein soleil. Des outils, dans les navigateurs notamment, calculent ce rapport entre deux couleurs.

## couleur-seule · single
Un formulaire signale les champs en erreur uniquement par une bordure rouge. Pourquoi est-ce insuffisant ?

- [x] Une personne daltonienne, ou utilisant un lecteur d'écran, ne perçoit pas l'information
- [ ] Le rouge est une couleur réservée aux liens
- [ ] Les bordures ne s'affichent pas sur téléphone
- [ ] Ce n'est pas insuffisant

> Une information ne doit jamais reposer sur la couleur seule. On ajoute un message en texte (« Adresse invalide »), une icône, et on relie le message au champ pour qu'il soit annoncé (`aria-describedby`).

## rgaa · single
Qu'est-ce que le RGAA ?

- [x] Le référentiel français d'accessibilité numérique, fondé sur les WCAG, obligatoire pour les services publics
- [ ] Un règlement sur les cartes graphiques
- [ ] Une norme de câblage réseau
- [ ] Un logiciel de retouche d'image

> Le Référentiel général d'amélioration de l'accessibilité décline les WCAG en critères vérifiables. Les sites publics, et ceux des grandes entreprises, doivent publier une déclaration d'accessibilité.

## design-system · single
Qu'apporte un *design system* à une équipe qui conçoit une interface ?

- [x] Une bibliothèque commune de composants, de couleurs et de règles, pour une interface cohérente et plus rapide à construire
- [ ] Un logiciel qui génère l'interface tout seul
- [ ] Un système d'exploitation dédié au design
- [ ] Le logo de l'entreprise

> Boutons, champs, typographie, espacements et règles d'usage sont définis une fois, documentés et réutilisés. L'accessibilité y est intégrée dès le départ. Exemples publics : le Système de design de l'État (DSFR), Material Design.
