---
id: fonctions-03
title: { fr: "Dérivation, logarithme, exponentielle : niveau expert" }
description: { fr: "Dérivées à écrire, extremums, inégalités de convexité, limites par taux d'accroissement, nombre de solutions" }
level: expert
tags: [maths, bac, prog-2019]
---

## derivee-xlnx · expression
Écrivez la dérivée de $f(x) = x\ln x - x$ sur $]0\,;+\infty[$.

= $\ln x$

> $(x\ln x)' = 1 \times \ln x + x \times \dfrac{1}{x} = \ln x + 1$, donc $f'(x) = \ln x + 1 - 1 = \ln x$ : $f$ est une primitive de $\ln$, à retenir.

## derivee-gauss · expression
Écrivez la dérivée de $f(x) = e^{-x^2}$.

= $-2xe^{-x^2}$

> $(e^u)' = u'e^u$ avec $u = -x^2$ et $u' = -2x$ : $f'(x) = -2x\,e^{-x^2}$. La fonction croît sur $]-\infty\,;0]$ et décroît ensuite : c'est la « courbe en cloche ».

## minimum-xex · numeric
Quelle est la valeur minimale de $f(x) = x\,e^x$ sur $\mathbb{R}$ (à $0,001$ près) ?

= -0,368 ± 0,001

> $f'(x) = (1 + x)\,e^x$, du signe de $1 + x$ : $f$ décroît puis croît, avec un minimum en $x = -1$, égal à $-e^{-1} = -\dfrac{1}{e} \approx -0,368$.

## convexite-exp · single
Pourquoi a-t-on $e^x \geq 1 + x$ pour tout réel $x$ ?

- [x] $\exp$ est convexe, et $y = 1 + x$ est sa tangente en 0
- [ ] Parce que $e^x$ est toujours positif
- [ ] Parce que $e > 1$
- [ ] Ce n'est vrai que pour $x \geq 0$

> Une fonction convexe est au-dessus de ses tangentes. La tangente à $\exp$ en 0 a pour équation $y = e^0(x - 0) + e^0 = 1 + x$. De même, $\ln$ est concave, d'où $\ln x \leq x - 1$.

## tangente-exp · expression
Écrivez l'équation réduite de la tangente à la courbe de $\exp$ au point d'abscisse 1 : $y = \dots$

= $ex$

> $y = e^1(x - 1) + e^1 = e\,x$ : cette tangente passe par l'origine. Comme $\exp$ est convexe, $e^x \geq e\,x$ pour tout réel $x$.

## solutions-ln · numeric
Combien l'équation $\ln x = \dfrac{x}{e}$ a-t-elle de solutions sur $]0\,;+\infty[$ ?

= 1

> $g(x) = \ln x - \dfrac{x}{e}$ a pour dérivée $\dfrac{1}{x} - \dfrac{1}{e}$, positive avant $e$, négative après : $g$ atteint son maximum en $e$, où $g(e) = 1 - 1 = 0$. Partout ailleurs, $g < 0$ : une seule solution, $x = e$. La droite $y = \frac{x}{e}$ est tangente à la courbe de $\ln$.

## taux-accroissement · numeric
Quelle est la limite de $\dfrac{e^x - 1}{x}$ quand $x$ tend vers 0 ?

= 1

> C'est le taux d'accroissement de $\exp$ en 0 : $\dfrac{e^x - e^0}{x - 0} \to \exp'(0) = 1$. La forme « $0/0$ » se lève en reconnaissant un nombre dérivé.

## maximum-lnx-sur-x · numeric
Quel est le maximum de $f(x) = \dfrac{\ln x}{x}$ sur $]0\,;+\infty[$ (à $0,001$ près) ?

= 0,368 ± 0,001

> $f'(x) = \dfrac{1 - \ln x}{x^2}$, positive pour $x < e$, négative ensuite : le maximum vaut $f(e) = \dfrac{1}{e} \approx 0,368$. On en déduit par exemple que $e^\pi > \pi^e$.

## concavite · single
Sur quel intervalle la fonction $f(x) = x^3 - 3x$ est-elle concave ?

- [x] $]-\infty\,;0]$
- [ ] $[0\,;+\infty[$
- [ ] $[-1\,;1]$
- [ ] $\mathbb{R}$

> $f''(x) = 6x$ est négative pour $x \leq 0$ : $f$ y est concave, puis convexe ; le point d'inflexion est en 0. Les points $-1$ et $1$, où $f'$ s'annule, sont les extremums.

## limite-carre-ln · single
Quelle est la limite de $\dfrac{(\ln x)^2}{x}$ quand $x$ tend vers $+\infty$ ?

- [x] $0$
- [ ] $+\infty$
- [ ] $1$
- [ ] Elle n'existe pas

> En posant $x = t^2$ ($t \to +\infty$) : $\dfrac{(\ln t^2)^2}{t^2} = 4\left(\dfrac{\ln t}{t}\right)^2 \to 0$. Toute puissance de $\ln x$ est négligeable devant toute puissance positive de $x$.
