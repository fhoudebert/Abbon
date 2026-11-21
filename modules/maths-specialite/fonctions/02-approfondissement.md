---
id: fonctions-02
title: { fr: "Dérivation, logarithme, exponentielle : approfondissement" }
description: { fr: "Dérivées de composées à écrire, équations et limites, théorème des valeurs intermédiaires, inflexion, tangente" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## derivee-produit-exp · expression
Écrivez la dérivée de $f(x) = x\,e^{-x}$.

= $(1-x)e^{-x}$

> Produit $u\,v$ avec $u = x$ et $v = e^{-x}$, donc $v' = -e^{-x}$ : $f'(x) = e^{-x} - x\,e^{-x} = (1 - x)\,e^{-x}$. La forme développée $e^{-x} - xe^{-x}$ est acceptée aussi. Oublier le signe moins de $(e^{-x})'$ est l'erreur classique.

## derivee-ln-composee · expression
Écrivez la dérivée de $f(x) = \ln(x^2 + 1)$.

= $\frac{2x}{x^2+1}$

> $(\ln u)' = \dfrac{u'}{u}$ avec $u = x^2 + 1 > 0$ et $u' = 2x$, donc $f'(x) = \dfrac{2x}{x^2 + 1}$.

## derivee-racine · expression
Écrivez la dérivée de $f(x) = \sqrt{2x + 1}$, pour $x > -\dfrac{1}{2}$.

= $\frac{1}{\sqrt{2x+1}}$

> $(\sqrt{u})' = \dfrac{u'}{2\sqrt{u}}$ avec $u = 2x + 1$ et $u' = 2$ : $f'(x) = \dfrac{2}{2\sqrt{2x+1}} = \dfrac{1}{\sqrt{2x+1}}$. Sans le facteur $u' = 2$, on obtiendrait $\dfrac{1}{2\sqrt{2x+1}}$, qui est faux.

## equation-exp · numeric
Résolvez $e^{2x} = 5$ (valeur approchée à $0,001$ près).

= 0,805 ± 0,001

> On applique $\ln$, fonction réciproque de $\exp$ : $2x = \ln 5$, donc $x = \dfrac{\ln 5}{2} \approx 0,805$. La solution exacte s'écrit $\dfrac{\ln 5}{2}$, ou $\ln\sqrt{5}$.

## croissances-comparees · single
Quelle est la limite de $\dfrac{e^x}{x^3}$ quand $x$ tend vers $+\infty$ ?

- [x] $+\infty$
- [ ] $0$
- [ ] $1$
- [ ] Elle n'existe pas

> Forme indéterminée « $\infty / \infty$ » ; par croissances comparées, l'exponentielle l'emporte sur toute puissance : $\dfrac{e^x}{x^n} \to +\infty$ pour tout entier $n$. À l'inverse, $\dfrac{\ln x}{x^n} \to 0$.

## tvi-solutions · numeric
Combien l'équation $x^3 - 3x + 1 = 0$ a-t-elle de solutions réelles ?

= 3

> $f(x) = x^3 - 3x + 1$ a pour dérivée $3x^2 - 3 = 3(x-1)(x+1)$ : $f$ croît jusqu'à $-1$, décroît jusqu'à $1$, puis croît. Or $f(-1) = 3 > 0$ et $f(1) = -1 < 0$, avec $f \to -\infty$ en $-\infty$ et $f \to +\infty$ en $+\infty$. Sur chacun des trois intervalles de monotonie, $f$ continue change de signe : le théorème des valeurs intermédiaires donne une solution unique dans chacun.

## inflexion · numeric
En quelle abscisse la courbe de $f(x) = x^3 - 3x^2$ a-t-elle un point d'inflexion ?

= 1

> $f'(x) = 3x^2 - 6x$ et $f''(x) = 6x - 6$, qui s'annule en $x = 1$ en changeant de signe : $f$ est concave avant, convexe après. Annuler $f'$ donnerait les extremums ($x = 0$ et $x = 2$), pas l'inflexion.

## tangente-ln · expression
Écrivez l'équation réduite de la tangente à la courbe de $\ln$ au point d'abscisse $1$ : $y = \dots$

= $x-1$

> $y = \ln'(1)\,(x - 1) + \ln 1$ avec $\ln'(1) = \dfrac{1}{1} = 1$ et $\ln 1 = 0$ : $y = x - 1$. Comme $\ln$ est concave, sa courbe est sous cette tangente : $\ln x \leq x - 1$ pour tout $x > 0$.

## inequation-ln · single
Quel est l'ensemble des solutions de $\ln x < 2$ ?

- [x] $]0\,;e^2[$
- [ ] $]-\infty\,;e^2[$
- [ ] $]0\,;2[$
- [ ] $]e^2\,;+\infty[$

> $\ln$ n'est définie que sur $]0\,;+\infty[$, et elle y est strictement croissante : $\ln x < 2 \iff x < e^2$. Il ne faut pas oublier la condition $x > 0$.

## exp-equation-produit · single
Quelles sont les solutions de $(x - 2)\,e^{x} = 0$ ?

- [x] $x = 2$ seulement
- [ ] $x = 2$ et $x = 0$
- [ ] Aucune
- [ ] Tous les réels

> Un produit est nul si l'un de ses facteurs l'est. Mais $e^x > 0$ pour tout réel $x$ : seul $x - 2$ peut s'annuler. Confondre $e^0 = 1$ avec une valeur nulle mène à la mauvaise réponse $x = 0$.
