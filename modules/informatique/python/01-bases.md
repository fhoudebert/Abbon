---
id: python-01
title: { fr: "Python : les bases" }
description: { fr: "Types, listes, dictionnaires, fonctions, exceptions" }
level: bases
tags: [python, "v:python-3.13"]
---

## division · single
Quel est le type du résultat de `3 / 2` en Python 3 ?

- [x] `float`
- [ ] `int`
- [ ] `complex`

> En Python 3, l'opérateur `/` fait toujours une division réelle : `3 / 2` vaut `1.5`, de type `float` (et `4 / 2` vaut `2.0`). La division entière s'écrit `//` : `3 // 2` vaut `1`.

## alias-liste · single
Qu'affiche ce programme ?

```python
a = [1, 2, 3]
b = a
b.append(4)
print(len(a))
```

- [x] 4
- [ ] 3
- [ ] Une erreur : `a` n'a pas été modifiée

> `b = a` ne copie pas la liste : les deux noms désignent le même objet. Ajouter un élément par `b` le fait donc apparaître aussi par `a`. Pour une copie indépendante : `b = a.copy()` ou `b = a[:]`.

## tranche · short
Que vaut l'expression `"abcdef"[1:4]` ? Écrivez la chaîne obtenue, sans guillemets.

= bcd

> Une tranche `[début:fin]` va de l'indice `début` inclus à l'indice `fin` exclu, et les indices commencent à 0 : on obtient les caractères d'indices 1, 2 et 3, soit `bcd`.

## comprehension · single
Que vaut `[x * 2 for x in range(3)]` ?

- [x] `[0, 2, 4]`
- [ ] `[2, 4, 6]`
- [ ] `[0, 1, 2, 0, 1, 2]`
- [ ] `(0, 2, 4)`

> `range(3)` produit 0, 1 et 2 ; chaque valeur est doublée. Les crochets construisent une liste (des parenthèses donneraient un générateur, pas un tuple). `[2, 4, 6]` correspondrait à `range(1, 4)`.

## cle-absente · single
`d = {"a": 1}`. Que se passe-t-il à l'exécution de `d["z"]` ?

- [x] Une exception `KeyError` est levée
- [ ] L'expression vaut `None`
- [ ] Une exception `IndexError` est levée
- [ ] La clé `"z"` est créée avec la valeur `0`

> L'accès par crochets à une clé absente lève `KeyError`. Pour obtenir une valeur par défaut sans erreur, on utilise `d.get("z")`, qui renvoie `None`, ou `d.get("z", 0)`. `IndexError` concerne les indices de listes.

## finally · single
Dans une instruction `try`, quel bloc est exécuté dans tous les cas, qu'une exception ait été levée ou non ?

- [x] `finally`
- [ ] `else`
- [ ] `except`

> `finally` s'exécute toujours : il sert à libérer une ressource (fermer un fichier, une connexion). `else` ne s'exécute que si aucune exception n'a été levée, `except` seulement si une exception correspondante l'a été.

## defaut-mutable · single
Qu'affiche ce programme ?

```python
def ajoute(x, liste=[]):
    liste.append(x)
    return liste

ajoute(1)
print(ajoute(2))
```

- [x] `[1, 2]`
- [ ] `[2]`
- [ ] `[1]`
- [ ] Une erreur

> La valeur par défaut `[]` est créée une seule fois, à la définition de la fonction, puis réutilisée à chaque appel : la même liste reçoit 1 puis 2. L'usage correct est `liste=None`, puis `if liste is None: liste = []` dans la fonction.

## immuables · multiple
Lesquels de ces types sont immuables (leurs valeurs ne peuvent pas être modifiées sur place) ?

- [x] `tuple`
- [x] `str`
- [ ] `list`
- [ ] `dict`

> Un tuple et une chaîne ne changent jamais après leur création : `s[0] = "x"` lève `TypeError`. Listes et dictionnaires sont modifiables. C'est pourquoi un tuple peut servir de clé de dictionnaire, pas une liste.

## pep8-nom · single
Selon la PEP 8, comment nommer une fonction qui calcule un total ?

- [x] `calcule_total`
- [ ] `calculeTotal`
- [ ] `CalculeTotal`
- [ ] `CALCULE_TOTAL`

> La PEP 8 recommande les minuscules séparées par des tirets bas (*snake_case*) pour les fonctions et les variables, `CapWords` pour les classes et les majuscules pour les constantes. `calculeTotal` est la convention de JavaScript ou de Java.

## egal-is · single
Quelle est la différence entre `==` et `is` ?

- [x] `==` compare les valeurs, `is` teste s'il s'agit du même objet
- [ ] `is` compare les valeurs, `==` teste s'il s'agit du même objet
- [ ] Aucune : ce sont deux écritures du même test
- [ ] `is` ne s'emploie qu'avec les nombres

> Deux listes distinctes de même contenu sont égales (`==`) sans être le même objet (`is`). On réserve `is` aux comparaisons avec `None` : `if x is None`.
