---
id: arithmetique-02
title: { fr: "Arithmétique : approfondissement" }
description: { fr: "Petit théorème de Fermat, restes de puissances, Bézout, équations diophantiennes, congruences, Euclide" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## fermat-reste · numeric
Quel est le reste de la division euclidienne de $3^{100}$ par 7 ?

= 4

> 7 est premier et ne divise pas 3 : par le petit théorème de Fermat, $3^6 \equiv 1 \pmod 7$. Comme $100 = 6 \times 16 + 4$, $3^{100} = (3^6)^{16} \times 3^4 \equiv 3^4 = 81 \pmod 7$, et $81 = 7 \times 11 + 4$.

## dernier-chiffre · numeric
Quel est le chiffre des unités de $7^{2026}$ ?

= 9

> On travaille modulo 10 : $7^1 \equiv 7$, $7^2 \equiv 9$, $7^3 \equiv 3$, $7^4 \equiv 1$. Les restes reviennent tous les 4 ; or $2026 = 4 \times 506 + 2$, donc $7^{2026} \equiv 7^2 \equiv 9 \pmod{10}$.

## bezout-coefficients · single
Quel couple $(u\,;v)$ vérifie $17\,u + 5\,v = 1$ ?

- [x] $(3\,;-10)$
- [ ] $(1\,;-3)$
- [ ] $(2\,;-7)$
- [ ] $(-3\,;10)$

> $17 \times 3 + 5 \times (-10) = 51 - 50 = 1$. On l'obtient en remontant l'algorithme d'Euclide : $17 = 3 \times 5 + 2$, $5 = 2 \times 2 + 1$, donc $1 = 5 - 2 \times 2 = 5 - 2(17 - 3 \times 5) = 7 \times 5 - 2 \times 17$ ; le couple $(-2\,;7)$ convient aussi. Il en existe une infinité.

## diophantienne · single
Quelles sont les solutions entières de $3x + 5y = 1$ ?

- [x] $x = 2 + 5k$ et $y = -1 - 3k$, pour $k$ entier
- [ ] $x = 2 + 3k$ et $y = -1 - 5k$, pour $k$ entier
- [ ] $x = 2$ et $y = -1$ seulement
- [ ] Il n'y en a pas

> $(2\,;-1)$ est une solution particulière. Si $3x + 5y = 1$, alors $3(x - 2) = -5(y + 1)$ ; 3 divise $5(y + 1)$ et est premier avec 5, donc, par le théorème de Gauss, il divise $y + 1$ : $y = -1 - 3k$, puis $x = 2 + 5k$. On vérifie : $3(2 + 5k) + 5(-1 - 3k) = 1$.

## consecutifs · single
Que vaut le PGCD de deux entiers consécutifs $n$ et $n + 1$ ($n \geq 1$) ?

- [x] Toujours 1
- [ ] Toujours 2
- [ ] $n$
- [ ] Cela dépend de $n$

> Un diviseur commun divise la différence $(n + 1) - n = 1$ : c'est 1. Autre preuve, par Bézout : $(n+1) \times 1 + n \times (-1) = 1$.

## diviseurs-360 · numeric
Combien l'entier $360$ a-t-il de diviseurs positifs ?

= 24

> $360 = 2^3 \times 3^2 \times 5$. Un diviseur s'écrit $2^a \times 3^b \times 5^c$ avec $0 \leq a \leq 3$, $0 \leq b \leq 2$, $0 \leq c \leq 1$ : $4 \times 3 \times 2 = 24$ diviseurs.

## congruence-equation · numeric
Quel est le plus petit entier naturel $x$ tel que $3x \equiv 2 \pmod 7$ ?

= 3

> On cherche l'inverse de 3 modulo 7 : $3 \times 5 = 15 \equiv 1$. En multipliant par 5 : $x \equiv 10 \equiv 3 \pmod 7$. Vérification : $3 \times 3 = 9 = 7 + 2$.

## gauss-application · single
L'entier 5 divise $3n$. Que peut-on en conclure ?

- [x] 5 divise $n$
- [ ] 5 divise 3
- [ ] $n = 5$
- [ ] Rien

> 5 divise le produit $3 \times n$ et il est premier avec 3 : par le théorème de Gauss, 5 divise $n$. Sans l'hypothèse « premier avec », la conclusion peut être fausse : 6 divise $4 \times 3$ sans diviser 4 ni 3.

## euclide · numeric
Quel est le PGCD de 252 et 198 ?

= 18

> Algorithme d'Euclide : $252 = 1 \times 198 + 54$, $198 = 3 \times 54 + 36$, $54 = 1 \times 36 + 18$, $36 = 2 \times 18 + 0$. Le dernier reste non nul est 18.

## carres-modulo-4 · single
Quels restes un carré d'entier peut-il avoir dans la division par 4 ?

- [x] 0 ou 1
- [ ] 0, 1, 2 ou 3
- [ ] 1 seulement
- [ ] 0 ou 2

> Un entier est pair, $n = 2k$ et $n^2 = 4k^2 \equiv 0$, ou impair, $n = 2k + 1$ et $n^2 = 4k^2 + 4k + 1 \equiv 1 \pmod 4$. Conséquence : un entier congru à 3 modulo 4 n'est jamais une somme de deux carrés.
