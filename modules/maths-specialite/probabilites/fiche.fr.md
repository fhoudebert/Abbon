## Dénombrement

| Situation | Nombre |
| --- | --- |
| $k$-uplets d'un ensemble à $n$ éléments (avec répétition) | $n^k$ |
| Arrangements : $k$ éléments distincts, **ordonnés** | $\dfrac{n!}{(n - k)!}$ |
| Permutations de $n$ éléments | $n!$ |
| Combinaisons : $k$ éléments, **sans ordre** | $\dbinom{n}{k} = \dfrac{n!}{k!\,(n - k)!}$ |

- $\dbinom{n}{k} = \dbinom{n}{n - k}$ ; relation de Pascal : $\dbinom{n}{k} + \dbinom{n}{k+1} = \dbinom{n+1}{k+1}$.
- Un ensemble à $n$ éléments a $2^n$ parties.

## Probabilités conditionnelles

- $P_A(B) = \dfrac{P(A \cap B)}{P(A)}$ si $P(A) \neq 0$, donc $P(A \cap B) = P(A) \times P_A(B)$.
- Arbre pondéré : on multiplie le long d'un chemin, on additionne les chemins qui mènent au même événement. La somme des branches issues d'un même nœud vaut 1.
- **Probabilités totales** : si $A_1, \dots, A_n$ forment une partition de l'univers, $P(B) = \sum P(A_i \cap B)$.
- $A$ et $B$ sont **indépendants** si $P(A \cap B) = P(A) \times P(B)$. Ne pas confondre avec **incompatibles** : $A \cap B = \varnothing$.
- Événement contraire : $P(\overline{A}) = 1 - P(A)$, utile pour « au moins un ».

## Loi binomiale

- Schéma de Bernoulli : $n$ épreuves identiques et indépendantes, deux issues, succès de probabilité $p$. $X$, nombre de succès, suit $\mathcal{B}(n\,;p)$.
- $P(X = k) = \dbinom{n}{k}\,p^k\,(1 - p)^{n-k}$.
- $E(X) = n\,p$, $V(X) = n\,p\,(1 - p)$, $\sigma(X) = \sqrt{V(X)}$.

## Sommes de variables aléatoires, concentration

- $E(X + Y) = E(X) + E(Y)$ ; $E(aX + b) = a\,E(X) + b$ ; $V(aX + b) = a^2\,V(X)$.
- Si $X$ et $Y$ sont indépendantes : $V(X + Y) = V(X) + V(Y)$.
- **Inégalité de Bienaymé-Tchebychev** : $P\big(|X - E(X)| \geq \delta\big) \leq \dfrac{V(X)}{\delta^2}$ pour tout $\delta > 0$.
- **Loi des grands nombres** : la moyenne de $n$ variables indépendantes de même loi se rapproche de leur espérance quand $n$ grandit.

## Pièges classiques

- Additionner des probabilités d'événements non incompatibles (deux fois le double 6).
- Confondre $P_A(B)$ et $P_B(A)$.
- Compter avec ordre quand l'ordre ne compte pas (et inversement).
- Croire que deux événements incompatibles de probabilité non nulle sont indépendants.
