---
id: materiel-01
title: { fr: "Matériel : composants, assemblage, périphériques" }
description: { fr: "Processeur, mémoire, stockage, carte graphique, carte mère, alimentation, montage d'un PC, connectique et périphériques" }
level: bases
tags: [matériel, culture générale]
---

## cpu-coeurs · single
Un processeur est annoncé « 8 cœurs, 16 threads ». Que signifie « 16 threads » ?

- [x] Chaque cœur peut traiter deux fils d'exécution en alternance rapide (SMT, ou Hyper-Threading chez Intel)
- [ ] Le processeur contient 16 cœurs physiques
- [ ] Le processeur tourne à 16 GHz
- [ ] Il peut ouvrir au plus 16 programmes

> Le SMT occupe les unités d'un cœur pendant que l'autre fil attend la mémoire : le gain est réel mais bien inférieur à celui de cœurs supplémentaires (souvent de 10 à 30 %). Un système d'exploitation gère des milliers de threads, en partageant le temps des cœurs.

## cache · single
À quoi sert la mémoire cache (L1, L2, L3) d'un processeur ?

- [x] À garder près des cœurs les données et instructions récemment utilisées, beaucoup plus vite accessibles que la RAM
- [ ] À stocker les fichiers temporaires du navigateur
- [ ] À sauvegarder le travail en cas de coupure de courant
- [ ] À accélérer le disque dur

> Lire en RAM prend de l'ordre d'une centaine de cycles d'horloge ; le cache L1, quelques cycles. Plus le niveau est éloigné (L1, puis L2, puis L3, partagé entre les cœurs), plus il est grand et lent. Le « cache » d'un navigateur est un tout autre mécanisme, sur le disque.

## ram-volatile · single
Que devient le contenu de la RAM quand on éteint l'ordinateur ?

- [x] Il est perdu : la RAM est une mémoire volatile, le stockage durable est sur le SSD ou le disque dur
- [ ] Il est conservé jusqu'au prochain démarrage
- [ ] Il est copié automatiquement sur la carte graphique
- [ ] Il est conservé dans le processeur

> La RAM contient les programmes en cours et leurs données ; son contenu disparaît sans alimentation. La mise en veille prolongée (hibernation) copie la RAM sur le disque avant d'éteindre, pour la restaurer au démarrage.

## ddr-compatibilite · single
Peut-on installer une barrette de DDR5 sur une carte mère prévue pour la DDR4 ?

- [x] Non : les barrettes ont un détrompeur placé différemment et des caractéristiques électriques incompatibles
- [ ] Oui, la DDR5 est rétrocompatible
- [ ] Oui, mais elle fonctionnera à la vitesse de la DDR4
- [ ] Oui, avec un adaptateur fourni

> Chaque génération de mémoire (DDR3, DDR4, DDR5) a son encoche à une position différente : on ne peut pas insérer une barrette dans le mauvais emplacement. La carte mère et le processeur déterminent le type de RAM accepté.

## dual-channel · single
On installe deux barrettes de RAM identiques sur une carte mère à quatre emplacements. Comment les placer ?

- [x] Dans les emplacements indiqués par le manuel pour le double canal (souvent A2 et B2), pour doubler la bande passante
- [ ] Côte à côte dans les deux premiers emplacements, c'est toujours le mieux
- [ ] N'importe où : cela ne change rien
- [ ] Une seule suffit, la seconde sert de secours

> En double canal, le contrôleur mémoire lit les deux barrettes en même temps. Deux barrettes dans le même canal fonctionnent, mais en simple canal, plus lentement, ce qui pénalise surtout la carte graphique intégrée et les jeux. Le manuel de la carte mère donne l'ordre de remplissage.

## bande-passante · numeric
Une barrette DDR5-6000 effectue 6000 millions de transferts par seconde sur un bus de 64 bits (8 octets). Quelle est sa bande passante théorique, en Go/s ?

= 48 ± 0,5 Go/s

> $6000 \times 10^6 \times 8$ octets $= 48 \times 10^9$ octets par seconde, soit 48 Go/s par canal ; deux barrettes en double canal atteignent 96 Go/s. Le « 6000 » est un débit de transferts (MT/s), souvent écrit à tort en MHz : la fréquence réelle de l'horloge est de 3000 MHz, avec deux transferts par cycle.

## ssd-nvme · single
Pourquoi un SSD NVMe M.2 est-il bien plus rapide qu'un SSD SATA de 2,5 pouces ?

- [x] Il passe par le bus PCI Express, sans la limite d'environ 600 Mo/s de l'interface SATA III
- [ ] Il contient un disque qui tourne plus vite
- [ ] Il est plus petit, donc les données ont moins de chemin à parcourir
- [ ] Tous les SSD M.2 sont NVMe, c'est le format qui compte

> SATA III plafonne à 6 Gbit/s, environ 600 Mo/s utiles ; un SSD NVMe en PCIe 4.0 ×4 dépasse 7000 Mo/s. Attention : le format M.2 accepte aussi des SSD SATA, plus lents ; il faut vérifier que le SSD et l'emplacement sont NVMe.

## hdd-ssd · single
Quel avantage garde le disque dur mécanique (HDD) sur le SSD ?

- [x] Le prix par téraoctet, pour stocker de gros volumes (sauvegardes, vidéos, serveurs de fichiers)
- [ ] Sa vitesse en accès aléatoire
- [ ] Sa résistance aux chocs
- [ ] Son silence

