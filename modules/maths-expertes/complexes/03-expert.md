---
id: complexes-03
title: { fr: "Nombres complexes : niveau expert" }
description: { fr: "Puissances par la forme exponentielle, valeurs exactes, ensembles de points, équations, polynômes, rotation, triangle équilatéral" }
level: expert
tags: [maths, bac, prog-2019]
---

## puissance-exponentielle · numeric
Calculez $\left(1 + i\sqrt{3}\right)^6$.

= 64

> $1 + i\sqrt{3} = 2\,e^{i\pi/3}$, donc $\left(1 + i\sqrt{3}\right)^6 = 2^6\,e^{2i\pi} = 64$. Développer avec le binôme serait bien plus long : la forme exponentielle est faite pour les puissances.

## premier-reel-positif · numeric
Quel est le plus petit entier $n \geq 1$ tel que $(1 + i)^n$ soit un réel strictement positif ?

= 8

> $1 + i = \sqrt{2}\,e^{i\pi/4}$, donc $(1 + i)^n = \sqrt{2}^{\,n}\,e^{in\pi/4}$. C'est un réel positif si $\dfrac{n\pi}{4}$ est un multiple de $2\pi$, soit $n$ multiple de 8 : $(1 + i)^8 = 16$. Pour $n = 4$, on obtient $-4$, réel mais négatif.

## cos-pi-sur-12 · numeric
En écrivant $e^{i\pi/12} = e^{i\pi/3}\,e^{-i\pi/4}$, on obtient la valeur exacte de $\cos\dfrac{\pi}{12}$. Donnez-en une valeur approchée à $0,001$ près.

= 0,966 ± 0,001

> $e^{i\pi/3}\,e^{-i\pi/4} = \left(\frac{1}{2} + i\frac{\sqrt{3}}{2}\right)\left(\frac{\sqrt{2}}{2} - i\frac{\sqrt{2}}{2}\right)$, dont la partie réelle est $\dfrac{\sqrt{2} + \sqrt{6}}{4} \approx 0,966$. C'est la formule $\cos(a - b) = \cos a\cos b + \sin a\sin b$, retrouvée sans l'apprendre.

## module-somme · numeric
Calculez $\left|1 + e^{2i\pi/3}\right|$.

= 1

> Angle moitié : $1 + e^{i\theta} = e^{i\theta/2}\left(e^{-i\theta/2} + e^{i\theta/2}\right) = 2\cos\dfrac{\theta}{2}\,e^{i\theta/2}$. Avec $\theta = \dfrac{2\pi}{3}$, le module vaut $2\cos\dfrac{\pi}{3} = 1$. Autre lecture : $1 + j = -j^2$, de module 1.

## cercle · single
Quel est l'ensemble des points $M$ d'affixe $z$ tels que $|z - 2i| = 3$ ?

- [x] Le cercle de centre le point d'affixe $2i$ et de rayon 3
- [ ] Le cercle de centre le point d'affixe $-2i$ et de rayon 3
- [ ] Le cercle de centre $O$ et de rayon 3
- [ ] Une droite

> $|z - z_A| = AM$ : on cherche les points à la distance 3 du point $A$ d'affixe $2i$. Attention au signe : $|z + 2i| = 3$ donnerait le centre d'affixe $-2i$.

## racines-cubiques · single
Quelles sont les solutions dans $\mathbb{C}$ de $z^3 = 8$ ?

- [x] $2$, $2e^{2i\pi/3}$ et $2e^{-2i\pi/3}$
- [ ] $2$ seulement
- [ ] $2$ et $-2$
- [ ] $2$, $2i$ et $-2i$

> $z = 2u$ avec $u^3 = 1$ : $u$ est une racine cubique de l'unité, $1$, $e^{2i\pi/3}$ ou $e^{-2i\pi/3}$. Les trois solutions, $2$ et $-1 \pm i\sqrt{3}$, forment un triangle équilatéral inscrit dans le cercle de rayon 2. Vérification : $(2i)^3 = -8i$, ce n'est pas 8.

## polynome-racine-evidente · single
On pose $P(z) = z^3 - 3z^2 + 4z - 2$. Sachant que $P(1) = 0$, quelles sont les racines de $P$ ?

- [x] $1$, $1 + i$ et $1 - i$
- [ ] $1$, $2$ et $-1$
- [ ] $1$ seulement
- [ ] $1$, $i$ et $-i$

> $1$ étant racine, $P(z) = (z - 1)(z^2 - 2z + 2)$ (par identification). Le facteur du second degré a pour discriminant $\Delta = 4 - 8 = -4 = (2i)^2$, d'où les racines $\dfrac{2 \pm 2i}{2} = 1 \pm i$, conjuguées comme pour tout polynôme à coefficients réels.

## rotation · single
Quelle est l'image du point d'affixe $2 + i$ par la rotation de centre le point d'affixe 1 et d'angle $\dfrac{\pi}{2}$ ?

- [x] Le point d'affixe $i$
- [ ] Le point d'affixe $-1 + 2i$
- [ ] Le point d'affixe $1 + 2i$
- [ ] Le point d'affixe $2 - i$

> L'écriture complexe de la rotation est $z' - 1 = e^{i\pi/2}(z - 1) = i(z - 1)$. Pour $z = 2 + i$ : $z' = 1 + i(1 + i) = 1 + i - 1 = i$. L'oubli du centre (rotation autour de $O$) donnerait $-1 + 2i$.

## triangle-equilateral · single
$A$, $B$ et $C$ ont pour affixes $a$, $b$ et $c$, distinctes. À quelle condition le triangle $ABC$ est-il équilatéral ?

- [x] $\dfrac{c - a}{b - a} = e^{i\pi/3}$ ou $\dfrac{c - a}{b - a} = e^{-i\pi/3}$
- [ ] $\dfrac{c - a}{b - a} = i$
- [ ] $|c - a| = |b - a|$
- [ ] $a + b + c = 0$

> Le quotient a pour module $\dfrac{AC}{AB}$ et pour argument l'angle $(\overrightarrow{AB}, \overrightarrow{AC})$ : équilatéral signifie $AC = AB$ et angle $\pm\dfrac{\pi}{3}$. $|c - a| = |b - a|$ seul donne un triangle isocèle ; le quotient $i$, un triangle rectangle isocèle.

## conjugue-carre · numeric
Combien l'équation $\bar{z} = z^2$ a-t-elle de solutions dans $\mathbb{C}$ ?

= 4

> En passant au module : $|z| = |z|^2$, donc $|z| = 0$ ou $|z| = 1$. La solution $z = 0$ convient. Si $|z| = 1$, $\bar{z} = \dfrac{1}{z}$, et l'équation devient $z^3 = 1$ : les trois racines cubiques de l'unité. En tout, $0$, $1$, $e^{2i\pi/3}$ et $e^{-2i\pi/3}$.
