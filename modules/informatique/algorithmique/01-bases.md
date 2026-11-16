---
id: algorithmique-01
title: { fr: "Algorithmique : les bases" }
description: { fr: "Complexité, recherche, tris, récursivité, piles, files, graphes" }
level: bases
tags: [algorithmique, nsi]
---

## dichotomie · single
Combien de comparaisons faut-il au plus pour trouver une valeur dans une liste triée de 1 000 éléments par recherche dichotomique ?

- [x] Environ 10
- [ ] Environ 500
- [ ] 1 000
- [ ] Environ 100

> Chaque comparaison divise par deux la zone de recherche : $2^{10} = 1\,024 \geq 1\,000$, donc 10 étapes suffisent. La complexité est en $O(\log n)$, contre $O(n)$ pour un parcours séquentiel. La liste doit être triée.

## complexite-boucles · single
Quelle est la complexité de ce programme, en fonction de `n` ?

```python
total = 0
for i in range(n):
    for j in range(n):
        total += i * j
```

- [x] $O(n^2)$
- [ ] $O(n)$
- [ ] $O(2n)$
- [ ] $O(\log n)$

> La boucle intérieure tourne `n` fois pour chacun des `n` tours de la boucle extérieure : $n \times n$ opérations. Si `n` double, le temps est multiplié par quatre environ.

## tri-insertion · single
Quelle est la complexité du tri par insertion dans le pire des cas ?

- [x] $O(n^2)$
- [ ] $O(n \log n)$
- [ ] $O(n)$
- [ ] $O(1)$

> Dans le pire des cas (liste triée à l'envers), chaque élément est comparé à tous ceux déjà placés : $1 + 2 + \dots + (n-1) = \frac{n(n-1)}{2}$ comparaisons. Sur une liste presque triée, il est en revanche très rapide, proche de $O(n)$.

## tri-fusion · single
Sur quel principe repose le tri fusion ?

- [x] Diviser la liste en deux, trier chaque moitié, puis fusionner les deux moitiés triées
- [ ] Échanger deux éléments voisins tant qu'ils sont dans le mauvais ordre
- [ ] Chercher le plus petit élément et le placer en tête, puis recommencer
- [ ] Tirer les éléments au hasard jusqu'à ce que la liste soit triée

> C'est la méthode « diviser pour régner ». Elle trie en $O(n \log n)$ dans tous les cas. Échanger des voisins, c'est le tri à bulles ; placer le minimum en tête, le tri par sélection, tous deux en $O(n^2)$.

## recursion-cas-base · single
Que manque-t-il à cette fonction récursive ?

```python
def somme(n):
    return n + somme(n - 1)
```

- [x] Un cas de base, par exemple `if n == 0: return 0`, qui arrête les appels
- [ ] Une boucle `for`
- [ ] Une variable globale
- [ ] Rien : elle calcule correctement $1 + 2 + \dots + n$

> Sans cas de base, la fonction s'appelle indéfiniment ; Python s'arrête avec une `RecursionError` quand la pile d'appels est pleine. Toute fonction récursive doit avoir un cas qui ne s'appelle pas, et chaque appel doit s'en rapprocher.

## recursion-valeur · numeric
Que renvoie `f(4)` ?

```python
def f(n):
    if n == 0:
        return 1
    return 2 * f(n - 1)
```

= 16

> $f(0) = 1$, $f(1) = 2$, $f(2) = 4$, $f(3) = 8$, $f(4) = 16$ : la fonction calcule $2^n$.

## pile · single
Une pile est une structure de type :

- [x] LIFO : le dernier élément ajouté est le premier retiré
- [ ] FIFO : le premier élément ajouté est le premier retiré
- [ ] triée : on retire toujours le plus petit élément
- [ ] à accès direct : on retire n'importe quel élément

> Comme une pile d'assiettes. Le bouton « Annuler » d'un éditeur et la pile d'appels des fonctions fonctionnent ainsi. La file, elle, est FIFO, comme une file d'attente.

## file · single
Quelle structure de données convient pour gérer des impressions dans l'ordre de leur envoi ?

- [x] Une file
- [ ] Une pile
- [ ] Un arbre binaire de recherche
- [ ] Un graphe

> Premier arrivé, premier servi : c'est une file (FIFO). En Python, `collections.deque` permet d'ajouter d'un côté et de retirer de l'autre en temps constant.

## parcours-largeur · single
Pour trouver le chemin qui passe par le moins d'arêtes entre deux sommets d'un graphe, quel parcours utiliser ?

- [x] Le parcours en largeur
- [ ] Le parcours en profondeur
- [ ] Un tri fusion des sommets
- [ ] La recherche dichotomique

> Le parcours en largeur visite d'abord tous les voisins, puis les voisins des voisins, et ainsi de suite : il atteint chaque sommet par un chemin le plus court en nombre d'arêtes. Il s'appuie sur une file. Le parcours en profondeur, qui s'appuie sur une pile, ne le garantit pas.

## arbre-binaire · single
Dans un arbre binaire de recherche, où se trouvent les valeurs plus petites que celle d'un nœud ?

- [x] Dans son sous-arbre gauche
- [ ] Dans son sous-arbre droit
- [ ] Au même niveau que lui
- [ ] N'importe où dans l'arbre

> Tout le sous-arbre gauche contient des valeurs plus petites, tout le sous-arbre droit des valeurs plus grandes. Chercher une valeur revient à descendre à gauche ou à droite : $O(\log n)$ si l'arbre est équilibré, $O(n)$ s'il a dégénéré en liste.
