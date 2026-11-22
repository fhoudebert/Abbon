---
id: mecanique-energie-01
title: { fr: "Mécanique et énergie" }
description: { fr: "Puissance mécanique et électrique, rendements, réducteurs, vitesse linéaire, énergie d'une batterie, statique, liaisons, contraintes" }
level: bases
tags: [si, sciences-ingenieur, terminale, bac]
---

## puissance-rotation · numeric
Un moteur fournit un couple de 2 N·m à la vitesse angulaire de 150 rad/s. Quelle puissance mécanique délivre-t-il (en W) ?

= 300 ± 1 W

> En rotation, $P = C \times \omega = 2 \times 150 = 300$ W. En translation, l'équivalent est $P = F \times v$. Attention aux unités : $\omega$ en rad/s, pas en tr/min.

## tr-min · single
Comment convertir une vitesse de rotation $N$ en tr/min en vitesse angulaire $\omega$ en rad/s ?

- [x] $\omega = \dfrac{2\pi N}{60}$
- [ ] $\omega = \dfrac{60 N}{2\pi}$
- [ ] $\omega = 2\pi N$
- [ ] $\omega = \dfrac{N}{60}$

> Un tour vaut $2\pi$ rad, une minute 60 s. À 3 000 tr/min, $\omega = 2\pi \times 3000 / 60 \approx 314$ rad/s.

## rendement-global · numeric
Un moteur de rendement 0,90 entraîne un réducteur de rendement 0,80. Quel est le rendement global de la chaîne (en %) ?

= 72 ± 1 %

> Les rendements de composants en série se multiplient : $\eta = 0{,}90 \times 0{,}80 = 0{,}72$. Le rendement global est toujours inférieur au plus faible des rendements ; les pertes (surtout thermiques) s'additionnent.

## reducteur-vitesse · numeric
Un réducteur de rapport $1/20$ est entraîné par un moteur tournant à 3 000 tr/min. À quelle vitesse tourne l'arbre de sortie (en tr/min) ?

= 150 ± 1 tr/min

> $N_s = N_e \times \dfrac{1}{20} = 150$ tr/min. Pour une même puissance, le couple est multiplié d'autant (aux pertes près) : un réducteur échange de la vitesse contre du couple.

## reducteur-couple · single
Le moteur de la question précédente fournit 0,5 N·m. Quel couple obtient-on en sortie du réducteur, si son rendement est de 0,95 ?

- [x] Environ 9,5 N·m
- [ ] 0,5 N·m
- [ ] 10,5 N·m
- [ ] 0,025 N·m

> $P_s = \eta \, P_e$ donne $C_s \, \omega_s = \eta \, C_e \, \omega_e$, d'où $C_s = \eta \times 20 \times C_e = 0{,}95 \times 20 \times 0{,}5 = 9{,}5$ N·m. Sans pertes, on aurait 10 N·m.

## vitesse-lineaire · single
Une roue de rayon 0,3 m tourne à 10 rad/s sans glisser sur le sol. Quelle est la vitesse du véhicule ?

- [x] 3 m/s
- [ ] 30 m/s
- [ ] 0,03 m/s
- [ ] 33 m/s

> $v = R \, \omega = 0{,}3 \times 10 = 3$ m/s, soit 10,8 km/h. La même relation sert pour un pignon-crémaillère ou une poulie-courroie, avec le rayon primitif.

## puissance-electrique · single
Un moteur alimenté sous 24 V absorbe 5 A et fournit 96 W mécaniques. Quel est son rendement ?

- [x] 80 %
- [ ] 96 %
- [ ] 120 %
- [ ] 20 %

> $P_{abs} = U \times I = 24 \times 5 = 120$ W ; $\eta = 96 / 120 = 0{,}8$. Les 24 W perdus partent en chaleur (effet Joule dans les bobinages, frottements).

## energie-batterie · numeric
Quelle énergie stocke une batterie de 12 V et 50 Ah (en Wh) ?

= 600 ± 1 Wh

> $E = U \times Q = 12 \times 50 = 600$ Wh, soit $600 \times 3600 = 2{,}16$ MJ. Avec une consommation moyenne de 100 W, l'autonomie théorique est de 6 h.

## pfs · single
Que traduit le principe fondamental de la statique pour un solide en équilibre ?

- [x] La somme des forces extérieures est nulle, et la somme de leurs moments en un même point est nulle
- [ ] Seule la somme des forces est nulle
- [ ] Le solide n'est soumis à aucune force
- [ ] Les forces sont toutes égales

> En plan, on obtient trois équations (deux en résultante, une en moment), qui permettent de calculer des actions inconnues, par exemple dans les liaisons. Si le solide accélère, on applique le principe fondamental de la dynamique.

## moment · single
On serre un écrou avec une clé de 0,25 m en exerçant une force de 40 N perpendiculaire au manche, à son extrémité. Quel couple de serrage obtient-on ?

- [x] 10 N·m
- [ ] 160 N·m
- [ ] 40 N·m
- [ ] 0,16 N·m

> $M = F \times d = 40 \times 0{,}25 = 10$ N·m, avec $d$ la distance entre l'axe et la droite d'action de la force. Une clé deux fois plus longue double le couple pour la même force.

## liaison-pivot · single
Combien de degrés de liberté laisse une liaison pivot entre deux pièces ?

- [x] Un : une rotation autour de son axe
- [ ] Aucun
- [ ] Deux : une rotation et une translation selon l'axe
- [ ] Trois rotations

> La liaison pivot glissant laisse deux mouvements (rotation et translation selon l'axe), la glissière une translation, la rotule trois rotations, l'encastrement aucun.

## contrainte · numeric
Une tige de section 10 mm² est tendue par une force de 1 000 N. Quelle contrainte normale subit-elle (en MPa) ?

= 100 ± 1 MPa

> $\sigma = F / S = 1000 / 10 = 100$ N/mm², soit 100 MPa. On vérifie que $\sigma$ reste inférieure à la limite élastique du matériau divisée par un coefficient de sécurité (par exemple 235 MPa pour un acier S235).
