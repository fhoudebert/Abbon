---
id: probabilites-03
title: { fr: "Dénombrement et probabilités : niveau expert" }
description: { fr: "Seuil d'une loi binomiale, test de dépistage, jeux équitables, moyenne d'un échantillon, chemins, anniversaires" }
level: expert
tags: [maths, bac, prog-2019]
---

## seuil-binomial · numeric
Un tireur atteint sa cible avec une probabilité de 0,1 à chaque tir, les tirs étant indépendants. Combien de tirs faut-il au minimum pour que la probabilité de l'atteindre au moins une fois dépasse 0,99 ?

= 44

> $P(\text{au moins un succès}) = 1 - 0,9^n \geq 0,99 \iff 0,9^n \leq 0,01 \iff n \geq \dfrac{\ln 0,01}{\ln 0,9} \approx 43,7$ (le sens change : $\ln 0,9 < 0$). Il faut 44 tirs.

## au-moins-un · expression
$X$ suit la loi binomiale $\mathcal{B}(n\,;0,1)$. Écrivez $P(X \geq 1)$ en fonction de $n$.

= $1 - 0{,}9^{n}$

> Événement contraire : $P(X \geq 1) = 1 - P(X = 0) = 1 - 0,9^n$. C'est la formule qui sert à chercher un nombre d'essais minimal : $1 - 0,9^n \geq 0,99$ dès $n = 44$.

## binomiale-milieu · numeric
$X$ suit la loi binomiale $\mathcal{B}(20\,;0,5)$. Calculez $P(X = 10)$ (à $0,001$ près).

= 0,176 ± 0,001

> $P(X = 10) = \dbinom{20}{10}\,0,5^{20} = \dfrac{184\,756}{1\,048\,576} \approx 0,176$. Même la valeur la plus probable n'est obtenue qu'environ une fois sur six.

## depistage · numeric
Une maladie touche 1 % d'une population. Un test la détecte chez 99 % des malades, et donne un résultat positif à tort chez 5 % des personnes saines. Une personne est testée positive : quelle est la probabilité qu'elle soit malade (à $0,001$ près) ?

= 0,167 ± 0,002

> $P(+) = 0,01 \times 0,99 + 0,99 \times 0,05 = 0,0099 + 0,0495 = 0,0594$, puis $P_+(M) = \dfrac{0,0099}{0,0594} \approx 0,167$. Malgré un test fiable, cinq positifs sur six sont des faux positifs, parce que la maladie est rare.

## jeu-equitable · numeric
On lance un dé équilibré : on gagne 10 € si l'on obtient 6, on perd 2 € sinon. Quelle est l'espérance du gain, en euros ?

= 0

> $E(G) = 10 \times \dfrac{1}{6} + (-2) \times \dfrac{5}{6} = \dfrac{10 - 10}{6} = 0$ : le jeu est équitable. Sur un grand nombre de parties, le gain moyen se rapproche de 0 (loi des grands nombres).

## moyenne-echantillon · numeric
$M_n$ est la moyenne de 100 variables aléatoires indépendantes, de même loi, d'espérance $\mu$ et de variance 4. Quel majorant l'inégalité de Bienaymé-Tchebychev donne-t-elle pour $P(|M_n - \mu| \geq 0,5)$ ?

= 0,16

> $V(M_n) = \dfrac{V(X)}{n} = \dfrac{4}{100} = 0,04$, d'où $P(|M_n - \mu| \geq 0,5) \leq \dfrac{0,04}{0,5^2} = 0,16$. Plus l'échantillon est grand, plus la moyenne se concentre autour de $\mu$ : c'est la loi faible des grands nombres.

## chemins · numeric
Sur un quadrillage, on va du point $(0\,;0)$ au point $(4\,;4)$ en ne faisant que des pas d'une unité vers la droite ou vers le haut. Combien y a-t-il de chemins ?

= 70

> Un chemin compte 8 pas, dont 4 vers la droite : il suffit de choisir leurs positions, $\dbinom{8}{4} = 70$.

## independance · single
On donne $P(A) = 0,5$, $P(B) = 0,4$ et $P(A \cup B) = 0,7$. Les événements $A$ et $B$ sont-ils indépendants ?

- [x] Oui, car $P(A \cap B) = 0,2 = P(A) \times P(B)$
- [ ] Non, car $P(A \cup B) \neq P(A) + P(B)$
- [ ] Non, car $P(A \cap B) \neq 0$
- [ ] On ne peut pas savoir

> $P(A \cap B) = P(A) + P(B) - P(A \cup B) = 0,2$, et $P(A) \times P(B) = 0,2$ : indépendants. Ils ne sont pas incompatibles ($P(A \cap B) \neq 0$) — ce sont deux notions différentes.

## variance-affine · numeric
$V(X) = 2$. Que vaut $V(3X - 2)$ ?

= 18

> $V(aX + b) = a^2\,V(X) = 9 \times 2 = 18$. Ajouter une constante décale les valeurs sans changer leur dispersion ; multiplier par $a$ multiplie l'écart type par $|a|$, la variance par $a^2$.

## anniversaires · numeric
Dans un groupe de 3 personnes (années de 365 jours, naissances équiprobables et indépendantes), quelle est la probabilité qu'au moins deux aient le même jour d'anniversaire (à $0,0002$ près) ?

= 0,0082 ± 0,0002

> Contraire : trois jours tous différents, de probabilité $\dfrac{365 \times 364 \times 363}{365^3} \approx 0,9918$. D'où $1 - 0,9918 \approx 0,0082$. Avec 23 personnes, on dépasse déjà 0,5.
