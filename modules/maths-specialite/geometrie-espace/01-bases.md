---
id: geometrie-espace-01
title: { fr: "Géométrie dans l'espace" }
description: { fr: "Vecteurs et colinéarité, produit scalaire et orthogonalité, distances, équations cartésiennes de plans, représentations paramétriques de droites, projeté orthogonal" }
level: bases
tags: [maths, bac, prog-2019, prog-2027]
---

## distance · numeric
Dans un repère orthonormé de l'espace, on donne $A(1\,;2\,;3)$ et $B(3\,;0\,;4)$. Calculez la distance $AB$.

= 3

> $\overrightarrow{AB}(2\,;-2\,;1)$, donc $AB = \sqrt{2^2 + (-2)^2 + 1^2} = \sqrt{9} = 3$. La formule n'est valable que dans un repère **orthonormé**. Au programme de 2019 comme à celui de 2027.

## colineaires · single
Les vecteurs $\vec{u}(2\,;4\,;-6)$ et $\vec{v}(-1\,;-2\,;3)$ sont-ils colinéaires ?

- [x] Oui : $\vec{u} = -2\,\vec{v}$
- [ ] Non, car leurs coordonnées n'ont pas le même signe
- [ ] Non, car $\vec{u} \cdot \vec{v} \neq 0$
- [ ] On ne peut pas savoir sans un point commun

> Deux vecteurs sont colinéaires si l'un est un multiple de l'autre : ici, chaque coordonnée de $\vec{u}$ vaut $-2$ fois celle de $\vec{v}$. Le signe n'y change rien (vecteurs de sens contraires). Le produit scalaire sert à l'orthogonalité, pas à la colinéarité.

## orthogonaux · single
Les vecteurs $\vec{u}(1\,;2\,;-1)$ et $\vec{v}(2\,;-1\,;0)$ sont-ils orthogonaux ?

- [x] Oui, car $\vec{u} \cdot \vec{v} = 0$
- [ ] Non, car ils ne sont pas colinéaires
- [ ] Non, car une coordonnée de $\vec{v}$ est nulle
- [ ] Oui, car leurs normes sont égales

> En repère orthonormé, $\vec{u} \cdot \vec{v} = xx' + yy' + zz' = 2 - 2 + 0 = 0$. Leurs normes ($\sqrt{6}$ et $\sqrt{5}$) n'ont rien à voir avec l'orthogonalité.

## angle · numeric
On donne $\vec{u}(1\,;0\,;1)$ et $\vec{v}(0\,;1\,;1)$. Quelle est la mesure, en degrés, de l'angle géométrique entre ces deux vecteurs ?

= 60 ± 0,5

> $\vec{u} \cdot \vec{v} = 1$ et $\|\vec{u}\| = \|\vec{v}\| = \sqrt{2}$, d'où $\cos\theta = \dfrac{1}{\sqrt{2} \times \sqrt{2}} = \dfrac{1}{2}$ et $\theta = 60°$. Les deux vecteurs sont des diagonales de faces d'un cube.

## polarisation · numeric
On sait que $\|\vec{u}\| = 3$, $\|\vec{v}\| = 4$ et $\|\vec{u} + \vec{v}\| = 5$. Que vaut $\vec{u} \cdot \vec{v}$ ?

= 0

> $\|\vec{u} + \vec{v}\|^2 = \|\vec{u}\|^2 + 2\,\vec{u} \cdot \vec{v} + \|\vec{v}\|^2$, soit $25 = 9 + 2\,\vec{u} \cdot \vec{v} + 16$, d'où $\vec{u} \cdot \vec{v} = 0$ : les vecteurs sont orthogonaux. C'est le théorème de Pythagore (3, 4, 5) écrit avec des vecteurs.

## equation-plan · single
Quelle est une équation cartésienne du plan passant par $A(1\,;0\,;2)$ et de vecteur normal $\vec{n}(2\,;-1\,;3)$ ?

- [x] $2x - y + 3z - 8 = 0$
- [ ] $x + 2z - 8 = 0$
- [ ] $2x - y + 3z = 0$
- [ ] $x - 2 = \dfrac{y}{-1} = \dfrac{z - 3}{2}$

