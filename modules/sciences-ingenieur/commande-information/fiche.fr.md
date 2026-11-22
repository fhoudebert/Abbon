## Asservissements

- **Boucle fermée** : capteur, comparateur (écart = consigne − mesure), correcteur ; compense les perturbations.
- Performances : **stabilité** (dépassement), **précision** (écart statique), **rapidité** ($t_{5\%}$ ; premier ordre : $t_{5\%} \approx 3\tau$).
- Retour unitaire, gain statique $K$ en boucle ouverte, sans intégrateur : écart statique $\dfrac{1}{1+K}$.
- Correcteur **PID** : proportionnel (rapidité), intégral (annule l'écart statique), dérivé (stabilité).

## Commande de l'énergie

- **MLI** (hacheur) : $\langle u \rangle = \alpha\,U$, avec $\alpha$ le rapport cyclique.

## Information numérique

- Binaire : $1101_2 = 13$ ; un octet code 0 à 255 (FF en hexadécimal).
- **CAN** de $n$ bits sur une plage $V$ : $2^n$ valeurs, quantum $q = V / 2^n$ (10 bits, 5 V : 4,88 mV).
- Échantillonnage : $f_e = 1/T_e$ ; Shannon : $f_e \ge 2 f_{max}$.
- Logique : ET ($\cdot$), OU ($+$), NON (barre) ; table de vérité.

## Réseaux et intelligence artificielle

- IPv4 et masque : partie réseau, partie machine (/24 : 255.255.255.0) ; routeur entre réseaux.
- Apprentissage supervisé : données étiquetées, entraînement, test sur des données nouvelles ; biais des données.
