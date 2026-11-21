## Ondes périodiques

- Période $T$ (s), fréquence $f = \dfrac{1}{T}$ (Hz), longueur d'onde $\lambda = v\,T = \dfrac{v}{f}$ (m), $v$ célérité de l'onde.
- Ordres de grandeur : son dans l'air, $v \approx \pu{340 m.s-1}$ ; lumière dans le vide, $c = \pu{3,00e8 m.s-1}$.
- Niveau d'intensité sonore : $L = 10\log\dfrac{I}{I_0}$ en dB, avec $I_0 = \pu{1,0e-12 W.m-2}$. Doubler l'intensité ajoute environ 3 dB.

## Diffraction et interférences

- **Diffraction** par une fente de largeur $a$ : écart angulaire $\theta = \dfrac{\lambda}{a}$ (en radians). Marquée quand $a$ est de l'ordre de $\lambda$ ou plus petite.
- **Interférences** de deux ondes cohérentes, différence de marche $\delta$ : constructives si $\delta = k\,\lambda$, destructives si $\delta = \left(k + \frac{1}{2}\right)\lambda$, $k$ entier.
- Fentes d'Young, distantes de $b$, écran à la distance $D$ : interfrange $i = \dfrac{\lambda\,D}{b}$.

## Effet Doppler

- Une source qui s'approche est perçue avec une fréquence plus élevée (son plus aigu), une source qui s'éloigne avec une fréquence plus basse.
- Pour une vitesse $v$ petite devant la célérité $c$ de l'onde : $|\Delta f| \approx f \times \dfrac{v}{c}$.
- Usages : radars de vitesse, échographie Doppler, vitesse des étoiles (décalage vers le rouge).

## Optique

- Vergence d'une lentille : $C = \dfrac{1}{f'}$, en dioptries, avec $f'$ **en mètres**.
- Relation de conjugaison (grandeurs algébriques) : $\dfrac{1}{\overline{OA'}} - \dfrac{1}{\overline{OA}} = \dfrac{1}{f'}$ ; grandissement $\gamma = \dfrac{\overline{OA'}}{\overline{OA}}$.
- Lunette astronomique afocale : le foyer image de l'objectif coïncide avec le foyer objet de l'oculaire ; grossissement $G = \dfrac{f'_1}{f'_2}$.

## Lumière et photons

- Énergie d'un photon : $E = h\,\nu = \dfrac{h\,c}{\lambda}$, avec $h = \pu{6,63e-34 J.s}$ ; $\pu{1 eV} = \pu{1,60e-19 J}$.
- Effet photoélectrique : un photon arrache un électron s'il apporte au moins le travail d'extraction $W$ ; l'électron sort avec $E_{c,\max} = h\,\nu - W$.

## Circuits électriques

- Puissance $P = U\,I$ (W) ; énergie $E = P\,\Delta t$, en joules si $\Delta t$ est en secondes ; $\pu{1 kWh} = \pu{3,6e6 J}$.
- Résistances : en série, $R = R_1 + R_2$ ; en dérivation, $\dfrac{1}{R} = \dfrac{1}{R_1} + \dfrac{1}{R_2}$.
- **Condensateur** : $q = C\,u_C$ (capacité en farads), $i = \dfrac{\mathrm{d}q}{\mathrm{d}t} = C\,\dfrac{\mathrm{d}u_C}{\mathrm{d}t}$, énergie $E = \frac{1}{2}C\,u_C^2$.
- **Circuit RC** soumis à un échelon de tension $E$ : $\tau = R\,C$, charge $u_C(t) = E\left(1 - e^{-t/\tau}\right)$, décharge $u_C(t) = E\,e^{-t/\tau}$. À $t = \tau$ : 63 % de la charge ; à $5\tau$ : plus de 99 %.

## Pièges classiques

- Laisser $f'$ en centimètres dans le calcul de la vergence.
- Confondre période et fréquence, ou oublier de convertir les ms et les kHz.
- Additionner les résistances en dérivation : ce sont leurs inverses qui s'ajoutent.
- Confondre la charge $q = C\,u_C$ et l'énergie $\frac{1}{2}C\,u_C^2$ ; confondre $\tau$ et $t_{1/2}$.
