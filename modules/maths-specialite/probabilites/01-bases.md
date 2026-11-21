---
id: probabilites-01
title: { fr: "Dénombrement et probabilités : les bases" }
description: { fr: "Dénombrement, loi binomiale, conditionnement, indépendance" }
level: bases
tags: [maths, bac, prog-2019]
---

## trois-lancers · single
Une pièce équilibrée est lancée 3 fois. Quelle est la probabilité d'obtenir exactement 2 fois « pile » ?

- [x] $\dfrac{3}{8}$
- [ ] $\dfrac{1}{8}$
- [ ] $\dfrac{2}{3}$
- [ ] $\dfrac{1}{4}$

> Il y a $2^3 = 8$ issues équiprobables, dont 3 favorables : PPF, PFP, FPP. Avec la loi binomiale $\mathcal{B}(3\,;0,5)$ : $\dbinom{3}{2} \times 0,5^2 \times 0,5 = \dfrac{3}{8}$.

## binomiale · single
$X$ suit la loi binomiale $\mathcal{B}(n\,;p)$. Que vaut $P(X = k)$ ?

- [x] $\dbinom{n}{k}\,p^k\,(1-p)^{n-k}$
- [ ] $p^k\,(1-p)^{n-k}$
- [ ] $\dbinom{n}{k}\,p^{n-k}\,(1-p)^{k}$
- [ ] $k\,p$

> $p^k(1-p)^{n-k}$ est la probabilité d'une issue précise comptant $k$ succès ; $\dbinom{n}{k}$ compte le nombre de ces issues, c'est-à-dire le nombre de façons de placer les $k$ succès parmi les $n$ épreuves.

## esperance-binomiale · numeric
$X$ suit la loi binomiale $\mathcal{B}(20\,;0,3)$. Que vaut l'espérance $E(X)$ ?

= 6

> Pour une loi binomiale, $E(X) = n\,p = 20 \times 0,3 = 6$ : sur un grand nombre de répétitions, on obtient en moyenne 6 succès. La variance vaut $n\,p\,(1-p) = 4,2$.

## au-moins-un · numeric
On lance deux dés équilibrés à six faces. Quelle est la probabilité d'obtenir au moins un 6 ? Donnez une valeur décimale arrondie au millième.

= 0,306 ± 0,001

> On passe par l'événement contraire, « aucun 6 » : $P = 1 - \left(\dfrac{5}{6}\right)^2 = 1 - \dfrac{25}{36} = \dfrac{11}{36} \approx 0,306$. Additionner $\dfrac{1}{6} + \dfrac{1}{6}$ compterait deux fois le double 6.

## combinaisons · numeric
Combien de façons y a-t-il de choisir 2 élèves parmi 5 pour former un binôme, sans tenir compte de l'ordre ?

= 10

> C'est le nombre de combinaisons $\dbinom{5}{2} = \dfrac{5 \times 4}{2} = 10$. Si l'ordre comptait (un rapporteur, un secrétaire), il y en aurait $5 \times 4 = 20$.

## permutations · numeric
De combien de façons peut-on ranger 4 livres différents sur une étagère ?

= 24

> 4 choix pour la première place, 3 pour la deuxième, 2 pour la troisième, 1 pour la dernière : $4! = 4 \times 3 \times 2 \times 1 = 24$ permutations.

## conditionnelle · single
$A$ est un événement de probabilité non nulle. Que vaut la probabilité de $B$ sachant $A$ ?

- [x] $P_A(B) = \dfrac{P(A \cap B)}{P(A)}$
- [ ] $P_A(B) = \dfrac{P(A \cap B)}{P(B)}$
- [ ] $P_A(B) = P(A) \times P(B)$
- [ ] $P_A(B) = P(B) - P(A)$

> On se place dans l'univers réduit à $A$ : on divise par $P(A)$. Sur un arbre pondéré, $P(A \cap B) = P(A) \times P_A(B)$ : on multiplie les probabilités le long d'un chemin. $\dfrac{P(A \cap B)}{P(B)}$ est $P_B(A)$.

## independance · single
Quand deux événements $A$ et $B$ sont-ils indépendants ?

- [x] Quand $P(A \cap B) = P(A) \times P(B)$
- [ ] Quand $P(A \cap B) = 0$
- [ ] Quand $P(A) + P(B) = 1$
- [ ] Quand $P(A) = P(B)$

> Si $P(A) \neq 0$, cela revient à $P_A(B) = P(B)$ : savoir que $A$ est réalisé ne change rien à la probabilité de $B$. $P(A \cap B) = 0$ signifie que $A$ et $B$ sont incompatibles, ce qui est très différent : deux événements incompatibles de probabilités non nulles ne sont jamais indépendants.

## contraire · numeric
On donne $P(A) = 0,3$. Que vaut $P(\overline{A})$ ?

= 0,7

> L'événement contraire $\overline{A}$ se réalise exactement quand $A$ ne se réalise pas : $P(\overline{A}) = 1 - P(A) = 0,7$.

## reunion · numeric
On donne $P(A) = 0,5$, $P(B) = 0,4$ et $P(A \cap B) = 0,1$. Que vaut $P(A \cup B)$ ?

= 0,8

> $P(A \cup B) = P(A) + P(B) - P(A \cap B) = 0,5 + 0,4 - 0,1 = 0,8$. On retire l'intersection, comptée deux fois dans la somme. Si $A$ et $B$ étaient incompatibles, on aurait simplement $P(A) + P(B)$.
