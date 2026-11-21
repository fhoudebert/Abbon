---
id: web-03
title: { fr: "HTML5 avancé : JavaScript et API du navigateur" }
description: { fr: "Chargement des scripts et modules, événements, DOM et sécurité, stockage local, asynchronisme, canvas, travail hors ligne" }
level: approfondissement
tags: [html, javascript]
---

## defer · single
Quelle différence y a-t-il entre `<script src="app.js" defer>` et `<script src="app.js">` placé dans `<head>` ?

- [x] Avec `defer`, le script est téléchargé en parallèle et exécuté une fois le HTML analysé ; sans, l'analyse de la page s'arrête pendant son téléchargement et son exécution
- [ ] Avec `defer`, le script ne s'exécute qu'au clic de l'utilisateur
- [ ] Aucune différence
- [ ] Avec `defer`, le script est exécuté avant le reste de la page

> Un script classique bloque l'analyse : il peut chercher un élément qui n'existe pas encore. `defer` garantit l'ordre des scripts et un DOM complet. `async` exécute le script dès qu'il est arrivé, sans ordre garanti : bien pour une mesure d'audience, risqué pour du code qui dépend d'autres scripts.

## module · single
Que faut-il pour écrire `import { calcul } from './outils.js';` dans un script chargé par la page ?

- [x] Le charger avec `<script type="module" src="app.js">`
- [ ] Rien : tous les scripts acceptent `import`
- [ ] Remplacer `import` par `require`
- [ ] Installer Node.js sur le poste du visiteur

> Les modules ES sont natifs dans les navigateurs : `type="module"` active `import` et `export`, le mode strict, et un comportement « différé » comme `defer`. Ouverts en `file://`, ils sont souvent refusés : il faut un petit serveur local. `require` est la syntaxe historique de Node.js.

## delegation · single
Une liste reçoit sans cesse de nouveaux `<li>`. Comment réagir aux clics sur chacun, y compris ceux ajoutés plus tard ?

- [x] Un seul écouteur sur la liste, qui lit `event.target.closest('li')` : l'événement remonte des `<li>` vers leur parent
- [ ] Un `onclick` dans chaque `<li>` du HTML d'origine suffit
- [ ] Ce n'est pas possible sans recharger la page
- [ ] Un écouteur sur `window` pour chaque `<li>`

> C'est la délégation d'événements : un clic « bouillonne » de l'élément cliqué vers ses ancêtres. Un écouteur posé sur le parent sert donc aussi aux éléments créés après coup, avec un seul `addEventListener`.

## prevent-default · single
Que fait `event.preventDefault()` dans l'écouteur `submit` d'un formulaire ?

- [x] Il empêche l'envoi classique et le rechargement de la page, pour traiter les données en JavaScript (par exemple avec `fetch`)
- [ ] Il vide les champs du formulaire
- [ ] Il empêche l'événement de remonter vers les éléments parents
- [ ] Il désactive la validation HTML5

> `preventDefault` annule l'action par défaut du navigateur (envoi, suivi d'un lien, case cochée). Arrêter la remontée de l'événement, c'est `stopPropagation`, une autre méthode. La validation native (`required`…) a lieu avant l'événement `submit`.

## innerhtml · single
On affiche le pseudo saisi par un visiteur avec `zone.innerHTML = pseudo;`. Quel est le risque ?

- [x] Une faille XSS : un pseudo contenant du HTML, comme `<img src=x onerror="…">`, exécute du code dans la page des autres visiteurs
- [ ] Aucun risque : le navigateur filtre tout
- [ ] Le texte s'affiche en majuscules
- [ ] Les accents disparaissent

> `innerHTML` interprète la chaîne comme du HTML. Pour afficher un texte tel quel, on utilise `textContent` (ou `createElement` puis `textContent`). Une politique de sécurité du contenu (en-tête `Content-Security-Policy`) ajoute une protection.

## localstorage · single
Que contient `t` après ce code ?

```javascript
localStorage.setItem('scores', [12, 15]);
const t = localStorage.getItem('scores');
```

- [x] La chaîne `"12,15"`
- [ ] Le tableau `[12, 15]`
- [ ] `null`
- [ ] Le nombre 27

> `localStorage` ne stocke que des chaînes : le tableau est converti par `toString()`. On écrit donc `setItem('scores', JSON.stringify(scores))` et on relit avec `JSON.parse(getItem('scores'))`. Les données restent sur l'appareil, pour ce site seulement, même après fermeture du navigateur.

## dataset · single
Comment lire en JavaScript l'attribut de `<button data-produit-id="42">` ?

- [x] `bouton.dataset.produitId`
- [ ] `bouton.data.produit-id`
- [ ] `bouton.produitId`
- [ ] `bouton.getData('produit')`

> Les attributs `data-*` stockent des données dans le HTML ; `dataset` les expose en notation camelCase (`data-produit-id` devient `produitId`). Leur valeur est une chaîne : `Number(bouton.dataset.produitId)` donne le nombre 42.

