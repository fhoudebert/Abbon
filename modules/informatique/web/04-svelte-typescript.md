---
id: web-04
title: { fr: "Svelte 5 et TypeScript" }
description: { fr: "Composants Svelte compilés, runes $state, $derived, $effect, $props et $bindable, événements, blocs each à clé, snippets, fichiers .svelte.ts, routes SvelteKit ; TypeScript : typage structurel, types effacés à l'exécution, unknown, rétrécissement, unions discriminées, never, satisfies, as const, types utilitaires" }
level: approfondissement
tags: [svelte, sveltekit, typescript, javascript, web]
---

## compilateur · single
Qu'est-ce qui distingue Svelte de bibliothèques comme React ?

- [x] C'est un compilateur : les composants `.svelte` sont traduits à la construction en JavaScript qui met à jour directement le DOM, sans DOM virtuel à comparer
- [ ] Il s'exécute uniquement côté serveur
- [ ] Il impose d'écrire le HTML en JavaScript (JSX)
- [ ] Il n'accepte pas de CSS dans les composants

> Le compilateur sait, dès la construction, quelles parties de la page dépendent de quelles variables : il produit le code de mise à jour ciblé. Le CSS d'un composant est limité par défaut à ce composant (une classe générée est ajoutée). SvelteKit est le cadriciel d'application construit autour : routes, chargement des données, rendu serveur.

## state · single
Que s'affiche-t-il après trois clics ?

```html
<script lang="ts">
  let notes = $state<number[]>([]);
</script>

<button onclick={() => notes.push(notes.length)}>Ajouter</button>
<p>{notes.length} note(s)</p>
```

- [x] « 3 note(s) » : un tableau déclaré avec `$state` est observé en profondeur, `push` suffit
- [ ] « 0 note(s) » : il faut réaffecter `notes = [...notes, n]` pour que l'affichage change
- [ ] Une erreur : on ne peut pas appeler `push` sur un état
- [ ] « 3 note(s) », mais seulement si on ajoute `bind:` sur le bouton

> En Svelte 5, `$state` enveloppe les objets et tableaux dans un proxy : les modifications en profondeur sont suivies. En Svelte 3 et 4, seule une affectation déclenchait la mise à jour, d'où l'habitude `notes = [...notes, n]`. Pour de gros objets qu'on remplace toujours en bloc, `$state.raw` évite le proxy : seule la réaffectation compte alors.

## derived · single
`let total = $derived(prix * quantite);` Que se passe-t-il quand `quantite` change ?

- [x] `total` est recalculé automatiquement : il dépend des états lus dans l'expression
- [ ] Rien : `total` garde la valeur calculée au montage du composant
- [ ] Il faut appeler `total.update()`
- [ ] `total` devient `undefined` jusqu'au prochain rendu

> Une valeur dérivée est en lecture seule et sans effet de bord : on ne l'affecte pas. Pour un calcul sur plusieurs lignes, `$derived.by(() => { … return valeur; })`. Calculer une valeur dans un `$effect` qui modifie un autre état est un piège classique : `$derived` est fait pour cela.

## effect · single
À quoi sert `$effect`, et quand faut-il l'éviter ?

- [x] À synchroniser l'extérieur (canvas, bibliothèque, minuterie, stockage) avec l'état ; il s'exécute après la mise à jour du DOM, et la fonction qu'il renvoie sert de nettoyage. À éviter pour calculer une valeur à partir d'une autre : c'est le rôle de `$derived`
- [ ] À déclarer un état modifiable
- [ ] À exécuter du code côté serveur avant l'affichage
- [ ] À remplacer tous les gestionnaires d'événements

> L'effet se relance quand un état qu'il a lu (de façon synchrone) change ; ce qui est lu après un `await` n'est pas suivi. Il ne s'exécute pas pendant le rendu serveur. Exemple : `$effect(() => { const id = setInterval(tic, 1000); return () => clearInterval(id); });`

## props · single
Comment un composant enfant reçoit-il ses propriétés en Svelte 5 ?

- [x] `let { titre, taille = 'normale' } = $props();`, avec une valeur par défaut éventuelle
- [ ] `export let titre;` uniquement
- [ ] `const titre = props.titre;`, `props` étant une variable globale
- [ ] `import { titre } from 'parent';`

