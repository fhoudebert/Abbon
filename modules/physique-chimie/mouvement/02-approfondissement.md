---
id: mouvement-02
title: { fr: "Mouvement et interactions : approfondissement" }
description: { fr: "Portée et hauteur maximale, satellites, champ électrique, conservation de la quantité de mouvement, bilans d'énergie" }
level: approfondissement
tags: [physique, bac, prog-2019]
---

## portee · numeric
Un projectile est lancé depuis le sol à $\pu{10 m.s-1}$, avec un angle de 45° par rapport à l'horizontale ($g = \pu{9,81 m.s-2}$, sans frottements). À quelle distance retombe-t-il au sol, en mètres ?

= 10,2 ± 0,1

> En éliminant $t$ entre $x(t) = v_0\cos\alpha\,t$ et $y(t) = -\frac{1}{2}g\,t^2 + v_0\sin\alpha\,t$, puis en cherchant $y = 0$ : portée $= \dfrac{v_0^2\sin(2\alpha)}{g} = \dfrac{100 \times 1}{9,81} \approx \pu{10,2 m}$. À vitesse donnée, c'est l'angle de 45° qui donne la plus grande portée.

## hauteur-max · numeric
Une balle est lancée verticalement vers le haut à $\pu{10 m.s-1}$ ($g = \pu{9,81 m.s-2}$, sans frottements). De combien monte-t-elle, en mètres ?

= 5,1 ± 0,1

> Au sommet, la vitesse est nulle. Par conservation de l'énergie mécanique, $\frac{1}{2}m\,v_0^2 = m\,g\,h$, donc $h = \dfrac{v_0^2}{2g} = \dfrac{100}{19,62} \approx \pu{5,1 m}$. La masse ne compte pas.

## satellite-vitesse · numeric
Un satellite tourne autour de la Terre sur une orbite circulaire à $\pu{400 km}$ d'altitude. Quelle est sa vitesse, en kilomètres par seconde ? ($G = \pu{6,67e-11 N.m2.kg-2}$, $M_T = \pu{5,97e24 kg}$, $R_T = \pu{6370 km}$.)

= 7,7 ± 0,1

> La deuxième loi de Newton, avec la seule force de gravitation, donne $v = \sqrt{\dfrac{G\,M_T}{r}}$, où $r = R_T + h = \pu{6,77e6 m}$ : $v \approx \pu{7,67e3 m.s-1}$, soit $\pu{7,7 km.s-1}$. Il faut prendre la distance au centre de la Terre, pas l'altitude.

## satellite-periode · numeric
Un satellite décrit une orbite circulaire de rayon $r = \pu{6,77e6 m}$ (400 km d'altitude) à la vitesse $v = \pu{7,67 km.s-1}$. Quelle est sa période de révolution, en minutes ?

= 92 ± 1

> $T = \dfrac{2\pi r}{v} = \dfrac{2\pi \times 6,77 \times 10^6}{7,67 \times 10^3} \approx \pu{5,55e3 s}$, soit environ 92 minutes : c'est l'ordre de grandeur de la période de la Station spatiale internationale.

## champ-electrique · numeric
Deux plaques parallèles distantes de $\pu{5,0 cm}$ sont soumises à une tension de $\pu{1000 V}$. Quelle est la valeur du champ électrique entre elles, en $\pu{V.m-1}$ ?

= 20000 ± 100

> Entre deux plaques, le champ est uniforme : $E = \dfrac{U}{d} = \dfrac{1000}{0,050} = \pu{2,0e4 V.m-1}$. Une particule de charge $q$ y subit la force $\vec F = q\,\vec E$, constante : son mouvement se calcule comme une chute libre.

## quantite-mouvement · numeric
Deux patineurs immobiles se repoussent. Le premier, de 60 kg, part à $\pu{2,0 m.s-1}$. À quelle vitesse part le second, de 40 kg, en $\pu{m.s-1}$ ? (Frottements négligés.)

= 3,0 ± 0,1

> Le système des deux patineurs est pseudo-isolé : sa quantité de mouvement, nulle au départ, se conserve. $m_1\,v_1 = m_2\,v_2$, d'où $v_2 = \dfrac{60 \times 2,0}{40} = \pu{3,0 m.s-1}$, en sens opposé. C'est le principe de la propulsion par réaction.

## freinage · numeric
Une voiture de 1000 kg roule à $\pu{20 m.s-1}$. Elle freine avec une force constante de $\pu{5000 N}$. Sur quelle distance s'arrête-t-elle, en mètres ?

= 40 ± 1

> Théorème de l'énergie cinétique : $0 - \frac{1}{2}m\,v^2 = -F\,d$, donc $d = \dfrac{m\,v^2}{2F} = \dfrac{1000 \times 400}{10\,000} = \pu{40 m}$. À vitesse double, la distance de freinage est quadruple.

## vitesse-chute · numeric
Un objet est lâché sans vitesse initiale d'une hauteur de 5,0 m ($g = \pu{9,81 m.s-2}$, sans frottements). Quelle est sa vitesse en arrivant au sol, en $\pu{m.s-1}$ ?

= 9,9 ± 0,1

> L'énergie mécanique se conserve : $m\,g\,h = \frac{1}{2}m\,v^2$, donc $v = \sqrt{2gh} = \sqrt{2 \times 9,81 \times 5,0} \approx \pu{9,9 m.s-1}$.

## frottements-energie · single
Un skieur descend une piste avec des frottements. Que devient son énergie mécanique ?

- [x] Elle diminue : le travail des frottements est négatif
- [ ] Elle se conserve
- [ ] Elle augmente
- [ ] Elle est nulle

> $\Delta E_m = W(\vec f)$, le travail des forces non conservatives. Les frottements s'opposent au mouvement : leur travail est négatif, et l'énergie mécanique diminue (elle est convertie en énergie thermique).

## referentiel · single
Dans quel référentiel étudie-t-on le mouvement d'un satellite autour de la Terre ?

- [x] Le référentiel géocentrique
- [ ] Le référentiel terrestre
- [ ] Le référentiel du satellite
- [ ] Le référentiel héliocentrique

> Le référentiel géocentrique (centre de la Terre, axes pointant vers des étoiles lointaines) est considéré comme galiléen pour une durée courte devant un an. Le référentiel terrestre tourne avec la Terre : il ne convient pas pour un satellite. L'héliocentrique sert pour les planètes.
