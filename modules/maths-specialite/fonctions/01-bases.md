---
id: fonctions-01
title: { fr: "Dérivation, logarithme, exponentielle : les bases" }
description: { fr: "Dérivées usuelles, tangente, convexité, propriétés de ln et de exp" }
level: bases
tags: [maths, bac, prog-2019]
---

## derivee-quotient · single
$u$ et $v$ sont dérivables, et $v$ ne s'annule pas. Que vaut $\left(\dfrac{u}{v}\right)'$ ?

- [x] $\dfrac{u'v - uv'}{v^2}$
- [ ] $\dfrac{u'v + uv'}{v^2}$
- [ ] $\dfrac{u'}{v'}$
- [ ] $\dfrac{uv' - u'v}{v^2}$

> L'ordre compte au numérateur : $u'v$ d'abord, moins $uv'$. Cas particulier : $\left(\dfrac{1}{v}\right)' = -\dfrac{v'}{v^2}$. Le signe $+$ est celui de la dérivée d'un produit, $(uv)' = u'v + uv'$.

## derivee-puissance · single
$u$ est dérivable et $n \geq 1$ est un entier. Que vaut $(u^n)'$ ?

- [x] $n\,u'\,u^{n-1}$
- [ ] $n\,u^{n-1}$
- [ ] $u'\,u^{n}$
- [ ] $n\,u'\,u^{n+1}$

> C'est la dérivée de la fonction puissance, $(x^n)' = n\,x^{n-1}$, multipliée par la dérivée $u'$ de la fonction intérieure. Par exemple, $\big((2x+1)^3\big)' = 3 \times 2 \times (2x+1)^2 = 6(2x+1)^2$. Oublier le facteur $u'$ est l'erreur la plus fréquente.

## tangente · single
Quelle est l'équation de la tangente à la courbe de $f$ au point d'abscisse $a$ ?

- [x] $y = f'(a)\,(x - a) + f(a)$
- [ ] $y = f'(a)\,x\,(x - a) + f(a)$
- [ ] $y = f(a)\,(x - a) + f'(a)$
- [ ] $y = f'(x)\,(x - a) + f(a)$

> La tangente est la droite qui passe par le point $(a\,;\,f(a))$ et dont le coefficient directeur est le nombre dérivé $f'(a)$. Dans l'équation n'apparaissent que des nombres fixés, $f(a)$ et $f'(a)$, et la variable $x$ au premier degré : une tangente est une droite.

## ln-un · numeric
Que vaut $\ln 1$ ?

= 0

> $\ln 1 = 0$, car $e^0 = 1$. En revanche, $\ln 0$ n'existe pas : $\ln$ n'est définie que sur $]0\,;+\infty[$, et $\lim\limits_{x \to 0^+} \ln x = -\infty$.

## ln-puissance · single
Pour $a > 0$ et $p$ entier, que vaut $\ln\left(a^p\right)$ ?

- [x] $p \ln a$
- [ ] $(\ln a)^p$
- [ ] $\ln p + \ln a$
- [ ] $a \ln p$

> Le logarithme transforme les produits en sommes, $\ln(ab) = \ln a + \ln b$, donc les puissances en produits : $\ln(a^p) = p\ln a$. Attention à l'écriture : $(\ln a)^p$ est une autre quantité.

## derivee-ln · single
Quelle est la dérivée de $x \mapsto \ln x$ sur $]0\,;+\infty[$ ?

- [x] $x \mapsto \dfrac{1}{x}$
- [ ] $x \mapsto \ln x$
- [ ] $x \mapsto e^x$
- [ ] $x \mapsto -\dfrac{1}{x^2}$

> $(\ln x)' = \dfrac{1}{x}$, et plus généralement $(\ln u)' = \dfrac{u'}{u}$ pour $u$ strictement positive. C'est $\exp$ qui est sa propre dérivée ; $-\dfrac{1}{x^2}$ est la dérivée de $\dfrac{1}{x}$.

## exp-zero · numeric
Que vaut $e^0$ ?

= 1

> Toute puissance d'exposant nul vaut 1 : $e^0 = 1$. C'est le point $(0\,;1)$ par lequel passe la courbe de l'exponentielle, où la tangente a pour équation $y = x + 1$.

## exp-limite · single
Quelle est la limite de $e^x$ quand $x$ tend vers $-\infty$ ?

- [x] $0$
- [ ] $-\infty$
- [ ] $1$
- [ ] $+\infty$

> L'exponentielle est strictement positive et croissante : quand $x \to -\infty$, elle se rapproche de 0 sans jamais l'atteindre. L'axe des abscisses est une asymptote horizontale de sa courbe. En $+\infty$, elle tend vers $+\infty$.

## exp-produit · single
Pour tous réels $a$ et $b$, à quoi est égal $e^a \times e^b$ ?

- [x] $e^{a+b}$
- [ ] $e^{ab}$
- [ ] $e^a + e^b$
- [ ] $e^{a-b}$

> L'exponentielle transforme les sommes en produits : $e^{a+b} = e^a \times e^b$, et $\dfrac{e^a}{e^b} = e^{a-b}$, $(e^a)^n = e^{na}$. C'est la relation inverse de $\ln(ab) = \ln a + \ln b$.

## convexite · single
$f$ est deux fois dérivable sur un intervalle $I$. À quelle condition est-elle convexe sur $I$ ?

- [x] $f'' \geq 0$ sur $I$
- [ ] $f' \geq 0$ sur $I$
- [ ] $f \geq 0$ sur $I$
- [ ] $f''$ s'annule sur $I$

> $f$ est convexe quand $f'$ est croissante, c'est-à-dire quand $f'' \geq 0$ : sa courbe est alors au-dessus de ses tangentes. $f' \geq 0$ signifie que $f$ est croissante, ce qui n'a rien à voir. Un point où $f''$ s'annule en changeant de signe est un point d'inflexion.