> Un vecteur normal $\vec{n}(a\,;b\,;c)$ donne l'équation $ax + by + cz + d = 0$ ; on trouve $d$ en écrivant que $A$ appartient au plan : $2 - 0 + 6 + d = 0$, donc $d = -8$. La troisième équation correspond au plan parallèle passant par l'origine.

## vecteur-normal · single
Le plan d'équation $3x - y + 5 = 0$ a pour vecteur normal :

- [x] $\vec{n}(3\,;-1\,;0)$
- [ ] $\vec{n}(3\,;-1\,;5)$
- [ ] $\vec{n}(0\,;0\,;1)$
- [ ] Ce n'est pas un plan, car $z$ n'apparaît pas

> Les coefficients de $x$, $y$ et $z$ donnent un vecteur normal ; ici celui de $z$ est nul. Le plan est parallèle à l'axe des cotes (« vertical »). La constante 5 ne fait pas partie du vecteur normal.

## point-droite · single
La droite $d$ passe par $A(1\,;2\,;0)$ et a pour vecteur directeur $\vec{u}(1\,;-1\,;2)$. Quel point lui appartient ?

- [x] $(3\,;0\,;4)$
- [ ] $(2\,;1\,;3)$
- [ ] $(1\,;-1\,;2)$
- [ ] $(0\,;3\,;2)$

> Représentation paramétrique : $x = 1 + t$, $y = 2 - t$, $z = 2t$. Pour $t = 2$ : $(3\,;0\,;4)$. Pour $(2\,;1\,;3)$, $x$ et $y$ demandent $t = 1$ mais $z$ demande $t = 1{,}5$ : impossible. $(1\,;-1\,;2)$ est le vecteur directeur, pas un point de la droite.

## intersection · single
Quel est le point d'intersection de la droite $\{x = 1 + t\,;\ y = 2t\,;\ z = 3 - t\}$ ($t \in \mathbb{R}$) et du plan $x + y + z = 10$ ?

- [x] $(4\,;6\,;0)$
- [ ] $(1\,;0\,;3)$
- [ ] $(3\,;4\,;3)$
- [ ] La droite est parallèle au plan

> On remplace dans l'équation du plan : $(1 + t) + 2t + (3 - t) = 10$, soit $4 + 2t = 10$ et $t = 3$, d'où le point $(4\,;6\,;0)$. On vérifie : $4 + 6 + 0 = 10$.

## droite-parallele-plan · single
La droite passant par $A(0\,;0\,;1)$, de vecteur directeur $\vec{u}(1\,;1\,;1)$, et le plan $\mathcal{P}$ d'équation $x - y = 1$ sont :

- [x] Strictement parallèles
- [ ] Sécants
- [ ] Confondus : la droite est incluse dans le plan
- [ ] Perpendiculaires

> Un vecteur normal du plan est $\vec{n}(1\,;-1\,;0)$, et $\vec{u} \cdot \vec{n} = 1 - 1 + 0 = 0$ : la droite est parallèle au plan. Le point $A$ ne vérifie pas l'équation ($0 - 0 = 0 \neq 1$) : elle n'y est pas incluse.

## distance-plan · numeric
Le point $M(1\,;2\,;3)$ a pour projeté orthogonal $H$ sur le plan d'équation $x + 2y + 2z - 2 = 0$. Calculez la distance $MH$ (la distance de $M$ au plan).

= 3

> $H = M + k\,\vec{n}$ avec $\vec{n}(1\,;2\,;2)$ ; $H$ dans le plan donne $(1 + k) + 2(2 + 2k) + 2(3 + 2k) - 2 = 0$, soit $9 + 9k = 0$ et $k = -1$. Donc $H(0\,;0\,;1)$ et $MH = \|\vec{n}\| = 3$. Le projeté orthogonal est le point du plan le plus proche de $M$.

## tetraedre · numeric
On donne $O(0\,;0\,;0)$, $A(3\,;0\,;0)$, $B(0\,;3\,;0)$ et $C(0\,;0\,;3)$. Quel est le volume du tétraèdre $OABC$ ?

= 4,5

> Volume d'une pyramide : $\dfrac{1}{3} \times \text{aire de la base} \times \text{hauteur}$. Base $OAB$, triangle rectangle d'aire $\dfrac{3 \times 3}{2} = 4{,}5$ ; hauteur $OC = 3$. Volume : $\dfrac{1}{3} \times 4{,}5 \times 3 = 4{,}5$.
