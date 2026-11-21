---
id: arithmetique-03
title: { fr: "Arithmétique : niveau expert" }
description: { fr: "Restes de grandes puissances, inverse modulo, équations diophantiennes, divisibilité de produits d'entiers consécutifs, restes chinois" }
level: expert
tags: [maths, bac, prog-2019]
---

## reste-periodique · numeric
Quel est le reste de la division euclidienne de $2^{2026}$ par 7 ?

= 2

> $2^3 = 8 \equiv 1 \pmod 7$ : les restes des puissances de 2 se répètent avec une période 3. Comme $2026 = 3 \times 675 + 1$, $2^{2026} = (2^3)^{675} \times 2 \equiv 2 \pmod 7$.

## fermat-13 · numeric
Quel est le reste de la division euclidienne de $5^{2026}$ par 13 ?

= 12

> On remarque $5^2 = 25 \equiv -1 \pmod{13}$, donc $5^4 \equiv 1$. Comme $2026 = 4 \times 506 + 2$, $5^{2026} \equiv 5^2 \equiv -1 \equiv 12 \pmod{13}$. Le petit théorème de Fermat ($5^{12} \equiv 1$) marche aussi, mais trouver une période plus courte allège les calculs. Un reste est positif : $-1$ s'écrit 12.

## deux-derniers-chiffres · numeric
Quel nombre forment les deux derniers chiffres de $7^{100}$ ?

= 1

> On travaille modulo 100 : $7^2 = 49$, $7^4 = 2401 \equiv 1 \pmod{100}$. Donc $7^{100} = (7^4)^{25} \equiv 1 \pmod{100}$ : $7^{100}$ se termine par 01.

## inverse-modulo · numeric
Résolvez $7x \equiv 3 \pmod{10}$, avec $0 \leq x \leq 9$.

= 9

> $7 \times 3 = 21 \equiv 1 \pmod{10}$ : 3 est un inverse de 7 modulo 10. En multipliant par 3 : $x \equiv 9 \pmod{10}$. Vérification : $7 \times 9 = 63 \equiv 3$. L'inverse existe parce que $\mathrm{PGCD}(7, 10) = 1$.

## diophantienne-generale · single
Quelles sont les solutions entières de $11x + 7y = 1$ ?

- [x] $x = 2 + 7k$ et $y = -3 - 11k$, $k \in \mathbb{Z}$
- [ ] $x = 2 + 11k$ et $y = -3 - 7k$, $k \in \mathbb{Z}$
- [ ] $x = 2$ et $y = -3$ seulement
- [ ] Il n'y en a pas

> $(2\,;-3)$ est solution particulière : $22 - 21 = 1$. Par différence, $11(x - 2) = -7(y + 3)$ ; 11 et 7 étant premiers entre eux, le théorème de Gauss donne $7 \mid x - 2$, soit $x = 2 + 7k$, puis $y = -3 - 11k$. Les coefficients s'échangent : c'est le piège.

## pgcd-ppcm · numeric
Deux entiers naturels $a$ et $b$ ont pour PGCD 12 et pour PPCM 360. Si $a = 36$, que vaut $b$ ?

= 120

> Pour deux entiers naturels, $\mathrm{PGCD}(a, b) \times \mathrm{PPCM}(a, b) = a \times b$, donc $b = \dfrac{12 \times 360}{36} = 120$. Vérification : $36 = 12 \times 3$ et $120 = 12 \times 10$, avec 3 et 10 premiers entre eux, et $12 \times 3 \times 10 = 360$.

## pgcd-expressions · single
Que vaut $\mathrm{PGCD}(2n + 1,\, 3n + 1)$ pour tout entier naturel $n$ ?

- [x] 1
- [ ] 2
- [ ] $n$
- [ ] Cela dépend de $n$

> $3(2n + 1) - 2(3n + 1) = 1$ : tout diviseur commun divise 1. C'est une relation de Bézout, donc les deux nombres sont premiers entre eux, pour tout $n$.

## trois-consecutifs · single
Pourquoi $n^3 - n$ est-il divisible par 6 pour tout entier $n$ ?

- [x] $n^3 - n = (n - 1)\,n\,(n + 1)$ est un produit de trois entiers consécutifs
- [ ] Parce que $n^3$ et $n$ sont de même parité
- [ ] Parce que 6 divise $n^3$
- [ ] Ce n'est vrai que pour $n$ pair

> Parmi trois entiers consécutifs, l'un est pair et l'un est multiple de 3 ; 2 et 3 étant premiers entre eux, 6 divise le produit. La parité seule ne donne que la divisibilité par 2.

## premier-carre-plus-2 · numeric
Pour quel nombre premier $p$ le nombre $p^2 + 2$ est-il aussi premier ?

= 3

> Si $p \neq 3$, $p$ n'est pas multiple de 3, donc $p \equiv \pm 1 \pmod 3$ et $p^2 \equiv 1$ : $p^2 + 2 \equiv 0 \pmod 3$, et comme $p^2 + 2 > 3$, il n'est pas premier. Reste $p = 3$ : $3^2 + 2 = 11$ est premier.

## restes-chinois · numeric
Quel est le plus petit entier naturel $n$ qui a pour reste 2 dans la division par 3, 3 dans la division par 5 et 2 dans la division par 7 ?

= 23

> Les deux premières conditions donnent $n \equiv 8 \pmod{15}$ (on teste 2, 5, 8 : seul 8 a pour reste 3 modulo 5). On cherche ensuite parmi $8, 23, 38, \dots$ : $23 = 7 \times 3 + 2$ convient. Les solutions sont les $23 + 105k$, car 3, 5 et 7 sont premiers entre eux deux à deux.
