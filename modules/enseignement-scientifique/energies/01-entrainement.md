---
id: energies-01
title: { fr: "Le futur des énergies : entraînement" }
description: { fr: "Alternateur et induction, photovoltaïque, effet Joule et haute tension, énergie et puissance, stockage, intermittence, émissions par kilowattheure" }
level: bases
tags: [enseignement scientifique, terminale, énergie, électricité]
---

## alternateur · single
Sur quel phénomène repose un alternateur de centrale électrique ?

- [x] L'induction électromagnétique : un aimant (ou électroaimant) en rotation fait apparaître une tension dans des bobines
- [ ] L'effet photovoltaïque
- [ ] L'effet Joule
- [ ] La réaction chimique d'une pile

> Découverte par Faraday en 1831, l'induction transforme l'énergie mécanique de rotation en énergie électrique. La turbine qui fait tourner l'alternateur est entraînée par de la vapeur (centrales thermiques et nucléaires), de l'eau (barrages) ou le vent (éoliennes).

## sans-alternateur · single
Quelle installation produit de l'électricité sans alternateur ?

- [x] Une centrale solaire photovoltaïque
- [ ] Une centrale nucléaire
- [ ] Un barrage hydroélectrique
- [ ] Une éolienne

> Une cellule photovoltaïque convertit directement le rayonnement en courant électrique, sans pièce en mouvement. Toutes les autres utilisent une turbine et un alternateur. Les panneaux produisent un courant continu, converti en courant alternatif par un onduleur.

## photovoltaique · single
Que se passe-t-il dans une cellule photovoltaïque ?

- [x] Les photons dont l'énergie dépasse un seuil (le « gap » du semi-conducteur) libèrent des électrons, mis en mouvement en courant électrique
- [ ] La lumière chauffe de l'eau qui fait tourner une turbine
- [ ] La lumière déclenche une réaction chimique réversible
- [ ] Tous les photons, quelle que soit leur énergie, produisent du courant

> Le silicium, semi-conducteur, n'absorbe que les photons d'énergie supérieure à son gap (environ 1,1 eV). L'énergie en excès est perdue en chaleur, et une partie du spectre n'est pas absorbée : le rendement des panneaux courants est de l'ordre de 20 %.

## puissance-panneaux · numeric
Des panneaux de 10 m² reçoivent un rayonnement solaire de 1 000 W/m² et ont un rendement de 20 %. Quelle puissance électrique fournissent-ils, en watts ?

= 2000 ± 1 W

> Puissance reçue : $10 \times 1\,000 = 10\,000$ W. Puissance électrique : $0{,}20 \times 10\,000 = 2\,000$ W. 1 000 W/m² correspond à un plein soleil vers midi ; la production moyenne sur l'année est bien plus faible (nuit, nuages, inclinaison du Soleil).

## effet-joule · numeric
Un câble de résistance 2 Ω est parcouru par un courant de 10 A. Quelle puissance est perdue par effet Joule, en watts ?

= 200 ± 1 W

> $P = R\,I^2 = 2 \times 10^2 = 200$ W, dissipés en chaleur. Les pertes croissent comme le carré de l'intensité : doubler l'intensité les multiplie par quatre.

## haute-tension · single
Pourquoi l'électricité est-elle transportée sur de longues distances sous très haute tension (jusqu'à 400 000 V en France) ?

- [x] À puissance transportée égale, une tension plus élevée réduit l'intensité, donc les pertes par effet Joule
- [ ] Parce que les centrales ne savent produire que de la haute tension
- [ ] Parce que la haute tension va plus vite
- [ ] Pour que les câbles soient plus légers à cause de l'isolant

> $P = U\,I$ : multiplier la tension par 10 divise l'intensité par 10, et les pertes $R\,I^2$ par 100. Des transformateurs élèvent la tension à la sortie des centrales et l'abaissent près des consommateurs (230 V chez soi). Les pertes du réseau français restent de l'ordre de 2 % sur le transport.

## energie-kwh · numeric
Un radiateur de 2 kW fonctionne pendant 3 heures. Quelle énergie consomme-t-il, en kilowattheures ?

= 6 ± 0,01 kWh

> $E = P \times \Delta t = 2 \text{ kW} \times 3 \text{ h} = 6$ kWh, soit $6 \times 3{,}6 \times 10^6 = 2{,}16 \times 10^7$ J. Le kilowattheure est une énergie, le kilowatt une puissance : on confond souvent les deux.

## reseau-equilibre · single
Quelle contrainte le gestionnaire d'un réseau électrique doit-il respecter à chaque instant ?

- [x] La production doit égaler la consommation, pertes comprises
- [ ] La production doit dépasser largement la consommation, le surplus étant perdu sans conséquence
- [ ] Chaque ville doit produire sa propre électricité
- [ ] Les centrales doivent fonctionner à pleine puissance

> L'électricité se stocke mal : un déséquilibre fait varier la fréquence (50 Hz en Europe) et peut provoquer des coupures. Le réseau se modélise par un graphe (sources, nœuds, consommateurs) ; on cherche la répartition des flux qui satisfait la demande en minimisant les pertes, sous la contrainte de conservation à chaque nœud.

## intermittence · single
Quel problème posent l'éolien et le solaire pour un réseau électrique ?

- [x] Leur production varie avec la météo et l'heure, indépendamment de la demande : il faut des moyens pilotables ou du stockage
- [ ] Ils produisent du courant continu impossible à transporter
- [ ] Ils émettent beaucoup de CO₂ pendant leur fonctionnement
- [ ] Ils ne produisent qu'en hiver

> Ce sont des énergies intermittentes (on dit aussi variables). On compense par des centrales pilotables (hydraulique, gaz, nucléaire dans une certaine mesure), le foisonnement entre régions, le pilotage de la demande et le stockage.

## stockage · single
Quel est, de loin, le principal moyen de stockage de l'électricité à grande échelle dans le monde ?

- [x] Les stations de transfert d'énergie par pompage (STEP), qui remontent de l'eau dans un barrage
- [ ] Les batteries des voitures électriques
- [ ] Les piles à combustible
- [ ] Les condensateurs

> Une STEP pompe l'eau vers un bassin haut quand l'électricité abonde, et la turbine quand on en a besoin, avec un rendement d'environ 75 à 80 %. Les batteries progressent vite, mais pour des durées plus courtes.

## renouvelables · multiple
Parmi ces sources d'énergie, lesquelles sont renouvelables ?

- [x] Le rayonnement solaire
- [x] Le vent
- [x] L'eau des barrages
- [ ] Le gaz naturel
- [ ] L'uranium

> Une source est renouvelable si elle se reconstitue à l'échelle humaine. Le gaz naturel, le pétrole et le charbon se sont formés en millions d'années ; l'uranium est une ressource minérale finie. Le nucléaire est en revanche bas carbone.

## emissions-kwh · single
Sur l'ensemble de leur cycle de vie (construction, combustible, démantèlement), quelle source émet le plus de CO₂ par kilowattheure produit ?

- [x] Le charbon (environ 800 à 1 000 g de CO₂ par kWh)
- [ ] Le nucléaire
- [ ] L'éolien
- [ ] L'hydraulique

> Ordres de grandeur du GIEC (valeurs médianes) : charbon environ 820 g/kWh, gaz environ 490 g/kWh, solaire photovoltaïque environ 40 g/kWh, nucléaire et éolien environ 12 g/kWh, hydraulique environ 24 g/kWh. Les émissions des renouvelables et du nucléaire viennent surtout de la fabrication et de la construction.
