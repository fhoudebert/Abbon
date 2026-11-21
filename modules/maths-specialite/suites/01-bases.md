---
id: suites-01
title: { fr: "Suites : les bases" }
description: { fr: "Suites arithmétiques et géométriques, sommes, limites, récurrence" }
level: bases
tags: [maths, bac, prog-2019]
---

## terme-arithmetique · numeric
$(u_n)$ est la suite arithmétique de premier terme $u_0 = 3$ et de raison $r = 2$. Que vaut $u_{10}$ ?

= 23

> Pour une suite arithmétique, $u_n = u_0 + n\,r$, donc $u_{10} = 3 + 10 \times 2 = 23$. Erreur fréquente : compter 9 ou 11 pas au lieu de 10 entre $u_0$ et $u_{10}$.

## terme-geometrique · numeric
$(u_n)$ est la suite géométrique de premier terme $u_0 = 2$ et de raison $q = 3$. Que vaut $u_4$ ?

= 162

> Pour une suite géométrique, $u_n = u_0 \times q^n$, donc $u_4 = 2 \times 3^4 = 2 \times 81 = 162$.

## somme-arithmetique · single
Quelle formule donne la somme $S$ de termes consécutifs d'une suite arithmétique ?

- [x] $S = \text{nombre de termes} \times \dfrac{\text{premier terme} + \text{dernier terme}}{2}$
- [ ] $S = \text{premier terme} \times \dfrac{1 - \text{raison}^{\,\text{nombre de termes}}}{1 - \text{raison}}$
- [ ] $S = \dfrac{\text{premier terme} + \text{dernier terme}}{2}$
- [ ] $S = \text{nombre de termes} \times \text{raison}$

> On ajoute les termes deux à deux, le premier avec le dernier, le deuxième avec l'avant-dernier… : chaque paire a la même somme. La deuxième formule est celle d'une suite géométrique ; la troisième donne la moyenne des termes, pas leur somme.

## gauss · numeric
Que vaut $1 + 2 + 3 + \dots + 100$ ?

= 5050

> C'est la somme de 100 termes d'une suite arithmétique : $S = 100 \times \dfrac{1 + 100}{2} = 5050$. Plus généralement, $1 + 2 + \dots + n = \dfrac{n(n+1)}{2}$.

## somme-geometrique · single
$(u_n)$ est géométrique, de raison $q \neq 1$. Que vaut la somme des $n$ premiers termes, $u_0 + u_1 + \dots + u_{n-1}$ ?

- [x] $u_0\,\dfrac{1 - q^{n}}{1 - q}$
- [ ] $u_0\,\dfrac{1 - q^{n+1}}{1 - q}$
- [ ] $n\,\dfrac{u_0 + u_{n-1}}{2}$
- [ ] $n\,u_0\,q$

> À retenir : premier terme $\times \dfrac{1 - \text{raison}^{\,\text{nombre de termes}}}{1 - \text{raison}}$. De $u_0$ à $u_{n-1}$, il y a $n$ termes. L'exposant $n+1$ correspondrait à la somme de $u_0$ à $u_n$.

## limite-q-superieur · single
$(u_n)$ est géométrique, de raison $q > 1$ et de premier terme $u_0 < 0$. Quelle est sa limite ?

- [x] $-\infty$
- [ ] $+\infty$
- [ ] $0$
- [ ] Elle n'a pas de limite

> $u_n = u_0 \times q^n$. Comme $q > 1$, $\lim\limits_{n \to +\infty} q^n = +\infty$ ; multiplié par $u_0 < 0$, le produit tend vers $-\infty$. Le signe du premier terme décide du signe de la limite.

## limite-q-inferieur · single
$(u_n)$ est géométrique, de raison $q$ telle que $-1 < q < 1$, et de premier terme $u_0 > 0$. Quelle est sa limite ?

- [x] $0$
- [ ] $u_0$
- [ ] $+\infty$
- [ ] Elle n'a pas de limite

> Si $|q| < 1$, alors $\lim\limits_{n \to +\infty} q^n = 0$, donc $u_n = u_0 \times q^n$ tend vers 0, quel que soit $u_0$. Avec $q$ négatif, les termes changent de signe mais se rapprochent quand même de 0.

## recurrence · single
Comment se construit un raisonnement par récurrence pour démontrer qu'une propriété $P(n)$ est vraie pour tout entier $n \geq 0$ ?

- [x] On montre $P(0)$, puis que, pour tout $n$, $P(n)$ vraie entraîne $P(n+1)$ vraie
- [ ] On vérifie $P(0)$, $P(1)$ et $P(2)$ : cela suffit
- [ ] On suppose $P(n)$ vraie pour tout $n$, puis on vérifie $P(0)$
- [ ] On montre que $P(n+1)$ entraîne $P(n)$

> Ce sont l'initialisation et l'hérédité : la propriété se transmet d'un rang au suivant, comme une rangée de dominos. Vérifier quelques cas ne démontre rien ; supposer la propriété vraie pour tout $n$, c'est supposer ce qu'on veut démontrer.

## monotone-bornee · single
Une suite est croissante et majorée par 5. Que peut-on en conclure ?

- [x] Elle converge, vers une limite inférieure ou égale à 5
- [ ] Elle converge vers 5
- [ ] Elle tend vers $+\infty$
- [ ] Elle est constante

> C'est le théorème de la limite monotone. La limite est au plus égale à 5, mais pas forcément égale à 5 : la suite $u_n = 1 - \dfrac{1}{n+1}$ est croissante, majorée par 5, et converge vers 1.

## moins-un · single
Quelle est la limite de la suite $u_n = (-1)^n$ ?

- [x] Elle n'a pas de limite
- [ ] $0$
- [ ] $1$
- [ ] $-1$

> Les termes valent alternativement 1 et −1 : ils ne se rapprochent d'aucune valeur. C'est la suite géométrique de raison $q = -1$, cas limite où $q^n$ ne converge pas.