> `export let` est la syntaxe de Svelte 4, encore acceptée hors du mode « runes ». Avec TypeScript : `let { titre }: { titre: string } = $props();`. Pour que le parent puisse lier une propriété avec `bind:valeur`, l'enfant la déclare `let { valeur = $bindable() } = $props();`.

## evenements · single
Comment écrit-on un gestionnaire de clic en Svelte 5 ?

- [x] Comme un attribut : `<button onclick={envoyer}>`
- [ ] Uniquement avec la directive `on:click={envoyer}`, obligatoire
- [ ] `<button onclick="envoyer()">`, entre guillemets comme en HTML
- [ ] Avec `addEventListener` dans un `$effect`, seule méthode possible

> Les événements sont désormais des propriétés comme les autres : un composant peut recevoir `onclick` ou `onvalider` dans ses `$props()` et les transmettre. La directive `on:click` de Svelte 4 reste acceptée mais dépréciée. Entre guillemets, `"envoyer()"` serait une simple chaîne de caractères.

## each-cle · single
Pourquoi écrire `{#each taches as tache (tache.id)}` plutôt que `{#each taches as tache}` ?

- [x] La clé permet à Svelte de suivre chaque élément quand la liste est triée, filtrée ou qu'on insère au milieu : il déplace les bons nœuds du DOM au lieu de réécrire leur contenu, ce qui garde l'état local (champ en cours de saisie, animation)
- [ ] C'est obligatoire, sinon la liste ne s'affiche pas
- [ ] Pour trier la liste par identifiant
- [ ] Pour que la boucle s'exécute côté serveur

> Sans clé, Svelte met à jour les éléments par position : le deuxième nœud reçoit les données du nouveau deuxième élément. Une clé doit être stable et unique : un identifiant, pas l'indice de la boucle.

## snippets · single
Que remplacent les *snippets* (`{#snippet ligne(item)}…{/snippet}`, puis `{@render ligne(x)}`) en Svelte 5 ?

- [x] Les *slots* : des morceaux de balisage réutilisables, avec paramètres, qu'on peut passer à un composant ; le contenu placé entre les balises d'un composant arrive dans sa propriété `children`
- [ ] Les composants : il n'y a plus de fichiers `.svelte`
- [ ] Les feuilles de style
- [ ] Les requêtes réseau

> Un composant enfant affiche son contenu avec `{@render children?.()}`. Un snippet est une valeur : on peut la passer en propriété, la tester, en choisir une selon le cas. Avec TypeScript, son type est `Snippet<[Item]>`, importé de `svelte`.

## svelte-ts · single
Pourquoi un fichier s'appelle-t-il `panier.svelte.ts` plutôt que `panier.ts` ?

- [x] Pour pouvoir y utiliser les runes (`$state`, `$derived`…) hors d'un composant, par exemple pour un état partagé par plusieurs pages
- [ ] Parce que tout fichier TypeScript d'un projet Svelte doit porter cette extension
- [ ] Pour qu'il soit exécuté uniquement par le navigateur
- [ ] Pour qu'il contienne du HTML

> Le compilateur ne transforme les runes que dans les `.svelte` et les `.svelte.ts` (ou `.svelte.js`). On y exporte souvent une classe dont les champs sont des `$state` : `class Panier { articles = $state<Article[]>([]); total = $derived(…); }`. Attention : exporter directement une variable `$state` réaffectée ne fonctionne pas ; on exporte un objet ou une classe.

## routes · single
Dans un projet SvelteKit, quel fichier affiche la page `/articles/mon-titre` ?

- [x] `src/routes/articles/[slug]/+page.svelte`, où `[slug]` reçoit « mon-titre »
- [ ] `src/pages/articles.svelte?slug=mon-titre`
- [ ] `src/routes/articles-mon-titre.svelte`
- [ ] `src/routes/+page.svelte`, qui lit l'adresse lui-même

> Les dossiers de `src/routes` forment les adresses. Un `+page.ts` (ou `+page.server.ts`, côté serveur seulement) voisin exporte une fonction `load` qui prépare les données, reçues dans la page par `let { data } = $props();`. Un `+layout.svelte` entoure toutes les pages de son dossier.

