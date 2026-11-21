---
id: ondes-signaux-03
title: { fr: "Ondes et signaux : niveau expert" }
description: { fr: "Doppler exact, niveaux sonores, mesure de longueur d'onde, diffraction, grandissement, circuit RC, flux de photons" }
level: expert
tags: [physique, bac, prog-2019]
---

## doppler-exact · numeric
Une ambulance émet un son de $\pu{440 Hz}$ et s'approche d'un piéton immobile à $\pu{20 m.s-1}$. Quelle fréquence le piéton perçoit-il, en hertz ? (Célérité du son : $\pu{340 m.s-1}$ ; pour une source qui s'approche, $f_R = f_E\,\dfrac{c}{c - v}$.)

= 467,5 ± 0,5 Hz

> $f_R = 440 \times \dfrac{340}{320} = \pu{467,5 Hz}$ : le son est plus aigu. L'approximation $\Delta f \approx f\,\dfrac{v}{c}$ donnerait $\pu{25,9 Hz}$ au lieu de $\pu{27,5 Hz}$ : à $\pu{20 m.s-1}$, elle commence à s'écarter.

## deux-sources-db · numeric
Une machine produit un niveau sonore de $\pu{60 dB}$ à un endroit donné. On en met en marche une seconde, identique, à la même distance. Quel est le niveau sonore total, en décibels ?

= 63 ± 0,1 dB

> Ce sont les intensités qui s'ajoutent, pas les niveaux : $I$ double, et $L = 10\log\dfrac{2I}{I_0} = 60 + 10\log 2 \approx \pu{63 dB}$. Doubler la source n'ajoute que 3 dB.

## attenuation · numeric
Un mur fait passer le niveau sonore de $\pu{80 dB}$ à $\pu{60 dB}$. Par combien l'intensité sonore a-t-elle été divisée ?

= 100

> $L_1 - L_2 = 10\log\dfrac{I_1}{I_2} = \pu{20 dB}$, donc $\dfrac{I_1}{I_2} = 10^2 = 100$. Chaque tranche de 10 dB correspond à un facteur 10 sur l'intensité.

## mesure-lambda · numeric
Avec des fentes d'Young distantes de $\pu{0,60 mm}$ et un écran à $\pu{1,50 m}$, on mesure $\pu{13 mm}$ pour 10 interfranges. Quelle est la longueur d'onde de la lumière, en nanomètres ?

= 520 ± 5 nm

> On mesure plusieurs interfranges pour réduire l'incertitude : $i = \pu{1,3 mm}$. Puis $\lambda = \dfrac{i\,b}{D} = \dfrac{\pu{1,3e-3} \times \pu{0,60e-3}}{1,50} = \pu{5,2e-7 m}$, soit $\pu{520 nm}$ (lumière verte).

## largeur-fente · numeric
Un laser de $\pu{633 nm}$ éclaire une fente fine ; sur un écran à $\pu{2,0 m}$, la tache centrale de diffraction mesure $\pu{3,0 cm}$ de large. Quelle est la largeur de la fente, en micromètres ?

= 84 ± 1 µm

> La tache centrale a pour largeur $L = 2D\tan\theta \approx 2D\,\dfrac{\lambda}{a}$, d'où $a = \dfrac{2\,\lambda\,D}{L} = \dfrac{2 \times \pu{633e-9} \times 2,0}{0,030} \approx \pu{8,4e-5 m}$. Le facteur 2 (la tache s'étend de part et d'autre de l'axe) est souvent oublié.

## grandissement · numeric
Un objet est placé à $\pu{30 cm}$ devant une lentille convergente de distance focale $\pu{20 cm}$ ($\overline{OA} = \pu{-30 cm}$). Quel est le grandissement $\gamma$ ?

= -2 ± 0,05

> Conjugaison : $\dfrac{1}{\overline{OA'}} = \dfrac{1}{20} + \dfrac{1}{-30} = \dfrac{1}{60}$, donc $\overline{OA'} = \pu{60 cm}$. Puis $\gamma = \dfrac{\overline{OA'}}{\overline{OA}} = \dfrac{60}{-30} = -2$ : l'image est renversée et deux fois plus grande.

## charge-99 · numeric
Un condensateur de $\pu{100 \mu F}$ se charge à travers une résistance de $\pu{10 k\Omega}$. Au bout de combien de temps atteint-il 99 % de sa tension finale, en secondes ?

= 4,6 ± 0,05 s

> $\tau = R\,C = \pu{1,0 s}$. $u_C = E\left(1 - e^{-t/\tau}\right) = 0,99\,E$ donne $e^{-t/\tau} = 0,01$, soit $t = \tau\ln 100 \approx 4,6\,\tau = \pu{4,6 s}$. D'où la règle pratique : charge quasi complète au bout de 5 $\tau$.

## charge-expression · expression
Un condensateur déchargé est relié à $t = 0$ à un générateur de $\pu{5 V}$ à travers une résistance ; la constante de temps vaut $\pu{2 s}$. Écrivez la tension à ses bornes, en volts, en fonction de $t$ en secondes : $u_C(t) = \dots$

= $5\left(1 - e^{-\frac{t}{2}}\right)$

> La solution de $\tau\,\dfrac{\mathrm{d}u_C}{\mathrm{d}t} + u_C = E$ avec $u_C(0) = 0$ est $u_C = E\left(1 - e^{-t/\tau}\right) = 5 - 5e^{-t/2}$. Vérifications : $u_C(0) = 0$, et $u_C \to 5$.

## energie-condensateur-calcul · numeric
Quelle énergie stocke un condensateur de $\pu{1,0 mF}$ chargé sous $\pu{12 V}$, en joules ?

= 0,072 ± 0,001 J

> $E = \dfrac{1}{2}C\,u_C^2 = \dfrac{1}{2} \times \pu{1,0e-3} \times 12^2 = \pu{0,072 J}$. Attention : le millifarad vaut $\pu{1e-3 F}$, et la tension est au carré.

## flux-photons · numeric
Un laser de $\pu{1,0 mW}$ émet à $\pu{633 nm}$. Combien de photons émet-il par seconde ? ($h = \pu{6,63e-34 J.s}$, $c = \pu{3,00e8 m.s-1}$.)

= 3,18e15 ± 0,05e15

> Chaque photon emporte $E = \dfrac{h\,c}{\lambda} \approx \pu{3,14e-19 J}$. Le nombre de photons par seconde vaut $N = \dfrac{P}{E} = \dfrac{P\,\lambda}{h\,c} \approx \pu{3,2e15}$ : même un faible laser émet un nombre colossal de photons.
