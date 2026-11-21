---
id: integrales-03
title: { fr: "Primitives et intégrales : niveau expert" }
description: { fr: "Primitives à écrire, double intégration par parties, valeur absolue, aires, encadrements, équations différentielles" }
level: expert
tags: [maths, bac, prog-2019]
---

## integrale-sinus · numeric
Calculez $\displaystyle\int_0^{\pi} \sin x\,\mathrm{d}x$.

= 2

> Une primitive de $\sin$ est $-\cos$ : $\big[-\cos x\big]_0^{\pi} = -\cos\pi + \cos 0 = 1 + 1 = 2$. C'est l'aire d'une arche de sinusoïde.

## double-ipp · numeric
Calculez $\displaystyle\int_0^1 x^2\,e^x\,\mathrm{d}x$ (à $0,001$ près).

= 0,718 ± 0,001

> Une première intégration par parties ($u = x^2$) donne $\big[x^2e^x\big]_0^1 - 2\displaystyle\int_0^1 x\,e^x\,\mathrm{d}x = e - 2 \times 1$, car $\displaystyle\int_0^1 x\,e^x\,\mathrm{d}x = 1$ (seconde intégration par parties). Résultat : $e - 2 \approx 0,718$.

## primitive-ln · expression
Écrivez une primitive de $\ln x$ sur $]0\,;+\infty[$.

= $x\ln x - x + C$

> Par parties, avec $u = \ln x$ et $v' = 1$ : $\displaystyle\int \ln x\,\mathrm{d}x = x\ln x - \int x \times \dfrac{1}{x}\,\mathrm{d}x = x\ln x - x$. On vérifie en dérivant : $(x\ln x - x)' = \ln x$.

## primitive-quotient · expression
Écrivez une primitive de $f(x) = \dfrac{x}{x^2 + 1}$ sur $\mathbb{R}$.

= $\frac{1}{2}\ln(x^2+1) + C$

> $f = \dfrac{1}{2} \times \dfrac{u'}{u}$ avec $u = x^2 + 1 > 0$ : $F(x) = \dfrac{1}{2}\ln(x^2 + 1)$. Pas de valeur absolue nécessaire, $u$ étant toujours positif.

## primitive-sinus · expression
Écrivez une primitive de $f(x) = \sin(2x)$.

= $-\frac{1}{2}\cos(2x) + C$

> Une primitive de $\sin(ax)$ est $-\dfrac{1}{a}\cos(ax)$ : ici $-\dfrac{1}{2}\cos(2x)$. Vérification : $\left(-\frac{1}{2}\cos 2x\right)' = \frac{1}{2} \times 2\sin 2x$. L'écriture $\sin^2 x$ convient aussi, elle ne diffère que d'une constante.

## aire-exp-tangente · numeric
Quelle est l'aire, en unités d'aire, comprise entre la courbe de $\exp$ et sa tangente $y = x + 1$, pour $x$ entre 0 et 1 (à $0,001$ près) ?

= 0,218 ± 0,001

> La courbe est au-dessus de sa tangente (convexité) : aire $= \displaystyle\int_0^1 (e^x - x - 1)\,\mathrm{d}x = \left[e^x - \dfrac{x^2}{2} - x\right]_0^1 = e - \dfrac{5}{2} \approx 0,218$.

## moyenne-sinus · numeric
Quelle est la valeur moyenne de $\sin$ sur $[0\,;\pi]$ (à $0,001$ près) ?

= 0,637 ± 0,001

> $\mu = \dfrac{1}{\pi}\displaystyle\int_0^{\pi}\sin x\,\mathrm{d}x = \dfrac{2}{\pi} \approx 0,637$. Sur $[0\,;2\pi]$, elle serait nulle : les deux arches se compensent.

## valeur-absolue · numeric
Calculez $\displaystyle\int_0^3 |x - 1|\,\mathrm{d}x$.

= 2,5 ± 0,01

> On coupe en 1 (relation de Chasles) : $\displaystyle\int_0^1 (1 - x)\,\mathrm{d}x + \int_1^3 (x - 1)\,\mathrm{d}x = \dfrac{1}{2} + 2 = \dfrac{5}{2}$. Ce sont les aires de deux triangles.

## encadrement · single
On pose $I_n = \displaystyle\int_0^1 x^n e^x\,\mathrm{d}x$. Pourquoi $(I_n)$ tend-elle vers 0 ?

- [x] Car $0 \leq x^n e^x \leq e\,x^n$ sur $[0\,;1]$, d'où $0 \leq I_n \leq \dfrac{e}{n+1}$
- [ ] Car $x^n \to 0$ pour tout $x$ de $[0\,;1]$
- [ ] Car $(I_n)$ est décroissante
- [ ] Car $e^x \leq 1$ sur $[0\,;1]$

> On encadre l'intégrande, puis on intègre (positivité de l'intégrale) : $0 \leq I_n \leq e\displaystyle\int_0^1 x^n\,\mathrm{d}x = \dfrac{e}{n+1}$, et les gendarmes concluent. « $x^n \to 0$ » ne suffit pas (c'est faux en $x = 1$, et passer à la limite sous l'intégrale n'est pas au programme) ; décroissante et minorée, la suite converge, mais sans dire vers quoi.

## equa-diff-constante · expression
Écrivez la solution de $y' + 2y = 6$ qui vérifie $y(0) = 0$ : $y(x) = \dots$

= $3 - 3e^{-2x}$

> L'équation s'écrit $y' = -2y + 6$ : solutions $C\,e^{-2x} + 3$ (la solution constante est $\frac{6}{2} = 3$). $y(0) = C + 3 = 0$ donne $C = -3$, d'où $y = 3 - 3e^{-2x}$, qui tend vers 3.
