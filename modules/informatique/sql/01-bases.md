---
id: sql-01
title: { fr: "SQL : les bases" }
description: { fr: "Sélection, filtres, clés, jointures, agrégats" }
level: bases
tags: [sql, données]
---

## where · single
Quelle clause ne garde que les lignes qui vérifient une condition ?

- [x] `WHERE`
- [ ] `ORDER BY`
- [ ] `GROUP BY`
- [ ] `SELECT`

> `SELECT nom FROM eleves WHERE classe = 'TG1';` ne renvoie que les élèves de TG1. `ORDER BY` trie le résultat, `GROUP BY` regroupe les lignes pour un calcul, `SELECT` choisit les colonnes.

## cle-primaire · single
Qu'est-ce qu'une clé primaire ?

- [x] Une colonne (ou un groupe de colonnes) dont la valeur identifie chaque ligne de façon unique, sans valeur `NULL`
- [ ] La première colonne de la table
- [ ] Une colonne chiffrée
- [ ] Une colonne qui renvoie vers une autre table

> La clé primaire distingue chaque ligne : deux lignes ne peuvent pas avoir la même, et elle ne peut pas être vide. Une colonne qui renvoie vers une autre table est une clé étrangère.

## cle-etrangere · single
Que garantit une contrainte de clé étrangère ?

- [x] Que la valeur de la colonne existe dans la table référencée
- [ ] Que la valeur de la colonne est unique
- [ ] Que la colonne n'est jamais vide
- [ ] Que la table est triée sur cette colonne

> Si `notes.eleve_id` référence `eleves.id`, on ne peut pas enregistrer une note pour un élève qui n'existe pas : c'est l'intégrité référentielle. L'unicité relève de `UNIQUE` ou de la clé primaire, l'absence de vide de `NOT NULL`.

## jointure · single
Que renvoie `eleves INNER JOIN notes ON notes.eleve_id = eleves.id` ?

- [x] Les combinaisons d'un élève et d'une de ses notes ; un élève sans note n'apparaît pas
- [ ] Tous les élèves, avec `NULL` pour ceux qui n'ont pas de note
- [ ] Toutes les combinaisons possibles d'un élève et d'une note
- [ ] Les élèves qui n'ont aucune note

> Une jointure interne ne garde que les lignes qui ont une correspondance des deux côtés. Pour garder aussi les élèves sans note, on utilise `LEFT JOIN`. Toutes les combinaisons possibles : c'est le produit cartésien (`CROSS JOIN`).

## null · single
Pourquoi `SELECT * FROM eleves WHERE ville = NULL;` ne renvoie-t-elle aucune ligne ?

- [x] Une comparaison avec `NULL` n'est jamais vraie : il faut écrire `ville IS NULL`
- [ ] `NULL` doit s'écrire entre apostrophes
- [ ] `NULL` n'est pas autorisé dans une clause `WHERE`
- [ ] La table ne contient aucune ville vide

> `NULL` signifie « valeur inconnue » : `ville = NULL` ne vaut ni vrai ni faux, mais inconnu, et la ligne est écartée. Les tests corrects sont `IS NULL` et `IS NOT NULL`.

## count · single
Que renvoie `SELECT COUNT(*) FROM eleves WHERE classe = 'TG1';` ?

- [x] Une seule ligne, contenant le nombre d'élèves de TG1
- [ ] Une ligne par élève de TG1
- [ ] La somme des identifiants des élèves de TG1
- [ ] Le nombre de colonnes de la table

> `COUNT(*)` est une fonction d'agrégation : elle résume un ensemble de lignes en une valeur. Autres agrégats usuels : `SUM`, `AVG`, `MIN`, `MAX`.

## having · single
On veut les classes de plus de 30 élèves : `SELECT classe, COUNT(*) FROM eleves GROUP BY classe …`. Quelle clause complète la requête ?

- [x] `HAVING COUNT(*) > 30`
- [ ] `WHERE COUNT(*) > 30`
- [ ] `ORDER BY COUNT(*) > 30`

> `WHERE` filtre les lignes avant le regroupement et ne peut donc pas porter sur un agrégat. `HAVING` filtre les groupes après le calcul.

## order-by · single
Quelle requête classe les élèves de la meilleure note à la moins bonne ?

- [x] `SELECT nom, note FROM eleves ORDER BY note DESC;`
- [ ] `SELECT nom, note FROM eleves ORDER BY note;`
- [ ] `SELECT nom, note FROM eleves GROUP BY note;`
- [ ] `SELECT nom, note FROM eleves SORT note DOWN;`

> `ORDER BY` trie par ordre croissant par défaut (`ASC`) ; `DESC` demande l'ordre décroissant. `SORT … DOWN` n'existe pas en SQL.

## update · short
Quel mot-clé SQL commence une requête qui modifie des lignes déjà présentes dans une table ?

= UPDATE

> `UPDATE eleves SET classe = 'TG2' WHERE id = 12;` modifie la ligne visée. Sans clause `WHERE`, toutes les lignes de la table sont modifiées. `INSERT` ajoute des lignes, `DELETE` en supprime.

## sqlite · single
Qu'est-ce qui caractérise SQLite parmi les systèmes de bases de données ?

- [x] La base tient dans un seul fichier, lu directement par l'application, sans serveur
- [ ] Elle ne fonctionne qu'en ligne, sur un serveur distant
- [ ] Elle ne comprend pas le langage SQL
- [ ] Elle est réservée aux très grands volumes de données

> SQLite est une bibliothèque intégrée au programme : pas de serveur à installer, la base est un fichier que l'on copie ou sauvegarde comme un autre. Son format est public et documenté, et son code est dans le domaine public. On la trouve dans les téléphones, les navigateurs et d'innombrables applications.
