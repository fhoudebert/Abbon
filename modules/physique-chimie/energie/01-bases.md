---
id: energie-01
title: { fr: "L'énergie : conversions et transferts, les bases" }
description: { fr: "Gaz parfait, température absolue, premier principe, capacité thermique, transferts thermiques, bilan radiatif" }
level: bases
tags: [physique, bac, prog-2019]
---

## gaz-parfait · numeric
Quel volume occupe $\pu{1,0 mol}$ de gaz parfait à $\pu{293 K}$ sous $\pu{1,013e5 Pa}$, en litres ? ($R = \pu{8,314 J.mol-1.K-1}$.)

= 24,0 ± 0,2

> $P\,V = n\,R\,T$, donc $V = \dfrac{n\,R\,T}{P} = \dfrac{1,0 \times 8,314 \times 293}{1,013 \times 10^5} \approx \pu{2,40e-2 m3}$, soit $\pu{24,0 L}$. Dans cette loi, la pression est en pascals, le volume en mètres cubes et la température en kelvins.

## kelvin · numeric
À combien de kelvins correspond une température de 25 °C (à 1 K près) ?

= 298 ± 1

> $T(\mathrm{K}) = \theta(°\mathrm{C}) + 273,15$, soit $\pu{298 K}$. La température absolue ne peut pas être négative : le zéro absolu vaut $-273,15$ °C. Les lois des gaz s'écrivent toujours avec la température en kelvins.

## premier-principe · single
Que dit le premier principe de la thermodynamique pour un système fermé au repos, qui reçoit un travail $W$ et un transfert thermique $Q$ ?

- [x] $\Delta U = W + Q$
- [ ] $\Delta U = W - Q$
- [ ] $\Delta U = 0$
- [ ] $W = Q$

> La variation d'énergie interne est égale à l'énergie reçue de l'extérieur, sous forme de travail et de transfert thermique : $\Delta U = W + Q$. Par convention, $W$ et $Q$ sont positifs quand le système les reçoit, négatifs quand il les cède.

## capacite-thermique · numeric
Quelle énergie faut-il pour chauffer 1,0 kg d'eau de 20 °C à 40 °C, en kilojoules ? ($c_{\text{eau}} = \pu{4180 J.kg-1.K-1}$.)

= 84 ± 1

> Pour un solide ou un liquide, $\Delta U = Q = m\,c\,\Delta T = 1,0 \times 4180 \times 20 = \pu{8,36e4 J}$, soit environ $\pu{84 kJ}$. Un écart de 20 °C est aussi un écart de 20 K.

## modes-transfert · single
Quel mode de transfert thermique peut se faire dans le vide ?

- [x] Le rayonnement
- [ ] La conduction
- [ ] La convection
- [ ] Aucun

> La conduction se fait de proche en proche dans la matière, sans déplacement d'ensemble ; la convection, par un déplacement de fluide. Le rayonnement (ondes électromagnétiques) se propage aussi dans le vide : c'est ainsi que l'énergie du Soleil nous parvient.

## flux-thermique · numeric
Une paroi de résistance thermique $R_{\text{th}} = \pu{0,050 K.W-1}$ sépare deux milieux dont les températures diffèrent de 15 K. Quel est le flux thermique qui la traverse, en watts ?

= 300

> $\Phi = \dfrac{\Delta T}{R_{\text{th}}} = \dfrac{15}{0,050} = \pu{300 W}$, du milieu chaud vers le milieu froid. Plus la résistance thermique est grande, plus la paroi isole.

## resistances-serie · single
Un mur est fait de deux couches de résistances thermiques $R_1$ et $R_2$, traversées l'une après l'autre. Quelle est la résistance thermique du mur ?

- [x] $R_1 + R_2$
- [ ] $\dfrac{R_1\,R_2}{R_1 + R_2}$
- [ ] La plus grande des deux
- [ ] $R_1 \times R_2$

> Le même flux traverse les deux couches, et les écarts de température s'ajoutent : les résistances thermiques en série s'additionnent, comme des résistances électriques en série. C'est pourquoi on ajoute une couche d'isolant.

## convention-signe · single
Une tasse de thé chaud refroidit dans une pièce. Pour le système « thé », quel est le signe du transfert thermique $Q$ ?

- [x] Négatif : le thé cède de l'énergie
- [ ] Positif : le thé reçoit de l'énergie
- [ ] Nul
- [ ] Il dépend de la masse du thé

> Le transfert thermique va spontanément du corps chaud vers le corps froid : le thé cède de l'énergie à l'air, donc $Q < 0$ pour lui, et son énergie interne diminue ($\Delta U = Q < 0$, sans travail).

## refroidissement · single
D'après la loi phénoménologique de Newton, comment évolue l'écart de température $T - T_{\text{ext}}$ entre un objet chaud et l'air qui l'entoure ?

- [x] Il décroît exponentiellement vers 0
- [ ] Il décroît linéairement jusqu'à 0
- [ ] Il reste constant
- [ ] Il oscille autour de 0

> Le flux cédé est proportionnel à l'écart de température. Le bilan d'énergie donne l'équation différentielle $\dfrac{\mathrm{d}T}{\mathrm{d}t} = -\dfrac{1}{\tau}\,(T - T_{\text{ext}})$, de solution $T - T_{\text{ext}} = (T_0 - T_{\text{ext}})\,e^{-t/\tau}$ : le refroidissement est rapide au début, puis de plus en plus lent.

## albedo · numeric
La Terre reçoit en moyenne $\pu{340 W.m-2}$ du Soleil et en réfléchit 30 % (albédo de 0,30). Quelle puissance surfacique absorbe-t-elle, en $\pu{W.m-2}$ ?

= 238 ± 2

> Elle absorbe la part non réfléchie : $(1 - 0,30) \times 340 = \pu{238 W.m-2}$. À l'équilibre, elle émet autant qu'elle absorbe ; l'effet de serre renvoie vers le sol une partie de son rayonnement infrarouge et réchauffe la surface.
