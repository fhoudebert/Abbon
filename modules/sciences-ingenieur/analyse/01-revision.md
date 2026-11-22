---
id: analyse-01
title: { fr: "Analyse des systèmes" }
description: { fr: "Besoin et cahier des charges, diagrammes SysML, chaînes de puissance et d'information, écarts, écoconception" }
level: bases
tags: [si, sciences-ingenieur, terminale, bac]
---

## diagramme-exigences · single
Quel diagramme SysML décrit les performances attendues d'un système, avec leurs critères et leurs niveaux (par exemple « autonomie ≥ 2 h ») ?

- [x] Le diagramme des exigences
- [ ] Le diagramme de séquence
- [ ] Le diagramme de blocs internes
- [ ] Le diagramme d'états

> Le diagramme des exigences (req) traduit le cahier des charges : chaque exigence a un identifiant, un texte et, si possible, un critère mesurable. Il sert ensuite à vérifier les performances obtenues.

## cas-utilisation · single
À quoi sert le diagramme des cas d'utilisation ?

- [x] À représenter les services rendus par le système à ses acteurs (utilisateurs, autres systèmes)
- [ ] À décrire la structure interne du système
- [ ] À donner la chronologie des messages échangés
- [ ] À dimensionner les composants

> Il délimite le système et répond à la question « à quoi sert-il, et pour qui ? ». Le diagramme de séquence détaille ensuite le déroulement d'un cas d'utilisation dans le temps.

## bdd-ibd · single
Quelle est la différence entre le diagramme de définition de blocs (bdd) et le diagramme de blocs internes (ibd) ?

- [x] Le bdd montre la composition du système (quels blocs le constituent) ; l'ibd montre les flux d'énergie, de matière et d'information entre ces blocs
- [ ] Ce sont deux noms du même diagramme
- [ ] Le bdd décrit le comportement, l'ibd les exigences
- [ ] L'ibd est réservé aux systèmes informatiques

> Le bdd est une décomposition, en arbre ; l'ibd relie les parties par des ports et des flux. Avec le diagramme d'états, on décrit le comportement : états du système et transitions entre eux.

## diagramme-etats · single
Une barrière de parking passe de « fermée » à « en ouverture » quand un badge valide est lu. Quel diagramme SysML représente ce fonctionnement ?

- [x] Le diagramme d'états (machine à états)
- [ ] Le diagramme des exigences
- [ ] Le diagramme de définition de blocs
- [ ] Le diagramme paramétrique

> Chaque état est relié aux autres par des transitions, déclenchées par des événements (badge lu, fin de course atteinte) et éventuellement conditionnées. Ce diagramme se traduit directement en programme.

## chaine-puissance · single
Dans quel ordre se succèdent les fonctions de la chaîne de puissance ?

- [x] Alimenter, distribuer, convertir, transmettre
- [ ] Acquérir, traiter, communiquer
- [ ] Convertir, alimenter, transmettre, distribuer
- [ ] Transmettre, distribuer, alimenter, convertir

> La chaîne de puissance agit sur la matière d'œuvre : une batterie alimente, un variateur distribue l'énergie, un moteur la convertit en énergie mécanique, un réducteur la transmet à l'effecteur. Acquérir, traiter et communiquer sont les fonctions de la chaîne d'information.

## composants-fonctions · single
Dans une trottinette électrique, quel composant assure la fonction « convertir » ?

- [x] Le moteur électrique
- [ ] La batterie
- [ ] Le variateur (hacheur)
- [ ] Le capteur de vitesse

> Le moteur convertit l'énergie électrique en énergie mécanique de rotation. La batterie alimente, le variateur distribue (il dose l'énergie envoyée au moteur, selon les ordres de la chaîne d'information), le capteur acquiert une information.

## chaine-information · single
Quel composant assure la fonction « traiter » de la chaîne d'information ?

- [x] Le microcontrôleur, qui exécute le programme
- [ ] Le capteur
- [ ] Le moteur
- [ ] Le module Wi-Fi

> Le capteur acquiert, le microcontrôleur traite (calcule, décide), le module Wi-Fi ou l'écran communique. Les ordres issus du traitement pilotent le distributeur de la chaîne de puissance.

## ecarts · single
Quel écart compare les performances mesurées sur le système réel aux performances attendues par le cahier des charges ?

- [x] L'écart entre le réel et le souhaité (performances attendues)
- [ ] L'écart entre le simulé et le réel
- [ ] L'écart entre le simulé et le souhaité
- [ ] L'écart type des mesures

> On distingue trois écarts : souhaité-réel (le système répond-il au besoin ?), souhaité-simulé (le modèle prévoit-il des performances suffisantes ?) et simulé-réel (le modèle est-il fidèle ?). Un écart simulé-réel important conduit à améliorer le modèle.

## acv · single
Que prend en compte l'analyse du cycle de vie (ACV) d'un produit ?

- [x] Ses impacts environnementaux à toutes les étapes : extraction des matières premières, fabrication, transport, utilisation, fin de vie
- [ ] Uniquement sa consommation d'énergie pendant l'utilisation
- [ ] Seulement son coût de fabrication
- [ ] Sa durée de garantie

> L'ACV mesure plusieurs indicateurs (émissions de gaz à effet de serre, consommation d'eau, épuisement des ressources). Pour un téléphone, l'essentiel de l'impact vient souvent de la fabrication, d'où l'intérêt d'en allonger la durée d'usage.

## ecoconception · multiple
Quelles démarches relèvent de l'écoconception ?

- [x] Réduire la masse de matière utilisée
- [x] Faciliter le démontage et la réparation
- [x] Choisir des matériaux recyclables
- [ ] Augmenter le nombre de matériaux différents assemblés par collage
- [ ] Rendre la batterie impossible à remplacer

> Les assemblages collés et les composants indémontables gênent la réparation et le tri en fin de vie. L'écoconception intègre l'environnement dès la conception, sans dégrader les performances attendues.

## innovation · single
Comment appelle-t-on une innovation qui améliore un produit existant sans en changer le principe ?

- [x] Une innovation incrémentale
- [ ] Une innovation de rupture
- [ ] Un brevet
- [ ] Un prototype

> L'innovation incrémentale améliore par petites étapes (autonomie, masse, coût). L'innovation de rupture change le principe ou l'usage, comme l'ampoule à LED face à l'ampoule à incandescence ou le smartphone face au téléphone à clavier.

## prototype · single
Pourquoi réalise-t-on un prototype pendant un projet ?

- [x] Pour vérifier une solution par l'expérience (forme, fonctionnement, performances) avant de la produire
- [ ] Pour vendre le produit plus vite
- [ ] Parce que la simulation numérique est interdite
- [ ] Pour remplacer le cahier des charges

> Imprimé en 3D, découpé au laser ou monté sur carte de prototypage, il permet des mesures et valide, ou non, les choix faits en simulation. Le projet de terminale s'appuie sur ce va-et-vient entre modèle et prototype.
