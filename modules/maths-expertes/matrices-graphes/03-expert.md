---
id: matrices-graphes-03
title: { fr: "Matrices et graphes : niveau expert" }
description: { fr: "Puissances de matrices, inverse par une relation polynomiale, suites récurrentes, chaînes de Markov à l'étape n, chaînes dans un graphe complet" }
level: expert
tags: [maths, bac, prog-2019]
---

## puissance-triangulaire · expression
On pose $A = \begin{pmatrix} 2 & 1 \\ 0 & 2 \end{pmatrix}$. On admet que $A^n = \begin{pmatrix} 2^n & b_n \\ 0 & 2^n \end{pmatrix}$ pour $n \geq 1$. Écrivez $b_n$ en fonction de $n$.

= $n \times 2^{n-1}$

> $A^{n+1} = A^n\,A$ donne $b_{n+1} = 2^n + 2\,b_n$, avec $b_1 = 1$ ; d'où $b_2 = 4$, $b_3 = 12$, $b_4 = 32$. On conjecture $b_n = n\,2^{n-1}$, et la récurrence le confirme : $2^n + 2n\,2^{n-1} = (n + 1)\,2^n$. Autre voie : $A = 2I + N$ avec $N^2 = 0$, et le binôme s'applique car $2I$ et $N$ commutent.

## permutation · single
On pose $M = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$. Que vaut $M^{2026}$ ?

- [x] $I_2$, la matrice identité
- [ ] $M$
- [ ] $-I_2$
- [ ] $\begin{pmatrix} 0 & 2026 \\ 2026 & 0 \end{pmatrix}$

> $M^2 = I_2$ (échanger deux fois les coordonnées ramène au départ). Donc $M^{2026} = (M^2)^{1013} = I_2$ ; pour un exposant impair, on obtiendrait $M$.

## inverse-polynome · single
Une matrice carrée $A$ vérifie $A^2 = 3A - 2I$. Que peut-on en déduire ?

- [x] $A$ est inversible, et $A^{-1} = \dfrac{1}{2}(3I - A)$
- [ ] $A$ n'est pas inversible
- [ ] $A^{-1} = 3I - A$
- [ ] $A = I$ ou $A = 2I$

> $A^2 - 3A = -2I$ s'écrit $A(3I - A) = 2I$, soit $A \times \dfrac{1}{2}(3I - A) = I$ : on a trouvé l'inverse. Les matrices $I$ et $2I$ vérifient la relation, mais d'autres aussi, comme $\begin{pmatrix} 1 & 0 \\ 0 & 2 \end{pmatrix}$ : on ne peut pas « factoriser » comme pour des nombres.

## non-inversible · numeric
Pour quelle valeur du réel $a$ la matrice $\begin{pmatrix} 1 & a \\ 2 & 4 \end{pmatrix}$ n'est-elle pas inversible ?

= 2

> Une matrice $\begin{pmatrix} p & q \\ r & s \end{pmatrix}$ est inversible si et seulement si $ps - qr \neq 0$. Ici $4 - 2a = 0$ pour $a = 2$ : les deux lignes sont alors proportionnelles.

## determinant-double · numeric
$A$ est une matrice carrée d'ordre 2 dont le déterminant vaut 3. Que vaut le déterminant de $2A$ ?

= 12

> Multiplier $A$ par 2 multiplie ses quatre coefficients : $\det(2A) = (2p)(2s) - (2q)(2r) = 4(ps - qr) = 12$. Le déterminant n'est pas linéaire ; pour une matrice d'ordre $n$, le facteur serait $2^n$.

## recurrence-matrice · single
La suite $(u_n)$ vérifie $u_{n+2} = u_{n+1} + 2u_n$. On pose $X_n = \begin{pmatrix} u_{n+1} \\ u_n \end{pmatrix}$. Quelle matrice $A$ vérifie $X_{n+1} = A\,X_n$ ?

- [x] $\begin{pmatrix} 1 & 2 \\ 1 & 0 \end{pmatrix}$
- [ ] $\begin{pmatrix} 2 & 1 \\ 1 & 0 \end{pmatrix}$
- [ ] $\begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$
- [ ] $\begin{pmatrix} 0 & 1 \\ 2 & 1 \end{pmatrix}$

> $X_{n+1} = \begin{pmatrix} u_{n+2} \\ u_{n+1} \end{pmatrix}$ : la première ligne doit donner $u_{n+1} + 2u_n$, d'où $(1\;\;2)$ ; la seconde recopie $u_{n+1}$, d'où $(1\;\;0)$. Ensuite $X_n = A^n X_0$.

## recurrence-terme-general · expression
Toujours avec $u_{n+2} = u_{n+1} + 2u_n$, on prend $u_0 = 0$ et $u_1 = 1$. Écrivez $u_n$ en fonction de $n$ (indication : $A^n$ fait intervenir $2^n$ et $(-1)^n$).

= $\frac{2^n - (-1)^n}{3}$

> On cherche $u_n = \alpha\,2^n + \beta\,(-1)^n$ (2 et $-1$ sont les solutions de $x^2 = x + 2$). $u_0 = \alpha + \beta = 0$ et $u_1 = 2\alpha - \beta = 1$ donnent $\alpha = \dfrac{1}{3}$ et $\beta = -\dfrac{1}{3}$. Vérification : $0, 1, 1, 3, 5, 11, 21\dots$

## markov-etape-n · expression
Une chaîne de Markov à deux états a pour matrice de transition $P = \begin{pmatrix} 0,7 & 0,3 \\ 0,4 & 0,6 \end{pmatrix}$ et part de l'état 1. On admet que la probabilité $p_n$ d'être dans l'état 1 à l'étape $n$ vérifie $p_{n+1} = 0,3\,p_n + 0,4$. Écrivez $p_n$ en fonction de $n$.

= $\frac{4}{7} + \frac{3}{7} \times 0{,}3^{n}$

> Suite arithmético-géométrique de point fixe $\ell = \dfrac{0,4}{1 - 0,3} = \dfrac{4}{7}$ : $p_n - \dfrac{4}{7} = 0,3^n\left(p_0 - \dfrac{4}{7}\right)$, avec $p_0 = 1$. D'où $p_n = \dfrac{4}{7} + \dfrac{3}{7} \times 0,3^n$. La relation vient de $p_{n+1} = 0,7\,p_n + 0,4\,(1 - p_n)$.

## markov-limite · numeric
Avec la même chaîne, vers quelle valeur tend $p_n$ (à $0,001$ près) ?

= 0,571 ± 0,001

> $0,3^n \to 0$ car $|0,3| < 1$, donc $p_n \to \dfrac{4}{7} \approx 0,571$, quel que soit l'état de départ. C'est la première composante de la distribution invariante $\left(\dfrac{4}{7}\;\;\dfrac{3}{7}\right)$.

## chaines-graphe-complet · numeric
Dans le graphe complet à 4 sommets, combien y a-t-il de chaînes de longueur 3 reliant deux sommets distincts donnés ?

= 7

> La matrice d'adjacence est $M = J - I$, où $J$ n'a que des 1 ; comme $J^2 = 4J$, $M^3 = J^3 - 3J^2 + 3J - I = 7J - I$. Hors diagonale, les coefficients valent 7. Dénombrement direct de $A$ à $B$ : $A\,x\,y\,B$ avec $x \neq A$ et $y \neq x$, $y \neq B$ donne 7 chaînes.
