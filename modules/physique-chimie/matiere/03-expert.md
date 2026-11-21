---
id: matiere-03
title: { fr: "Constitution et transformations de la matière : niveau expert" }
description: { fr: "pH d'un acide faible, titrages, conductimétrie, cinétique d'ordre 1, décroissance radioactive, électrolyse, spectroscopie infrarouge" }
level: expert
tags: [chimie, bac, prog-2019]
---

## ph-acide-faible · numeric
Quel est le pH d'une solution d'acide éthanoïque à $\pu{0,10 mol.L-1}$ ($\mathrm{p}K_A = 4,76$) ?

= 2,88 ± 0,02

> Avec $x = [\ce{H3O+}]$ : $\dfrac{x^2}{0,10 - x} = 10^{-4,76}$, d'où $x \approx \pu{1,31e-3 mol.L-1}$ et $\mathrm{pH} \approx 2,88$. Un acide fort de même concentration aurait un pH de 1 : à peine plus de 1 % de l'acide éthanoïque a réagi avec l'eau.

## concentration-titree · numeric
On titre $\pu{10,0 mL}$ d'une solution d'acide chlorhydrique par de la soude à $\pu{0,100 mol.L-1}$ ; l'équivalence est atteinte pour $\pu{12,5 mL}$. Quelle est la concentration de l'acide, en $\pu{mol.L-1}$ ?

= 0,125 ± 0,001

> Réaction $\ce{H3O+ + HO- -> 2 H2O}$, mole à mole : à l'équivalence, $c_A\,V_A = c_B\,V_E$, donc $c_A = \dfrac{0,100 \times 12,5}{10,0} = \pu{0,125 mol.L-1}$. Les volumes peuvent rester en millilitres, puisqu'ils figurent des deux côtés.

## conductimetrie · single
Lors du titrage d'une solution d'acide chlorhydrique par de la soude, la conductivité diminue jusqu'à l'équivalence, puis augmente. Pourquoi diminue-t-elle d'abord ?

- [x] Les ions $\ce{H3O+}$, très conducteurs, sont remplacés par des ions $\ce{Na+}$, moins conducteurs
- [ ] Parce que la solution est diluée par la soude versée
- [ ] Parce que des ions $\ce{HO-}$ s'accumulent dans la solution
- [ ] Parce que les ions $\ce{Cl-}$ disparaissent

> Avant l'équivalence, chaque $\ce{HO-}$ versé consomme un $\ce{H3O+}$, et un $\ce{Na+}$ arrive à sa place ; la conductivité ionique molaire de $\ce{H3O+}$ est bien plus grande. Après l'équivalence, les $\ce{HO-}$ (eux aussi très conducteurs) et les $\ce{Na+}$ s'accumulent : elle remonte. Les ions $\ce{Cl-}$ sont spectateurs.

## demi-vie-cinetique · numeric
Une réaction suit une loi de vitesse d'ordre 1 de constante $k = \pu{0,0231 min-1}$. Quel est son temps de demi-réaction, en minutes ?

= 30 ± 0,5 min

> $[A] = [A]_0\,e^{-kt}$ vaut $\dfrac{[A]_0}{2}$ pour $t_{1/2} = \dfrac{\ln 2}{k} = \dfrac{0,693}{0,0231} \approx \pu{30 min}$. Pour un ordre 1, ce temps ne dépend pas de la concentration initiale.

## ordre-1-expression · expression
Le réactif $A$ disparaît selon une loi d'ordre 1, avec $[A]_0 = \pu{0,50 mol.L-1}$ et $k = \pu{0,10 min-1}$. Écrivez $[A]$, en $\pu{mol.L-1}$, en fonction du temps $t$ en minutes.

= $0{,}5e^{-0{,}1t}$

