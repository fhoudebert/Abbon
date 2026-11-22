---
id: algorithmique-01
title: { fr: "Algorithmique et méthodes numériques" }
description: { fr: "Dichotomie, méthode de Newton, méthode d'Euler, rectangles et trapèzes, Monte-Carlo, listes et boucles en Python" }
level: bases
tags: [maths, bac, python, prog-2019, prog-2027]
---

## dichotomie-etape · single
On cherche par dichotomie la solution de $x^2 - 2 = 0$ dans $[1\,;2]$. Après la première étape, dans quel intervalle se trouve-t-elle ?

- [x] $[1\,;1{,}5]$
- [ ] $[1{,}5\,;2]$
- [ ] $[1{,}25\,;1{,}75]$
- [ ] $[1\,;2]$, inchangé

> On calcule $f$ au milieu : $f(1{,}5) = 0{,}25 > 0$, alors que $f(1) = -1 < 0$. Le changement de signe a lieu entre 1 et 1,5 : on garde $[1\,;1{,}5]$. C'est le théorème des valeurs intermédiaires appliqué pas à pas.

## dichotomie-nombre · numeric
Un intervalle de longueur 1 est coupé en deux à chaque étape de dichotomie. Combien d'étapes faut-il au minimum pour obtenir un encadrement d'amplitude inférieure à $10^{-3}$ ?

= 10

> Après $n$ étapes, l'amplitude vaut $\dfrac{1}{2^n}$. On veut $2^n > 1\,000$ : $2^9 = 512$ ne suffit pas, $2^{10} = 1\,024$ convient. La dichotomie gagne environ trois décimales toutes les dix étapes.

## newton · numeric
La méthode de Newton pour $f(x) = x^2 - 2$ s'écrit $x_{n+1} = x_n - \dfrac{f(x_n)}{f'(x_n)}$. En partant de $x_0 = 1$, que vaut $x_2$ (à $0,001$ près) ?

= 1,417 ± 0,001

> $x_1 = 1 - \dfrac{-1}{2} = 1{,}5$, puis $x_2 = 1{,}5 - \dfrac{0{,}25}{3} \approx 1{,}4167$. On reconnaît la méthode de Héron : $x_{n+1} = \dfrac{x_n}{2} + \dfrac{1}{x_n}$. Le nombre de décimales exactes double environ à chaque étape, bien plus vite que la dichotomie.

## euler · numeric
On approche la solution de $y' = y$, $y(0) = 1$, par la méthode d'Euler avec un pas $h = 0{,}5$ : $y_{k+1} = y_k + h\,y_k$. Quelle valeur approchée obtient-on pour $y(1)$ ?

= 2,25 ± 0,001

> $y(0{,}5) \approx 1 + 0{,}5 \times 1 = 1{,}5$, puis $y(1) \approx 1{,}5 + 0{,}5 \times 1{,}5 = 2{,}25$. La valeur exacte est $e \approx 2{,}718$ : un pas plus petit améliore l'approximation ($h = 0{,}01$ donne $1{,}01^{100} \approx 2{,}705$).

## rectangles · numeric
On approche $\displaystyle\int_0^1 x^2\,\mathrm{d}x$ par la méthode des rectangles à gauche, avec 2 rectangles de même largeur. Quelle valeur obtient-on ?

= 0,125 ± 0,001

> Largeur $0{,}5$ ; hauteurs $f(0) = 0$ et $f(0{,}5) = 0{,}25$ ; somme : $0{,}5 \times (0 + 0{,}25) = 0{,}125$. La valeur exacte est $\dfrac{1}{3}$ : pour une fonction croissante, les rectangles à gauche donnent une valeur par défaut.

## trapezes · numeric
Même intégrale, $\displaystyle\int_0^1 x^2\,\mathrm{d}x$, par la méthode des trapèzes avec 2 trapèzes. Quelle valeur obtient-on ?

= 0,375 ± 0,001

> $0{,}5 \times \dfrac{0 + 0{,}25}{2} + 0{,}5 \times \dfrac{0{,}25 + 1}{2} = 0{,}0625 + 0{,}3125 = 0{,}375$. Pour une fonction convexe, les trapèzes sont au-dessus de la courbe : valeur par excès, plus proche de $\frac{1}{3}$ que les rectangles.

## monte-carlo · numeric
On tire au hasard 1 000 points dans le carré $[0\,;1] \times [0\,;1]$ ; 785 tombent dans le quart de disque de centre $O$ et de rayon 1. Quelle valeur approchée de $\pi$ en déduit-on ?

= 3,14 ± 0,005

> La proportion de points dans le quart de disque estime le rapport des aires, $\dfrac{\pi/4}{1}$ : $\pi \approx 4 \times 0{,}785 = 3{,}14$. La précision progresse lentement, en $\dfrac{1}{\sqrt{n}}$ : c'est la loi des grands nombres à l'œuvre.

## liste-comprehension · short
Quelle liste le code Python `[k**2 for k in range(1, 5)]` produit-il ? (Écrivez-la comme Python l'affiche.)

= [1, 4, 9, 16]
= [1,4,9,16]

> `range(1, 5)` parcourt 1, 2, 3, 4 (le 5 est exclu) ; `k**2` est le carré. Les listes définies « en compréhension » figurent explicitement au programme de 2027.

## seuil-python · numeric
Que renvoie cette fonction ?

```python
def seuil():
    n, u = 0, 1
    while u < 1000:
        n = n + 1
        u = 2 * u
    return n
```

= 10

> La boucle double $u$ tant qu'il est inférieur à 1 000 : $u_n = 2^n$, et le premier $n$ tel que $2^n \geq 1\,000$ est 10 ($2^{10} = 1\,024$). C'est l'algorithme de seuil, classique au bac.

## somme-boucle · numeric
Que vaut `s` après ce code ?

```python
s = 0
for k in range(1, 11):
    s = s + k
```

= 55

> La boucle ajoute $1 + 2 + \dots + 10 = \dfrac{10 \times 11}{2} = 55$. `range(1, 11)` s'arrête à 10. Écrire `range(1, 10)` donnerait 45, une erreur fréquente.
