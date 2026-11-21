---
id: matiere-01
title: { fr: "Titrages, acides et bases, oxydoréduction : les bases" }
description: { fr: "Équivalence, Beer-Lambert, pH, Brønsted, oxydant et réducteur, équilibre, estérification" }
level: bases
tags: [chimie, bac, prog-2019]
---

## titrage-relation · single
On titre une espèce A par une espèce B selon la réaction $\ce{aA + bB -> cC + dD}$. À l'équivalence, quelle relation lie la quantité $n_A$ de A initialement présente et la quantité $n_B$ de B versée ?

- [x] $\dfrac{n_A}{a} = \dfrac{n_B}{b}$
- [ ] $a\,n_A = b\,n_B$
- [ ] $n_A = n_B$
- [ ] $\dfrac{n_A}{b} = \dfrac{n_B}{a}$

> À l'équivalence, les réactifs ont été introduits dans les proportions stœchiométriques : ils sont entièrement consommés tous les deux. Avec $n_A = C_A V_A$ et $n_B = C_B V_E$, on en tire $C_A = \dfrac{a\,C_B\,V_E}{b\,V_A}$. L'égalité $n_A = n_B$ n'est vraie que si $a = b$.

## titrage-calcul · numeric
On titre $\pu{20,0 mL}$ d'acide chlorhydrique par une solution d'hydroxyde de sodium à $\pu{0,10 mol.L-1}$. L'équivalence est atteinte pour $\pu{15,0 mL}$ versés. Quelle est la concentration de l'acide, en mol·L⁻¹ ?

= 0,075 ± 0,001 mol·L⁻¹

> La réaction support $\ce{H3O+ + HO- -> 2 H2O}$ a des coefficients égaux à 1 : à l'équivalence, $C_A V_A = C_B V_E$, donc $C_A = \dfrac{0,10 \times 15,0}{20,0} = \pu{0,075 mol.L-1}$. Les volumes peuvent rester en millilitres : ils apparaissent dans un rapport.

