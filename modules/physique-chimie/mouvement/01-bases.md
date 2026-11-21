---
id: mouvement-01
title: { fr: "Mouvement et interactions : les bases" }
description: { fr: "Équations horaires, lois de Newton, chute libre, Kepler, énergie cinétique" }
level: bases
tags: [physique, bac, prog-2019]
---

## mru · single
Un point se déplace sur l'axe $(Ox)$ d'un mouvement rectiligne uniforme, à la vitesse $v_0$, depuis la position $x_0$ à $t = 0$. Quelle est son équation horaire ?

- [x] $x(t) = v_0\,t + x_0$
- [ ] $x(t) = v_0\,t^2 + x_0$
- [ ] $x(t) = \dfrac{1}{2}v_0\,t^2 + x_0$
- [ ] $x(t) = x_0\,v_0\,t$

> Mouvement uniforme : la vitesse est constante, $v_x(t) = v_0$. La position en est une primitive qui vaut $x_0$ à $t = 0$ : $x(t) = v_0\,t + x_0$. Un terme en $t^2$ supposerait une accélération non nulle.

## chute-libre · single
Un objet est lancé verticalement vers le haut, à la vitesse $v_0$, depuis l'altitude $y_0$. L'axe $(Oy)$ est vertical, orienté vers le haut ; les frottements sont négligés. Quelle est l'équation horaire de son altitude ?

- [x] $y(t) = -\dfrac{1}{2}g\,t^2 + v_0\,t + y_0$
- [ ] $y(t) = \dfrac{1}{2}g\,t^2 + v_0\,t + y_0$
- [ ] $y(t) = -g\,t + v_0$
- [ ] $y(t) = -\dfrac{1}{2}g\,t^2$

> En chute libre, $\vec a = \vec g$, soit $a_y = -g$ sur un axe orienté vers le haut. Une première primitive donne $v_y(t) = -g\,t + v_0$, la seconde $y(t) = -\frac{1}{2}g\,t^2 + v_0\,t + y_0$. Le signe de $g$ dépend de l'orientation de l'axe ; $-g\,t + v_0$ est la vitesse, pas la position.

## newton-2 · single
Que dit la deuxième loi de Newton, dans un référentiel galiléen ?

- [x] $\sum \vec F = m\,\vec a$
- [ ] $\sum \vec F = m\,\vec v$
- [ ] $\sum \vec F = \vec 0$ dans tous les cas
- [ ] $\sum \vec F = \dfrac{m}{a}$

> La somme des forces appliquées est égale au produit de la masse par l'accélération du centre de masse. Si cette somme est nulle, l'accélération l'est aussi : le mouvement est rectiligne uniforme, ou l'objet est immobile (première loi). La quantité $m\,\vec v$ est la quantité de mouvement $\vec p$, dont la dérivée vaut $\sum \vec F$.

## vitesse-derivee · single
La position d'un mobile est $x(t) = 3t^2 + 2t$, en mètres, $t$ en secondes. Quelle est sa vitesse $v_x(t)$ ?

- [x] $v_x(t) = 6t + 2$
- [ ] $v_x(t) = 3t + 2$
- [ ] $v_x(t) = 6t$
- [ ] $v_x(t) = t^3 + t^2$

> La vitesse est la dérivée de la position par rapport au temps : $v_x(t) = \dfrac{\mathrm{d}x}{\mathrm{d}t} = 6t + 2$. L'accélération est à son tour la dérivée de la vitesse : $a_x = \pu{6 m.s-2}$. $t^3 + t^2$ serait une primitive, pas la dérivée.

## vitesse-chute · numeric
Un objet est lâché sans vitesse initiale et tombe en chute libre ($g = \pu{9,81 m.s-2}$). Quelle est sa vitesse au bout de 2,0 s, en m·s⁻¹ ?

= 19,6 ± 0,1 m·s⁻¹

> Sans vitesse initiale, $v(t) = g\,t = 9,81 \times 2,0 \approx \pu{19,6 m.s-1}$, soit environ 71 km·h⁻¹. La masse n'intervient pas : en l'absence de frottements, tous les objets tombent de la même façon.

## parabole · single
Un projectile est lancé avec une vitesse initiale non verticale, dans un champ de pesanteur uniforme, sans frottements. Quelle est la forme de sa trajectoire ?

- [x] Une parabole
- [ ] Une droite
- [ ] Un arc de cercle
- [ ] Une hyperbole

