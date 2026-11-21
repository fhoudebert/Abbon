---
id: mouvement-03
title: { fr: "Mouvement et interactions : niveau expert" }
description: { fr: "Durée de vol et équation de trajectoire, orbite géostationnaire, troisième loi de Kepler, loi des aires, particules chargées, recul" }
level: expert
tags: [physique, bac, prog-2019]
---

## duree-vol · numeric
Un projectile est lancé depuis le sol à $\pu{20 m.s-1}$, avec un angle de 30° au-dessus de l'horizontale ($g = \pu{9,81 m.s-2}$, sans frottements). Combien de temps reste-t-il en l'air, en secondes ?

= 2,04 ± 0,02 s

> $y(t) = v_0\sin\alpha\;t - \dfrac{1}{2}g\,t^2$ s'annule pour $t = 0$ et pour $t = \dfrac{2\,v_0\sin\alpha}{g} = \dfrac{2 \times 20 \times 0,5}{9,81} \approx \pu{2,04 s}$. La masse n'intervient pas.

## tir-horizontal · numeric
Une bille quitte le bord d'une table de $\pu{1,25 m}$ de haut avec une vitesse horizontale de $\pu{3,0 m.s-1}$ ($g = \pu{9,81 m.s-2}$). À quelle distance horizontale du pied de la table touche-t-elle le sol, en mètres ?

= 1,51 ± 0,02 m

> Durée de chute : $h = \dfrac{1}{2}g\,t^2$ donne $t = \sqrt{\dfrac{2h}{g}} \approx \pu{0,505 s}$, la même que pour une bille lâchée sans vitesse. Horizontalement, le mouvement est uniforme : $x = v_0\,t \approx \pu{1,51 m}$.

## trajectoire · expression
Un projectile est lancé horizontalement depuis une hauteur de $\pu{2 m}$, à $\pu{5 m.s-1}$ ; on prend $g = \pu{10 m.s-2}$ et l'origine au sol, à la verticale du point de lancement. Écrivez l'équation de la trajectoire : $y = \dots$ (en fonction de $x$, en mètres).

= $2 - \frac{x^2}{5}$

> $x = v_0\,t$ et $y = h - \dfrac{1}{2}g\,t^2$. On élimine le temps, $t = \dfrac{x}{v_0}$ : $y = h - \dfrac{g\,x^2}{2\,v_0^2} = 2 - \dfrac{10\,x^2}{50} = 2 - \dfrac{x^2}{5}$. Le projectile touche le sol pour $x = \sqrt{10} \approx \pu{3,2 m}$.

## geostationnaire · numeric
Un satellite géostationnaire tourne en une journée sidérale ($T = \pu{86164 s}$) sur une orbite circulaire. Quelle est son altitude, en kilomètres, à 100 km près ? ($G\,M_{\text{Terre}} = \pu{3,986e14 m3.s-2}$, rayon terrestre $\pu{6371 km}$.)

= 35800 ± 100 km

> Troisième loi de Kepler : $r^3 = \dfrac{G\,M\,T^2}{4\pi^2}$, d'où $r \approx \pu{42 164 km}$, rayon de l'orbite compté depuis le centre de la Terre. L'altitude vaut $r - R_T \approx \pu{35 800 km}$. Oublier de retrancher le rayon terrestre est l'erreur classique.

## periode-mars · numeric
Le demi-grand axe de l'orbite de Mars vaut 1,52 fois celui de l'orbite terrestre. Quelle est la période de révolution de Mars, en années terrestres ?

= 1,87 ± 0,01

> $\dfrac{T^2}{a^3}$ est le même pour toutes les planètes : $\dfrac{T_M^2}{T_T^2} = \left(\dfrac{a_M}{a_T}\right)^3$, d'où $T_M = 1,52^{3/2} \approx 1,87$ an. Pas besoin de connaître la masse du Soleil quand on compare deux planètes.

## vitesse-aphelie · numeric
La Terre passe au périhélie à $\pu{147,1e6 km}$ du Soleil, à $\pu{30,29 km.s-1}$, et à l'aphélie à $\pu{152,1e6 km}$. En ces deux points, la vitesse est perpendiculaire au rayon, et la loi des aires donne $r_P\,v_P = r_A\,v_A$. Quelle est sa vitesse à l'aphélie, en $\pu{km.s-1}$ ?

= 29,29 ± 0,02

> $v_A = v_P \times \dfrac{r_P}{r_A} = 30,29 \times \dfrac{147,1}{152,1} \approx \pu{29,29 km.s-1}$. Plus loin du Soleil, la Terre va moins vite : la moitié de l'orbite qui contient l'aphélie (début juillet) est parcourue plus lentement, et l'été astronomique de l'hémisphère nord, de l'équinoxe de mars à celui de septembre, dure environ une semaine de plus que l'hiver.

## periode-rayon · single
Le rayon de l'orbite circulaire d'un satellite est multiplié par 4. Comment varie sa période de révolution ?

- [x] Elle est multipliée par 8
- [ ] Elle est multipliée par 4
- [ ] Elle est multipliée par 16
- [ ] Elle est multipliée par 2

> $T^2$ est proportionnel à $r^3$ : $T$ est multipliée par $\sqrt{4^3} = 8$. Dans le même temps, la vitesse $v = \sqrt{\dfrac{G\,M}{r}}$ est divisée par 2 : l'orbite est 4 fois plus longue et parcourue 2 fois moins vite.

## electron-accelere · numeric
Un électron, initialement immobile, est accéléré par une tension de $\pu{1000 V}$. Quelle vitesse atteint-il, en $\pu{m.s-1}$ ? ($e = \pu{1,602e-19 C}$, $m_e = \pu{9,109e-31 kg}$, effets relativistes négligés.)

= 1,88e7 ± 0,02e7 m/s

> Théorème de l'énergie cinétique : le travail de la force électrique vaut $e\,U$, donc $\dfrac{1}{2}m_e\,v^2 = e\,U$ et $v = \sqrt{\dfrac{2\,e\,U}{m_e}} \approx \pu{1,88e7 m.s-1}$, soit environ 6 % de la vitesse de la lumière : l'approximation non relativiste reste acceptable.

## particule-alpha · numeric
Une particule $\alpha$ (charge $2e$) traverse une différence de potentiel de $\pu{500 V}$. Quelle énergie cinétique gagne-t-elle, en électronvolts ?

= 1000

> Le travail de la force électrique vaut $W = q\,U = 2e \times \pu{500 V} = \pu{1000 eV}$ (soit $\pu{1,6e-16 J}$). L'électronvolt est l'énergie gagnée par une charge $e$ sous $\pu{1 V}$ : il évite les puissances de dix.

## recul · numeric
Un canon de $\pu{1000 kg}$, initialement immobile et libre de reculer, tire horizontalement un obus de $\pu{10 kg}$ à $\pu{500 m.s-1}$. Quelle est la vitesse de recul du canon, en $\pu{m.s-1}$ ?

= 5

> Le système {canon + obus} est pseudo-isolé horizontalement : sa quantité de mouvement, nulle au départ, se conserve. $m_c\,v_c + m_o\,v_o = 0$ donne $v_c = -\dfrac{10 \times 500}{1000} = \pu{-5 m.s-1}$ : le canon recule à $\pu{5 m.s-1}$. C'est aussi le principe de la propulsion des fusées.
