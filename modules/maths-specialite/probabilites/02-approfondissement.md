---
id: probabilites-02
title: { fr: "Dénombrement et probabilités : approfondissement" }
description: { fr: "Loi binomiale, probabilités totales et inversées, variance, Bienaymé-Tchebychev, dénombrement" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## binomiale-valeur · numeric
$X$ suit la loi binomiale $\mathcal{B}(10\,;0,3)$. Calculez $P(X = 2)$ (valeur approchée à $0,001$ près).

= 0,233 ± 0,001

> $P(X = 2) = \dbinom{10}{2} \times 0,3^2 \times 0,7^8 = 45 \times 0,09 \times 0,7^8 \approx 0,233$. Le coefficient binomial compte les façons de placer les 2 succès parmi les 10 épreuves.

## binomiale-au-moins · numeric
$X$ suit la loi binomiale $\mathcal{B}(5\,;0,2)$. Calculez $P(X \geq 1)$ (valeur approchée à $0,001$ près).

= 0,672 ± 0,001

> On passe par l'événement contraire : $P(X \geq 1) = 1 - P(X = 0) = 1 - 0,8^5 \approx 0,672$. C'est plus court que d'additionner $P(X = 1)$, …, $P(X = 5)$.

## binomiale-zero · expression
$X$ suit la loi binomiale $\mathcal{B}\left(n\,;\dfrac{1}{2}\right)$. Écrivez $P(X = 0)$ en fonction de $n$.

= $\left(\frac{1}{2}\right)^{n}$

> $P(X = 0) = \dbinom{n}{0}\left(\dfrac{1}{2}\right)^0\left(1 - \dfrac{1}{2}\right)^n = \left(\dfrac{1}{2}\right)^n$ : aucun succès en $n$ épreuves indépendantes. Les écritures $\dfrac{1}{2^n}$ ou $0,5^n$ sont acceptées.

## probabilites-totales · numeric
On donne $P(A) = 0,4$, $P_A(B) = 0,5$ et $P_{\overline{A}}(B) = 0,2$. Calculez $P(B)$.

= 0,32

> $A$ et $\overline{A}$ forment une partition : $P(B) = P(A)\,P_A(B) + P(\overline{A})\,P_{\overline{A}}(B) = 0,4 \times 0,5 + 0,6 \times 0,2 = 0,2 + 0,12 = 0,32$. Sur l'arbre : on multiplie le long des chemins, on additionne les chemins qui mènent à $B$.

## probabilite-inversee · numeric
Avec les mêmes données ($P(A) = 0,4$, $P_A(B) = 0,5$, $P(B) = 0,32$), calculez $P_B(A)$.

= 0,625

> $P_B(A) = \dfrac{P(A \cap B)}{P(B)} = \dfrac{0,4 \times 0,5}{0,32} = \dfrac{0,2}{0,32} = 0,625$. Il ne faut pas confondre $P_B(A)$ (sachant $B$) et $P_A(B)$ (sachant $A$), qui vaut ici $0,5$.

## variance-binomiale · numeric
$X$ suit la loi binomiale $\mathcal{B}(100\,;0,5)$. Quelle est sa variance ?

= 25

> $V(X) = n\,p\,(1 - p) = 100 \times 0,5 \times 0,5 = 25$, et l'écart type vaut $\sigma(X) = \sqrt{25} = 5$.

## bienayme-tchebychev · numeric
Une variable aléatoire $X$ a pour espérance 50 et pour variance 25. Quel majorant l'inégalité de Bienaymé-Tchebychev donne-t-elle pour $P(|X - 50| \geq 10)$ ?

= 0,25

> $P(|X - E(X)| \geq \delta) \leq \dfrac{V(X)}{\delta^2} = \dfrac{25}{10^2} = 0,25$. C'est un majorant, souvent large : la probabilité réelle peut être bien plus petite.

## variance-somme · numeric
$X$ et $Y$ sont indépendantes, avec $V(X) = 4$ et $V(Y) = 9$. Que vaut $V(X + Y)$ ?

= 13

> Pour des variables indépendantes, les variances s'ajoutent : $V(X + Y) = 4 + 9 = 13$. Ce sont les variances, pas les écarts types, qui s'additionnent : $\sigma(X + Y) = \sqrt{13} \neq 2 + 3$.

## mains-deux-as · numeric
Dans un jeu de 32 cartes (dont 4 as), combien de mains de 5 cartes contiennent exactement 2 as ?

= 19656

> On choisit les 2 as parmi 4, puis les 3 autres cartes parmi les 28 qui ne sont pas des as : $\dbinom{4}{2} \times \dbinom{28}{3} = 6 \times 3276 = 19\,656$. L'ordre des cartes dans la main ne compte pas : ce sont des combinaisons.

## anagrammes · numeric
Combien de mots différents (ayant un sens ou non) peut-on écrire avec toutes les lettres du mot ANANAS ?

= 60

> Six lettres donnent $6!$ permutations, mais échanger les trois A ou les deux N donne le même mot : $\dfrac{6!}{3!\,2!} = \dfrac{720}{12} = 60$.
