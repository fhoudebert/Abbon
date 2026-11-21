---
id: integrales-01
title: { fr: "Primitives et intégrales : les bases" }
description: { fr: "Primitives usuelles, calcul d'intégrales, aire, valeur moyenne, intégration par parties" }
level: bases
tags: [maths, bac, prog-2019]
---

## integrale-carre · numeric
Calculez $\displaystyle\int_0^2 3x^2\,\mathrm{d}x$.

= 8

> Une primitive de $3x^2$ est $x^3$ : $\displaystyle\int_0^2 3x^2\,\mathrm{d}x = \big[x^3\big]_0^2 = 2^3 - 0^3 = 8$.

## integrale-affine · numeric
Calculez $\displaystyle\int_0^1 (2x + 3)\,\mathrm{d}x$.

= 4

> Une primitive est $x^2 + 3x$ : $\big[x^2 + 3x\big]_0^1 = (1 + 3) - 0 = 4$. Sur $[0\,;1]$, c'est aussi l'aire d'un trapèze de hauteurs 3 et 5 et de largeur 1 : $\dfrac{3 + 5}{2} = 4$.

## primitive-puissance · single
Pour $n \neq -1$, quelle est une primitive de $x \mapsto x^n$ ?

- [x] $x \mapsto \dfrac{x^{n+1}}{n+1}$
- [ ] $x \mapsto n\,x^{n-1}$
- [ ] $x \mapsto x^{n+1}$
- [ ] $x \mapsto \dfrac{x^{n}}{n+1}$

> On vérifie en dérivant : $\left(\dfrac{x^{n+1}}{n+1}\right)' = x^n$. $n\,x^{n-1}$ est la dérivée, pas une primitive. Le cas $n = -1$ est à part : une primitive de $\dfrac{1}{x}$ est $\ln x$.

## primitive-inverse · single
Quelle est une primitive de $x \mapsto \dfrac{1}{x}$ sur $]0\,;+\infty[$ ?

- [x] $x \mapsto \ln x$
- [ ] $x \mapsto -\dfrac{1}{x^2}$
- [ ] $x \mapsto e^x$
- [ ] $x \mapsto \dfrac{x^0}{0}$

> $(\ln x)' = \dfrac{1}{x}$. La formule $\dfrac{x^{n+1}}{n+1}$ ne s'applique pas pour $n = -1$ : elle ferait diviser par 0. $-\dfrac{1}{x^2}$ est la dérivée de $\dfrac{1}{x}$.

## primitive-exp · single
Quelle est une primitive de $x \mapsto e^{2x}$ ?

- [x] $x \mapsto \dfrac{1}{2}e^{2x}$
- [ ] $x \mapsto 2e^{2x}$
- [ ] $x \mapsto e^{2x}$
- [ ] $x \mapsto e^{x^2}$

> En dérivant $\dfrac{1}{2}e^{2x}$, on obtient $\dfrac{1}{2} \times 2e^{2x} = e^{2x}$. Plus généralement, une primitive de $e^{ax}$ est $\dfrac{1}{a}e^{ax}$. $2e^{2x}$ est la dérivée.

## aire · single
$f$ est continue et positive sur $[a\,;b]$. Que représente $\displaystyle\int_a^b f(x)\,\mathrm{d}x$ ?

- [x] L'aire, en unités d'aire, du domaine entre la courbe de $f$, l'axe des abscisses et les droites $x = a$ et $x = b$
- [ ] La longueur de la courbe de $f$ entre $a$ et $b$
- [ ] La valeur moyenne de $f$ sur $[a\,;b]$
- [ ] La différence $f(b) - f(a)$

> Si $f$ change de signe, l'intégrale compte négativement les parties situées sous l'axe. La valeur moyenne est $\dfrac{1}{b-a}\displaystyle\int_a^b f(x)\,\mathrm{d}x$. C'est $F(b) - F(a)$, avec $F$ primitive de $f$, qui vaut l'intégrale.

## valeur-moyenne · single
Comment s'écrit la valeur moyenne d'une fonction continue $f$ sur $[a\,;b]$, avec $a < b$ ?

- [x] $\dfrac{1}{b-a}\displaystyle\int_a^b f(x)\,\mathrm{d}x$
- [ ] $\dfrac{f(a) + f(b)}{2}$
- [ ] $\displaystyle\int_a^b f(x)\,\mathrm{d}x$
- [ ] $(b-a)\displaystyle\int_a^b f(x)\,\mathrm{d}x$

> C'est la hauteur du rectangle de base $[a\,;b]$ qui a la même aire que le domaine sous la courbe. $\dfrac{f(a) + f(b)}{2}$ ne coïncide avec elle que pour une fonction affine.

## ipp · single
$u$ et $v$ sont dérivables, de dérivées continues sur $[a\,;b]$. Que dit la formule d'intégration par parties ?

- [x] $\displaystyle\int_a^b u\,v'\,\mathrm{d}x = \big[u\,v\big]_a^b - \displaystyle\int_a^b u'\,v\,\mathrm{d}x$
- [ ] $\displaystyle\int_a^b u\,v'\,\mathrm{d}x = \big[u\,v\big]_a^b + \displaystyle\int_a^b u'\,v\,\mathrm{d}x$
- [ ] $\displaystyle\int_a^b u\,v'\,\mathrm{d}x = \displaystyle\int_a^b u\,\mathrm{d}x \times \displaystyle\int_a^b v'\,\mathrm{d}x$
- [ ] $\displaystyle\int_a^b u\,v'\,\mathrm{d}x = u'(b)\,v(a)$

> Elle découle de la dérivée d'un produit, $(uv)' = u'v + uv'$, que l'on intègre entre $a$ et $b$. On l'emploie pour $\displaystyle\int x\,e^x\,\mathrm{d}x$ ou $\displaystyle\int \ln x\,\mathrm{d}x$, en choisissant pour $u$ le facteur qui se simplifie en dérivant. L'intégrale d'un produit n'est pas le produit des intégrales.
