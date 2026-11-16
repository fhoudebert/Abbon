---
id: ia-01
title: { fr: "Intelligence artificielle : les bases" }
description: { fr: "Apprentissage supervisé ou non, réseaux de neurones, modèles de langage, biais, cadre légal" }
level: bases
tags: [ia, apprentissage-automatique]
---

## supervise · single
Qu'est-ce que l'apprentissage supervisé ?

- [x] Apprendre à partir d'exemples dont on connaît la bonne réponse, par exemple des photos étiquetées « chat » ou « chien »
- [ ] Apprendre sous la surveillance permanente d'un humain qui valide chaque calcul
- [ ] Regrouper des données sans aucune étiquette
- [ ] Apprendre uniquement par essais et erreurs dans un jeu

> Le modèle ajuste ses paramètres pour reproduire les étiquettes des exemples, puis prédit celles de nouvelles données. Regrouper des données sans étiquettes est de l'apprentissage non supervisé ; apprendre par récompenses, de l'apprentissage par renforcement.

## kmeans · single
L'algorithme des k-moyennes (*k-means*) sert à :

- [x] Regrouper des données en k groupes de points proches, sans étiquettes
- [ ] Prédire une étiquette à partir des k exemples les plus proches
- [ ] Trier une liste en k étapes
- [ ] Générer du texte

> C'est un algorithme non supervisé : il place k centres, affecte chaque point au plus proche, recalcule les centres, et recommence. Prédire à partir des k plus proches voisins, c'est l'algorithme des k plus proches voisins (kNN), supervisé, au programme de NSI.

## surapprentissage · single
Un modèle obtient 99 % de bonnes réponses sur ses données d'entraînement et 60 % sur des données nouvelles. Que se passe-t-il ?

- [x] Du surapprentissage : il a appris les exemples par cœur au lieu de généraliser
- [ ] Il est excellent : seul compte le score sur l'entraînement
- [ ] Les données nouvelles sont forcément fausses
- [ ] Il manque de mémoire vive

> C'est pourquoi on évalue toujours un modèle sur des données de test qu'il n'a jamais vues. Parades : plus de données, un modèle plus simple, de la régularisation, ou l'arrêt de l'entraînement au bon moment.

## neurone · single
Que calcule un neurone artificiel ?

- [x] Une somme pondérée de ses entrées, à laquelle il applique une fonction d'activation
- [ ] Le maximum de ses entrées
- [ ] Une recherche dans une base de données
- [ ] Une fonction choisie au hasard à chaque appel

> Chaque entrée est multipliée par un poids, on ajoute un biais, puis une fonction non linéaire (ReLU, sigmoïde…) donne la sortie. L'apprentissage ajuste les poids, par descente de gradient, pour réduire l'erreur du réseau.

## llm · single
Comment un grand modèle de langage produit-il un texte ?

- [x] Il prédit, à partir du texte déjà écrit, une suite probable d'un élément de texte (*token*), puis recommence
- [ ] Il recopie des phrases d'une base de textes vérifiés
- [ ] Il cherche la réponse sur Internet à chaque question
- [ ] Il applique des règles de grammaire écrites à la main

> Entraîné sur de très grands corpus, le modèle a appris des régularités de la langue. Il peut ainsi produire des affirmations plausibles mais fausses (« hallucinations ») : ses réponses se vérifient, surtout les faits, les chiffres et les sources.

## biais · single
Un modèle de tri de CV a été entraîné sur les recrutements passés d'une entreprise qui embauchait surtout des hommes. Quel risque court-on ?

- [x] Le modèle reproduit ce déséquilibre et défavorise les candidates
- [ ] Aucun : un algorithme est neutre par nature
- [ ] Le modèle sera plus lent
- [ ] Le modèle refusera de fonctionner

> Un modèle apprend ce que contiennent ses données, y compris leurs biais. Il faut examiner les données, mesurer les résultats selon les groupes de personnes et garder un contrôle humain sur les décisions importantes.

## evaluation · single
Un test de dépistage d'une maladie rare (1 personne sur 1 000) répond toujours « pas malade ». Que vaut sa précision globale (*accuracy*), et qu'en penser ?

- [x] 99,9 % : un chiffre trompeur, puisque le test ne détecte aucun malade
- [ ] 0 % : il se trompe toujours
- [ ] 50 % : il a une chance sur deux
- [ ] 99,9 % : c'est un excellent test

> Sur des classes déséquilibrées, la précision globale ne suffit pas. On regarde aussi le rappel (la part des malades détectés, ici 0 %) et la précision positive. La matrice de confusion montre toutes ces erreurs.

## rgpd · single
Quel texte européen encadre la collecte et l'utilisation des données personnelles, y compris pour entraîner une IA ?

- [x] Le RGPD (Règlement général sur la protection des données)
- [ ] Le Code de la route
- [ ] La licence GPL
- [ ] Le règlement intérieur de chaque entreprise

> Le RGPD exige une base légale, une finalité précise, la minimisation des données et le respect des droits des personnes (accès, rectification, effacement…). En France, la CNIL veille à son application.

## ai-act · single
Sur quel principe repose le règlement européen sur l'IA (*AI Act*) ?

- [x] Des obligations proportionnées au risque : certains usages interdits, des exigences fortes pour les systèmes à haut risque
- [ ] L'interdiction de toute intelligence artificielle en Europe
- [ ] Aucune règle : seule l'autorégulation des entreprises
- [ ] Un permis individuel pour chaque utilisateur d'IA

> Adopté en 2024, il interdit par exemple la notation sociale des citoyens, impose des exigences aux systèmes à haut risque (recrutement, éducation, santé…) et des obligations de transparence, comme signaler qu'un contenu a été généré ou qu'on parle à une IA.

## donnees-test · single
Pourquoi sépare-t-on les données en un jeu d'entraînement et un jeu de test ?

- [x] Pour mesurer la performance sur des données que le modèle n'a jamais vues
- [ ] Pour entraîner deux modèles différents
- [ ] Pour aller deux fois plus vite
- [ ] Parce que le jeu de test contient les étiquettes et pas l'autre

> Un modèle évalué sur ses propres exemples d'entraînement paraît toujours meilleur qu'il ne l'est. Le jeu de test doit rester à l'écart pendant toute la mise au point : sinon, on finit par régler le modèle sur lui, et la mesure n'est plus honnête.
