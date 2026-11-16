---
id: linux-01
title: { fr: "Linux : les bases" }
description: { fr: "Arborescence, droits, processus, shell, paquets, systemd" }
level: bases
tags: [linux, shell, "v:debian-13"]
---

## racine · single
Sous Linux, comment s'appelle le répertoire au sommet de l'arborescence ?

- [x] `/`
- [ ] `C:\`
- [ ] `/home`
- [ ] `~`

> Tout part de la racine `/` : il n'y a pas de lettres de lecteur, les disques sont « montés » dans des répertoires de l'arborescence. `~` désigne le répertoire personnel de l'utilisateur, en général `/home/nom`.

## etc · single
Dans quel répertoire se trouvent la plupart des fichiers de configuration du système ?

- [x] `/etc`
- [ ] `/bin`
- [ ] `/var`
- [ ] `/tmp`

> `/etc` contient la configuration (`/etc/hostname`, `/etc/fstab`…). `/bin` et `/usr/bin` contiennent des programmes, `/var` des données qui varient (journaux, files d'attente), `/tmp` des fichiers temporaires.

## chmod · single
Que signifient les droits `rwxr-x---` sur un fichier ?

- [x] Le propriétaire peut lire, écrire et exécuter ; le groupe lire et exécuter ; les autres rien
- [ ] Tout le monde peut lire, écrire et exécuter
- [ ] Le propriétaire peut lire ; le groupe écrire ; les autres exécuter
- [ ] Le fichier est un répertoire

> Les neuf caractères vont par trois : propriétaire, groupe, autres ; `r` lecture, `w` écriture, `x` exécution, `-` droit absent. En notation octale, `rwxr-x---` s'écrit 750.

## chmod-octal · short
Quel nombre octal donner à `chmod` pour obtenir les droits `rw-r--r--` ?

= 644

> Chaque groupe de trois droits est une somme : `r` = 4, `w` = 2, `x` = 1. `rw-` = 6, `r--` = 4, `r--` = 4, soit `chmod 644 fichier` : modifiable par son propriétaire, lisible par tous.

## sudo · single
À quoi sert `sudo` devant une commande ?

- [x] À l'exécuter avec les droits d'un autre utilisateur, en général l'administrateur `root`
- [ ] À l'exécuter en arrière-plan
- [ ] À l'exécuter plus vite
- [ ] À l'exécuter dans un nouveau terminal

> `sudo apt install paquet` demande les droits d'administration pour cette seule commande, après vérification que l'utilisateur y est autorisé. Travailler en utilisateur ordinaire et n'élever ses droits que ponctuellement limite les dégâts d'une erreur.

## pipe · single
Que fait `ls -l | wc -l` ?

- [x] Elle compte les lignes affichées par `ls -l`
- [ ] Elle liste les fichiers dans l'ordre inverse
- [ ] Elle enregistre la liste des fichiers dans un fichier nommé `wc`
- [ ] Elle affiche deux fois la liste des fichiers

> Le tube `|` envoie la sortie de la première commande à l'entrée de la seconde ; `wc -l` compte les lignes. C'est la philosophie Unix : de petits outils que l'on enchaîne.

## redirection · single
Quelle est la différence entre `commande > fichier` et `commande >> fichier` ?

- [x] `>` remplace le contenu du fichier, `>>` ajoute à la fin
- [ ] `>` ajoute à la fin, `>>` remplace le contenu
- [ ] `>>` redirige les messages d'erreur
- [ ] Aucune

> Les deux créent le fichier s'il n'existe pas. Attention : `>` vide un fichier existant avant d'écrire. Les messages d'erreur, eux, se redirigent avec `2>`.

## processus · single
Quelle commande affiche les processus en cours et leur consommation, mise à jour en continu ?

- [x] `top`
- [ ] `ls`
- [ ] `df`
- [ ] `cat`

> `top` (ou `htop`, plus confortable) montre les processus, la mémoire et le processeur utilisés. `ps aux` en donne une photo instantanée ; `kill` envoie un signal à un processus, par exemple pour l'arrêter.

## apt · single
Sous Debian ou Ubuntu, quelle commande installe un logiciel depuis les dépôts de la distribution ?

- [x] `sudo apt install nom-du-paquet`
- [ ] `sudo apt get nom-du-paquet`
- [ ] `install nom-du-paquet`
- [ ] `sudo dnf install nom-du-paquet`

> `apt` télécharge le paquet et ses dépendances depuis des dépôts signés, puis l'installe. `dnf` joue le même rôle sur Fedora. Installer depuis les dépôts plutôt que depuis un site inconnu garantit l'origine et les mises à jour.

## systemctl · single
Avec systemd, quelle commande démarre le service `ssh` à chaque démarrage de la machine ?

- [x] `sudo systemctl enable ssh`
- [ ] `sudo systemctl start ssh`
- [ ] `sudo systemctl status ssh`
- [ ] `sudo service ssh boot`

> `enable` active le démarrage automatique ; `start` démarre le service tout de suite, sans rien changer pour les démarrages suivants ; `status` affiche son état et ses derniers messages. `enable --now` fait les deux à la fois.
