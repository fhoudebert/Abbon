---
id: logiciel-libre-01
title: { fr: "Logiciel libre et standards : les bases" }
description: { fr: "Libertés du logiciel libre, licences, Git, formats ouverts, standards" }
level: bases
tags: [logiciel-libre, git, licences]
---

## libertes · single
Lesquelles de ces libertés définissent un logiciel libre ?

- [x] Utiliser, étudier, modifier et redistribuer le logiciel, modifié ou non
- [ ] L'utiliser gratuitement, sans pouvoir voir son code
- [ ] L'utiliser sans publicité
- [ ] L'utiliser sans connexion Internet

> Ce sont les quatre libertés définies par la Free Software Foundation ; étudier et modifier supposent l'accès au code source. « Libre » ne veut pas dire « gratuit » : un gratuiciel fermé n'est pas libre, et un logiciel libre peut se vendre.

## copyleft · single
Qu'impose une licence à *copyleft*, comme la GPL ?

- [x] Que les versions modifiées et redistribuées restent sous la même licence libre
- [ ] Que le logiciel ne soit jamais vendu
- [ ] Que le code reste secret
- [ ] Que l'on cite l'auteur, sans autre obligation

> Le copyleft protège les libertés des utilisateurs suivants : qui distribue une version modifiée doit en fournir le code sous la même licence. Les licences permissives (MIT, BSD, Apache) demandent surtout de conserver la mention de l'auteur et de la licence, et autorisent les versions fermées.

## open-source-gratuit · single
Un logiciel gratuit, dont le code n'est pas publié, est-il un logiciel libre ?

- [x] Non : sans accès au code, on ne peut ni l'étudier ni le modifier
- [ ] Oui : il est gratuit
- [ ] Oui, s'il est téléchargé depuis un site officiel
- [ ] Oui, s'il ne contient pas de publicité

> La gratuité n'est pas le critère : c'est un gratuiciel (*freeware*). À l'inverse, un logiciel libre peut être payant, ou fourni dans le cadre d'un service payant.

## creative-commons · single
Que signifie la mention CC BY-SA sur un contenu ?

- [x] Réutilisation et modification permises, à condition de citer l'auteur et de partager les dérivés sous la même licence
- [ ] Toute réutilisation est interdite
- [ ] Réutilisation permise sans citer l'auteur
- [ ] Réutilisation permise uniquement à des fins commerciales

> Les licences Creative Commons s'appliquent aux contenus (textes, images, cours). BY : attribution ; SA : partage dans les mêmes conditions ; NC : pas d'usage commercial ; ND : pas de modification. Wikipédia est sous CC BY-SA.

## git-commit · single
Dans Git, qu'est-ce qu'un *commit* ?

- [x] Un instantané enregistré des fichiers suivis, avec un message, un auteur et une référence à l'état précédent
- [ ] L'envoi des fichiers sur un serveur
- [ ] La copie d'un dépôt distant sur sa machine
- [ ] Une branche

> Les commits forment l'historique du projet ; chacun est identifié par une empreinte (SHA). `git commit` enregistre localement ; c'est `git push` qui envoie vers un dépôt distant, et `git clone` qui copie un dépôt.

## git-branche · single
À quoi sert une branche Git ?

- [x] À développer une modification à part, sans toucher à la ligne principale, puis à l'y fusionner
- [ ] À sauvegarder le dépôt sur une clé USB
- [ ] À supprimer l'historique
- [ ] À compiler le programme

> On crée une branche pour une fonctionnalité ou une correction (`git switch -c nouvelle-fonction`), on y fait ses commits, puis on la fusionne (`git merge`), souvent après relecture dans une demande de fusion (*pull request*).

## git-status · short
Quelle commande Git affiche les fichiers modifiés, non encore enregistrés dans un commit ? Écrivez la commande complète.

= git status

> `git status` indique la branche courante, les fichiers modifiés, ceux prêts à être enregistrés (`git add`) et ceux que Git ne suit pas. `git diff` montre le détail des modifications.

## format-ouvert · single
Qu'est-ce qu'un format ouvert ?

- [x] Un format dont la spécification est publique et utilisable librement, par exemple ODF, PNG ou CSV
- [ ] Un format que tout le monde peut modifier sans règle
- [ ] Un format qui ne peut être lu que par un seul logiciel
- [ ] Un fichier non protégé par mot de passe

> N'importe qui peut écrire un logiciel qui lit et écrit un format ouvert : les données ne dépendent pas d'un éditeur et restent lisibles dans le temps. En France, la loi pour une République numérique encourage les administrations à les utiliser.

## w3c · single
Quel organisme publie les standards du Web, comme HTML, CSS ou SVG ?

- [x] Le W3C, avec le WHATWG pour HTML
- [ ] Microsoft
- [ ] L'ANSSI
- [ ] L'ISO seul

> Le W3C (World Wide Web Consortium) et le WHATWG élaborent ces standards avec les éditeurs de navigateurs et le public. L'IETF publie ceux d'Internet (TCP/IP, HTTP), sous forme de RFC.

## licence-projet · single
Vous publiez un logiciel sur un dépôt public sans fichier de licence. Que peuvent légalement en faire les autres ?

- [x] Le lire, mais pas, en principe, le copier, le modifier ou le redistribuer : le droit d'auteur s'applique par défaut
- [ ] Tout ce qu'ils veulent : ce qui est public est libre
- [ ] L'utiliser à des fins commerciales seulement
- [ ] Rien, pas même le lire

> Sans licence, l'auteur garde tous ses droits. Pour faire un logiciel libre, il faut choisir une licence (MIT, GPL, Apache…) et la joindre au dépôt dans un fichier `LICENSE`.