## map-join · short · case-sensitive
Qu'affiche `console.log([1, 2, 3].map((x) => x * 2).join('-'))` ? Écrivez le résultat exact.

= 2-4-6

> `map` crée un nouveau tableau `[2, 4, 6]` en appliquant la fonction à chaque élément, sans modifier l'original ; `join('-')` en fait une chaîne avec `-` comme séparateur.

## fetch-404 · single
Que se passe-t-il quand `await fetch('/api/inconnu')` reçoit une réponse 404 ?

- [x] La promesse est résolue normalement : il faut tester `reponse.ok` (ou `reponse.status`)
- [ ] La promesse est rejetée et part dans le `catch`
- [ ] Le navigateur affiche une page d'erreur
- [ ] `fetch` renvoie `undefined`

> `fetch` ne rejette qu'en cas d'échec réseau (pas de connexion, adresse introuvable, requête bloquée par CORS). Une réponse HTTP, même 404 ou 500, est une réponse : `if (!reponse.ok) throw new Error(reponse.status);`.

## promise-all · single
On doit charger trois fichiers JSON indépendants. Quelle écriture est la plus rapide ?

- [x] `const [a, b, c] = await Promise.all([fetch(u1), fetch(u2), fetch(u3)]);`
- [ ] Trois `await fetch(…)` l'un après l'autre
- [ ] Une boucle `for` avec `setTimeout`
- [ ] Les trois écritures prennent le même temps

> Avec trois `await` successifs, chaque requête attend la fin de la précédente. `Promise.all` lance les trois en parallèle et attend qu'elles soient toutes terminées ; il échoue dès que l'une échoue (`Promise.allSettled` attend toutes les issues).

## var-let · single
Qu'affiche ce code, une seconde plus tard ?

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
```

- [x] `3`, trois fois
- [ ] `0`, `1`, `2`
- [ ] `undefined`, trois fois
- [ ] Une erreur

> `var` crée une seule variable `i` pour toute la boucle ; quand les fonctions s'exécutent, la boucle est finie et `i` vaut 3. Avec `let`, chaque tour a son propre `i` : on obtient `0`, `1`, `2`. On préfère `let` et `const` à `var`.

## canvas · single
Comment dessiner un rectangle plein dans `<canvas id="dessin" width="300" height="150">` ?

- [x] `const ctx = document.getElementById('dessin').getContext('2d'); ctx.fillRect(10, 10, 100, 50);`
- [ ] `document.getElementById('dessin').rect(10, 10, 100, 50);`
- [ ] En ajoutant `<rect>` dans le `<canvas>`
- [ ] Avec la propriété CSS `canvas-rect`

> Le canvas est une surface de pixels pilotée par JavaScript, via un contexte de dessin (`2d`, ou `webgl` pour la 3D). `<rect>` est un élément SVG : en SVG, chaque forme reste un élément du DOM ; dans un canvas, il ne reste que des pixels.

## service-worker · single
Quel mécanisme permet à une application web de fonctionner hors ligne ?

- [x] Un service worker, qui intercepte les requêtes et répond avec des fichiers mis en cache
- [ ] Le `localStorage`, qui garde toutes les pages
- [ ] La balise `<meta offline="true">`
- [ ] Les cookies

> Un service worker est un script qui s'exécute à part de la page, entre elle et le réseau ; avec l'API Cache, il sert les fichiers sans connexion. C'est la base des applications web progressives (PWA), installables comme des applications. Il n'est accepté qu'en HTTPS (ou sur `localhost`).

## web-worker · single
Un calcul de 5 secondes, lancé au clic, fige l'interface. Quelle solution HTML5 garde la page réactive ?

- [x] Exécuter le calcul dans un Web Worker, qui communique avec la page par `postMessage`
- [ ] Mettre le calcul dans une fonction `async`
- [ ] Ajouter l'attribut `defer` au bouton
- [ ] Utiliser `setInterval` à 0 ms

> JavaScript exécute la page dans un seul fil : un calcul long bloque l'affichage et les clics. `async` n'y change rien pour un calcul (il ne rend pas le code parallèle, il sert à attendre des opérations comme le réseau). Un Web Worker tourne dans un autre fil, sans accès au DOM.

## cors · single
Une page servie par `https://site-a.fr` appelle `fetch('https://api.site-b.fr/donnees')`, et la console signale une erreur CORS. Qui doit corriger ?

- [x] Le serveur `api.site-b.fr`, en autorisant `site-a.fr` dans l'en-tête `Access-Control-Allow-Origin`
- [ ] Le visiteur, en désactivant la sécurité de son navigateur
- [ ] Le code de la page, en ajoutant `mode: 'cors-off'`
- [ ] Personne : les appels vers un autre domaine sont impossibles

> Par défaut, un navigateur empêche une page de lire les réponses d'un autre domaine (politique de même origine). Le serveur appelé décide de lever cette restriction par ses en-têtes CORS ; la page ne peut pas s'en dispenser.