> La loi $v = -\dfrac{\mathrm{d}[A]}{\mathrm{d}t} = k\,[A]$ est une équation différentielle $y' = -k\,y$ : $[A] = [A]_0\,e^{-kt} = 0,5\,e^{-0,1t}$. Le temps de demi-réaction vaut $\ln 2 / 0,1 \approx \pu{6,9 min}$.

## carbone-14 · numeric
Le carbone 14 a une demi-vie de 5730 ans. Un bois ancien n'a plus que 25 % de l'activité d'un bois récent. Quel est son âge, en années ?

= 11460 ± 20

> 25 % $= \left(\dfrac{1}{2}\right)^2$ : deux demi-vies se sont écoulées, soit $2 \times 5730 = 11\,460$ ans. En général, $A = A_0\,e^{-\lambda t}$ avec $\lambda = \dfrac{\ln 2}{t_{1/2}}$, d'où $t = \dfrac{t_{1/2}}{\ln 2}\ln\dfrac{A_0}{A}$.

## electrolyse · numeric
On dépose du cuivre par électrolyse d'une solution de sulfate de cuivre ($\ce{Cu^2+ + 2 e- -> Cu}$), avec un courant de $\pu{2,0 A}$ pendant 30 minutes. Quelle masse de cuivre se dépose, en grammes ? ($F = \pu{96 500 C.mol-1}$, $M(\ce{Cu}) = \pu{63,5 g.mol-1}$.)

= 1,18 ± 0,02 g

> Charge : $Q = I\,\Delta t = 2,0 \times 1800 = \pu{3600 C}$, soit $n(e^-) = \dfrac{Q}{F} \approx \pu{3,73e-2 mol}$. Il faut 2 électrons par atome : $n(\ce{Cu}) \approx \pu{1,87e-2 mol}$, d'où $m \approx \pu{1,18 g}$. Le facteur 2 et la conversion des minutes en secondes sont les deux pièges.

## rendement-esterification · single
Comment augmenter le rendement d'une estérification, transformation non totale ?

- [x] Mettre un réactif en excès, ou éliminer l'eau au fur et à mesure qu'elle se forme
- [ ] Ajouter un catalyseur
- [ ] Chauffer davantage
- [ ] Ajouter de l'eau

> Excès de réactif ou élimination d'un produit : $Q_r$ redevient inférieur à $K$, et le système évolue encore dans le sens direct. Le catalyseur et le chauffage accélèrent l'atteinte de l'équilibre sans changer son état final (pour l'estérification, $K$ varie très peu avec la température). Ajouter de l'eau favoriserait l'hydrolyse de l'ester.

## spectre-ir · single
Un spectre infrarouge présente une bande très large de 2500 à $\pu{3200 cm-1}$ et une bande fine et intense vers $\pu{1710 cm-1}$. À quelle famille appartient la molécule ?

- [x] Acide carboxylique
- [ ] Alcool
- [ ] Cétone
- [ ] Ester

> La bande vers $\pu{1710 cm-1}$ signale une liaison $\ce{C=O}$ ; la bande très large et décalée vers 2500–$\pu{3200 cm-1}$ est celle de la liaison $\ce{O-H}$ d'un acide carboxylique (liaisons hydrogène). Un alcool donne une bande $\ce{O-H}$ large vers 3200–$\pu{3400 cm-1}$ sans $\ce{C=O}$ ; une cétone ou un ester n'ont pas de bande $\ce{O-H}$.

## rapport-especes · numeric
Une solution d'acide éthanoïque ($\mathrm{p}K_A = 4,76$) est ajustée à $\mathrm{pH} = 7,0$. Que vaut le rapport $\dfrac{[\ce{CH3COO-}]}{[\ce{CH3COOH}]}$ ?

= 174 ± 3

> $\mathrm{pH} = \mathrm{p}K_A + \log\dfrac{[\ce{A-}]}{[\ce{AH}]}$, donc le rapport vaut $10^{7,0 - 4,76} = 10^{2,24} \approx 174$ : à pH neutre, l'acide éthanoïque est presque entièrement sous forme d'ion éthanoate.
