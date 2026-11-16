---
id: cybersecurite-01
title: { fr: "Cybersécurité : comprendre les menaces" }
description: { fr: "Hameçonnage, mots de passe, chiffrement, failles web, rançongiciels, cadre légal" }
level: bases
tags: [cybersécurité, anssi, owasp]
---

## hameconnage · single
Vous recevez un courriel de « votre banque » qui demande de confirmer vos identifiants par un lien, sous 24 heures. De quoi s'agit-il le plus probablement ?

- [x] D'hameçonnage (*phishing*) : le lien mène vers un faux site qui recueille les identifiants
- [ ] D'un message légitime : les banques demandent souvent cette confirmation
- [ ] D'un rançongiciel déjà installé sur l'ordinateur
- [ ] D'une attaque par déni de service

> L'urgence, la menace et le lien vers une page de connexion sont les marques de l'hameçonnage. Une banque ne demande jamais ses identifiants par courriel. On se connecte en tapant soi-même l'adresse du site, et l'on signale le message (en France : signal-spam.fr, ou 33700 pour un SMS).

## hachage · single
Comment un site sérieux conserve-t-il les mots de passe de ses utilisateurs ?

- [x] Sous forme d'empreintes calculées par une fonction de hachage lente et salée (Argon2, bcrypt…)
- [ ] En clair, dans une table protégée par un mot de passe
- [ ] Chiffrés avec une clé conservée sur le même serveur
- [ ] Encodés en Base64

> Une fonction de hachage ne se renverse pas : à la connexion, le site hache le mot de passe saisi et compare les empreintes. Le sel (une valeur aléatoire propre à chaque compte) et la lenteur rendent très coûteux de retrouver les mots de passe à partir d'une base volée. Base64 n'est qu'un encodage, réversible par tous.

## mot-de-passe · single
Lequel de ces choix rend un mot de passe le plus difficile à deviner ?

- [x] Sa longueur, par exemple une phrase de passe de plusieurs mots choisis au hasard
- [ ] Remplacer des lettres par des chiffres : `P@ssw0rd`
- [ ] Le changer chaque mois en incrémentant un chiffre final
- [ ] Utiliser son nom et sa date de naissance

> Le nombre de combinaisons croît très vite avec la longueur. Les substitutions courantes (`@` pour `a`, `0` pour `o`) sont connues des outils d'attaque. L'ANSSI recommande des mots de passe longs, uniques pour chaque service, gardés dans un gestionnaire de mots de passe.

## double-facteur · single
Quel est l'intérêt de l'authentification à deux facteurs ?

- [x] Un mot de passe volé ne suffit plus : il faut aussi un second élément (application, clé physique…)
- [ ] Elle permet d'utiliser un mot de passe plus court
- [ ] Elle chiffre le disque de l'ordinateur
- [ ] Elle remplace l'antivirus

> On combine quelque chose que l'on sait (mot de passe) et quelque chose que l'on possède (téléphone, clé de sécurité). Les clés physiques et les *passkeys* (FIDO2) résistent même à l'hameçonnage, parce qu'elles vérifient l'adresse du site.

## chiffrement-asymetrique · single
En chiffrement asymétrique, Alice veut envoyer un message que seul Bob pourra lire. Avec quelle clé le chiffre-t-elle ?

- [x] La clé publique de Bob
- [ ] La clé privée de Bob
- [ ] La clé privée d'Alice
- [ ] La clé publique d'Alice

> Ce que chiffre une clé publique, seule la clé privée correspondante le déchiffre ; Bob est le seul à détenir la sienne. À l'inverse, Alice signe avec sa propre clé privée, et chacun vérifie la signature avec sa clé publique.

## injection-sql · single
Quelle est la parade de référence contre l'injection SQL ?

- [x] Les requêtes préparées (paramétrées) : les données de l'utilisateur ne sont jamais interprétées comme du code SQL
- [ ] Masquer les messages d'erreur de la base de données
- [ ] Interdire les apostrophes dans tous les formulaires
- [ ] Utiliser HTTPS

> L'injection survient quand un programme colle une saisie de l'utilisateur dans le texte d'une requête : la saisie peut alors en changer le sens. Une requête préparée envoie séparément la requête et ses paramètres. Filtrer quelques caractères laisse passer d'autres formes ; HTTPS ne protège que le transport.

## xss · single
Qu'est-ce qu'une faille XSS (*cross-site scripting*) ?

- [x] Un site affiche une saisie d'utilisateur sans l'échapper, ce qui permet d'exécuter un script dans le navigateur des autres visiteurs
- [ ] Une attaque qui sature un serveur de requêtes
- [ ] Le vol du disque d'un serveur
- [ ] Une erreur de configuration du DNS

> Si un commentaire contenant une balise `<script>` est réaffiché tel quel, ce script s'exécute chez chaque lecteur, avec les droits du site (lecture de la session, actions à sa place). Parades : échapper toute donnée affichée, et limiter les scripts autorisés par une politique de sécurité du contenu (CSP).

## rancongiciel · single
Que fait un rançongiciel (*ransomware*) ?

- [x] Il chiffre les fichiers de la victime et exige une rançon contre la clé de déchiffrement
- [ ] Il affiche des publicités
- [ ] Il ralentit volontairement l'ordinateur pour vendre du matériel
- [ ] Il supprime les fichiers temporaires

> Les rançongiciels touchent particuliers, entreprises, hôpitaux et collectivités. La meilleure protection est une sauvegarde déconnectée et testée. Les autorités déconseillent de payer : rien ne garantit la remise de la clé, et le paiement finance d'autres attaques. Victime en France : cybermalveillance.gouv.fr.

## ddos · single
Qu'est-ce qu'une attaque par déni de service distribué (DDoS) ?

- [x] Saturer un service d'un très grand nombre de requêtes venues de nombreuses machines, pour le rendre indisponible
- [ ] Voler la base de données d'un site
- [ ] Deviner un mot de passe en essayant toutes les combinaisons
- [ ] Intercepter les échanges sur un réseau Wi-Fi public

> Les requêtes viennent souvent d'un réseau de machines compromises (*botnet*), y compris des objets connectés mal protégés. Le but est l'indisponibilité, pas le vol. On s'en protège par des services de filtrage capables d'absorber de gros volumes.

## cadre-legal · single
En France, que risque-t-on à s'introduire sans autorisation dans un système informatique, même sans rien y modifier ?

- [x] C'est un délit puni par le Code pénal (article 323-1), même sans dégât
- [ ] Rien, tant que l'on ne modifie rien
- [ ] Rien, si c'est pour montrer qu'il y a une faille
- [ ] Une simple amende administrative

> L'accès ou le maintien frauduleux dans un système est puni de trois ans d'emprisonnement et de 100 000 € d'amende ; les peines augmentent en cas de dégâts. Le hacking éthique se pratique avec une autorisation écrite : audit commandé, programme de *bug bounty*, plateformes d'entraînement. Une faille découverte par hasard se signale à son responsable, ou à l'ANSSI.
