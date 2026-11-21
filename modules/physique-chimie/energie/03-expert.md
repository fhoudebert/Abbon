---
id: energie-03
title: { fr: "L'énergie : niveau expert" }
description: { fr: "Gaz parfait à volume constant, masse d'air, résistances thermiques en série, isolation, refroidissement et chauffage selon Newton, stockage d'énergie" }
level: expert
tags: [physique, bac, prog-2019]
---

## pneu-chauffe · numeric
Un pneu est gonflé à $\pu{2,0 bar}$ à 20 °C. Après un trajet, l'air qu'il contient est à 50 °C. En supposant son volume constant, quelle est sa pression, en bars ?

= 2,20 ± 0,02 bar

> À $n$ et $V$ constants, $\dfrac{P}{T}$ est constant : $P_2 = P_1\,\dfrac{T_2}{T_1} = 2,0 \times \dfrac{323,15}{293,15} \approx \pu{2,20 bar}$. En degrés Celsius, on obtiendrait à tort $\pu{5 bar}$ : les températures doivent être en kelvins.

## masse-air · numeric
Quelle est la masse de l'air d'une pièce de $\pu{50 m3}$, à 20 °C et sous $\pu{1,013e5 Pa}$, en kilogrammes ? (Air assimilé à un gaz parfait de masse molaire $\pu{29 g.mol-1}$, $R = \pu{8,314 J.mol-1.K-1}$.)

= 60 ± 1 kg

> $n = \dfrac{P\,V}{R\,T} = \dfrac{\pu{1,013e5} \times 50}{8,314 \times 293,15} \approx \pu{2,08e3 mol}$, puis $m = n\,M \approx 2078 \times \pu{0,029 kg} \approx \pu{60 kg}$. L'air d'une pièce pèse autant qu'une personne.

## double-vitrage · numeric
Une fenêtre est assimilée à deux résistances thermiques en série, de $\pu{0,02 K.W-1}$ et de $\pu{0,05 K.W-1}$. L'écart de température entre l'intérieur et l'extérieur vaut 20 °C. Quel est le flux thermique, en watts ?

= 286 ± 2 W

> En série, les résistances s'additionnent : $R = \pu{0,07 K.W-1}$. $\Phi = \dfrac{\Delta T}{R} = \dfrac{20}{0,07} \approx \pu{286 W}$. Un écart de 20 °C vaut un écart de 20 K.

## isolation · numeric
Un mur de $\pu{10 m2}$ est fait de $\pu{20 cm}$ de béton ($\lambda = \pu{0,8 W.m-1.K-1}$), doublé de $\pu{10 cm}$ d'isolant ($\lambda = \pu{0,04 W.m-1.K-1}$). L'écart de température vaut 15 °C. Quel est le flux thermique à travers le mur, en watts ?

= 54,5 ± 0,5 W

> $R_{\text{béton}} = \dfrac{e}{\lambda\,S} = \dfrac{0,20}{0,8 \times 10} = \pu{0,025 K.W-1}$ et $R_{\text{isolant}} = \dfrac{0,10}{0,04 \times 10} = \pu{0,25 K.W-1}$. En série : $R = \pu{0,275 K.W-1}$, $\Phi = \dfrac{15}{0,275} \approx \pu{54,5 W}$, contre $\pu{600 W}$ sans isolant : 10 cm d'isolant résistent dix fois plus que 20 cm de béton.

## demi-ecart · numeric
Un objet refroidit selon la loi de Newton, avec une constante de temps $\tau = \pu{10 min}$. Au bout de combien de temps son écart de température avec l'air ambiant est-il divisé par deux, en minutes ?

= 6,9 ± 0,1 min

> $T - T_{\text{ext}} = (T_0 - T_{\text{ext}})\,e^{-t/\tau}$ ; l'écart est divisé par deux quand $e^{-t/\tau} = \dfrac{1}{2}$, soit $t = \tau\ln 2 \approx \pu{6,9 min}$. Il faut à nouveau 6,9 min pour le diviser encore par deux, quelle que soit la température de départ.

## constante-temps-mesuree · numeric
Un café passe de 90 °C à 50 °C en 10 minutes dans une pièce à 20 °C. En supposant que la loi de Newton s'applique, quelle est la constante de temps du refroidissement, en minutes ?

= 11,8 ± 0,1 min

> Les écarts à la température ambiante valent 70 °C puis 30 °C : $\dfrac{30}{70} = e^{-10/\tau}$, d'où $\tau = \dfrac{10}{\ln(7/3)} \approx \pu{11,8 min}$. Raisonner sur la température elle-même, et non sur l'écart, est l'erreur à éviter.

## chauffage-expression · expression
Un plat à 20 °C est placé dans un four à 200 °C. On admet que sa température suit la loi de Newton avec une constante de temps de 15 minutes. Écrivez sa température $T$, en °C, en fonction du temps $t$ en minutes.

= $200 - 180e^{-\frac{t}{15}}$

> Même loi qu'au refroidissement : $T(t) = T_{\text{four}} + (T_0 - T_{\text{four}})\,e^{-t/\tau} = 200 + (20 - 200)\,e^{-t/15}$. Vérifications : $T(0) = 20$ et $T \to 200$.

## ballon-eau-chaude · numeric
L'eau d'un ballon de 200 L refroidit de 60 °C à 40 °C. Quelle énergie a-t-elle cédée, en kilowattheures ? ($c_{\text{eau}} = \pu{4180 J.kg-1.K-1}$, masse volumique $\pu{1 kg.L-1}$, $\pu{1 kWh} = \pu{3,6e6 J}$.)

= 4,64 ± 0,02 kWh

> $Q = m\,c\,\Delta T = 200 \times 4180 \times 20 \approx \pu{1,67e7 J}$, soit $\dfrac{\pu{1,67e7}}{\pu{3,6e6}} \approx \pu{4,64 kWh}$. Le kilowattheure est l'unité des factures : $\pu{1 kWh}$, c'est un appareil de $\pu{1 kW}$ pendant une heure.

## premier-principe-gaz · single
Un gaz parfait est comprimé lentement à température constante. Il reçoit un travail $W > 0$. Que peut-on dire du transfert thermique $Q$ ?

- [x] $Q = -W$ : le gaz cède à l'extérieur autant d'énergie qu'il reçoit de travail
- [ ] $Q = 0$, puisque la température ne change pas
- [ ] $Q = W$
- [ ] $Q > 0$ : le gaz est chauffé par la compression

> L'énergie interne d'un gaz parfait ne dépend que de sa température : $\Delta U = 0$. Le premier principe $\Delta U = W + Q$ donne $Q = -W < 0$. Température constante ne veut pas dire « pas d'échange thermique ».

## bouteille-isotherme · single
Comment une bouteille isotherme (double paroi sous vide, faces argentées) limite-t-elle les transferts thermiques ?

- [x] Le vide supprime la conduction et la convection, les faces argentées réduisent le rayonnement
- [ ] Le vide supprime le rayonnement, les faces argentées la conduction
- [ ] Le vide supprime les trois modes de transfert
- [ ] Les faces argentées absorbent la chaleur

> Conduction et convection ont besoin de matière : le vide les arrête. Le rayonnement traverse le vide, mais une surface réfléchissante le renvoie en grande partie. Les pertes restantes passent surtout par le bouchon et le col.
