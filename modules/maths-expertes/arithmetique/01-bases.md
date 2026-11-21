---
id: arithmetique-01
title: { fr: "Arithmétique : les bases" }
description: { fr: "Divisibilité, division euclidienne, congruences, PGCD, Bézout, Gauss, nombres premiers" }
level: bases
tags: [maths, expertes, prog-2019]
---

## pgcd · single
Quel est le PGCD de 84 et 126 ?

- [x] 42
- [ ] 14
- [ ] 21
- [ ] 84

> Par l'algorithme d'Euclide : $126 = 1 \times 84 + 42$, puis $84 = 2 \times 42 + 0$. Le dernier reste non nul est 42. Ou par les facteurs premiers : $84 = 2^2 \times 3 \times 7$, $126 = 2 \times 3^2 \times 7$, d'où $2 \times 3 \times 7 = 42$.

## reste-puissance · numeric
Quel est le reste de la division euclidienne de $2^{10}$ par 7 ?

= 2

> $2^3 = 8 \equiv 1 \pmod 7$, donc $2^{9} = (2^3)^3 \equiv 1$, et $2^{10} = 2^9 \times 2 \equiv 2 \pmod 7$. Vérification : $2^{10} = 1024 = 7 \times 146 + 2$.

## reste-division · numeric
Quel est le reste de la division euclidienne de 2026 par 9 ?

= 1

> $2026 = 9 \times 225 + 1$. Raccourci : un entier est congru à la somme de ses chiffres modulo 9, et $2 + 0 + 2 + 6 = 10 \equiv 1 \pmod 9$.

## congruence · single
Que signifie $a \equiv b \pmod n$ ?

- [x] $n$ divise $a - b$
- [ ] $a$ et $b$ sont tous deux divisibles par $n$
- [ ] $a = n\,b$
- [ ] $a + b$ est un multiple de $n$

> $a$ et $b$ ont le même reste dans la division euclidienne par $n$, ce qui revient à dire que $n$ divise $a - b$. Par exemple, $17 \equiv 2 \pmod 5$, car $17 - 2 = 15$.

## bezout · single
Que dit le théorème de Bézout, pour deux entiers $a$ et $b$ ?

- [x] $a$ et $b$ sont premiers entre eux si et seulement s'il existe des entiers $u$ et $v$ tels que $a\,u + b\,v = 1$
- [ ] $a$ et $b$ sont premiers entre eux si et seulement si $a$ et $b$ sont premiers
- [ ] Il existe toujours des entiers $u$ et $v$ tels que $a\,u + b\,v = 1$
- [ ] $a$ et $b$ sont premiers entre eux si et seulement si $a\,b = 1$

> « Premiers entre eux » signifie que leur PGCD vaut 1 : 8 et 15 le sont sans être premiers. Les coefficients $u$ et $v$ s'obtiennent en remontant l'algorithme d'Euclide. Si $a$ et $b$ ont un diviseur commun $d > 1$, $a\,u + b\,v$ est un multiple de $d$ et ne peut pas valoir 1.

## gauss · single
$a$ divise $b\,c$, et $a$ est premier avec $b$. Que peut-on en conclure ?

- [x] $a$ divise $c$
- [ ] $a$ divise $b$
- [ ] $b$ divise $c$
- [ ] $a = c$

> C'est le théorème de Gauss. L'hypothèse « premier avec $b$ » est indispensable : 6 divise $4 \times 3 = 12$, mais ne divise ni 4 ni 3, car 6 n'est premier ni avec 4 ni avec 3.

## ppcm · numeric
Quel est le PPCM de 4 et 6 ?

= 12

> Les multiples de 4 sont 4, 8, 12… ; ceux de 6 sont 6, 12… : le plus petit commun est 12. On a toujours $\mathrm{PGCD}(a, b) \times \mathrm{PPCM}(a, b) = a\,b$ : $2 \times 12 = 24 = 4 \times 6$.

## premier · single
Lequel de ces entiers est premier ?

- [x] 97
- [ ] 91
- [ ] 87
- [ ] 1

> Pour tester 97, il suffit d'essayer les nombres premiers jusqu'à $\sqrt{97} \approx 9,8$ : 2, 3, 5 et 7 ne le divisent pas. $91 = 7 \times 13$ et $87 = 3 \times 29$. 1 n'est pas premier : un nombre premier a exactement deux diviseurs.

## nombre-diviseurs · numeric
Combien l'entier 36 a-t-il de diviseurs positifs ?

= 9

> $36 = 2^2 \times 3^2$ : un diviseur s'écrit $2^a \times 3^b$ avec $a$ et $b$ entre 0 et 2, soit $3 \times 3 = 9$ diviseurs : 1, 2, 3, 4, 6, 9, 12, 18, 36.

## division-negatif · numeric
Quel est le reste de la division euclidienne de $-17$ par 5 ?

= 3

> On cherche $-17 = 5q + r$ avec $0 \leq r < 5$ : $q = -4$ et $r = 3$, car $5 \times (-4) + 3 = -17$. Le reste n'est jamais négatif : $-2$ ne convient pas.