## structurel · single
Ce code TypeScript compile-t-il ?

```typescript
interface Point { x: number; y: number }
const p = { x: 1, y: 2, nom: 'A' };
function norme(v: Point) { return Math.hypot(v.x, v.y); }
norme(p);
```

- [x] Oui : le typage est structurel, `p` a au moins les propriétés `x` et `y` de type `number`
- [ ] Non : `p` n'a pas été déclaré comme `Point`
- [ ] Non : `p` a une propriété en trop
- [ ] Oui, mais seulement avec `as Point`

> Peu importe le nom du type : seule la forme compte. Le contrôle des propriétés en trop ne s'applique qu'à un objet littéral écrit directement à l'appel : `norme({ x: 1, y: 2, nom: 'A' })` serait refusé, pour attraper les fautes de frappe.

## efface · single
Pourquoi `if (valeur instanceof Point)` est-il refusé quand `Point` est une `interface` ?

- [x] Les types TypeScript sont effacés à la compilation : à l'exécution, il ne reste que du JavaScript, et une interface n'y existe pas
- [ ] Parce qu'`instanceof` n'existe pas en TypeScript
- [ ] Parce qu'il faut écrire `typeof valeur === Point`
- [ ] Parce que les interfaces sont privées

> Pour vérifier une forme à l'exécution, on écrit une fonction de garde (`function estPoint(v: unknown): v is Point { … }`) ou l'on valide avec une bibliothèque de schémas, comme Zod, qui déduit aussi le type. `instanceof` fonctionne avec une `class`, qui, elle, existe en JavaScript.

## unknown · single
Des données arrivent de `JSON.parse`. Pourquoi les typer `unknown` plutôt que `any` ?

- [x] Avec `unknown`, TypeScript interdit de s'en servir tant qu'on n'a pas vérifié leur forme ; `any` désactive tout contrôle et laisse passer les erreurs
- [ ] `unknown` est plus rapide à l'exécution
- [ ] `any` n'accepte pas les objets
- [ ] Il n'y a aucune différence

> `any` « contamine » : ce qu'on en tire est aussi `any`. Avec `unknown`, il faut rétrécir le type (`typeof x === 'string'`, `'id' in x`, fonction de garde, schéma) avant de l'utiliser. En mode `strict`, les erreurs attrapées par `catch (e)` sont d'ailleurs typées `unknown`.

## union-discriminee · single
Avec ce type, que vaut le type de `r` dans la branche `else` ?

```typescript
type Resultat =
  | { ok: true; valeur: number }
  | { ok: false; erreur: string };

function afficher(r: Resultat) {
  if (r.ok) console.log(r.valeur);
  else console.log(r.erreur);
}
```

- [x] `{ ok: false; erreur: string }` : la propriété commune `ok` sert de discriminant, TypeScript rétrécit le type dans chaque branche
- [ ] `Resultat`, sans changement : il faut un `as` pour lire `erreur`
- [ ] `never`
- [ ] `{ ok: boolean; valeur?: number; erreur?: string }`

> C'est une union discriminée. Avec un `switch` sur le discriminant, on peut vérifier qu'aucun cas n'est oublié : dans le `default`, `const reste: never = r;` ne compile que si tous les cas ont été traités.

## satisfies · single
Quelle différence entre `const couleurs: Record<string, string> = { fond: '#fff' }` et `const couleurs = { fond: '#fff' } satisfies Record<string, string>` ?

- [x] Les deux vérifient l'objet, mais avec `satisfies` le type précis est gardé : `couleurs.fond` est connu, et `couleurs.bord` est une erreur
- [ ] `satisfies` convertit les valeurs à l'exécution
- [ ] `satisfies` désactive la vérification
- [ ] Aucune différence

> Avec l'annotation, le type devient `Record<string, string>` : n'importe quelle clé est acceptée, et `couleurs.bord` passerait sans erreur. `satisfies` (TypeScript 4.9) contrôle sans élargir. `as const` va plus loin : il fige les valeurs en types littéraux en lecture seule, comme `'#fff'` au lieu de `string`.
