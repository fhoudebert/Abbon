## Décrire un mouvement

- Vitesse et accélération sont les dérivées successives de la position : $\vec v = \dfrac{\mathrm{d}\overrightarrow{OM}}{\mathrm{d}t}$, $\vec a = \dfrac{\mathrm{d}\vec v}{\mathrm{d}t}$.
- **Rectiligne uniforme** : $\vec v$ constant, $\vec a = \vec 0$, $x(t) = v_0\,t + x_0$.
- **Rectiligne uniformément varié** : $a$ constante, $v(t) = a\,t + v_0$, $x(t) = \frac{1}{2}a\,t^2 + v_0\,t + x_0$.
- **Circulaire uniforme** : vitesse de valeur constante, accélération centripète de valeur $a = \dfrac{v^2}{R}$.

## Lois de Newton (référentiel galiléen)

1. Si $\sum \vec F = \vec 0$, le centre de masse est immobile ou en mouvement rectiligne uniforme (et réciproquement).
2. $\sum \vec F = m\,\vec a$ (deuxième loi), ou $\sum \vec F = \dfrac{\mathrm{d}\vec p}{\mathrm{d}t}$ avec $\vec p = m\,\vec v$.
3. Action et réaction : $\vec F_{A/B} = -\vec F_{B/A}$.

Système isolé ou pseudo-isolé : sa quantité de mouvement $\vec p$ se conserve (recul, propulsion par réaction).

## Mouvement dans un champ uniforme

**Pesanteur**, frottements négligés : $\vec a = \vec g$. Pour un lancer avec $\vec v_0$ faisant l'angle $\alpha$ avec l'horizontale, axe $(Oy)$ vers le haut :

$$x(t) = v_0\cos\alpha\;t$$

$$y(t) = -\frac{1}{2}g\,t^2 + v_0\sin\alpha\;t + y_0$$

Équation de la trajectoire : on élimine $t = \dfrac{x}{v_0\cos\alpha}$ ; pour un lancer horizontal depuis la hauteur $h$, $y = h - \dfrac{g\,x^2}{2\,v_0^2}$. Durée de vol sur sol horizontal : $\dfrac{2\,v_0\sin\alpha}{g}$.

La trajectoire est une parabole (un segment de droite si le lancer est vertical). Portée sur sol horizontal : $\dfrac{v_0^2\sin(2\alpha)}{g}$, maximale pour 45° ; hauteur atteinte par un lancer vertical : $\dfrac{v_0^2}{2g}$.

**Champ électrique** : $\vec F = q\,\vec E$, donc $\vec a = \dfrac{q\,\vec E}{m}$ ; même calcul que dans le champ de pesanteur (accélérateur de particules, déviation).

## Gravitation, satellites, Kepler

- Force de gravitation : $F = G\,\dfrac{m_A\,m_B}{d^2}$, avec $G = \pu{6,67e-11 N.m2.kg-2}$.
- Satellite en orbite circulaire de rayon $r$ autour d'un astre de masse $M$ : $v = \sqrt{\dfrac{G\,M}{r}}$, $T = \dfrac{2\pi r}{v}$.
- Lois de Kepler : orbites elliptiques dont l'astre est un foyer ; loi des aires (vitesse maximale au **périhélie**, point le plus proche du Soleil, minimale à l'**aphélie**, le plus éloigné) ; $\dfrac{T^2}{a^3} = \dfrac{4\pi^2}{G\,M}$, la même pour tous les satellites d'un même astre. Rayon multiplié par 4 : période multipliée par 8.
- Aux extrémités du grand axe, la loi des aires s'écrit $r_P\,v_P = r_A\,v_A$. Satellite géostationnaire : $T = \pu{86164 s}$, altitude d'environ $\pu{35 800 km}$ (le rayon de l'orbite se compte depuis le centre de la Terre).
- Particule de charge $q$ accélérée par une tension $U$ : elle gagne l'énergie cinétique $|q\,U|$, soit $\pu{1 eV}$ par charge $e$ et par volt.

## Énergie

- $E_c = \frac{1}{2}m\,v^2$ ; $E_{pp} = m\,g\,z$ (axe vertical vers le haut) ; $E_m = E_c + E_{pp}$.
- Travail d'une force constante : $W_{AB}(\vec F) = \vec F \cdot \overrightarrow{AB} = F \times AB \times \cos\theta$.
- Théorème de l'énergie cinétique : $\Delta E_c = \sum W(\vec F)$.
- Sans frottements, l'énergie mécanique se conserve ; avec frottements, elle diminue.

## Unités

| Grandeur | Unité SI |
| --- | --- |
| Force | newton, $\pu{1 N} = \pu{1 kg.m.s-2}$ |
| Quantité de mouvement | $\pu{kg.m.s-1}$ |
| Énergie, travail | joule, $\pu{1 J} = \pu{1 kg.m2.s-2}$ |
| Vitesse | $\pu{m.s-1}$ ; $\pu{1 m.s-1} = \pu{3,6 km.h-1}$ |

## Pièges classiques

- Le signe de $g$ dépend de l'orientation de l'axe : vérifier l'orientation avant d'intégrer.
- Un mouvement circulaire « uniforme » a une accélération non nulle.
- Convertir les kilomètres et les km/h avant tout calcul ; travailler en radians pour les angles.
- Oublier le carré de la vitesse dans $E_c$ : doubler $v$ quadruple $E_c$.
