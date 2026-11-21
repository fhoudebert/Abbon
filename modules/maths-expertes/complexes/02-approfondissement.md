---
id: complexes-02
title: { fr: "Nombres complexes : approfondissement" }
description: { fr: "Puissances et forme exponentielle, équations du second degré, racines de l'unité, géométrie, trigonométrie" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## module-puissance · numeric
Quel est le module de $(1 + i)^{10}$ ?

= 32

> Le module d'une puissance est la puissance du module : $|(1+i)^{10}| = |1+i|^{10} = \left(\sqrt{2}\right)^{10} = 2^5 = 32$. Développer $(1+i)^{10}$ serait bien plus long.

## quotient · single
Quelle est la forme algébrique de $\dfrac{1 + i}{1 - i}$ ?

- [x] $i$
- [ ] $1$
- [ ] $-i$
- [ ] $\dfrac{1}{2} + \dfrac{1}{2}i$

> On multiplie par le conjugué du dénominateur : $\dfrac{(1+i)(1+i)}{(1-i)(1+i)} = \dfrac{1 + 2i + i^2}{1 - i^2} = \dfrac{2i}{2} = i$. En forme exponentielle : $\dfrac{\sqrt{2}\,e^{i\pi/4}}{\sqrt{2}\,e^{-i\pi/4}} = e^{i\pi/2} = i$.

## puissance-reelle · numeric
$(1 + i\sqrt{3})^6$ est un nombre réel. Lequel ?

= 64

> $1 + i\sqrt{3} = 2\,e^{i\pi/3}$ (module $\sqrt{1 + 3} = 2$, argument $\frac{\pi}{3}$). Par la formule de Moivre, $(2\,e^{i\pi/3})^6 = 2^6\,e^{2i\pi} = 64$.

## second-degre · single
Quelles sont les solutions dans $\mathbb{C}$ de $z^2 - 2z + 5 = 0$ ?

- [x] $1 - 2i$ et $1 + 2i$
- [ ] $-1 - 2i$ et $-1 + 2i$
- [ ] $2 - i$ et $2 + i$
- [ ] Il n'y en a pas

> $\Delta = 4 - 20 = -16 < 0$ : deux solutions conjuguées $\dfrac{2 \pm i\sqrt{16}}{2} = 1 \pm 2i$. Vérification : la somme des solutions vaut $2$ et leur produit $1 + 4 = 5$, comme l'indiquent les coefficients.

## racine-conjuguee · single
$P$ est un polynôme à coefficients réels et $P(i) = 0$. Que peut-on en déduire ?

- [x] $P(-i) = 0$ aussi
- [ ] $P(1) = 0$
- [ ] $P(-1) = 0$
- [ ] Rien de plus

> Les coefficients étant réels, $\overline{P(z)} = P(\overline{z})$ : donc $P(-i) = \overline{P(i)} = 0$. $P$ est alors divisible par $(z - i)(z + i) = z^2 + 1$. Par exemple, $z^3 + z^2 + z + 1 = (z + 1)(z^2 + 1)$.

## racines-unite · numeric
Que vaut la somme des trois racines cubiques de l'unité, $1 + e^{2i\pi/3} + e^{4i\pi/3}$ ?

= 0

> Avec $j = e^{2i\pi/3}$, la somme vaut $1 + j + j^2 = \dfrac{1 - j^3}{1 - j} = 0$, car $j^3 = 1$ et $j \neq 1$. Géométriquement, les trois points forment un triangle équilatéral centré en $O$.

## mediatrice · single
Quel est l'ensemble des points $M$ d'affixe $z$ tels que $|z - 1| = |z + i|$ ?

- [x] La médiatrice du segment joignant les points d'affixes $1$ et $-i$
- [ ] Le cercle de centre $1$ et de rayon $1$
- [ ] La droite passant par les points d'affixes $1$ et $-i$
- [ ] Un seul point

> $|z - 1|$ est la distance de $M$ au point $A$ d'affixe $1$ ; $|z + i| = |z - (-i)|$, la distance au point $B$ d'affixe $-i$. $MA = MB$ décrit la médiatrice de $[AB]$, ici la droite d'équation $y = -x$.

## rectangle-isocele · single
Trois points $A$, $B$, $C$ vérifient $z_C - z_A = i\,(z_B - z_A)$. Quelle est la nature du triangle $ABC$ ?

- [x] Rectangle isocèle en $A$
- [ ] Équilatéral
- [ ] Rectangle en $B$
- [ ] Aplati

> Multiplier par $i = e^{i\pi/2}$, c'est tourner d'un quart de tour : $\overrightarrow{AC}$ est l'image de $\overrightarrow{AB}$ par la rotation d'angle $\frac{\pi}{2}$. Donc $AC = AB$ (module 1) et l'angle en $A$ est droit.

## moivre-cos · single
En développant $(\cos\theta + i\sin\theta)^3$ par la formule de Moivre, que vaut $\cos(3\theta)$ ?

- [x] $4\cos^3\theta - 3\cos\theta$
- [ ] $3\cos\theta - 4\cos^3\theta$
- [ ] $\cos^3\theta$
- [ ] $3\cos\theta$

> $(\cos\theta + i\sin\theta)^3 = \cos 3\theta + i\sin 3\theta$. La partie réelle du développement est $\cos^3\theta - 3\cos\theta\sin^2\theta = \cos^3\theta - 3\cos\theta(1 - \cos^2\theta) = 4\cos^3\theta - 3\cos\theta$. Vérification en $\theta = 0$ : $4 - 3 = 1 = \cos 0$.

## linearisation · single
Grâce aux formules d'Euler, comment s'écrit $\cos^2 x$ ?

- [x] $\dfrac{1 + \cos(2x)}{2}$
- [ ] $\dfrac{1 - \cos(2x)}{2}$
- [ ] $\cos(2x)$
- [ ] $2\cos x$

> $\cos^2 x = \left(\dfrac{e^{ix} + e^{-ix}}{2}\right)^2 = \dfrac{e^{2ix} + 2 + e^{-2ix}}{4} = \dfrac{2 + 2\cos(2x)}{4} = \dfrac{1 + \cos(2x)}{2}$. La forme $\dfrac{1 - \cos(2x)}{2}$ est celle de $\sin^2 x$. Linéariser sert à calculer une primitive.
