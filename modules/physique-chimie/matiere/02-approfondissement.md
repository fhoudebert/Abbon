---
id: matiere-02
title: { fr: "Constitution et transformations de la matière : approfondissement" }
description: { fr: "pH et pKa, prédominance, demi-équivalence, cinétique, quotient de réaction, rendement, dosage, pile, groupe carbonyle" }
level: approfondissement
tags: [chimie, bac, prog-2019]
---

## ph-acide-fort · numeric
Quel est le pH d'une solution d'acide chlorhydrique à $\pu{1,0e-2 mol.L-1}$ ? (L'acide chlorhydrique est un acide fort.)

= 2,0 ± 0,1

> Un acide fort réagit totalement avec l'eau : $[\ce{H3O+}] = c = \pu{1,0e-2 mol.L-1}$, donc $\mathrm{pH} = -\log(1,0 \times 10^{-2}) = 2,0$. Pour un acide faible de même concentration, le pH serait plus élevé.

## tampon · numeric
Une solution contient autant d'acide éthanoïque que d'ions éthanoate ($\mathrm{p}K_A = 4,8$). Quel est son pH ?

= 4,8 ± 0,1

> $\mathrm{pH} = \mathrm{p}K_A + \log\dfrac{[\ce{A-}]}{[\ce{AH}]} = 4,8 + \log 1 = 4,8$. Un tel mélange est une solution tampon : son pH varie peu par ajout modéré d'acide, de base, ou par dilution.

## predominance · single
Le couple $\ce{NH4+}/\ce{NH3}$ a un $\mathrm{p}K_A$ de 9,2. Quelle espèce prédomine dans une solution de pH 7,0 ?

- [x] $\ce{NH4+}$
- [ ] $\ce{NH3}$
- [ ] Les deux, en quantités égales
- [ ] On ne peut pas le savoir

> $\mathrm{pH} < \mathrm{p}K_A$ : la forme acide prédomine. Ici, $\log\dfrac{[\ce{NH3}]}{[\ce{NH4+}]} = 7,0 - 9,2 = -2,2$ : il y a environ 160 fois plus d'ions ammonium que d'ammoniac.

## demi-equivalence · single
Lors du titrage d'un acide faible par une base forte, que vaut le pH à la demi-équivalence ?

- [x] Le $\mathrm{p}K_A$ du couple de l'acide titré
- [ ] 7
- [ ] La moitié du pH à l'équivalence
- [ ] 14

> À la demi-équivalence, la moitié de l'acide a été transformée en sa base conjuguée : $[\ce{A-}] = [\ce{AH}]$, donc $\mathrm{pH} = \mathrm{p}K_A$. C'est une façon de mesurer un $\mathrm{p}K_A$ sur une courbe de titrage. Le pH vaut 7 à l'équivalence seulement pour un acide fort titré par une base forte.

## demi-reaction · numeric
Une réaction suit une loi de vitesse d'ordre 1 de constante $k = \pu{1,0e-2 s-1}$. Quel est son temps de demi-réaction, en secondes ?

= 69 ± 1

> Pour l'ordre 1, $[A](t) = [A]_0\,e^{-kt}$ ; $[A] = \frac{[A]_0}{2}$ pour $t_{1/2} = \dfrac{\ln 2}{k} = \dfrac{0,693}{0,010} \approx \pu{69 s}$. Ce temps ne dépend pas de la concentration initiale.

## quotient-reaction · single
Pour une réaction de constante d'équilibre $K = 2$, le quotient de réaction initial vaut $Q_{r,i} = 0,5$. Comment le système évolue-t-il ?

- [x] Dans le sens direct, jusqu'à ce que $Q_r = K$
- [ ] Dans le sens inverse
- [ ] Il n'évolue pas
- [ ] Il évolue jusqu'à $Q_r = 0$

> $Q_{r,i} < K$ : le système évolue dans le sens qui augmente $Q_r$, c'est-à-dire qui forme les produits (sens direct), jusqu'à l'équilibre où $Q_r = K$.

## rendement · numeric
Une estérification part de $\pu{0,50 mol}$ d'acide éthanoïque et d'un excès d'éthanol ; on obtient $\pu{0,33 mol}$ d'ester. Quel est le rendement, en pourcentage ?

= 66 ± 1

> Le réactif limitant est l'acide : on pourrait au mieux obtenir $\pu{0,50 mol}$ d'ester. Rendement $= \dfrac{0,33}{0,50} = 0,66$, soit 66 %. L'estérification est limitée ; l'excès d'alcool déplace l'équilibre et augmente le rendement.

## beer-lambert-calcul · numeric
Une solution a une absorbance $A = 0,60$ dans une cuve de $\pu{1,0 cm}$. Le coefficient d'absorption molaire vaut $\varepsilon = \pu{1,2e4 L.mol-1.cm-1}$. Quelle est la concentration, en micromoles par litre ?

= 50 ± 1

> $c = \dfrac{A}{\varepsilon\,\ell} = \dfrac{0,60}{1,2 \times 10^4 \times 1,0} = \pu{5,0e-5 mol.L-1}$, soit $\pu{50 \mu mol.L-1}$. La loi de Beer-Lambert n'est valable que pour des solutions diluées.

## pile-electrons · single
Dans une pile cuivre-zinc, le zinc est oxydé et les ions cuivre(II) sont réduits. Comment circulent les électrons dans le circuit extérieur ?

- [x] De l'électrode de zinc vers l'électrode de cuivre
- [ ] De l'électrode de cuivre vers l'électrode de zinc
- [ ] Dans le pont salin
- [ ] Ils ne circulent pas

> L'oxydation du zinc, $\ce{Zn -> Zn^2+ + 2e-}$, libère des électrons à l'anode (borne −) ; ils traversent le circuit extérieur et sont consommés à la cathode (borne +) par $\ce{Cu^2+ + 2e- -> Cu}$. Dans le pont salin, ce sont des ions qui circulent, pas des électrons.

## groupe-carbonyle · single
À quelle famille appartient la molécule ci-dessous ?

![formule topologique de la propanone, CH3-CO-CH3](smiles:CC(C)=O)

- [x] Cétone
- [ ] Aldéhyde
- [ ] Alcool
- [ ] Acide carboxylique

> Le groupe carbonyle $\ce{C=O}$ est porté par un atome de carbone lié à deux autres atomes de carbone : c'est une cétone, ici la propanone (l'acétone). Dans un aldéhyde, le groupe carbonyle est en bout de chaîne, lié à un atome d'hydrogène.
