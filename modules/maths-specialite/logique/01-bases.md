---
id: logique-01
title: { fr: "Logique et raisonnement" }
description: { fr: "Négation avec quantificateurs, contraposée, réciproque, condition nécessaire ou suffisante, contre-exemple, raisonnement par l'absurde, ensembles et cardinaux" }
level: bases
tags: [maths, bac, prog-2019, prog-2027]
---

## negation-pour-tout · single
Quelle est la négation de : « Pour tout réel $x$, $f(x) > 0$ » ?

- [x] Il existe un réel $x$ tel que $f(x) \leq 0$
- [ ] Pour tout réel $x$, $f(x) < 0$
- [ ] Pour tout réel $x$, $f(x) \leq 0$
- [ ] Il existe un réel $x$ tel que $f(x) < 0$

> Nier « pour tout » donne « il existe », et la négation de $>$ est $\leq$ (et non $<$). Il suffit d'un seul $x$ qui ne convient pas pour que l'affirmation soit fausse. Le programme de 2027 insiste sur ces négations, avec au plus deux quantificateurs.

## negation-deux-quantificateurs · single
Quelle est la négation de : « Il existe un entier $n$ tel que, pour tout réel $x$, $x^2 \geq n$ » ?

- [x] Pour tout entier $n$, il existe un réel $x$ tel que $x^2 < n$
- [ ] Il n'existe aucun réel $x$ tel que $x^2 \geq n$
- [ ] Pour tout entier $n$ et tout réel $x$, $x^2 < n$
- [ ] Il existe un entier $n$ et un réel $x$ tels que $x^2 < n$

> On inverse chaque quantificateur (« il existe » devient « pour tout » et réciproquement), dans le même ordre, puis on nie la propriété finale. L'énoncé de départ est vrai ($n = 0$ convient) ; sa négation est donc fausse.

## contraposee · single
Quelle est la contraposée de : « Si $n^2$ est pair, alors $n$ est pair » ?

- [x] Si $n$ est impair, alors $n^2$ est impair
- [ ] Si $n$ est pair, alors $n^2$ est pair
- [ ] Si $n^2$ est impair, alors $n$ est impair
- [ ] $n^2$ est pair et $n$ est impair

> La contraposée de « $P \Rightarrow Q$ » est « non $Q \Rightarrow$ non $P$ » : elle est vraie exactement quand l'implication l'est. Ici, elle se démontre facilement : $(2k + 1)^2 = 2(2k^2 + 2k) + 1$. La deuxième réponse est la réciproque, la dernière la négation de l'implication.

## reciproque · single
L'implication « si $x = 2$, alors $x^2 = 4$ » est vraie. Que dire de sa réciproque ?

- [x] Elle est fausse : $x = -2$ vérifie $x^2 = 4$ sans être égal à 2
- [ ] Elle est vraie, comme toute réciproque d'une implication vraie
- [ ] Elle est vraie, car c'est la contraposée
- [ ] Elle n'a pas de sens

> La réciproque « si $x^2 = 4$, alors $x = 2$ » échange hypothèse et conclusion : sa vérité est indépendante de celle de l'implication de départ. Un seul contre-exemple suffit à la réfuter.

## condition-suffisante · single
Pour un réel $x$, la condition « $x > 3$ » est, pour avoir « $x > 1$ », une condition :

- [x] Suffisante, mais pas nécessaire
- [ ] Nécessaire, mais pas suffisante
- [ ] Nécessaire et suffisante
- [ ] Ni nécessaire ni suffisante

> « $x > 3 \Rightarrow x > 1$ » est vrai : il suffit que $x > 3$. Mais $x = 2$ vérifie $x > 1$ sans vérifier $x > 3$ : ce n'est pas nécessaire. « $P$ est suffisante pour $Q$ » signifie $P \Rightarrow Q$ ; « $P$ est nécessaire pour $Q$ » signifie $Q \Rightarrow P$.

## contre-exemple · single
Comment réfuter l'affirmation « tout nombre premier est impair » ?

- [x] Il suffit d'un contre-exemple : 2 est premier et pair
- [ ] Il faut vérifier tous les nombres premiers
- [ ] Par récurrence
- [ ] On ne peut pas, car c'est vrai

> Une affirmation universelle (« tout… ») est fausse dès qu'un seul cas la contredit. À l'inverse, aucun nombre d'exemples ne démontre une affirmation universelle sur un ensemble infini.

## absurde · single
Pour démontrer par l'absurde que $\sqrt{2}$ est irrationnel, que suppose-t-on au départ ?

- [x] Que $\sqrt{2} = \dfrac{p}{q}$, avec $p$ et $q$ entiers premiers entre eux, pour aboutir à une contradiction
- [ ] Que $\sqrt{2}$ est irrationnel, pour le vérifier
- [ ] Que $\sqrt{2}$ est un entier
- [ ] Que $\sqrt{2} \approx 1{,}414$

> On suppose le contraire de ce qu'on veut prouver. De $p^2 = 2q^2$, on déduit que $p$ est pair (par contraposée : si $p$ était impair, $p^2$ le serait aussi), puis que $q$ l'est aussi : la fraction n'était pas irréductible. Contradiction : $\sqrt{2}$ est irrationnel.

## produit-cartesien · numeric
L'ensemble $A$ a 3 éléments et l'ensemble $B$ en a 4. Combien d'éléments le produit cartésien $A \times B$ (ensemble des couples $(a, b)$) contient-il ?

= 12

> $\mathrm{Card}(A \times B) = \mathrm{Card}(A) \times \mathrm{Card}(B) = 12$ : c'est le principe multiplicatif du dénombrement. Pour des triplets de $A \times A \times A$ : $3^3 = 27$.

## cardinal-reunion · numeric
Dans une classe, 20 élèves pratiquent un sport, 15 jouent d'un instrument et 8 font les deux. Combien d'élèves font au moins l'une des deux activités ?

= 27

> $\mathrm{Card}(A \cup B) = \mathrm{Card}(A) + \mathrm{Card}(B) - \mathrm{Card}(A \cap B) = 20 + 15 - 8 = 27$ : les 8 élèves de l'intersection ont été comptés deux fois.

## de-morgan · single
Dans un univers $\Omega$, l'événement « ni $A$ ni $B$ » est égal à :

- [x] $\overline{A} \cap \overline{B}$, c'est-à-dire $\overline{A \cup B}$
- [ ] $\overline{A} \cup \overline{B}$
- [ ] $\overline{A \cap B}$
- [ ] $A \cap B$

> Lois de De Morgan : le complémentaire d'une réunion est l'intersection des complémentaires, et inversement. « Ni $A$ ni $B$ » est le contraire de « $A$ ou $B$ ». En probabilités : $P(\overline{A} \cap \overline{B}) = 1 - P(A \cup B)$.
