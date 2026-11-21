---
id: matrices-graphes-01
title: { fr: "Matrices et graphes : les bases" }
description: { fr: "Calcul matriciel, déterminant, graphes, matrice d'adjacence, chaînes de Markov" }
level: bases
tags: [maths, expertes, prog-2019]
---

## determinant · numeric
Quel est le déterminant de la matrice $A = \begin{pmatrix} 2 & 3 \\ 1 & 4 \end{pmatrix}$ ?

= 5

> Pour une matrice $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$, le déterminant vaut $ad - bc$ : $2 \times 4 - 3 \times 1 = 5$.

## inversible · single
À quelle condition une matrice carrée de taille 2 est-elle inversible ?

- [x] Son déterminant est non nul
- [ ] Son déterminant est nul
- [ ] Tous ses coefficients sont non nuls
- [ ] Elle est égale à sa transposée

> Si $\det A = ad - bc \neq 0$, alors $A^{-1} = \dfrac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$. La matrice $\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}$ n'a que des coefficients non nuls, mais son déterminant est nul : elle n'est pas inversible.

## produit-taille · single
$A$ est une matrice de taille $2 \times 3$ et $B$ de taille $3 \times 4$. Quelle est la taille de $A\,B$ ?

- [x] $2 \times 4$
- [ ] $3 \times 3$
- [ ] $4 \times 2$
- [ ] Le produit n'est pas défini

> Le produit $A\,B$ existe quand le nombre de colonnes de $A$ égale le nombre de lignes de $B$ (ici 3) ; il a le nombre de lignes de $A$ et le nombre de colonnes de $B$. $B\,A$, lui, n'est pas défini : 4 colonnes pour 2 lignes.

## commutativite · single
$A$ et $B$ sont deux matrices carrées de même taille. A-t-on toujours $A\,B = B\,A$ ?

- [x] Non : le produit de matrices n'est pas commutatif en général
- [ ] Oui, toujours
- [ ] Oui, pour les matrices de taille 2

> Contre-exemple : avec $A = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ et $B = \begin{pmatrix} 0 & 0 \\ 1 & 0 \end{pmatrix}$, $A\,B = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}$ mais $B\,A = \begin{pmatrix} 0 & 0 \\ 0 & 1 \end{pmatrix}$. D'où l'attention à l'ordre : $(A\,B)^2 \neq A^2B^2$ en général.

## arbre · single
Un graphe connexe a 8 sommets et 7 arêtes. Que peut-on affirmer ?

- [x] C'est un arbre : il n'a aucun cycle
- [ ] C'est un graphe complet
- [ ] Il possède nécessairement un cycle
- [ ] Il n'est pas connexe

> Un graphe connexe à $n$ sommets a au moins $n - 1$ arêtes, et il en a exactement $n - 1$ si et seulement s'il est sans cycle : c'est un arbre. Un graphe complet à 8 sommets aurait $\dfrac{8 \times 7}{2} = 28$ arêtes.

## degres · numeric
Un graphe a 5 arêtes. Quelle est la somme des degrés de ses sommets ?

= 10

> Chaque arête relie deux sommets : elle compte pour 1 dans le degré de chacun. La somme des degrés est donc le double du nombre d'arêtes. Conséquence : le nombre de sommets de degré impair est toujours pair.

## adjacence · single
$M$ est la matrice d'adjacence d'un graphe. Que donne le coefficient de la ligne $i$ et de la colonne $j$ de $M^n$ ?

- [x] Le nombre de chaînes de longueur $n$ qui vont du sommet $i$ au sommet $j$
- [ ] La distance entre les sommets $i$ et $j$
- [ ] Le nombre d'arêtes du graphe
- [ ] Le degré du sommet $i$ multiplié par $n$

> $M^2$ compte les chaînes de longueur 2, $M^3$ celles de longueur 3, et ainsi de suite. On s'en sert pour savoir si deux sommets sont reliés en au plus $n$ étapes.

## markov · single
Dans la matrice de transition d'une chaîne de Markov (une ligne par état de départ), que vaut la somme des coefficients de chaque ligne ?

- [x] 1
- [ ] 0
- [ ] Le nombre d'états
- [ ] Elle dépend de la ligne

> Chaque ligne donne les probabilités de passer de l'état de départ à chacun des états possibles : leur somme vaut 1. Si $\pi_n$ est la distribution (en ligne) à l'étape $n$, alors $\pi_{n+1} = \pi_n\,P$.
