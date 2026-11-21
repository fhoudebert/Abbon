## Calcul matriciel

- Le produit $A\,B$ existe si le nombre de colonnes de $A$ égale le nombre de lignes de $B$ ; pour $A$ de taille $n \times p$ et $B$ de taille $p \times q$, $A\,B$ est de taille $n \times q$.
- Coefficient $(i, j)$ de $A\,B$ : ligne $i$ de $A$ « multipliée » par la colonne $j$ de $B$, $\sum_k a_{ik}\,b_{kj}$.
- Le produit **n'est pas commutatif** : en général $A\,B \neq B\,A$, et $(A + B)^2 \neq A^2 + 2AB + B^2$.
- Matrice identité $I_n$ : $A\,I_n = I_n\,A = A$.

## Matrices carrées de taille 2

- Déterminant de $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ : $\det A = ad - bc$.
- $A$ est inversible si et seulement si $\det A \neq 0$, et alors $A^{-1} = \dfrac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.
- Système $A\,X = B$ avec $A$ inversible : unique solution $X = A^{-1}B$.
- Suites matricielles : si $U_{n+1} = A\,U_n$, alors $U_n = A^n\,U_0$. Si $U_{n+1} = A\,U_n + B$, on cherche $C = (I - A)^{-1}B$, puis $V_n = U_n - C$ vérifie $V_{n+1} = A\,V_n$.
- Puissances : pour $D$ diagonale, $D^n$ s'obtient en élevant chaque coefficient diagonal à la puissance $n$ ; si $A = P\,D\,P^{-1}$, alors $A^n = P\,D^n\,P^{-1}$.

## Graphes

- Vocabulaire : sommets, arêtes, **ordre** (nombre de sommets), **degré** d'un sommet (nombre d'arêtes qui y aboutissent), graphe **complet** (toutes les arêtes possibles, $\frac{n(n-1)}{2}$ pour $n$ sommets), **connexe** (deux sommets quelconques sont reliés par une chaîne).
- La somme des degrés est le double du nombre d'arêtes ; le nombre de sommets de degré impair est donc pair.
- Un **arbre** est un graphe connexe sans cycle ; un graphe connexe à $n$ sommets en est un si et seulement s'il a $n - 1$ arêtes.
- **Matrice d'adjacence** $M$ : $m_{ij}$ = nombre d'arêtes (ou d'arcs) de $i$ vers $j$. Le coefficient $(i, j)$ de $M^n$ est le nombre de chaînes de longueur $n$ de $i$ à $j$.

## Chaînes de Markov

- Graphe probabiliste : la somme des poids des arcs issus d'un sommet vaut 1.
- **Matrice de transition** $P$ (une ligne par état de départ) : chaque ligne a une somme égale à 1.
- Distribution à l'étape $n$, écrite en ligne : $\pi_{n+1} = \pi_n\,P$, donc $\pi_n = \pi_0\,P^n$.
- **Distribution invariante** : $\pi = \pi\,P$, avec la somme des coefficients de $\pi$ égale à 1.

## Pièges classiques

- Inverser l'ordre d'un produit de matrices, ou multiplier des matrices de tailles incompatibles.
- Conclure qu'une matrice est inversible parce que ses coefficients sont non nuls : seul le déterminant compte.
- Écrire la distribution en colonne alors que la matrice de transition est rangée par lignes (ou l'inverse).
