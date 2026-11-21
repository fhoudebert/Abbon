---
id: web-02
title: { fr: "HTML5 et CSS, sans JavaScript" }
description: { fr: "Structure d'une page, balises sémantiques, formulaires, images et médias, feuilles de style et leur import, boîte, grille, responsive" }
level: bases
tags: [html, css]
---

## doctype · single
À quoi sert la première ligne `<!DOCTYPE html>` d'une page ?

- [x] À faire afficher la page en mode standard (HTML5) plutôt qu'en mode de compatibilité
- [ ] À charger la bibliothèque HTML5 depuis Internet
- [ ] À indiquer l'encodage des caractères
- [ ] Elle est facultative et n'a aucun effet

> Sans doctype, les navigateurs passent en mode « quirks », qui imite les bogues des navigateurs des années 1990 (calcul des boîtes différent, par exemple). `<!DOCTYPE html>` est la forme courte de HTML5 ; l'encodage se déclare à part, avec `<meta charset="utf-8">`.

## head-meta · multiple
Quelles balises placées dans `<head>` sont recommandées pour toute page HTML5 ?

- [x] `<meta charset="utf-8">`
- [x] `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [x] `<title>…</title>`
- [ ] `<body>`
- [ ] `<h1>…</h1>`

> L'encodage UTF-8 évite les accents illisibles, la balise viewport empêche les téléphones d'afficher la page comme un écran de bureau réduit, et le titre apparaît dans l'onglet et les résultats de recherche. `<body>` et `<h1>` vont dans le corps, pas dans l'en-tête.

## import-css · single
Quelle est la façon recommandée de relier une feuille de style externe à une page ?

- [x] `<link rel="stylesheet" href="style.css">` dans `<head>`
- [ ] `<style src="style.css"></style>`
- [ ] `<script src="style.css"></script>`
- [ ] `<css href="style.css">`

> `<link rel="stylesheet">` est chargé en parallèle des autres ressources. Dans une feuille de style, `@import url("autre.css");` fonctionne aussi, mais il doit être placé en tête du fichier et retarde le chargement : le navigateur ne découvre la seconde feuille qu'après avoir lu la première.

## cascade-ordre · single
Une même propriété est fixée par une feuille externe liée dans `<head>`, puis par un bloc `<style>` placé après, et enfin par l'attribut `style="…"` de l'élément. Les trois sélecteurs ont la même spécificité. Laquelle s'applique ?

- [x] L'attribut `style` de l'élément
- [ ] La feuille externe, chargée en premier
- [ ] Le bloc `<style>`, interne à la page
- [ ] Aucune : le navigateur signale un conflit

> Un style en ligne l'emporte sur les règles des feuilles (seul `!important` le surpasse). Entre la feuille externe et le bloc `<style>`, c'est l'ordre d'apparition qui départage, et non le fait d'être interne ou externe. On évite les styles en ligne : ils sont difficiles à maintenir et à surcharger.

## semantique · single
Un article de blog, qui a du sens lu seul (on pourrait le publier ailleurs), doit être balisé avec :

- [x] `<article>`
- [ ] `<section>`
- [ ] `<div class="article">`
- [ ] `<aside>`

> `<article>` est un contenu autonome (billet, commentaire, fiche produit). `<section>` regroupe une partie thématique d'un document, en général avec un titre ; `<aside>` contient un contenu annexe (encadré, publicité). Un `<div>` n'a aucun sens pour les lecteurs d'écran ni pour les moteurs de recherche.

## titres · single
Quelle structure de titres est correcte pour une page accessible ?

- [x] Un `<h1>` pour le titre principal, puis des `<h2>`, et des `<h3>` à l'intérieur des `<h2>`, sans sauter de niveau
- [ ] Des `<h4>` partout, parce qu'ils sont plus petits
- [ ] Un `<h1>` par paragraphe, pour mettre en valeur
- [ ] L'ordre des titres n'a pas d'importance

> Les lecteurs d'écran proposent de naviguer de titre en titre : la hiérarchie sert de table des matières. La taille d'affichage se règle en CSS, elle ne doit pas guider le choix du niveau.

## validation-native · single
Que fait ce champ, sans aucune ligne de JavaScript ?

```html
<input type="email" name="courriel" required>
```

- [x] Le navigateur refuse d'envoyer le formulaire si le champ est vide ou ne ressemble pas à une adresse électronique
- [ ] Il envoie un courriel de vérification à l'adresse saisie
- [ ] Rien : la validation exige JavaScript
- [ ] Il chiffre l'adresse avant l'envoi

> HTML5 valide de lui-même `required`, les types (`email`, `url`, `number`), `min`, `max`, `minlength` et `pattern`, et affiche un message. Sur téléphone, `type="email"` fait aussi apparaître un clavier avec « @ ». Le serveur doit **toujours** revérifier : la validation du navigateur se contourne facilement.

## picture · single
À quoi sert l'attribut `srcset` d'une image ?

```html
<img src="photo-800.jpg" srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w" sizes="(max-width: 600px) 100vw, 50vw" alt="…">
```

- [x] À proposer plusieurs tailles de fichier : le navigateur choisit la plus adaptée à l'écran
- [ ] À afficher les trois images l'une après l'autre
- [ ] À charger les trois images pour les mettre en cache
- [ ] À indiquer des images de secours en cas d'erreur réseau

> Un téléphone télécharge la version 400 px au lieu de 1600 px : moins de données, page plus rapide. `src` reste l'image par défaut des navigateurs anciens. Pour changer de cadrage ou de format (AVIF, WebP), on utilise `<picture>` et ses `<source>`.

## video · single
Que faut-il ajouter à `<video src="film.mp4">` pour que l'utilisateur dispose des boutons lecture, pause et volume ?

- [x] L'attribut `controls`
- [ ] L'attribut `autoplay`
- [ ] Une balise `<player>` autour
- [ ] Un module externe (Flash)

> HTML5 lit audio et vidéo sans module : `controls` affiche les commandes du navigateur. `<track kind="captions">` ajoute des sous-titres. `autoplay` est en général bloqué par les navigateurs, sauf avec `muted`.

## box-sizing · numeric
Avec `box-sizing: content-box` (valeur par défaut), quelle largeur totale occupe un élément `width: 200px; padding: 20px; border: 5px solid;`, en pixels ?

= 250 ± 0 px

> En `content-box`, `width` ne compte que le contenu : $200 + 2 \times 20 + 2 \times 5 = 250$ px. Avec `box-sizing: border-box`, l'élément ferait exactement 200 px, marges intérieures et bordure comprises ; c'est pourquoi beaucoup de feuilles commencent par `*, *::before, *::after { box-sizing: border-box; }`.

## media-query · single
Que fait cette règle ?

```css
@media (max-width: 600px) {
  .colonnes { flex-direction: column; }
}
```

- [x] Sur un écran de 600 px de large ou moins, les colonnes s'empilent verticalement
- [ ] Elle limite la largeur de `.colonnes` à 600 px
- [ ] Elle ne s'applique qu'à l'impression
- [ ] Elle s'applique aux écrans de plus de 600 px

> Une requête média n'applique ses règles que si la condition est vraie : c'est la base du responsive design. Démarche « mobile d'abord » : on écrit le style des petits écrans, puis on l'enrichit avec `@media (min-width: …)`.

## grid-fr · single
Que produit `grid-template-columns: 1fr 2fr;` dans un conteneur `display: grid` de 900 px de large (sans espacement) ?

- [x] Deux colonnes de 300 px et 600 px
- [ ] Deux colonnes de 1 px et 2 px
- [ ] Trois colonnes égales
- [ ] Deux colonnes de 450 px

> L'unité `fr` partage l'espace libre : 3 parts, dont 1 et 2, soit 300 et 600 px. Flexbox aligne sur un axe ; la grille place les éléments sur deux axes (lignes et colonnes) à la fois.

## variables-css · single
Que vaut la couleur du texte des boutons ?

```css
:root { --principale: #0b5; }
button { color: var(--principale, black); }
```

- [x] `#0b5`, la valeur de la propriété personnalisée
- [ ] `black`, la valeur indiquée en dernier
- [ ] Aucune : `var()` n'existe qu'en Sass
- [ ] `--principale`, écrit tel quel

> Les propriétés personnalisées (« variables CSS ») sont natives. Le second argument de `var()` sert de valeur de secours, utilisée seulement si la variable n'est pas définie. Changer `--principale` à un seul endroit recolore tout le site, par exemple pour un thème sombre.

## focus-visible · single
Pourquoi ne faut-il pas écrire `*:focus { outline: none; }` sans rien prévoir d'autre ?

- [x] Les personnes qui naviguent au clavier ne voient plus où elles se trouvent dans la page
- [ ] Parce que la règle ralentit l'affichage
- [ ] Parce que `outline` n'existe plus en CSS3
- [ ] Ce n'est pas un problème : le focus ne sert qu'à la souris

> Le contour de focus est indispensable à la navigation au clavier (Tab). Pour le masquer après un clic tout en le gardant au clavier, on utilise `:focus-visible`, par exemple `button:focus-visible { outline: 3px solid #0b5; }`.

## sticky · single
Que fait `position: sticky; top: 0;` sur un en-tête de tableau ?

- [x] L'en-tête défile normalement, puis reste collé en haut de son conteneur quand on fait défiler le contenu
- [ ] L'en-tête est retiré du flux et fixé au coin de la fenêtre, comme `fixed`
- [ ] L'en-tête ne peut plus bouger du tout
- [ ] Rien sans JavaScript

> `sticky` se comporte comme `relative`, jusqu'à ce que le seuil (`top: 0`) soit atteint ; il se comporte alors comme `fixed`, dans les limites de son conteneur. Autrefois, il fallait du JavaScript pour cela.
