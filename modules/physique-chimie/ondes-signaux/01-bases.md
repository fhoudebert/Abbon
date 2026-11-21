---
id: ondes-signaux-01
title: { fr: "Ondes et signaux : les bases" }
description: { fr: "Période, longueur d'onde, lentilles, diffraction, Doppler, circuits et condensateur" }
level: bases
tags: [physique, bac, prog-2019]
---

## periode · numeric
Une onde a une fréquence de 500 Hz. Quelle est sa période, en secondes ?

= 0,002 ± 0,00001 s

> $T = \dfrac{1}{f} = \dfrac{1}{500} = \pu{2,0e-3 s}$, soit 2,0 ms. Plus la fréquence est élevée, plus la période est courte.

## longueur-onde · numeric
Un son de fréquence 500 Hz se propage dans l'air à $\pu{340 m.s-1}$. Quelle est sa longueur d'onde, en mètres ?

= 0,68 ± 0,01 m

> La longueur d'onde est la distance parcourue pendant une période : $\lambda = v\,T = \dfrac{v}{f} = \dfrac{340}{500} = \pu{0,68 m}$.

## vergence · numeric
Une lentille convergente a une distance focale de 20 cm. Quelle est sa vergence, en dioptries ?

= 5 ± 0,01 δ

> $C = \dfrac{1}{f'}$, avec $f'$ en mètres : $C = \dfrac{1}{0,20} = \pu{5,0 m^{-1}}$, soit 5,0 dioptries. L'erreur classique est de garder $f'$ en centimètres, ce qui donne 0,05.

## diffraction · single
Une onde de longueur d'onde $\lambda$ traverse une fente de largeur $a$. Quelle relation donne l'écart angulaire $\theta$ de la tache centrale de diffraction ?

- [x] $\theta = \dfrac{\lambda}{a}$
- [ ] $\theta = \dfrac{a}{\lambda}$
- [ ] $\theta = \lambda\,a$
- [ ] $\theta = \dfrac{\lambda}{a^2}$

> $\theta$, en radians, est d'autant plus grand que la fente est étroite : diminuer $a$ élargit la tache. La diffraction est marquée quand $a$ est de l'ordre de grandeur de $\lambda$ ou plus petite.

## doppler · single
Une ambulance s'approche d'un piéton, sirène allumée. Comment le piéton perçoit-il la sirène, par rapport à ce qu'entend l'ambulancier ?

- [x] Plus aiguë : la fréquence perçue est plus élevée
- [ ] Plus grave : la fréquence perçue est plus faible
- [ ] Identique : seule l'intensité change
- [ ] Plus aiguë quand l'ambulance s'éloigne

> C'est l'effet Doppler : quand la source s'approche, les fronts d'onde arrivent plus rapprochés, et la fréquence perçue augmente. Quand elle s'éloigne, le son paraît plus grave. Le même effet, sur la lumière, mesure la vitesse des étoiles et des galaxies.

## resistances-derivation · numeric
Deux résistances de 6 Ω et de 3 Ω sont montées en dérivation. Quelle est leur résistance équivalente, en ohms ?

= 2 ± 0,01 Ω

> En dérivation, les inverses s'ajoutent : $\dfrac{1}{R} = \dfrac{1}{6} + \dfrac{1}{3} = \dfrac{1}{2}$, donc $R = \pu{2 \Omega}$. La résistance équivalente est plus petite que la plus petite des deux. En série, elles s'ajouteraient : 9 Ω.

## farad · single
Quelle est l'unité de la capacité d'un condensateur ?

- [x] Le farad (F)
- [ ] Le henry (H)
- [ ] Le tesla (T)
- [ ] Le coulomb (C)

> La capacité relie la charge à la tension : $q = C\,u_C$, en farads. Le henry mesure l'inductance d'une bobine, le tesla un champ magnétique, le coulomb une charge électrique.

## energie-condensateur · single
Quelle est l'énergie stockée dans un condensateur de capacité $C$, sous la tension $u_C$ ?

- [x] $E = \dfrac{1}{2}C\,u_C^2$
- [ ] $E = C\,u_C$
- [ ] $E = \dfrac{1}{2}R\,I^2$
- [ ] $E = R\,C$

> $C\,u_C$ est la charge $q$ du condensateur, pas son énergie. $R\,C$ est la constante de temps $\tau$ d'un circuit RC, une durée.

## constante-temps · numeric
Un condensateur de $\pu{100 \mu F}$ se charge à travers une résistance de $\pu{1,0 k\Omega}$. Quelle est la constante de temps du circuit, en secondes ?

= 0,1 ± 0,001 s

> $\tau = R\,C = 1,0 \times 10^{3} \times 100 \times 10^{-6} = \pu{0,10 s}$. Au bout de $\tau$, le condensateur est chargé à 63 % ; au bout de $5\tau$, à plus de 99 %.

## energie-electrique · numeric
Un appareil de 1 000 W fonctionne pendant 2 heures. Quelle énergie consomme-t-il, en kilowattheures ?

= 2 ± 0,01 kWh

> $E = P \times \Delta t = \pu{1,0 kW} \times \pu{2 h} = \pu{2 kWh}$. En joules : $\pu{1 kWh} = 1000 \times 3600 = \pu{3,6e6 J}$, donc $\pu{2 kWh} = \pu{7,2e6 J}$.