> Horizontalement, rien n'accélère le projectile : $x$ est proportionnel à $t$. Verticalement, $y$ contient un terme en $t^2$. En exprimant $t$ en fonction de $x$, on obtient $y$ comme un polynôme du second degré en $x$ : une parabole. Si la vitesse initiale est verticale, la trajectoire est un segment de droite.

## kepler-3 · single
Que dit la troisième loi de Kepler, pour les planètes en orbite autour du Soleil ($T$ période de révolution, $a$ demi-grand axe de l'orbite) ?

- [x] Le rapport $\dfrac{T^2}{a^3}$ est le même pour toutes les planètes
- [ ] Le rapport $\dfrac{T}{a}$ est le même pour toutes les planètes
- [ ] Le produit $T^2 a^3$ est le même pour toutes les planètes
- [ ] La période est la même pour toutes les planètes

> Plus une planète est loin, plus sa période est longue, et plus vite que la distance : $T^2$ croît comme $a^3$. Pour une orbite circulaire, la deuxième loi de Newton donne $\dfrac{T^2}{r^3} = \dfrac{4\pi^2}{G\,M}$, où $M$ est la masse du Soleil.

## perihelie · single
Une planète décrit une orbite elliptique autour du Soleil. À quoi correspond son périhélie ?

- [x] À la position où la planète est la plus proche du Soleil
- [ ] À la position où la planète est la plus éloignée du Soleil
- [ ] Au centre de l'ellipse
- [ ] Au foyer de l'ellipse occupé par le Soleil

> Le Soleil occupe un foyer de l'ellipse, pas son centre (première loi de Kepler). Le périhélie est le point de l'orbite le plus proche du Soleil, l'aphélie le plus éloigné (« péri » : autour, près ; « apo » : loin ; « hélios » : Soleil). Pour la Terre, environ $\pu{147e6 km}$ début janvier et $\pu{152e6 km}$ début juillet.

## kepler-vitesse · single
Sur son orbite elliptique, où la vitesse d'une planète est-elle maximale ?

- [x] Au périhélie, là où elle est la plus proche du Soleil
- [ ] À l'aphélie, là où elle est la plus éloignée du Soleil
- [ ] Nulle part : sa vitesse est constante sur l'orbite
- [ ] Aux deux extrémités du petit axe de l'ellipse

> Loi des aires (deuxième loi de Kepler) : le segment Soleil-planète balaie des aires égales pendant des durées égales. Près du Soleil, ce segment est court : pour balayer la même aire, la planète doit parcourir un arc plus long, donc aller plus vite. Sa vitesse est maximale au périhélie, minimale à l'aphélie. Elle n'est constante que pour une orbite circulaire.

## circulaire · single
Quelle est l'accélération d'un point en mouvement circulaire uniforme, de rayon $R$ et de vitesse $v$ ?

- [x] Dirigée vers le centre du cercle, de valeur $\dfrac{v^2}{R}$
- [ ] Nulle, puisque la valeur de la vitesse est constante
- [ ] Tangente à la trajectoire, de valeur $\dfrac{v^2}{R}$
- [ ] Dirigée vers l'extérieur du cercle, de valeur $v\,R$

> La valeur de la vitesse est constante, mais pas sa direction : le vecteur vitesse tourne, donc l'accélération n'est pas nulle. Elle est centripète, de valeur $\dfrac{v^2}{R}$. C'est le cas, en première approximation, d'un satellite en orbite circulaire.

## energie-cinetique · numeric
Un objet de masse 2,0 kg se déplace à 3,0 m·s⁻¹. Quelle est son énergie cinétique, en joules ?

= 9,0 ± 0,1 J

> $E_c = \dfrac{1}{2}m\,v^2 = \dfrac{1}{2} \times 2,0 \times 3,0^2 = \pu{9,0 J}$. Attention au carré : doubler la vitesse multiplie l'énergie cinétique par quatre.

## unite-newton · single
À quelles unités du Système international correspond le newton (N) ?

- [x] $\pu{kg.m.s-2}$
- [ ] $\pu{kg.m.s-1}$
- [ ] $\pu{kg.m2.s-2}$
- [ ] $\pu{kg.s-2}$

> D'après $F = m\,a$, une force s'exprime en kilogrammes multipliés par des mètres par seconde au carré. $\pu{kg.m.s-1}$ est l'unité de la quantité de mouvement ; $\pu{kg.m2.s-2}$ est le joule, unité d'énergie.