## beer-lambert · single
Quelle relation exprime la loi de Beer-Lambert ($A$ absorbance, $\varepsilon$ coefficient d'absorption molaire, $\ell$ épaisseur traversée, $c$ concentration) ?

- [x] $A = \varepsilon\,\ell\,c$
- [ ] $A = \dfrac{\varepsilon\,c}{\ell}$
- [ ] $A = \varepsilon\,\ell + c$
- [ ] $A = \log c$

> L'absorbance est proportionnelle à la concentration, pour une solution assez diluée et une longueur d'onde donnée. C'est le principe du dosage par étalonnage : on trace la droite $A = k\,c$ à partir de solutions de concentrations connues, puis on y lit la concentration inconnue.

## ph-definition · single
Quelle relation lie le pH d'une solution aqueuse diluée à la concentration en ions oxonium ?

- [x] $\mathrm{pH} = -\log\dfrac{[\ce{H3O+}]}{c^\circ}$, avec $c^\circ = \pu{1 mol.L-1}$
- [ ] $\mathrm{pH} = [\ce{H3O+}]$
- [ ] $\mathrm{pH} = \log [\ce{H3O+}]$
- [ ] $\mathrm{pH} = \dfrac{1}{[\ce{H3O+}]}$

> Le logarithme décimal ramène des concentrations très différentes à une échelle simple. Le signe moins rend le pH positif, car la concentration est inférieure à $\pu{1 mol.L-1}$. Réciproquement, $[\ce{H3O+}] = c^\circ \times 10^{-\mathrm{pH}}$.

## ph-concentration · single
Une solution aqueuse a un pH égal à 2,0. Quelle est sa concentration en ions oxonium ?

- [x] $\pu{1,0e-2 mol.L-1}$
- [ ] $\pu{2,0 mol.L-1}$
- [ ] $\pu{1,0e2 mol.L-1}$
- [ ] $\pu{1,0e-12 mol.L-1}$

> $[\ce{H3O+}] = 10^{-\mathrm{pH}} = \pu{1,0e-2 mol.L-1}$. $\pu{1,0e-12 mol.L-1}$ est la concentration en ions hydroxyde $\ce{HO-}$ de cette solution à 25 °C, puisque $[\ce{H3O+}] \times [\ce{HO-}] = 10^{-14}$.

## bronsted · single
Selon Brønsted, qu'est-ce qu'un acide ?

- [x] Une espèce capable de céder un proton $\ce{H+}$
- [ ] Une espèce capable de capter un proton $\ce{H+}$
- [ ] Une espèce capable de céder des électrons
- [ ] Une espèce capable de capter des électrons

> Un acide cède un proton, une base le capte : ils forment un couple acide-base, par exemple $\ce{CH3COOH}/\ce{CH3COO-}$. Céder ou capter des électrons définit le réducteur et l'oxydant, en oxydoréduction.

## oxydant · single
Qu'est-ce qu'un oxydant ?

- [x] Une espèce capable de capter des électrons
- [ ] Une espèce capable de céder des électrons
- [ ] Une espèce capable de céder uniquement des protons
- [ ] Une espèce qui produit toujours du dioxygène

> L'oxydant capte des électrons : il est réduit. Le réducteur en cède : il est oxydé. Moyen mnémotechnique : « l'oxydant gagne des électrons, le réducteur les perd ». Un oxydant ne contient pas forcément d'oxygène, comme l'ion $\ce{Cu^2+}$.

## oxydee · single
Dans la réaction $\ce{Cu^2+ + Fe -> Cu + Fe^2+}$, quelle espèce est oxydée ?

- [x] $\ce{Fe}$
- [ ] $\ce{Cu^2+}$
- [ ] $\ce{Cu}$
- [ ] $\ce{Fe^2+}$

> Le fer perd deux électrons, $\ce{Fe -> Fe^2+ + 2e-}$ : il est oxydé, c'est le réducteur. L'ion cuivre(II) les gagne, $\ce{Cu^2+ + 2e- -> Cu}$ : il est réduit, c'est l'oxydant. $\ce{Cu}$ et $\ce{Fe^2+}$ sont des produits.

## argent-noirci · single
Un objet en argent noircit : à sa surface s'est formé du sulfure d'argent $\ce{Ag2S}$, par réaction avec des composés soufrés de l'air. Pour lui rendre son éclat, on le pose au contact d'une feuille d'aluminium, dans une cuvette en plastique remplie d'eau salée très chaude. Quel est le rôle de l'aluminium ?

- [x] Réducteur : il cède des électrons qui réduisent $\ce{Ag2S}$ en argent métallique
- [ ] Oxydant : il capte des électrons de l'argent
- [ ] Catalyseur : il accélère la réaction sans être consommé
- [ ] Abrasif : il détache le dépôt noir par frottement

> L'aluminium, métal très réducteur, s'oxyde : $\ce{Al -> Al^3+ + 3e-}$. Ses électrons réduisent le sulfure d'argent, $\ce{Ag2S + 2e- -> 2Ag + S^2-}$ : l'argent est régénéré sur l'objet, au lieu d'être arraché comme avec un produit abrasif. Les ions $\ce{Al^3+}$ précipitent en hydroxyde d'aluminium, qui ternit la feuille. Bilan :
>
> $$\begin{gathered}\ce{3Ag2S + 2Al + 6H2O}\\ \ce{-> 6Ag + 2Al(OH)3 + 3H2S}\end{gathered}$$
>
> Les deux métaux en contact forment une pile : envelopper l'objet dans la feuille améliore l'échange d'électrons (d'où la cuvette en plastique, pour éviter un autre métal). Le sel dissous rend l'eau conductrice sans intervenir dans le bilan ; la chaleur accélère la réaction. L'odeur d'œuf pourri vient du sulfure d'hydrogène $\ce{H2S}$ formé ; une pincée de bicarbonate maintient le pH vers 8,3 et limite son dégagement. D'après Médiachimie, « Nettoyer l'argenterie par une recette de grand-mère ».

## equilibre · single
Que peut-on dire d'un système chimique à l'équilibre dynamique ?

- [x] Les réactions directe et inverse ont lieu à la même vitesse
- [ ] Les réactions directe et inverse se sont arrêtées
- [ ] Les réactifs ont tous disparu
- [ ] Les concentrations des réactifs et des produits sont égales

> À l'équilibre, les deux réactions continuent, mais se compensent exactement : les concentrations ne varient plus, sans être égales pour autant. Leurs valeurs vérifient $Q_r = K$, la constante d'équilibre.

## esterification · single
Que produit la réaction d'estérification entre un acide carboxylique et un alcool ?

- [x] Un ester et de l'eau
- [ ] Un aldéhyde et du dioxygène
- [ ] Une cétone et du dihydrogène
- [ ] Un alcane et du dioxyde de carbone

> Par exemple, l'acide éthanoïque et l'éthanol donnent l'éthanoate d'éthyle et de l'eau :
>
> $$\begin{gathered}\ce{CH3COOH + C2H5OH}\\ \ce{<=> CH3COOC2H5 + H2O}\end{gathered}$$
>
> La réaction est lente et limitée ; un catalyseur acide l'accélère, et retirer l'eau formée déplace l'équilibre vers l'ester.
