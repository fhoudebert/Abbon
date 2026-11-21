---
id: integrales-02
title: { fr: "Primitives et intégrales : approfondissement" }
description: { fr: "Primitives à écrire, intégration par parties, aire entre deux courbes, équations différentielles" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## primitive-u-exp · expression
Écrivez une primitive de $f(x) = x\,e^{x^2}$.

= $\frac{1}{2}e^{x^2} + C$

> On reconnaît $\dfrac{1}{2}\,u'\,e^{u}$ avec $u = x^2$ et $u' = 2x$ : une primitive est $F(x) = \dfrac{1}{2}e^{x^2}$. Toute fonction $\dfrac{1}{2}e^{x^2} + C$ convient. On vérifie en dérivant : $F'(x) = \dfrac{1}{2} \times 2x\,e^{x^2} = x\,e^{x^2}$.

## primitive-u-sur-u · expression
Écrivez une primitive de $f(x) = \dfrac{1}{2x + 1}$ sur $\left]-\dfrac{1}{2}\,;+\infty\right[$.

= $\frac{1}{2}\ln(2x+1) + C$

> $f = \dfrac{1}{2} \times \dfrac{u'}{u}$ avec $u = 2x + 1 > 0$ et $u' = 2$ : $F(x) = \dfrac{1}{2}\ln(2x + 1)$. Oublier le facteur $\dfrac{1}{2}$ donnerait une fonction dont la dérivée est $\dfrac{2}{2x+1}$.

## integrale-exp · numeric
Calculez $\displaystyle\int_0^1 e^{2x}\,\mathrm{d}x$ (valeur approchée à $0,01$ près).

= 3,19 ± 0,01

> Une primitive de $e^{2x}$ est $\dfrac{1}{2}e^{2x}$ : l'intégrale vaut $\dfrac{1}{2}(e^2 - e^0) = \dfrac{e^2 - 1}{2} \approx 3,19$.

## ipp-x-exp · numeric
Calculez $\displaystyle\int_0^1 x\,e^{x}\,\mathrm{d}x$.

= 1

> Par parties, avec $u = x$ ($u' = 1$) et $v' = e^x$ ($v = e^x$) : $\displaystyle\int_0^1 x\,e^x\,\mathrm{d}x = \big[x\,e^x\big]_0^1 - \int_0^1 e^x\,\mathrm{d}x = e - (e - 1) = 1$.

## ipp-ln · numeric
Calculez $\displaystyle\int_1^e \ln x\,\mathrm{d}x$.

= 1

> Par parties, avec $u = \ln x$ ($u' = \dfrac{1}{x}$) et $v' = 1$ ($v = x$) : $\big[x\ln x\big]_1^e - \displaystyle\int_1^e 1\,\mathrm{d}x = e - (e - 1) = 1$. Une primitive de $\ln$ est d'ailleurs $x\ln x - x$.

## aire-entre-courbes · numeric
Quelle est l'aire, en unités d'aire, du domaine compris entre les courbes de $y = x$ et $y = x^2$ pour $x$ entre 0 et 1 (valeur approchée à $0,001$ près) ?

= 0,167 ± 0,001

> Sur $[0\,;1]$, $x \geq x^2$ : l'aire vaut $\displaystyle\int_0^1 (x - x^2)\,\mathrm{d}x = \left[\dfrac{x^2}{2} - \dfrac{x^3}{3}\right]_0^1 = \dfrac{1}{2} - \dfrac{1}{3} = \dfrac{1}{6} \approx 0,167$. On soustrait toujours la fonction du dessous à celle du dessus.

## valeur-moyenne · numeric
Quelle est la valeur moyenne de $f(x) = x^2$ sur $[0\,;3]$ ?

= 3

> $\mu = \dfrac{1}{3 - 0}\displaystyle\int_0^3 x^2\,\mathrm{d}x = \dfrac{1}{3} \times \left[\dfrac{x^3}{3}\right]_0^3 = \dfrac{1}{3} \times 9 = 3$. Ne pas oublier de diviser par la longueur de l'intervalle.

## equa-diff-homogene · expression
Écrivez la solution de $y' = 2y$ qui vérifie $y(0) = 3$ : $y(x) = \dots$

= $3e^{2x}$

> Les solutions de $y' = a\,y$ sont les $C\,e^{ax}$ ; ici $y = C\,e^{2x}$, et $y(0) = C = 3$. Donc $y(x) = 3\,e^{2x}$.

## equa-diff-second-membre · expression
Écrivez la solution de $y' = -y + 4$ qui vérifie $y(0) = 1$ : $y(x) = \dots$

= $4 - 3e^{-x}$

> Pour $y' = a\,y + b$, les solutions sont $C\,e^{ax} - \dfrac{b}{a}$ ; ici $a = -1$, $b = 4$, donc $y = C\,e^{-x} + 4$. La condition $y(0) = C + 4 = 1$ donne $C = -3$. La solution constante $y = 4$ est la limite en $+\infty$.

## suite-integrales · expression
Pour tout entier $n \geq 0$, on pose $I_n = \displaystyle\int_0^1 x^n\,\mathrm{d}x$. Écrivez $I_n$ en fonction de $n$.

= $\frac{1}{n+1}$

> Une primitive de $x^n$ est $\dfrac{x^{n+1}}{n+1}$, donc $I_n = \dfrac{1}{n+1} - 0 = \dfrac{1}{n+1}$. La suite $(I_n)$ est décroissante et tend vers 0 : sur $[0\,;1]$, $x^{n+1} \leq x^n$.
