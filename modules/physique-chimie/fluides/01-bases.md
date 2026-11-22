---
id: fluides-01
title: { fr: "Mécanique des fluides" }
description: { fr: "Pression et statique des fluides, poussée d'Archimède, flottaison, débit volumique, relation de Bernoulli, effet Venturi, vidange de Torricelli" }
level: bases
tags: [physique, bac, prog-2019]
---

## pression-profondeur · numeric
De combien la pression augmente-t-elle quand un plongeur descend de 10 m dans l'eau douce, en pascals ? ($\rho = \pu{1000 kg.m-3}$, $g = \pu{9,81 N.kg-1}$.)

= 9,8e4 ± 0,1e4 Pa

> Loi de la statique des fluides : $p_B - p_A = \rho\,g\,(z_A - z_B) = 1\,000 \times 9{,}81 \times 10 \approx \pu{9,8e4 Pa}$, soit environ 1 bar. À 10 m de fond, la pression totale est donc d'environ 2 bars, le double de la pression atmosphérique.

## meme-profondeur · single
Trois récipients de formes différentes (large, étroit, évasé) contiennent de l'eau sur la même hauteur. Où la pression au fond est-elle la plus grande ?

- [x] Elle est la même dans les trois
- [ ] Dans le récipient le plus large, qui contient le plus d'eau
- [ ] Dans le récipient le plus étroit
- [ ] Dans le récipient évasé vers le haut

> La pression dans un fluide au repos ne dépend que de la profondeur (et de la masse volumique), pas de la forme du récipient ni de la quantité de liquide : c'est le « paradoxe hydrostatique ». Pascal l'illustra en faisant éclater un tonneau avec un tube fin et haut rempli d'eau.

## archimede · numeric
Un objet de 2 L est entièrement immergé dans l'eau ($\rho = \pu{1000 kg.m-3}$, $g = \pu{9,81 N.kg-1}$). Quelle est la valeur de la poussée d'Archimède qu'il subit, en newtons ?

= 19,6 ± 0,1 N

> La poussée est égale au poids du fluide déplacé : $\Pi = \rho\,V\,g = 1\,000 \times \pu{2e-3} \times 9{,}81 \approx \pu{19,6 N}$. Elle ne dépend pas de la masse de l'objet, seulement de son volume immergé et du fluide.

## iceberg · numeric
La glace a une masse volumique de $\pu{917 kg.m-3}$, l'eau de mer de $\pu{1025 kg.m-3}$. Quelle fraction du volume d'un iceberg est immergée, en pourcentage ?

= 89 ± 1 %

> À l'équilibre, poids et poussée se compensent : $\rho_\text{glace}\,V\,g = \rho_\text{mer}\,V_\text{imm}\,g$, d'où $\dfrac{V_\text{imm}}{V} = \dfrac{917}{1\,025} \approx 0{,}89$. Seul un dixième environ dépasse : d'où l'expression « la partie émergée de l'iceberg ».

## bateau-acier · single
Pourquoi un navire en acier (7 800 kg/m³) flotte-t-il sur l'eau ?

- [x] Sa coque creuse déplace un volume d'eau dont le poids égale le sien, bien avant d'être entièrement immergée
- [ ] Parce que l'acier des navires est traité pour être moins dense que l'eau
- [ ] Parce que l'air contenu dans la coque le tire vers le haut
- [ ] Parce que l'eau de mer salée est plus dense que l'acier

> Ce qui compte est la masse volumique moyenne du navire (acier et air de la coque), inférieure à celle de l'eau. Un bloc d'acier plein coule ; la même masse façonnée en coque flotte. Si la coque se remplit d'eau, le navire coule.

## debit · numeric
De l'eau circule à $\pu{2,0 m.s-1}$ dans un tuyau de rayon $\pu{1,0 cm}$. Quel est le débit volumique, en litres par seconde ?

= 0,63 ± 0,01 L/s

> $D_V = S\,v = \pi r^2\,v = \pi \times (\pu{1,0e-2})^2 \times 2{,}0 \approx \pu{6,3e-4 m3.s-1}$, soit $\pu{0,63 L.s-1}$ (1 m³ = 1 000 L).

## conservation-debit · single
Dans un écoulement permanent d'un fluide incompressible, la section d'une canalisation est divisée par deux. Que devient la vitesse de l'eau dans la partie étroite ?

- [x] Elle double
- [ ] Elle est divisée par deux
- [ ] Elle reste la même
- [ ] Elle est multipliée par quatre

> Le débit volumique se conserve : $S_1\,v_1 = S_2\,v_2$. Si $S_2 = \dfrac{S_1}{2}$, alors $v_2 = 2\,v_1$. C'est ce qu'on fait en pinçant l'extrémité d'un tuyau d'arrosage pour que le jet porte plus loin.

## venturi · single
Selon la relation de Bernoulli, que se passe-t-il pour la pression dans le rétrécissement d'une canalisation horizontale, là où le fluide accélère ?

- [x] Elle diminue : c'est l'effet Venturi
- [ ] Elle augmente, car le fluide est comprimé
- [ ] Elle reste constante
- [ ] Elle devient nulle

> Pour un fluide parfait incompressible en écoulement permanent, $p + \dfrac{1}{2}\rho\,v^2 + \rho\,g\,z$ se conserve le long d'une ligne de courant. À même altitude, plus de vitesse signifie moins de pression. L'effet sert dans les trompes à eau, les carburateurs ou certains débitmètres.

## torricelli · numeric
Un réservoir ouvert se vide par un petit orifice situé 5,0 m sous la surface libre ($g = \pu{9,81 m.s-2}$). D'après la relation de Bernoulli, à quelle vitesse l'eau sort-elle, en $\pu{m.s-1}$ ?

= 9,9 ± 0,1 m/s

> La pression est atmosphérique à la surface et à la sortie, et la surface descend très lentement : $\rho\,g\,h = \dfrac{1}{2}\rho\,v^2$, d'où $v = \sqrt{2\,g\,h} \approx \pu{9,9 m.s-1}$. C'est la formule de Torricelli : la même vitesse qu'un objet en chute libre de 5 m.

## unite-pression · single
Quelle est la pression atmosphérique moyenne au niveau de la mer ?

- [x] Environ 1 013 hPa, soit $\pu{1,013e5 Pa}$, environ 1 bar
- [ ] Environ 1 013 Pa
- [ ] Environ 10 bars
- [ ] Environ 1 013 kPa

> 1 hPa = 100 Pa ; 1 bar = $\pu{1e5 Pa}$. Les cartes météo indiquent la pression en hectopascals : une dépression descend sous 1 000 hPa environ, un anticyclone dépasse souvent 1 020 hPa.
