---
id: graphisme-3d-01
title: { fr: "3D et graphisme : les bases" }
description: { fr: "Images matricielles et vectorielles, couleurs, repères, maillages, rendu, formats" }
level: bases
tags: [3d, graphisme, svg]
---

## vectoriel · single
Quelle différence entre une image matricielle (PNG, JPEG) et une image vectorielle (SVG) ?

- [x] La matricielle est une grille de pixels ; la vectorielle décrit des formes, et s'agrandit sans perte
- [ ] La vectorielle est toujours plus lourde
- [ ] La matricielle ne peut pas contenir de couleurs
- [ ] Aucune : seul le nom du fichier change

> Agrandie, une image matricielle devient floue ou « pixelisée ». Une image vectorielle est recalculée à chaque taille : idéale pour les logos, les schémas et les icônes. Une photographie reste matricielle.

## rvb · single
En RVB sur 8 bits par canal, quelle couleur donne `(255, 255, 0)` ?

- [x] Jaune
- [ ] Blanc
- [ ] Cyan
- [ ] Orange

> La synthèse additive des écrans mélange de la lumière : rouge + vert = jaune ; rouge + vert + bleu au maximum = blanc ; vert + bleu = cyan. En notation hexadécimale CSS, ce jaune s'écrit `#FFFF00`.

## couleurs · numeric
Combien de couleurs différentes peut-on coder en RVB avec 8 bits par canal ? Donnez le nombre exact.

= 16777216

> Chaque canal prend $2^8 = 256$ valeurs, donc $256^3 = 2^{24} = 16\,777\,216$ couleurs, soit environ 16,7 millions.

## jpeg-png · single
Pour une capture d'écran contenant du texte net, quel format choisir ?

- [x] PNG, compression sans perte
- [ ] JPEG, pensé pour les photographies
- [ ] BMP, pour sa compression efficace
- [ ] GIF, pour ses millions de couleurs

> JPEG perd de l'information pour réduire la taille : bien pour une photo, mais il crée des bavures autour du texte et des aplats. PNG conserve l'image exacte. BMP ne compresse pas, GIF est limité à 256 couleurs.

## maillage · single
De quoi est fait le maillage d'un objet 3D ?

- [x] De sommets reliés par des arêtes en faces, le plus souvent des triangles
- [ ] D'une grille de pixels
- [ ] D'une seule équation mathématique
- [ ] De photographies de l'objet

> La carte graphique dessine des triangles : toute surface est approchée par des faces planes. Plus il y a de faces, plus la forme est fine, et plus le calcul est lourd.

## transformation · single
Dans quel ordre applique-t-on habituellement les transformations d'un objet pour le placer dans une scène ?

- [x] Mise à l'échelle, puis rotation, puis translation
- [ ] Translation, puis rotation, puis mise à l'échelle
- [ ] L'ordre n'a aucune importance
- [ ] Rotation seulement : la translation est automatique

> Les transformations ne commutent pas. Tourner un objet déjà déplacé le fait tourner autour de l'origine de la scène, pas autour de son propre centre. Ces transformations se combinent sous forme de matrices.

## shader · single
Qu'est-ce qu'un *shader* ?

- [x] Un petit programme exécuté par la carte graphique, par exemple pour calculer la couleur de chaque pixel
- [ ] Un filtre photo réservé aux téléphones
- [ ] Le fichier qui contient les textures
- [ ] Un format d'export de Blender

> Le *vertex shader* place chaque sommet à l'écran, le *fragment shader* calcule la couleur de chaque pixel (éclairage, textures, effets). Ils s'exécutent en parallèle sur des milliers de cœurs du processeur graphique.

## rendu · single
Quelle est la différence principale entre le rendu en temps réel (jeux vidéo) et le lancer de rayons des films d'animation ?

- [x] Le temps réel doit calculer une image en quelques millisecondes ; le lancer de rayons suit le trajet de la lumière, plus réaliste mais bien plus coûteux
- [ ] Le lancer de rayons n'affiche pas les couleurs
- [ ] Le temps réel ne gère pas les ombres
- [ ] Il n'y a aucune différence de qualité

> À 60 images par seconde, chaque image dispose d'environ 16 ms. Un film peut passer des minutes, voire des heures, par image. Les cartes graphiques récentes accélèrent le lancer de rayons, ce qui rapproche les deux mondes.

## gltf · single
Qu'est-ce que glTF ?

- [x] Un format ouvert d'échange de scènes 3D, publié par le Khronos Group, conçu pour être chargé rapidement
- [ ] Le format propriétaire d'un seul logiciel
- [ ] Un format d'image matricielle
- [ ] Une police de caractères

> Surnommé « le JPEG de la 3D », glTF transporte maillages, matériaux, textures et animations. Il s'exporte depuis Blender et se lit dans les navigateurs (WebGL, WebGPU) comme dans les moteurs de jeu.

## svg-xml · single
Sur quel langage le format SVG est-il fondé ?

- [x] XML : un fichier SVG est un texte qui décrit les formes avec des balises
- [ ] JSON
- [ ] Un format binaire non lisible
- [ ] CSV

> `<circle cx="50" cy="50" r="40" fill="currentColor"/>` dessine un disque. Un SVG s'écrit à la main, se génère par programme et s'anime en CSS. Publié par le W3C, il fait partie des standards du Web.
