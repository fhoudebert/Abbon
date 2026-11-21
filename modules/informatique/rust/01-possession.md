---
id: rust-01
title: { fr: "Rust : possession et emprunt" }
description: { fr: "Déplacement, Copy, emprunts, Option, Result, cargo" }
level: bases
tags: [rust, mémoire, "v:rust-2024"]
---

## deplacement · single
Que se passe-t-il après `let b = a;` si `a` est une `String` ?

- [x] `a` n'est plus utilisable : la valeur a été déplacée dans `b`
- [ ] `a` et `b` partagent la même chaîne
- [ ] La chaîne est copiée : `a` et `b` sont indépendantes

> `String` n'implémente pas `Copy` : l'affectation déplace la valeur, et le compilateur refuse tout usage ultérieur de `a`. Chaque valeur a ainsi un seul propriétaire, qui la libère en fin de portée. Pour une copie explicite : `let b = a.clone();`.

## copy · single
Ce programme compile-t-il ?

```rust
fn main() {
    let x = 5;
    let y = x;
    println!("{x} {y}");
}
```

- [x] Oui : les entiers implémentent `Copy`, `x` reste utilisable
- [ ] Non : `x` a été déplacé dans `y`
- [ ] Non : il faut écrire `x.clone()`
- [ ] Oui, mais `x` vaut désormais 0

> Les types simples de taille fixe (entiers, flottants, `bool`, `char`) implémentent `Copy` : l'affectation duplique la valeur au lieu de la déplacer. Le programme affiche `5 5`.

## mutabilite · single
Par défaut, une variable déclarée avec `let` est :

- [x] immuable ; il faut `let mut` pour pouvoir la modifier
- [ ] modifiable ; il faut `const` pour l'en empêcher
- [ ] modifiable seulement à l'intérieur de sa fonction

> En Rust, l'immuabilité est le choix par défaut : `let x = 1; x = 2;` ne compile pas. On demande la mutabilité explicitement avec `let mut x = 1;`.

## emprunt-mutable · single
Combien de références mutables (`&mut`) vers une même valeur peuvent exister en même temps ?

- [x] Une seule, et aucune référence partagée (`&`) en même temps
- [ ] Autant que l'on veut
- [ ] Deux au plus
- [ ] Une seule, en plus d'autant de références partagées que l'on veut

> La règle des emprunts : soit plusieurs références partagées en lecture, soit une seule référence mutable. Elle est vérifiée à la compilation et interdit qu'une donnée soit modifiée pendant qu'un autre code la lit.

## option · single
Comment Rust représente-t-il l'absence éventuelle de valeur ?

- [x] Par le type `Option<T>`, dont la variante `None` signifie « rien »
- [ ] Par la valeur `null`
- [ ] Par la valeur `nil`
- [ ] Par la valeur `-1`

> Rust n'a pas de `null`. Une valeur qui peut manquer a le type `Option<T>` : `Some(valeur)` ou `None`. Le compilateur oblige à traiter les deux cas (par `match` ou `if let`) avant d'utiliser la valeur.

## point-interrogation · single
Dans une fonction qui renvoie un `Result`, que fait l'opérateur `?` placé après un appel ?

- [x] Si l'appel a échoué, il renvoie aussitôt l'erreur à l'appelant ; sinon il donne la valeur
- [ ] Il fait paniquer le programme en cas d'erreur
- [ ] Il ignore l'erreur et continue
- [ ] Il transforme le `Result` en `Option`

> `let texte = std::fs::read_to_string(chemin)?;` vaut la chaîne lue si tout va bien, et fait sortir de la fonction avec `Err(…)` sinon. C'est `unwrap()` qui panique en cas d'erreur.

## string-str · single
Quelle est la différence entre `String` et `&str` ?

- [x] `String` possède son texte, alloué sur le tas, et peut grandir ; `&str` est une vue empruntée sur un texte
- [ ] `String` est en UTF-16, `&str` en UTF-8
- [ ] `&str` peut être modifiée, pas `String`
- [ ] Aucune : `&str` est l'ancien nom de `String`

> Les deux contiennent de l'UTF-8. Une `String` est propriétaire de ses données ; un `&str` désigne un texte qui appartient à quelqu'un d'autre, par exemple une `String` ou un littéral comme `"abc"`. Une fonction qui ne fait que lire un texte prend en général un `&str`.

## cargo-run · short
Quelle commande compile le projet courant puis lance le programme obtenu ? Écrivez la commande complète.

= cargo run

> `cargo run` compile si nécessaire puis exécute. `cargo build` compile seulement, `cargo check` vérifie le code sans produire d'exécutable, et `cargo test` lance les tests.

## passage-fonction · single
Que donne ce programme ?

```rust
fn longueur(s: String) -> usize {
    s.len()
}

fn main() {
    let texte = String::from("abc");
    let n = longueur(texte);
    println!("{texte} {n}");
}
```

- [x] Il ne compile pas : `texte` a été déplacée dans la fonction
- [ ] Il affiche `abc 3`
- [ ] Il compile, puis panique à l'exécution
- [ ] Il affiche ` 3` : la chaîne a été vidée

> Passer une `String` par valeur la déplace dans le paramètre `s` ; elle est libérée à la fin de `longueur`. Pour seulement la lire, la fonction devrait emprunter : `fn longueur(s: &str) -> usize`, appelée par `longueur(&texte)`.

## garanties · single
Hors blocs `unsafe`, que garantit le compilateur Rust ?

- [x] Pas d'accès à une mémoire invalide ni d'accès concurrents non synchronisés à une donnée
- [ ] Pas de fuite de mémoire
- [ ] Pas de panique à l'exécution
- [ ] Pas d'erreur de logique

> La possession et les emprunts excluent, à la compilation, l'usage d'une valeur libérée, la double libération et les accès concurrents non synchronisés (*data races*). Une fuite de mémoire reste possible (cycle de `Rc`, `std::mem::forget`), tout comme une panique (indice hors limites) ou un bug de logique.
