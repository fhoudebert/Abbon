## Divisibilité et division euclidienne

- $b$ divise $a$ s'il existe un entier $k$ tel que $a = k\,b$. Si $c$ divise $a$ et $b$, il divise toute combinaison $a\,u + b\,v$.
- **Division euclidienne** de $a$ par $b > 0$ : un unique couple $(q, r)$ avec $a = b\,q + r$ et $0 \leq r < b$.

## Congruences

- $a \equiv b \pmod n$ si $n$ divise $a - b$, c'est-à-dire si $a$ et $b$ ont le même reste dans la division par $n$.
- Compatibles avec l'addition, la multiplication et les puissances : si $a \equiv b$, alors $a^k \equiv b^k \pmod n$.
- Méthode : trouver une puissance qui vaut 1, par exemple $2^3 = 8 \equiv 1 \pmod 7$, puis écrire $2^{10} = (2^3)^3 \times 2 \equiv 2 \pmod 7$.
- Un entier est congru à la somme de ses chiffres modulo 9 (et modulo 3).

## PGCD, PPCM

- **Algorithme d'Euclide** : $\mathrm{PGCD}(a, b) = \mathrm{PGCD}(b, r)$, où $r$ est le reste de $a$ par $b$ ; le dernier reste non nul est le PGCD.
- $\mathrm{PGCD}(a, b) \times \mathrm{PPCM}(a, b) = a\,b$ pour $a$ et $b$ positifs.
- $a$ et $b$ sont **premiers entre eux** si $\mathrm{PGCD}(a, b) = 1$.

## Théorèmes

- **Bézout** : $a$ et $b$ sont premiers entre eux si et seulement s'il existe des entiers $u$ et $v$ tels que $a\,u + b\,v = 1$. Plus généralement, il existe $u$, $v$ tels que $a\,u + b\,v = \mathrm{PGCD}(a, b)$.
- **Gauss** : si $a$ divise $b\,c$ et que $a$ est premier avec $b$, alors $a$ divise $c$.
- Corollaire : si $a$ et $b$ sont premiers entre eux et divisent tous deux $n$, alors $a\,b$ divise $n$.
- **Équation $a\,x + b\,y = c$** : une solution particulière (Bézout, Euclide remonté), puis Gauss donne toutes les autres. Pour $3x + 5y = 1$ : $x = 2 + 5k$, $y = -1 - 3k$, $k$ entier.

## Nombres premiers

- Un nombre premier a exactement deux diviseurs : 1 et lui-même (1 n'est pas premier). Il y en a une infinité.
- Tout entier $n \geq 2$ se décompose de façon unique en produit de facteurs premiers.
- Pour tester $n$, il suffit d'essayer les nombres premiers inférieurs ou égaux à $\sqrt{n}$.
- **Petit théorème de Fermat** : si $p$ est premier et ne divise pas $a$, alors $a^{p-1} \equiv 1 \pmod p$.

## Pièges classiques

- Appliquer Gauss sans vérifier que $a$ est premier avec $b$.
- Confondre « premiers entre eux » et « premiers » : 8 et 15 sont premiers entre eux.
- Oublier que le reste doit vérifier $0 \leq r < b$, y compris pour un $a$ négatif.
