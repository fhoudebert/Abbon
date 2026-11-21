---
id: complexes-01
title: { fr: "Nombres complexes : les bases" }
description: { fr: "Conjugué, module, forme exponentielle, calculs et équations" }
level: bases
tags: [maths, expertes, prog-2019]
---

## conjugue · single
Quel est le conjugué de $z = 3 + 2i$ ?

- [x] $3 - 2i$
- [ ] $-3 + 2i$
- [ ] $-3 - 2i$
- [ ] $2 + 3i$

> Le conjugué de $a + ib$ est $a - ib$ : on change le signe de la partie imaginaire seulement. Dans le plan, $\overline{z}$ est le symétrique de $z$ par rapport à l'axe des réels. On a $z\,\overline{z} = 3^2 + 2^2 = 13$.

## module · numeric
Quel est le module de $z = 3 + 4i$ ?

= 5

> $|a + ib| = \sqrt{a^2 + b^2}$, donc $|3 + 4i| = \sqrt{9 + 16} = 5$. C'est la distance de l'origine au point d'affixe $z$.

## i-exponentielle · single
Quelle est la forme exponentielle de $i$ ?

- [x] $e^{i\pi/2}$
- [ ] $e^{i\pi}$
- [ ] $e^{i}$
- [ ] $e^{-i\pi/2}$

> $i$ a pour module 1 et pour argument $\dfrac{\pi}{2}$ : $e^{i\pi/2} = \cos\dfrac{\pi}{2} + i\sin\dfrac{\pi}{2} = i$. $e^{i\pi} = -1$ et $e^{-i\pi/2} = -i$.

## puissance · single
Soit $z = e^{i\pi/3}$. Que vaut $z^6$ ?

- [x] $1$
- [ ] $-1$
- [ ] $i$
- [ ] $e^{i\pi/18}$

> $z^6 = \left(e^{i\pi/3}\right)^6 = e^{6i\pi/3} = e^{2i\pi} = 1$ : $z$ est une racine sixième de l'unité. On multiplie l'argument par l'exposant ; diviser, comme dans $e^{i\pi/18}$, est l'erreur classique.

## euler · single
Que vaut $e^{i\pi}$ ?

- [x] $-1$
- [ ] $1$
- [ ] $i$
- [ ] $0$

> $e^{i\theta} = \cos\theta + i\sin\theta$, donc $e^{i\pi} = \cos\pi + i\sin\pi = -1$. D'où l'identité d'Euler, $e^{i\pi} + 1 = 0$, qui réunit cinq constantes fondamentales.

## binome · single
Que vaut $(1 + i)^3$ ?

- [x] $-2 + 2i$
- [ ] $2 + 2i$
- [ ] $-2 - 2i$
- [ ] $1 - i$

> Avec $(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$ : $1 + 3i + 3i^2 + i^3 = 1 + 3i - 3 - i = -2 + 2i$. On peut aussi calculer $(1 + i)^2 = 2i$, puis $2i(1 + i) = 2i + 2i^2 = -2 + 2i$. $1 - i$ vient de l'oubli des termes croisés : $1^3 + i^3$.

## factorisation · single
Comment se factorise $z^3 - 1$ ?

- [x] $(z - 1)(z^2 + z + 1)$
- [ ] $(z - 1)(z^2 - z + 1)$
- [ ] $(z - 1)^3$
- [ ] $(z + 1)(z^2 - z + 1)$

> C'est l'identité $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$, avec $a = z$ et $b = 1$. Les solutions de $z^3 = 1$ sont donc 1 et les deux racines de $z^2 + z + 1$, soit $e^{2i\pi/3}$ et $e^{-2i\pi/3}$. $(z + 1)(z^2 - z + 1)$ est la factorisation de $z^3 + 1$.

## equation · single
Quelles sont les solutions dans $\mathbb{C}$ de l'équation $z^2 = -1$ ?

- [x] $i$ et $-i$
- [ ] Il n'y en a pas
- [ ] $-1$
- [ ] $i$ seulement

> $i^2 = -1$ et $(-i)^2 = -1$. Dans $\mathbb{R}$, l'équation n'a pas de solution ; dans $\mathbb{C}$, toute équation du second degré en a deux, éventuellement confondues.

## argument · single
Quel est un argument de $z = 1 + i$ ?

- [x] $\dfrac{\pi}{4}$
- [ ] $\dfrac{\pi}{2}$
- [ ] $1$
- [ ] $\sqrt{2}$

> $|z| = \sqrt{2}$, et $\cos\theta = \dfrac{1}{\sqrt{2}}$, $\sin\theta = \dfrac{1}{\sqrt{2}}$ : $\theta = \dfrac{\pi}{4}$ (à $2\pi$ près). Donc $1 + i = \sqrt{2}\,e^{i\pi/4}$. $\sqrt{2}$ est le module, pas l'argument.

## inverse · single
Que vaut $\dfrac{1}{i}$ ?

- [x] $-i$
- [ ] $i$
- [ ] $1$
- [ ] $-1$

> On multiplie numérateur et dénominateur par le conjugué $-i$ : $\dfrac{1}{i} = \dfrac{-i}{i \times (-i)} = \dfrac{-i}{1} = -i$. Vérification : $i \times (-i) = -i^2 = 1$.
