## Système et gaz parfait

- Un système thermodynamique est décrit par sa pression $P$ (Pa), son volume $V$ ($\pu{m3}$), sa température absolue $T$ (K) et sa quantité de matière $n$ (mol).
- Température absolue : $T = \theta + 273,15$ ; le zéro absolu vaut $-273,15$ °C.
- **Gaz parfait** : $P\,V = n\,R\,T$, avec $R = \pu{8,314 J.mol-1.K-1}$. Modèle valable pour un gaz peu dense (molécules sans interaction).

## Premier principe

Pour un système fermé au repos, qui reçoit un travail $W$ et un transfert thermique $Q$ :

$$\Delta U = W + Q$$

- Convention : $W$ et $Q$ sont positifs quand le système les **reçoit**.
- Solide ou liquide de masse $m$ et de capacité thermique massique $c$ : $\Delta U = m\,c\,\Delta T$ (en J, avec $c$ en $\pu{J.kg-1.K-1}$). Eau liquide : $c = \pu{4180 J.kg-1.K-1}$.

## Transferts thermiques

- Spontanément, du corps chaud vers le corps froid.
- **Conduction** : de proche en proche, sans déplacement de matière. **Convection** : par déplacement d'un fluide. **Rayonnement** : ondes électromagnétiques, y compris dans le vide.
- Flux thermique (puissance, en W) à travers une paroi : $\Phi = \dfrac{T_{\text{chaud}} - T_{\text{froid}}}{R_{\text{th}}}$ ; énergie transférée $Q = \Phi\,\Delta t$.
- Résistances thermiques traversées l'une après l'autre : elles s'additionnent.

## Loi de Newton du refroidissement

Le flux cédé est proportionnel à l'écart de température avec l'extérieur ; le bilan d'énergie donne

$$\frac{\mathrm{d}T}{\mathrm{d}t} = -\frac{1}{\tau}\left(T - T_{\text{ext}}\right)$$

d'où $T(t) = T_{\text{ext}} + (T_0 - T_{\text{ext}})\,e^{-t/\tau}$ : l'écart décroît exponentiellement.

## Bilan radiatif de la Terre

- Puissance solaire moyenne reçue : environ $\pu{340 W.m-2}$ ; l'albédo (environ 0,30) en est la part réfléchie.
- Puissance absorbée : $(1 - \text{albédo}) \times 340 \approx \pu{238 W.m-2}$ ; à l'équilibre, la Terre en émet autant, dans l'infrarouge.
- L'effet de serre : l'atmosphère absorbe une partie de ce rayonnement infrarouge et en renvoie vers le sol, ce qui élève la température de surface.

## Pièges classiques

- Utiliser des degrés Celsius dans $P\,V = n\,R\,T$, ou des litres au lieu de mètres cubes.
- Se tromper de signe : un système qui cède de l'énergie a $Q < 0$.
- Additionner les résistances thermiques de parois traversées côte à côte (elles sont alors en parallèle).
