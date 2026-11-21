---
id: matrices-graphes-02
title: { fr: "Matrices et graphes : approfondissement" }
description: { fr: "Inverse et systèmes, puissances de matrices, suites matricielles, chaînes de Markov, chemins dans un graphe" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## inverse · single
Quelle est l'inverse de $A = \begin{pmatrix} 2 & 1 \\ 5 & 3 \end{pmatrix}$ ?

- [x] $\begin{pmatrix} 3 & -1 \\ -5 & 2 \end{pmatrix}$
- [ ] $\begin{pmatrix} 2 & 5 \\ 1 & 3 \end{pmatrix}$
- [ ] $\begin{pmatrix} -3 & 1 \\ 5 & -2 \end{pmatrix}$
- [ ] $A$ n'est pas inversible

> $\det A = 2 \times 3 - 1 \times 5 = 1 \neq 0$, donc $A^{-1} = \dfrac{1}{1}\begin{pmatrix} 3 & -1 \\ -5 & 2 \end{pmatrix}$ : on échange les coefficients diagonaux et on change le signe des deux autres. Vérification : $A\,A^{-1} = I_2$.

## systeme · single
Quelle est la solution du système $\begin{cases} 2x + y = 5 \\ 5x + 3y = 13 \end{cases}$ ?

- [x] $x = 2$ et $y = 1$
- [ ] $x = 1$ et $y = 2$
- [ ] $x = 3$ et $y = -1$
- [ ] Il n'y en a pas

> Le système s'écrit $A\,X = B$, avec la matrice $A$ inversible de la question précédente : $X = A^{-1}B = \begin{pmatrix} 3 \times 5 - 13 \\ -5 \times 5 + 2 \times 13 \end{pmatrix} = \begin{pmatrix} 2 \\ 1 \end{pmatrix}$. Vérification : $4 + 1 = 5$ et $10 + 3 = 13$.

## puissance-matrice · expression
On pose $T = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$. On admet que $T^n = \begin{pmatrix} 1 & a_n \\ 0 & 1 \end{pmatrix}$. Écrivez $a_n$ en fonction de $n$.

= $n$

> $T^{n+1} = T^n\,T = \begin{pmatrix} 1 & a_n + 1 \\ 0 & 1 \end{pmatrix}$ : $a_{n+1} = a_n + 1$ avec $a_1 = 1$, donc $a_n = n$ (une récurrence le démontre). Les puissances d'une matrice ne s'obtiennent pas en élevant chaque coefficient à la puissance $n$.

## diagonale · single
$D = \begin{pmatrix} 2 & 0 \\ 0 & 0,5 \end{pmatrix}$ est diagonale. Que vaut $D^n$ ?

- [x] $\begin{pmatrix} 2^n & 0 \\ 0 & 0,5^n \end{pmatrix}$
- [ ] $\begin{pmatrix} 2n & 0 \\ 0 & 0,5\,n \end{pmatrix}$
- [ ] $\begin{pmatrix} 2^n & 0,5^n \\ 0,5^n & 2^n \end{pmatrix}$
- [ ] $2^n \times 0,5^n\,I_2$

> Pour une matrice diagonale, on élève chaque coefficient diagonal à la puissance $n$. D'où l'intérêt d'écrire $A = P\,D\,P^{-1}$ : alors $A^n = P\,D^n\,P^{-1}$, facile à calculer.

## point-fixe · single
Une suite de matrices colonnes vérifie $U_{n+1} = A\,U_n + B$. Comment trouve-t-on la matrice $C$ telle que $C = A\,C + B$, lorsque $I - A$ est inversible ?

- [x] $C = (I - A)^{-1}\,B$
- [ ] $C = B\,(I - A)^{-1}$
- [ ] $C = A^{-1}\,B$
- [ ] $C = B - A$

> $C = A\,C + B \iff C - A\,C = B \iff (I - A)\,C = B \iff C = (I - A)^{-1}B$, en multipliant **à gauche** par l'inverse. Ensuite $V_n = U_n - C$ vérifie $V_{n+1} = A\,V_n$, donc $V_n = A^n\,V_0$.

## markov-etape · numeric
Une chaîne de Markov à deux états a pour matrice de transition $P = \begin{pmatrix} 0,9 & 0,1 \\ 0,5 & 0,5 \end{pmatrix}$. Partant de l'état 1, quelle est la probabilité d'être dans l'état 1 après deux étapes ?

= 0,86

> $\pi_0 = (1\;\;0)$, $\pi_1 = \pi_0\,P = (0,9\;\;0,1)$, $\pi_2 = \pi_1\,P = (0,9 \times 0,9 + 0,1 \times 0,5\;\;\dots) = (0,86\;\;0,14)$. Les distributions s'écrivent en ligne et se multiplient à droite par $P$.

## markov-invariante · numeric
Avec la même matrice $P$, quelle est la première composante de la distribution invariante (valeur approchée à $0,001$ près) ?

= 0,833 ± 0,001

> On cherche $\pi = (a\;\;b)$ avec $\pi\,P = \pi$ et $a + b = 1$ : $a = 0,9\,a + 0,5\,b$, soit $0,1\,a = 0,5\,b$, donc $a = 5b$, puis $a = \dfrac{5}{6} \approx 0,833$ et $b = \dfrac{1}{6}$. À long terme, la chaîne passe environ 83 % du temps dans l'état 1.

## chemins-longueur-2 · numeric
Le graphe complet à 3 sommets (un triangle) a pour matrice d'adjacence $M = \begin{pmatrix} 0 & 1 & 1 \\ 1 & 0 & 1 \\ 1 & 1 & 0 \end{pmatrix}$. Combien de chaînes de longueur 2 vont d'un sommet à lui-même ?

= 2

> C'est le coefficient diagonal de $M^2 = \begin{pmatrix} 2 & 1 & 1 \\ 1 & 2 & 1 \\ 1 & 1 & 2 \end{pmatrix}$ : depuis le sommet 1, on va au sommet 2 ou au sommet 3, puis on revient. Ce nombre est le degré du sommet.

## aretes-degres · numeric
Les sommets d'un graphe ont pour degrés 3, 3, 2, 2 et 2. Combien a-t-il d'arêtes ?

= 6

> Chaque arête compte dans le degré de ses deux extrémités : la somme des degrés, $3 + 3 + 2 + 2 + 2 = 12$, vaut le double du nombre d'arêtes, soit 6.

## matrice-graphe-oriente · single
Dans un graphe orienté, que dit la matrice d'adjacence $M$ quand $m_{ij} = 1$ et $m_{ji} = 0$ ?

- [x] Il y a un arc de $i$ vers $j$, mais pas de $j$ vers $i$
- [ ] Il y a une arête entre $i$ et $j$, dans les deux sens
- [ ] Le sommet $i$ est de degré 1
- [ ] La matrice est fausse : elle doit être symétrique

> Pour un graphe orienté, $m_{ij}$ compte les arcs de $i$ vers $j$ : la matrice n'a pas à être symétrique. Elle l'est pour un graphe non orienté, où chaque arête relie $i$ et $j$ dans les deux sens.
