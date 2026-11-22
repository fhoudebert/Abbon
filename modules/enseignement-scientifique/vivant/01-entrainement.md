---
id: vivant-01
title: { fr: "Une histoire du vivant : entraînement" }
description: { fr: "Estimer une population, Hardy-Weinberg, dérive et sélection, évolution humaine, modèles démographiques, apprentissage automatique" }
level: bases
tags: [enseignement scientifique, terminale, biodiversité, évolution, démographie, intelligence artificielle]
---

## capture-recapture · numeric
Pour estimer une population de lézards, on en capture et marque 50, puis on les relâche. Plus tard, on en capture 40, dont 8 sont marqués. Quelle est l'estimation de la population ?

= 250 ± 1

> On suppose que la proportion de marqués est la même dans l'échantillon et dans la population : $\dfrac{8}{40} = \dfrac{50}{N}$, d'où $N = \dfrac{50 \times 40}{8} = 250$. Cette méthode de capture-marquage-recapture suppose une population fermée et un mélange au hasard ; le résultat s'accompagne d'un intervalle de confiance.

## hardy-weinberg · numeric
Dans une population à l'équilibre de Hardy-Weinberg, l'allèle A a une fréquence $p = 0{,}7$ et l'allèle a une fréquence $q = 0{,}3$. Quelle est la fréquence attendue des hétérozygotes Aa ?

= 0,42 ± 0,005

> Les génotypes AA, Aa et aa ont pour fréquences $p^2$, $2pq$ et $q^2$ : $2 \times 0{,}7 \times 0{,}3 = 0{,}42$ (et $0{,}49 + 0{,}42 + 0{,}09 = 1$).

## conditions-hw · multiple
Quelles conditions le modèle de Hardy-Weinberg suppose-t-il pour que les fréquences des allèles restent stables ?

- [x] Une population de très grande taille
- [x] Des unions au hasard (panmixie)
- [x] Ni mutation, ni sélection, ni migration
- [ ] Une population isolée de petite taille
- [ ] Des individus qui choisissent des partenaires semblables à eux

> Ces conditions ne sont jamais toutes réunies : un écart entre fréquences observées et attendues signale qu'une force évolutive agit (sélection, dérive, migration, mutation, choix du partenaire). Le modèle sert de référence pour les détecter.

## derive · single
Qu'est-ce que la dérive génétique ?

- [x] La variation aléatoire des fréquences des allèles d'une génération à l'autre, d'autant plus forte que la population est petite
- [ ] L'apparition d'un nouvel allèle par mutation
- [ ] La sélection des allèles les plus avantageux
- [ ] Le déplacement des populations vers de nouveaux territoires

> Seule une partie des allèles est transmise à la génération suivante, au hasard : dans une petite population, un allèle peut disparaître ou se fixer sans aucun avantage ni désavantage. L'effet fondateur (une petite population qui en fonde une nouvelle) en est un cas particulier.

## selection-naturelle · single
Les insecticides deviennent moins efficaces au fil des années sur les moustiques d'une région. Quelle explication est conforme à la théorie de l'évolution ?

- [x] Les rares moustiques porteurs d'un allèle de résistance survivent et se reproduisent davantage : leur fréquence augmente
- [ ] Les moustiques s'habituent à l'insecticide et transmettent cette habitude
- [ ] L'insecticide provoque chez chaque moustique la mutation qui le protège
- [ ] Les moustiques apprennent à éviter les zones traitées

> C'est la sélection naturelle : l'insecticide ne crée pas les mutations, il trie celles qui existent déjà, au hasard, dans la population. Le même mécanisme explique la résistance des bactéries aux antibiotiques.

## ancetre-commun · single
Quelle affirmation sur l'être humain et le chimpanzé est exacte ?

- [x] Ils partagent un ancêtre commun, qui vivait il y a environ 7 millions d'années
- [ ] L'être humain descend du chimpanzé
- [ ] Le chimpanzé descend de l'être humain
- [ ] Ils n'ont aucun lien de parenté

> L'espèce humaine et le chimpanzé sont des espèces « cousines », issues d'un ancêtre commun qui n'était ni l'un ni l'autre. Elles partagent environ 98,8 % de leur ADN. Le chimpanzé a lui aussi évolué depuis la séparation des deux lignées.

