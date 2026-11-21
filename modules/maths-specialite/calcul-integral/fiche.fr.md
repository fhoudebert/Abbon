## Primitives usuelles

$F$ est une primitive de $f$ si $F' = f$ ; deux primitives diffèrent d'une constante.

| $f(x)$ | Une primitive $F(x)$ |
| --- | --- |
| $x^n$ ($n \neq -1$) | $\dfrac{x^{n+1}}{n+1}$ |
| $\dfrac{1}{x}$ (sur $]0\,;+\infty[$) | $\ln x$ |
| $\dfrac{1}{x^2}$ | $-\dfrac{1}{x}$ |
| $e^{ax}$ ($a \neq 0$) | $\dfrac{1}{a}\,e^{ax}$ |
| $u'\,e^u$ | $e^u$ |
| $\dfrac{u'}{u}$ ($u > 0$) | $\ln u$ |
| $u'\,u^n$ ($n \neq -1$) | $\dfrac{u^{n+1}}{n+1}$ |
| $\sin(ax)$ ($a \neq 0$) | $-\dfrac{1}{a}\cos(ax)$ |
| $\cos(ax)$ ($a \neq 0$) | $\dfrac{1}{a}\sin(ax)$ |
| $\ln x$ | $x\ln x - x$ |

Toujours vérifier une primitive en la dérivant.

**Encadrer une intégrale** : si $g \leq f \leq h$ sur $[a\,;b]$ ($a \leq b$), alors $\displaystyle\int_a^b g \leq \int_a^b f \leq \int_a^b h$ ; utile pour trouver la limite d'une suite d'intégrales.

## Intégrale

- $\displaystyle\int_a^b f(x)\,\mathrm{d}x = F(b) - F(a) = \big[F(x)\big]_a^b$.
- Linéarité : $\displaystyle\int_a^b (\lambda f + \mu g) = \lambda\int_a^b f + \mu\int_a^b g$.
- Relation de Chasles : $\displaystyle\int_a^b f = \int_a^c f + \int_c^b f$.
- Positivité : si $f \geq 0$ sur $[a\,;b]$ avec $a \leq b$, alors $\displaystyle\int_a^b f \geq 0$ ; si $f \leq g$, alors $\displaystyle\int_a^b f \leq \int_a^b g$.

## Aire et valeur moyenne

- Si $f$ est continue et positive sur $[a\,;b]$, $\displaystyle\int_a^b f(x)\,\mathrm{d}x$ est l'aire, en unités d'aire, sous la courbe.
- Aire entre deux courbes, avec $f \geq g$ sur $[a\,;b]$ : $\displaystyle\int_a^b \big(f(x) - g(x)\big)\,\mathrm{d}x$.
- Valeur moyenne : $\mu = \dfrac{1}{b - a}\displaystyle\int_a^b f(x)\,\mathrm{d}x$.

## Intégration par parties

$$\int_a^b u\,v' = \big[u\,v\big]_a^b - \int_a^b u'\,v$$

Choisir pour $u$ le facteur qui se simplifie en dérivant : $x$ dans $\int x\,e^x$, $\ln x$ dans $\int \ln x$ (avec $v' = 1$).

## Équations différentielles

- $y' = a\,y$ : solutions $y = C\,e^{ax}$, $C$ réel.
- $y' = a\,y + b$ ($a \neq 0$) : solutions $y = C\,e^{ax} - \dfrac{b}{a}$ ; la constante $C$ se fixe par une condition initiale.

## Pièges classiques

- Utiliser $\dfrac{x^{n+1}}{n+1}$ pour $n = -1$ : la primitive de $\dfrac{1}{x}$ est $\ln x$.
- Oublier le facteur $\dfrac{1}{a}$ dans la primitive de $e^{ax}$.
- Prendre une intégrale pour une aire quand $f$ change de signe.
- Écrire que l'intégrale d'un produit est le produit des intégrales.
