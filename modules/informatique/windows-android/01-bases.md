---
id: windows-android-01
title: { fr: "Windows et Android : les bases" }
description: { fr: "NTFS, registre, PowerShell, comptes ; architecture Android, permissions, APK" }
level: bases
tags: [windows, android, "v:windows-11", "v:android-15"]
---

## ntfs · single
Quel est le système de fichiers habituel d'un disque système Windows ?

- [x] NTFS
- [ ] FAT32
- [ ] ext4
- [ ] APFS

> NTFS gère les droits d'accès par fichier, la journalisation et les gros fichiers. FAT32 survit sur les clés USB pour sa compatibilité, mais limite un fichier à 4 Go. ext4 est courant sous Linux, APFS sous macOS.

## registre · single
Qu'est-ce que le Registre de Windows ?

- [x] Une base de données hiérarchique de paramètres du système et des applications
- [ ] Le journal des événements du système
- [ ] La liste des programmes ouverts
- [ ] Le dossier où sont rangés les fichiers téléchargés

> Le Registre range des clés et des valeurs (par exemple sous `HKEY_LOCAL_MACHINE` ou `HKEY_CURRENT_USER`). On le consulte avec `regedit` ; une modification mal faite peut empêcher Windows de démarrer. Les événements se lisent dans l'Observateur d'événements.

## powershell · single
Qu'est-ce qui distingue PowerShell d'un interpréteur de commandes classique ?

- [x] Ses commandes s'échangent des objets structurés, pas seulement du texte
- [ ] Il ne fonctionne que sous Linux
- [ ] Il n'accepte aucun script
- [ ] Il ne peut pas lancer de programmes

> `Get-Process | Where-Object CPU -gt 100` filtre des objets processus sur leur propriété `CPU`, sans découper du texte. PowerShell est libre et existe aussi pour Linux et macOS.

## compte-standard · single
Pourquoi recommande-t-on d'utiliser au quotidien un compte standard plutôt qu'un compte administrateur ?

- [x] Un programme malveillant lancé par erreur aura moins de droits pour modifier le système
- [ ] Un compte standard rend l'ordinateur plus rapide
- [ ] Un compte administrateur ne peut pas naviguer sur le Web
- [ ] Un compte standard n'a pas besoin de mot de passe

> C'est le principe du moindre privilège. Le contrôle de compte d'utilisateur (UAC) demande une confirmation, ou le mot de passe d'un administrateur, avant toute action qui touche au système.

## noyau-android · single
Sur quel noyau repose le système Android ?

- [x] Linux
- [ ] Windows NT
- [ ] XNU, celui de macOS et d'iOS
- [ ] Un noyau écrit pour chaque téléphone

> Android utilise un noyau Linux modifié, sur lequel Google a bâti ses propres bibliothèques, l'environnement d'exécution ART et le cadre des applications. Le cœur du système est publié sous licence libre (AOSP).

## bac-a-sable · single
Comment Android isole-t-il les applications les unes des autres ?

- [x] Chaque application s'exécute sous son propre identifiant utilisateur, avec son propre espace de stockage privé
- [ ] Toutes les applications partagent les mêmes fichiers, sous un même utilisateur
- [ ] Les applications sont exécutées l'une après l'autre, jamais en même temps
- [ ] Elles ne sont pas isolées : c'est l'antivirus qui les surveille

> Android attribue un identifiant Linux distinct à chaque application : une application ne peut pas lire les fichiers privés d'une autre. Pour accéder à une ressource partagée (contacts, appareil photo), elle doit obtenir une permission.

## permission · single
Une application Android de lampe de poche demande l'accès aux contacts. Que faire ?

- [x] Refuser : cette permission n'a aucun rapport avec la fonction de l'application
- [ ] Accepter : sinon la lampe ne s'allumera pas
- [ ] Accepter : les permissions ne servent à rien
- [ ] Redémarrer le téléphone

> Depuis Android 6, les permissions sensibles se donnent à l'exécution, une par une, et se retirent dans les réglages. Une demande sans rapport avec la fonction annoncée est un signal d'alerte : collecte de données, voire logiciel malveillant.

## apk · single
Qu'est-ce qu'un fichier APK ?

- [x] Le paquet d'installation d'une application Android, signé par son développeur
- [ ] Une sauvegarde complète du téléphone
- [ ] Un fichier de configuration du réseau
- [ ] Le système Android lui-même

> Un APK est une archive ZIP qui contient le code compilé, les ressources et le manifeste de l'application. Sa signature garantit que les mises à jour viennent du même auteur. Installer un APK de source inconnue contourne les vérifications du magasin d'applications.

## mises-a-jour · single
Pourquoi faut-il installer les mises à jour de sécurité du système sans tarder ?

- [x] Elles corrigent des failles connues, que des attaquants cherchent justement à exploiter
- [ ] Elles libèrent de l'espace disque
- [ ] Elles sont obligatoires pour garder le droit d'utiliser le système
- [ ] Elles améliorent toujours l'autonomie de la batterie

> Une fois un correctif publié, la faille est connue de tous, y compris des attaquants : un appareil non mis à jour devient une cible facile. Microsoft publie ses correctifs chaque deuxième mardi du mois ; Android, chaque mois également.

## sauvegarde · single
Quelle règle résume une bonne stratégie de sauvegarde ?

- [x] 3 copies des données, sur 2 supports différents, dont 1 hors du lieu habituel
- [ ] 1 copie, sur le même disque que les données
- [ ] Une synchronisation dans le nuage suffit, car elle remplace une sauvegarde
- [ ] Sauvegarder une fois par an

> La règle « 3-2-1 » protège contre la panne d'un disque, le vol, l'incendie et les rançongiciels. Une simple synchronisation reproduit aussi les suppressions et les chiffrements malveillants : elle ne remplace pas une sauvegarde avec historique.
