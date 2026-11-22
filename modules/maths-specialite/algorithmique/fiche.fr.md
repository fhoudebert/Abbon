## Résoudre $f(x) = 0$

- **Dichotomie** : on coupe l'intervalle en deux et on garde la moitié où $f$ change de signe ; amplitude $\dfrac{b - a}{2^n}$ après $n$ étapes.
- **Newton** : $x_{n+1} = x_n - \dfrac{f(x_n)}{f'(x_n)}$ ; convergence très rapide près de la solution.

## Équations différentielles

**Euler** pour $y' = F(x, y)$ : $y_{k+1} = y_k + h\,F(x_k, y_k)$, avec un pas $h$ ; plus $h$ est petit, meilleure est l'approximation.

## Intégrales

- **Rectangles** (à gauche) : $h\,(f(x_0) + \dots + f(x_{n-1}))$.
- **Trapèzes** : $h\,\dfrac{f(x_k) + f(x_{k+1})}{2}$ sur chaque intervalle.
- **Monte-Carlo** : proportion de points aléatoires sous la courbe × aire du rectangle ; précision en $\dfrac{1}{\sqrt{n}}$.

## Python

- `range(a, b)` parcourt $a, a + 1, \dots, b - 1$ (b exclu).
- Liste en compréhension : `[k**2 for k in range(1, 5)]` donne `[1, 4, 9, 16]`.
- Algorithme de seuil : `while u < seuil:` … `n = n + 1`.