> Un disque dur a des plateaux qui tournent et une tête qui se déplace : accès lents (quelques millisecondes), bruit, sensibilité aux chocs. Mais à capacité égale, il coûte nettement moins cher : on le garde pour les grandes capacités, et le système va sur un SSD.

## gpu-vram · single
À quoi sert la mémoire vidéo (VRAM) d'une carte graphique ?

- [x] À stocker près du processeur graphique les textures, les images en cours de calcul et les données des calculs parallèles (IA, rendu 3D)
- [ ] À augmenter la RAM disponible pour le système
- [ ] À enregistrer les captures d'écran
- [ ] À stocker les pilotes de la carte

> Le GPU contient des milliers d'unités de calcul simples qui travaillent en parallèle ; sa VRAM (GDDR6, HBM) a une bande passante bien supérieure à celle de la RAM. Une VRAM trop petite limite la résolution, la qualité des textures, ou la taille des modèles d'IA utilisables. Un GPU intégré au processeur partage, lui, la RAM du système.

## socket · single
Avant d'acheter un processeur pour une carte mère, que faut-il vérifier en premier ?

- [x] Que le socket (support) et le chipset de la carte mère acceptent ce processeur, avec une version de BIOS adaptée
- [ ] Que le processeur et la carte mère sont de la même couleur
- [ ] Que le processeur a autant de cœurs que la carte mère a d'emplacements de RAM
- [ ] Rien : tous les processeurs vont sur toutes les cartes mères

> AMD et Intel utilisent des sockets différents (par exemple AM5 chez AMD, LGA 1700 puis LGA 1851 chez Intel), qui changent selon les générations. Le site du fabricant de la carte mère publie la liste des processeurs compatibles et la version de BIOS minimale.

## pate-thermique · single
Lors du montage du ventirad sur le processeur, à quoi sert la pâte thermique ?

- [x] À combler les micro-aspérités entre le processeur et le radiateur, où l'air isolerait, pour mieux évacuer la chaleur
- [ ] À coller le processeur à la carte mère
- [ ] À isoler électriquement le processeur
- [ ] On en met une couche épaisse pour refroidir davantage

> L'air conduit très mal la chaleur ; la pâte remplit les creux entre deux surfaces qui semblent planes. Une petite quantité suffit (un grain de riz ou de petit pois au centre) : la pression du radiateur l'étale. Trop de pâte n'améliore rien et peut déborder. Beaucoup de ventirads neufs sont livrés avec la pâte déjà appliquée.

## electricite-statique · single
Quelle précaution prendre avant de manipuler des composants dans un PC ouvert ?

- [x] Débrancher l'alimentation et se décharger de l'électricité statique (bracelet antistatique, ou toucher une partie métallique du boîtier)
- [ ] Laisser le PC allumé pour voir si les composants fonctionnent
- [ ] Porter des gants en laine
- [ ] Poser les composants sur la moquette

> Une décharge électrostatique, parfois imperceptible, peut endommager un composant. On travaille sur une surface dure, on tient les cartes par les bords, et on garde les composants dans leur sachet antistatique jusqu'au montage. Laine et moquette favorisent l'électricité statique.

## alimentation · numeric
Les composants d'un PC consomment 450 W. Son alimentation a un rendement de 90 % à cette charge. Quelle puissance prélève-t-elle sur la prise, en watts ?

= 500 ± 1 W

> $P_{\text{prise}} = \dfrac{450}{0{,}90} = 500$ W ; les 50 W perdus chauffent l'alimentation. Les labels 80 PLUS (Bronze, Gold, Platinum…) garantissent un rendement minimal. On choisit une alimentation avec de la marge (ici 650 à 750 W) : elle ne travaille pas à fond, et son rendement est souvent meilleur vers la moitié de sa puissance maximale.

## post-uefi · single
Un PC neuf s'allume, les ventilateurs tournent, mais rien ne s'affiche et la carte mère émet des bips (ou allume un voyant « DRAM »). Que soupçonner en premier ?

- [x] La mémoire vive, mal enfoncée ou mal placée : le test de démarrage (POST) de l'UEFI échoue
- [ ] Un virus
- [ ] Le système d'exploitation, mal installé
- [ ] L'écran, trop petit

> Au démarrage, le micrologiciel (UEFI, autrefois BIOS) teste le processeur, la mémoire et la carte graphique avant de chercher un système à lancer. Les bips ou voyants de diagnostic indiquent le composant en cause (le manuel en donne le code). Une barrette mal enclenchée est la cause la plus fréquente d'un premier démarrage raté. Autre oubli classique : brancher l'écran sur la carte mère au lieu de la carte graphique.

## connectique · single
Quelle affirmation sur les prises est exacte ?

- [x] Une prise USB-C ne dit rien du débit : selon le câble et l'appareil, elle peut porter de l'USB 2.0, de l'USB 3.2, de l'USB4 ou du Thunderbolt, et parfois de la vidéo
- [ ] Toutes les prises USB-C ont le même débit
- [ ] HDMI et DisplayPort transportent du réseau Ethernet à la place de l'image
- [ ] Le VGA est une prise numérique récente

> USB-C est la forme de la prise ; le protocole (de 480 Mbit/s en USB 2.0 à 40 Gbit/s et plus en USB4 ou Thunderbolt) dépend des deux appareils et du câble. Pour l'écran, HDMI et DisplayPort sont numériques ; le VGA, analogique, est ancien. Pour un écran 144 Hz, on vérifie que la prise et le câble suivent ce taux de rafraîchissement.
