---
id: ondes-signaux-02
title: { fr: "Ondes et signaux : approfondissement" }
description: { fr: "Interférences et diffraction, niveau sonore, effet Doppler, photons et effet photoélectrique, lunette, lentilles, circuit RC" }
level: approfondissement
tags: [physique, bac, prog-2019]
---

## interfrange · numeric
Des fentes d'Young distantes de $b = \pu{0,50 mm}$ sont éclairées par un laser de longueur d'onde $\pu{650 nm}$. L'écran est à $D = \pu{2,0 m}$. Quel est l'interfrange, en millimètres ?

= 2,6 ± 0,1

> $i = \dfrac{\lambda\,D}{b} = \dfrac{650 \times 10^{-9} \times 2,0}{0,50 \times 10^{-3}} = \pu{2,6e-3 m}$, soit $\pu{2,6 mm}$. Pour ne pas se tromper, on convertit tout en mètres avant de calculer.

## tache-diffraction · numeric
Une fente de $\pu{0,10 mm}$ est éclairée par une lumière de $\pu{600 nm}$. Quelle est la largeur de la tache centrale sur un écran à $\pu{2,0 m}$, en millimètres ?

= 24 ± 1

> $\theta = \dfrac{\lambda}{a} = \pu{6,0e-3 rad}$ ; la tache centrale s'étend de $-\theta$ à $+\theta$, d'où une largeur $L \approx 2D\theta = 2 \times 2,0 \times 6,0 \times 10^{-3} = \pu{2,4e-2 m}$, soit $\pu{24 mm}$ (angle petit : $\tan\theta \approx \theta$).

## deux-sources · numeric
Une source sonore produit un niveau de 60 dB en un point. On ajoute une seconde source identique. Quel est le nouveau niveau, en décibels ?

= 63 ± 1

> Ce sont les intensités qui s'ajoutent, pas les niveaux : $L = 10\log\dfrac{2I}{I_0} = 60 + 10\log 2 \approx \pu{63 dB}$. Doubler l'intensité ajoute environ 3 dB.

## doppler-calcul · numeric
Une source émet un son de 440 Hz et s'approche à $\pu{20 m.s-1}$ d'un observateur immobile ; le son se propage à $\pu{340 m.s-1}$. Quelle fréquence l'observateur perçoit-il, en hertz ?

= 467 ± 2

> La source s'approche : la fréquence perçue est plus élevée. $f' = f\,\dfrac{c}{c - v} = 440 \times \dfrac{340}{320} \approx \pu{468 Hz}$. L'approximation $\Delta f \approx f\,\dfrac{v}{c} \approx \pu{26 Hz}$ donne $\pu{466 Hz}$, également acceptée.

## photon · numeric
Quelle est l'énergie d'un photon de longueur d'onde $\pu{500 nm}$, en électronvolts ? ($h = \pu{6,63e-34 J.s}$, $c = \pu{3,00e8 m.s-1}$, $\pu{1 eV} = \pu{1,60e-19 J}$.)

= 2,49 ± 0,02

> $E = \dfrac{h\,c}{\lambda} = \dfrac{6,63 \times 10^{-34} \times 3,00 \times 10^8}{500 \times 10^{-9}} \approx \pu{3,98e-19 J}$, soit $\dfrac{3,98 \times 10^{-19}}{1,60 \times 10^{-19}} \approx \pu{2,49 eV}$.

## photoelectrique · numeric
Un métal a un travail d'extraction de $\pu{2,3 eV}$. On l'éclaire avec des photons de $\pu{3,0 eV}$. Quelle est l'énergie cinétique maximale des électrons émis, en électronvolts ?

= 0,7 ± 0,05

> Bilan d'énergie de l'effet photoélectrique : $E_{c,\max} = h\nu - W = 3,0 - 2,3 = \pu{0,7 eV}$. Un photon d'énergie inférieure à $\pu{2,3 eV}$ n'arracherait aucun électron, quelle que soit l'intensité de la lumière.

## lunette · numeric
Une lunette astronomique afocale a un objectif de distance focale $\pu{1,0 m}$ et un oculaire de $\pu{2,5 cm}$. Quel est son grossissement ?

= 40

> $G = \dfrac{f'_1}{f'_2} = \dfrac{1,0}{0,025} = 40$. On exprime les deux distances focales dans la même unité.

## conjugaison · numeric
Un objet est placé à 30 cm devant une lentille convergente de distance focale 10 cm ($\overline{OA} = \pu{-30 cm}$). À quelle distance de la lentille se forme l'image, en centimètres ($\overline{OA'}$) ?

= 15 ± 0,5

> $\dfrac{1}{\overline{OA'}} = \dfrac{1}{f'} + \dfrac{1}{\overline{OA}} = \dfrac{1}{10} - \dfrac{1}{30} = \dfrac{2}{30}$, donc $\overline{OA'} = \pu{15 cm}$ : l'image est réelle, derrière la lentille. Le grandissement $\gamma = \dfrac{15}{-30} = -0,5$ : elle est renversée et deux fois plus petite.

## charge-rc · numeric
Un condensateur initialement déchargé se charge sous une tension $E = \pu{10 V}$ à travers une résistance. Quelle est la tension à ses bornes au bout d'une constante de temps $\tau$, en volts ?

= 6,3 ± 0,1

> $u_C(t) = E\left(1 - e^{-t/\tau}\right)$, donc $u_C(\tau) = 10\,(1 - e^{-1}) \approx \pu{6,3 V}$ : 63 % de la charge. On retrouve $\tau$ sur une courbe en cherchant le temps où $u_C$ atteint 63 % de sa valeur finale.

## interferences-destructives · single
Deux ondes cohérentes, de longueur d'onde $\lambda$, arrivent en un point avec une différence de marche $\delta$. À quelle condition les interférences y sont-elles destructives ?

- [x] $\delta = \left(k + \dfrac{1}{2}\right)\lambda$, avec $k$ entier
- [ ] $\delta = k\,\lambda$, avec $k$ entier
- [ ] $\delta = 0$
- [ ] $\delta = 2\lambda$ seulement

> Les ondes arrivent en opposition de phase quand la différence de marche vaut un nombre impair de demi-longueurs d'onde : leurs amplitudes se retranchent. Pour $\delta = k\lambda$, elles sont en phase : interférences constructives.
