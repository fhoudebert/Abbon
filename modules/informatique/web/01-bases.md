---
id: web-01
title: { fr: "Web : HTML, CSS et JavaScript, les bases" }
description: { fr: "Sémantique, accessibilité, sélecteurs, flexbox, DOM, promesses" }
level: bases
tags: [html, css, javascript]
---

## nav · single
Quel élément HTML convient pour le menu de navigation principal d'un site ?

- [x] `<nav>`
- [ ] `<div id="nav">`
- [ ] `<menu>`
- [ ] `<header>`

> `<nav>` indique aux navigateurs et aux lecteurs d'écran qu'il s'agit d'une zone de navigation, ce qu'un `<div>` ne dit pas. `<header>` est l'en-tête de la page ou d'une section ; il peut contenir un `<nav>`.

## alt · single
À quoi sert l'attribut `alt` d'une image ?

- [x] À fournir un texte de remplacement, lu par les lecteurs d'écran et affiché si l'image ne se charge pas
- [ ] À afficher une bulle quand la souris survole l'image
- [ ] À donner un autre fichier à charger si le premier manque
- [ ] À fixer le nom du fichier à l'enregistrement

> Le texte alternatif décrit ce que l'image apporte. Une image purement décorative reçoit `alt=""` pour être ignorée des lecteurs d'écran. La bulle au survol vient de l'attribut `title`.

## specificite · single
Avec ces règles, de quelle couleur est le texte de `<p class="note">` ?

```css
.note { color: red; }
p { color: blue; }
```

- [x] Rouge : un sélecteur de classe est plus spécifique qu'un sélecteur d'élément
- [ ] Bleu : la dernière règle écrite l'emporte toujours
- [ ] Violet : les deux couleurs se mélangent

> Quand deux règles visent la même propriété, la plus spécifique gagne : identifiant, puis classe, puis élément. L'ordre d'écriture ne départage que des règles de même spécificité.

## flex-centre · single
Dans un conteneur `display: flex` en ligne, quelle propriété centre les éléments horizontalement ?

- [x] `justify-content: center`
- [ ] `align-items: center`
- [ ] `text-align: center`
- [ ] `float: center`

> `justify-content` répartit les éléments le long de l'axe principal (horizontal par défaut), `align-items` sur l'axe secondaire (vertical). `float: center` n'existe pas.

## rem · single
Quelle unité CSS est relative à la taille de police de l'élément racine de la page ?

- [x] `rem`
- [ ] `em`
- [ ] `px`
- [ ] `vh`

> `1rem` vaut la taille de police de `<html>`, 16 px par défaut, que l'utilisateur peut changer. `em` est relative à la police de l'élément lui-même, `vh` à la hauteur de la fenêtre. Exprimer les tailles en `rem` respecte le réglage de l'utilisateur.

## const · single
Que se passe-t-il à l'exécution de ce code JavaScript ?

```javascript
const t = [1];
t.push(2);
```

- [x] Rien d'anormal : `t` vaut `[1, 2]`
- [ ] Une `TypeError` : `t` est constante
- [ ] Rien : `push` est ignoré sans erreur

> `const` interdit de réaffecter le nom (`t = [3]` lèverait une `TypeError`), pas de modifier l'objet désigné. Le tableau reste donc modifiable.

## egalite-stricte · single
Que valent `"5" == 5` et `"5" === 5` en JavaScript ?

- [x] `true`, puis `false`
- [ ] `false`, puis `false`
- [ ] `true`, puis `true`
- [ ] `false`, puis `true`

> `==` convertit les opérandes avant de comparer : la chaîne `"5"` devient le nombre 5. `===` compare sans conversion : une chaîne n'est jamais égale à un nombre. On utilise `===` par défaut.

## query-selector · single
Que renvoie `document.querySelector(".menu")` ?

- [x] Le premier élément qui a la classe `menu`, ou `null` s'il n'y en a pas
- [ ] Tous les éléments qui ont la classe `menu`
- [ ] Un tableau d'éléments
- [ ] Le texte du premier élément trouvé

> `querySelector` renvoie un seul élément, le premier dans l'ordre du document. Pour tous les éléments, `querySelectorAll` renvoie une `NodeList`, que l'on parcourt avec `forEach` ou `for…of`.

## fetch · single
Que renvoie immédiatement l'appel `fetch(url)` ?

- [x] Une promesse, qui sera résolue avec la réponse du serveur
- [ ] La réponse du serveur
- [ ] Le texte de la page
- [ ] `undefined`

> `fetch` est asynchrone : il rend tout de suite une `Promise`. On attend la réponse avec `await` ou `.then()` : `const reponse = await fetch(url); const donnees = await reponse.json();`.

## label · single
Comment associer un `<label>` à un champ de formulaire ?

- [x] En donnant à l'attribut `for` du label la valeur de l'`id` du champ
- [ ] En donnant au label et au champ le même attribut `name`
- [ ] En donnant au label et au champ la même classe
- [ ] En recopiant le texte du label dans l'attribut `placeholder`

> `<label for="courriel">` et `<input id="courriel">` sont alors liés : cliquer sur le texte place le curseur dans le champ, et un lecteur d'écran annonce le libellé. On peut aussi placer le champ à l'intérieur du label. Un `placeholder` ne remplace pas un label.
