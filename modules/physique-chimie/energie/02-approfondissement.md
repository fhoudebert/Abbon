---
id: energie-02
title: { fr: "L'énergie : conversions et transferts, approfondissement" }
description: { fr: "Gaz parfait, bilans d'énergie, mélange, chauffage, résistances thermiques, loi de Newton à écrire" }
level: approfondissement
tags: [physique, bac, prog-2019]
---

## compression-isotherme · numeric
Un gaz parfait sous $\pu{100 kPa}$ est comprimé à température constante jusqu'à la moitié de son volume. Quelle est sa nouvelle pression, en kilopascals ?

= 200

> À $n$ et $T$ constants, $P\,V = n\,R\,T$ est constant : $P_1 V_1 = P_2 V_2$, donc $P_2 = P_1\,\dfrac{V_1}{V_2} = 100 \times 2 = \pu{200 kPa}$ (loi de Boyle-Mariotte).

## quantite-gaz · numeric
Un récipient de $\pu{10 L}$ contient un gaz parfait sous $\pu{2,0e5 Pa}$ à $\pu{300 K}$. Quelle quantité de matière contient-il, en moles ? ($R = \pu{8,314 J.mol-1.K-1}$.)

= 0,80 ± 0,01

> $n = \dfrac{P\,V}{R\,T} = \dfrac{2,0 \times 10^5 \times 10 \times 10^{-3}}{8,314 \times 300} \approx \pu{0,80 mol}$. Le volume doit être converti en mètres cubes : $\pu{10 L} = \pu{1,0e-2 m3}$.

## bilan-signes · numeric
Un système reçoit un travail de $\pu{200 J}$ et cède $\pu{500 J}$ par transfert thermique. Quelle est la variation de son énergie interne, en joules ?

= -300

> Avec la convention « reçu > 0 » : $W = \pu{+200 J}$ et $Q = \pu{-500 J}$, donc $\Delta U = W + Q = \pu{-300 J}$. L'énergie interne diminue : le système cède plus qu'il ne reçoit.

## melange · numeric
On mélange $\pu{200 g}$ d'eau à 80 °C et $\pu{300 g}$ d'eau à 20 °C, dans un récipient isolé dont on néglige la capacité thermique. Quelle est la température finale, en degrés Celsius ?

= 44 ± 0,5

> Le système isolé ne reçoit rien : la somme des transferts est nulle, $m_1\,c\,(T_f - T_1) + m_2\,c\,(T_f - T_2) = 0$. D'où $T_f = \dfrac{m_1 T_1 + m_2 T_2}{m_1 + m_2} = \dfrac{0,2 \times 80 + 0,3 \times 20}{0,5} = \pu{44 °C}$ : une moyenne pondérée par les masses.

## bouilloire · numeric
Une bouilloire de $\pu{2000 W}$ chauffe $\pu{1,0 kg}$ d'eau de 20 °C à 100 °C. En supposant que toute l'énergie électrique chauffe l'eau, combien de temps faut-il, en secondes ? ($c_{\text{eau}} = \pu{4180 J.kg-1.K-1}$.)

= 167 ± 2

> Énergie nécessaire : $Q = m\,c\,\Delta T = 1,0 \times 4180 \times 80 \approx \pu{3,34e5 J}$. Durée : $\Delta t = \dfrac{Q}{P} = \dfrac{3,34 \times 10^5}{2000} \approx \pu{167 s}$, un peu moins de 3 minutes. En réalité, une partie de l'énergie chauffe la bouilloire et l'air : il faut un peu plus longtemps.

## resistance-paroi · numeric
Quelle est la résistance thermique d'un mur de béton de $\pu{20 cm}$ d'épaisseur et de $\pu{10 m2}$ de surface, en $\pu{K.W-1}$ ? (Conductivité du béton : $\lambda = \pu{0,80 W.m-1.K-1}$.)

= 0,025 ± 0,001

> Pour une paroi plane, $R_{\text{th}} = \dfrac{e}{\lambda\,S} = \dfrac{0,20}{0,80 \times 10} = \pu{0,025 K.W-1}$. Une paroi isole d'autant mieux qu'elle est épaisse et faite d'un matériau peu conducteur.

## flux-isole · numeric
On double ce mur d'une couche d'isolant de $\pu{10 cm}$ ($\lambda = \pu{0,040 W.m-1.K-1}$, même surface). Quel est le flux thermique qui le traverse pour un écart de 20 °C entre l'intérieur et l'extérieur, en watts ?

= 73 ± 1

> Isolant : $R = \dfrac{0,10}{0,040 \times 10} = \pu{0,25 K.W-1}$, dix fois plus que le béton. Les deux couches sont traversées l'une après l'autre : $R_{\text{tot}} = 0,025 + 0,25 = \pu{0,275 K.W-1}$, et $\Phi = \dfrac{20}{0,275} \approx \pu{73 W}$, contre $\pu{800 W}$ sans isolant.

## newton-expression · expression
Un café à 90 °C refroidit dans une pièce à 20 °C ; il suit la loi de Newton avec une constante de temps de 10 minutes. Écrivez sa température $T(t)$, en degrés Celsius, avec $t$ en minutes.

= $20 + 70e^{-\frac{t}{10}}$

> La solution de $\dfrac{\mathrm{d}T}{\mathrm{d}t} = -\dfrac{1}{\tau}(T - T_{\text{ext}})$ est $T(t) = T_{\text{ext}} + (T_0 - T_{\text{ext}})\,e^{-t/\tau}$, ici $20 + 70\,e^{-t/10}$. Les écritures équivalentes sont acceptées, par exemple $70\exp(-0,1t) + 20$.

## newton-valeur · numeric
Avec la même loi, quelle est la température du café au bout de 10 minutes, en degrés Celsius ?

= 46 ± 1

> $T(10) = 20 + 70\,e^{-1} \approx 20 + 25,8 \approx \pu{46 °C}$. Au bout d'une constante de temps, l'écart à la température extérieure a été divisé par $e$ : il en reste 37 %.

## isotherme · single
Un gaz parfait subit une transformation à température constante. Que peut-on dire des échanges d'énergie ?

- [x] $\Delta U = 0$, donc $Q = -W$
- [ ] $Q = 0$, donc $\Delta U = W$
- [ ] $W = 0$, donc $\Delta U = Q$
- [ ] $Q = W$

> L'énergie interne d'un gaz parfait ne dépend que de sa température : à température constante, $\Delta U = 0$. Le premier principe donne alors $W + Q = 0$ : le travail reçu en le comprimant est intégralement cédé sous forme de transfert thermique.
