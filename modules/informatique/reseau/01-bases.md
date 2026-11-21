---
id: reseau-01
title: { fr: "Réseau : les bases" }
description: { fr: "Modèle en couches, adressage IP, DNS, HTTP, ports" }
level: bases
tags: [réseau, tcp-ip]
---

## couches · single
Dans le modèle TCP/IP, à quelle couche appartient le protocole IP ?

- [x] La couche réseau (Internet), qui achemine les paquets de proche en proche
- [ ] La couche application
- [ ] La couche transport
- [ ] La couche physique

> IP adresse et achemine les paquets entre réseaux. Au-dessus, la couche transport (TCP, UDP) gère la communication entre deux programmes ; au-dessus encore, la couche application (HTTP, DNS…). En dessous, l'accès au réseau (Ethernet, Wi-Fi).

## tcp-udp · single
Qu'apporte TCP par rapport à UDP ?

- [x] Une connexion fiable : les données arrivent toutes, dans l'ordre, ou l'erreur est signalée
- [ ] Une plus grande vitesse, sans aucun contrôle
- [ ] Le chiffrement des données
- [ ] L'adressage des machines

> TCP numérote, accuse réception et retransmet ce qui se perd. UDP envoie sans garantie, mais avec moins de délai : on le préfère pour la voix, la vidéo en direct ou le DNS. Ni l'un ni l'autre ne chiffre.

## ipv4 · single
Laquelle de ces adresses est une adresse IPv4 valide ?

- [x] `192.168.1.20`
- [ ] `192.168.1.300`
- [ ] `192.168.1`
- [ ] `2001:db8::1`

> Une adresse IPv4 compte quatre nombres de 0 à 255 (32 bits). 300 dépasse 255. `2001:db8::1` est une adresse IPv6 (128 bits, en hexadécimal). Les plages `10.0.0.0/8`, `172.16.0.0/12` (de `172.16.x.x` à `172.31.x.x`) et `192.168.0.0/16` sont réservées aux réseaux privés.

## masque · numeric
Dans un réseau `192.168.1.0/24`, combien d'adresses peuvent être attribuées à des machines ?

= 254

> `/24` laisse 32 − 24 = 8 bits pour les machines, soit $2^8 = 256$ adresses. On retire l'adresse du réseau (`.0`) et celle de diffusion (`.255`) : il reste 254 adresses utilisables.

## dns · single
Quel est le rôle du DNS ?

- [x] Traduire un nom de domaine, comme `exemple.fr`, en adresse IP
- [ ] Attribuer automatiquement une adresse IP aux machines du réseau
- [ ] Chiffrer les échanges sur le Web
- [ ] Bloquer les sites dangereux

> Le DNS est l'annuaire d'Internet : avant de joindre un site, la machine demande son adresse IP à un résolveur DNS. C'est DHCP qui attribue les adresses sur un réseau local, et TLS qui chiffre.

## routeur · single
Quel équipement relie le réseau local d'une maison à Internet et fait passer les paquets d'un réseau à l'autre ?

- [x] Le routeur (intégré à la box)
- [ ] Le commutateur (switch)
- [ ] Le répéteur Wi-Fi
- [ ] La carte réseau de l'ordinateur

> Le routeur décide où envoyer chaque paquet selon son adresse IP de destination. Le commutateur relie les machines d'un même réseau local, le répéteur prolonge la portée du Wi-Fi.

## code-http · single
Que signifie le code de réponse HTTP 404 ?

- [x] La ressource demandée n'existe pas sur le serveur
- [ ] Le serveur est en panne
- [ ] L'accès est interdit
- [ ] Tout s'est bien passé

> Les codes en 2xx signalent un succès (200 OK), 3xx une redirection, 4xx une erreur du client (404 introuvable, 403 interdit), 5xx une erreur du serveur (500, 503).

## port-https · numeric
Quel est le numéro de port habituel d'un serveur HTTPS ?

= 443

> Un port distingue les services d'une même machine. Ports habituels : 80 pour HTTP, 443 pour HTTPS, 22 pour SSH, 53 pour DNS, 25 pour l'envoi de courriel entre serveurs.

## https · single
Que garantit le cadenas HTTPS dans la barre d'adresse ?

- [x] Les échanges sont chiffrés et le serveur a prouvé qu'il détient le nom de domaine affiché
- [ ] Le site est honnête et sans danger
- [ ] Le site appartient à une entreprise connue
- [ ] L'ordinateur est protégé contre les virus

> HTTPS protège le trajet (confidentialité et intégrité) et authentifie le nom de domaine. Un site d'hameçonnage peut parfaitement avoir un certificat valide pour son propre nom : le cadenas ne dit rien de ses intentions.

## ipv6 · single
Pourquoi a-t-on créé IPv6 ?

- [x] Parce que les quelque 4,3 milliards d'adresses d'IPv4 ne suffisent plus
- [ ] Parce qu'IPv4 ne fonctionne pas en Wi-Fi
- [ ] Pour chiffrer toutes les communications
- [ ] Pour remplacer le DNS

> IPv4 n'offre que $2^{32}$ adresses, épuisées depuis les années 2010 ; on a prolongé sa vie en partageant une adresse publique entre plusieurs machines (NAT). IPv6, sur 128 bits, en offre $2^{128}$ : chaque appareil peut avoir la sienne.
