---
id: commande-information-01
title: { fr: "Commande et information" }
description: { fr: "Boucle ouverte et fermée, performances d'un asservissement, correcteurs, MLI, numération, conversion analogique-numérique, réseaux, intelligence artificielle" }
level: bases
tags: [si, sciences-ingenieur, terminale, bac]
---

## boucle-fermee · single
Qu'apporte une commande en boucle fermée par rapport à une boucle ouverte ?

- [x] La grandeur réelle est mesurée par un capteur et comparée à la consigne : le système corrige l'écart, même en cas de perturbation
- [ ] Elle supprime le besoin de capteur
- [ ] Elle consomme moins d'énergie dans tous les cas
- [ ] Elle rend le système plus simple

> En boucle ouverte, une perturbation (une pente, une charge) n'est pas compensée. En boucle fermée, le comparateur calcule l'écart entre consigne et mesure, et le correcteur adapte la commande. C'est un asservissement.

## performances · single
Quels sont les trois critères de performance d'un asservissement ?

- [x] La stabilité, la précision et la rapidité
- [ ] Le coût, la masse et l'encombrement
- [ ] La puissance, le rendement et l'autonomie
- [ ] La tension, l'intensité et la fréquence

> Stabilité : la sortie converge (dépassement, oscillations). Précision : l'écart statique entre consigne et sortie en régime permanent. Rapidité : le temps de réponse à 5 %.

## temps-reponse · single
Comment lit-on le temps de réponse à 5 % sur la réponse indicielle d'un système ?

- [x] C'est l'instant à partir duquel la sortie reste dans une bande de ±5 % autour de sa valeur finale
- [ ] C'est l'instant où la sortie atteint 5 % de sa valeur finale
- [ ] C'est la durée du premier dépassement
- [ ] C'est 5 % de la durée totale de l'essai

> Pour un système du premier ordre de constante de temps $\tau$, $t_{5\%} \approx 3\tau$. Pour un système oscillant, on retient le dernier instant d'entrée dans la bande.

## ecart-statique · numeric
Un asservissement a une fonction de transfert en boucle ouverte de gain statique $K = 9$ (sans intégrateur). Quel est l'écart statique pour une consigne en échelon, en pourcentage de la consigne ?

= 10 ± 0,5 %

> En boucle fermée à retour unitaire, le gain statique vaut $\dfrac{K}{1+K} = 0{,}9$ : la sortie atteint 90 % de la consigne, l'écart est de $\dfrac{1}{1+K} = 10$ %. Augmenter $K$ réduit l'écart, mais peut dégrader la stabilité.

## correcteur-integral · single
Quel effet a l'ajout d'une action intégrale dans le correcteur ?

- [x] Elle annule l'écart statique pour une consigne en échelon, mais tend à ralentir le système et à le rendre moins stable
- [ ] Elle rend le système instantané
- [ ] Elle augmente l'écart statique
- [ ] Elle supprime le besoin de capteur

> L'intégrateur accumule l'écart tant qu'il n'est pas nul. Le correcteur PID combine actions proportionnelle (rapidité, précision), intégrale (précision) et dérivée (stabilité, anticipation).

## mli · single
Un hacheur alimenté sous 12 V commande un moteur avec un rapport cyclique de 0,6. Quelle est la tension moyenne aux bornes du moteur ?

- [x] 7,2 V
- [ ] 12 V
- [ ] 6 V
- [ ] 20 V

> En modulation de largeur d'impulsion (MLI), la tension vaut 12 V pendant 60 % de la période et 0 le reste du temps : $\langle u \rangle = \alpha \, U = 0{,}6 \times 12 = 7{,}2$ V. Faire varier $\alpha$ fait varier la vitesse du moteur, avec très peu de pertes.

## binaire · single
Que vaut le nombre binaire $1101_2$ en décimal ?

- [x] 13
- [ ] 11
- [ ] 1101
- [ ] 7

> $1 \times 8 + 1 \times 4 + 0 \times 2 + 1 \times 1 = 13$. Sur un octet (8 bits), on code les entiers de 0 à 255 ; en hexadécimal, 255 s'écrit FF.

## can-quantum · numeric
Un convertisseur analogique-numérique de 10 bits mesure des tensions de 0 à 5 V. Quel est son quantum (pas de quantification), en mV, à 0,1 près ?

= 4,9 ± 0,1 mV

> $2^{10} = 1024$ valeurs : $q = 5 / 1024 \approx 4{,}88$ mV. Une tension de 2,5 V donne environ la valeur 512. Plus il y a de bits, plus la mesure est fine.

## echantillonnage · single
Un capteur est lu toutes les 10 ms. Quelle est la fréquence d'échantillonnage ?

- [x] 100 Hz
- [ ] 10 Hz
- [ ] 1 000 Hz
- [ ] 0,01 Hz

> $f_e = 1 / T_e = 1 / 0{,}01 = 100$ Hz. Pour ne pas perdre l'information, la fréquence d'échantillonnage doit être au moins le double de la plus haute fréquence du signal (théorème de Shannon).

## logique · single
Une perceuse ne démarre que si le bouton est appuyé (B = 1) **et** le carter est fermé (C = 1), ou si un mode de test est actif (T = 1). Quelle équation logique commande le moteur M ?

- [x] $M = (B \cdot C) + T$
- [ ] $M = B + C + T$
- [ ] $M = B \cdot C \cdot T$
- [ ] $M = \overline{B} \cdot C + T$

> Le point note le ET, le plus le OU, la barre le NON. En programme : `M = (B and C) or T`. Ces conditions de sécurité se vérifient avec une table de vérité.

## reseau-ip · single
Dans une adresse IPv4 192.168.1.20 avec le masque 255.255.255.0, quelle partie identifie le réseau ?

- [x] 192.168.1
- [ ] 20
- [ ] 192
- [ ] 255.255.255

> Le masque indique les bits du réseau (ici les 24 premiers, noté /24) ; le dernier octet identifie la machine dans ce réseau, de 1 à 254. Deux appareils communiquent directement s'ils sont dans le même réseau ; sinon, il faut passer par un routeur.

## ia · single
Dans un apprentissage supervisé, comment un réseau de neurones apprend-il à reconnaître des pièces défectueuses sur des images ?

- [x] On lui fournit de nombreuses images étiquetées (bonne ou défectueuse) et on ajuste ses paramètres pour réduire ses erreurs ; on l'évalue ensuite sur des images qu'il n'a jamais vues
- [ ] On écrit à la main toutes les règles de décision
- [ ] Il apprend seul sans aucun exemple
- [ ] On lui donne uniquement des images de pièces défectueuses

> La qualité et la variété des données conditionnent le résultat : un jeu déséquilibré ou biaisé donne un modèle peu fiable. Le jeu de test, distinct du jeu d'entraînement, mesure la capacité à généraliser.
