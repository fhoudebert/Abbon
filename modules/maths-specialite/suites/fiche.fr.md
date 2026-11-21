## Suites arithmétiques et géométriques

**Arithmétique** de raison $r$ :

- récurrence : $u_{n+1} = u_n + r$ ;
- terme général : $u_n = u_0 + n\,r$, ou $u_n = u_p + (n - p)\,r$.

**Géométrique** de raison $q$ :

- récurrence : $u_{n+1} = q\,u_n$ ;
- terme général : $u_n = u_0 \times q^n$, ou $u_n = u_p \times q^{n-p}$.

**Sommes** :

- arithmétique : nombre de termes $\times \dfrac{\text{premier} + \text{dernier}}{2}$. Exemple : $1 + 2 + \dots + n = \dfrac{n(n+1)}{2}$.
- géométrique ($q \neq 1$) : premier terme $\times \dfrac{1 - q^{\,\text{nombre de termes}}}{1 - q}$. Exemple : $1 + q + \dots + q^n = \dfrac{1 - q^{n+1}}{1 - q}$.
- De $u_0$ à $u_n$, il y a $n + 1$ termes.

## Suites arithmético-géométriques

Pour $u_{n+1} = a\,u_n + b$ avec $a \neq 1$ :

1. chercher le point fixe $\ell$, solution de $\ell = a\,\ell + b$ ;
2. poser $v_n = u_n - \ell$ : $(v_n)$ est géométrique de raison $a$ ;
3. en déduire $u_n = \ell + (u_0 - \ell)\,a^n$, puis la limite si $-1 < a < 1$ : $u_n \to \ell$.

Autre suite auxiliaire classique : $v_n = \dfrac{1}{u_n}$ quand $u_{n+1} = \dfrac{u_n}{1 + u_n}$.

## Limites de $q^n$

- Si $q > 1$ : $q^n \to +\infty$.
- Si $q = 1$ : $q^n = 1$.
- Si $-1 < q < 1$ : $q^n \to 0$.
- Si $q \leq -1$ : pas de limite.

Pour $u_n = u_0\,q^n$ avec $q > 1$, le signe de $u_0$ donne le signe de la limite infinie.

## Théorèmes de limites

- **Comparaison** : si $u_n \geq v_n$ à partir d'un rang et $v_n \to +\infty$, alors $u_n \to +\infty$.
- **Gendarmes** : si $v_n \leq u_n \leq w_n$ à partir d'un rang et $v_n$, $w_n$ tendent vers $\ell$, alors $u_n \to \ell$.
- **Limite monotone** : une suite croissante et majorée converge ; décroissante et minorée, elle converge. La limite est au plus égale au majorant, pas forcément égale à lui. Une suite croissante non majorée tend vers $+\infty$.
- Si $u_{n+1} = f(u_n)$, que $(u_n)$ converge vers $\ell$ et que $f$ est continue en $\ell$, alors $f(\ell) = \ell$.
- Somme télescopique : $\displaystyle\sum_{k=1}^{n}(a_k - a_{k+1}) = a_1 - a_{n+1}$ ; par exemple $\dfrac{1}{k(k+1)} = \dfrac{1}{k} - \dfrac{1}{k+1}$.
- Limite remarquable : $\left(1 + \dfrac{1}{n}\right)^n \to e$.

## Raisonnement par récurrence

1. **Initialisation** : la propriété est vraie au premier rang.
2. **Hérédité** : si elle est vraie à un rang $n$ quelconque, elle l'est au rang $n + 1$.
3. **Conclusion** : elle est vraie pour tout $n$ à partir du premier rang.

## Sens de variation

- Étudier le signe de $u_{n+1} - u_n$, ou comparer $\dfrac{u_{n+1}}{u_n}$ à 1 si les termes sont strictement positifs.
- Si $u_n = f(n)$, les variations de $f$ sur $[0\,;+\infty[$ donnent celles de la suite.

## Pièges classiques

- Compter un terme de trop ou de moins dans une somme.
- Conclure qu'une suite croissante tend vers $+\infty$ : il faut aussi qu'elle ne soit pas majorée.
- Conclure d'après quelques termes calculés : cela ne démontre rien.
- $(-1)^n$ n'a pas de limite.