## neandertal · single
Que nous apprend l'ADN ancien sur Néandertal et *Homo sapiens* ?

- [x] Les deux espèces ont coexisté et se sont métissées : les humains d'origine non africaine portent environ 2 % d'ADN néandertalien
- [ ] *Homo sapiens* descend de Néandertal
- [ ] Les deux espèces ne se sont jamais rencontrées
- [ ] Néandertal a disparu bien avant l'apparition d'*Homo sapiens*

> Plusieurs espèces du genre *Homo* ont vécu en même temps : il y a 50 000 ans, *Homo sapiens* côtoyait Néandertal, les Dénisoviens et d'autres. L'arbre de la lignée humaine est buissonnant, pas une échelle. Le prix Nobel 2022 de médecine a récompensé Svante Pääbo pour ces travaux.

## malthus · single
Que prévoyait le modèle de Malthus (1798) ?

- [x] Une population qui croît de façon géométrique, plus vite que les ressources, qui croissent de façon arithmétique, d'où des famines
- [ ] Une population qui se stabilise d'elle-même
- [ ] Des ressources qui croissent plus vite que la population
- [ ] Une population qui diminue régulièrement

> Selon Malthus, la population se multiplie par un même facteur à chaque période (suite géométrique), alors que la production agricole augmente d'une même quantité (suite arithmétique). Sa prédiction ne s'est pas réalisée : les rendements agricoles ont fortement progressé, et la fécondité a baissé (transition démographique).

## croissance-geometrique · numeric
Une population de 1 000 individus augmente de 2 % par an. Selon ce modèle, combien compte-t-elle d'individus au bout de 10 ans (arrondi à l'unité) ?

= 1219 ± 1

> Augmenter de 2 %, c'est multiplier par 1,02 : $P_n = 1\,000 \times 1{,}02^n$, suite géométrique. $P_{10} = 1\,000 \times 1{,}02^{10} \approx 1\,219$. Ce n'est pas 1 200 : les pourcentages se cumulent, comme des intérêts composés.

## limites-modele · single
Pourquoi le modèle exponentiel ne décrit-il pas l'évolution de la population mondiale sur le long terme ?

- [x] Parce que le taux de croissance n'est pas constant : il baisse avec la transition démographique et les limites du milieu
- [ ] Parce que la population mondiale diminue depuis 1950
- [ ] Parce qu'il prévoit une croissance trop lente
- [ ] Parce qu'une population ne peut croître que de façon arithmétique

> La population mondiale a dépassé 8 milliards en 2022, mais son taux de croissance, maximal dans les années 1960 (plus de 2 % par an), est aujourd'hui inférieur à 1 %. Les projections des Nations unies prévoient un maximum vers 10 milliards au cours de ce siècle. Un modèle n'est valable que dans un domaine et pour une durée limités.

## apprentissage · single
Comment un programme d'intelligence artificielle apprend-il, par exemple, à reconnaître des chats sur des photos ?

- [x] On lui fournit de nombreuses photos déjà étiquetées ; il ajuste ses paramètres pour réduire ses erreurs sur ces exemples
- [ ] Un programmeur écrit à la main la règle qui définit un chat
- [ ] Il comprend ce qu'est un chat comme un être humain
- [ ] Il cherche la réponse sur Internet à chaque photo

> C'est l'apprentissage automatique supervisé : un réseau de neurones artificiels règle ses paramètres (ses « poids ») à partir des exemples. Il ne suit pas une règle écrite par un humain, et ne « comprend » pas ce qu'il reconnaît.

## biais-donnees · single
Un système de reconnaissance de visages fonctionne bien sur les personnes à peau claire et mal sur les personnes à peau foncée. Quelle est l'explication la plus probable ?

- [x] Les données d'entraînement contenaient surtout des visages de personnes à peau claire
- [ ] Les visages à peau foncée sont plus difficiles à photographier
- [ ] Le programme a été écrit pour ne reconnaître que certains visages
- [ ] C'est une erreur de calcul de l'ordinateur

> Un système d'apprentissage reproduit les biais de ses données. C'est pourquoi on évalue un modèle sur des données qu'il n'a pas vues pendant l'apprentissage (jeu de test), représentatives des situations réelles.
