---
id: suites-03
title: { fr: "Suites : niveau expert" }
description: { fr: "Suites récurrentes et point fixe, sommes télescopiques, limites remarquables, suites d'intégrales" }
level: expert
tags: [maths, bac, prog-2019]
---

## racine-recurrente · numeric
On pose $u_0 = 0$ et $u_{n+1} = \sqrt{2 + u_n}$. On admet que $(u_n)$ est croissante et majorée par 2. Quelle est sa limite ?

= 2

> Croissante et majorée, la suite converge vers un réel $\ell$. La fonction $x \mapsto \sqrt{2 + x}$ est continue, donc $\ell = \sqrt{2 + \ell}$, soit $\ell^2 - \ell - 2 = 0$, de racines $2$ et $-1$. Comme $u_n \geq 0$, $\ell = 2$.

## heron · numeric
On pose $u_0 = 2$ et $u_{n+1} = \dfrac{u_n}{2} + \dfrac{1}{u_n}$. Cette suite converge ; vers quelle valeur (à $0,001$ près) ?

= 1,414 ± 0,001

> La limite $\ell > 0$ vérifie $\ell = \dfrac{\ell}{2} + \dfrac{1}{\ell}$, soit $\ell^2 = 2$ : $\ell = \sqrt{2} \approx 1,414$. C'est la méthode de Héron, très rapide : $u_3$ est déjà exact à $10^{-5}$ près.

## somme-telescopique · expression
Écrivez $S_n = \displaystyle\sum_{k=1}^{n} \dfrac{1}{k(k+1)}$ en fonction de $n$.

= $\frac{n}{n+1}$

> $\dfrac{1}{k(k+1)} = \dfrac{1}{k} - \dfrac{1}{k+1}$ : les termes se simplifient deux à deux (somme télescopique), et il reste $S_n = 1 - \dfrac{1}{n+1} = \dfrac{n}{n+1}$. Les deux écritures sont acceptées ; $S_n \to 1$.

## recurrence-carres · expression
On pose $u_0 = 1$ et $u_{n+1} = u_n + 2n + 3$. Conjecturez puis écrivez $u_n$ en fonction de $n$.

= $(n+1)^2$

> $u_1 = 4$, $u_2 = 9$, $u_3 = 16$ : on conjecture $u_n = (n+1)^2$. Hérédité : $(n+1)^2 + 2n + 3 = n^2 + 4n + 4 = (n+2)^2$. La récurrence le démontre pour tout $n$.

## serie-geometrique · numeric
Vers quelle valeur tend $S_n = 1 + \dfrac{2}{3} + \left(\dfrac{2}{3}\right)^2 + \dots + \left(\dfrac{2}{3}\right)^n$ ?

= 3

> $S_n = \dfrac{1 - (2/3)^{n+1}}{1 - 2/3} = 3\left(1 - \left(\dfrac{2}{3}\right)^{n+1}\right)$, et $\left(\frac{2}{3}\right)^{n+1} \to 0$ : $S_n \to 3$.

## seuil-logarithme · numeric
Un capital augmente de 5 % par an. Au bout de combien d'années aura-t-il doublé pour la première fois ?

= 15

> On cherche le plus petit $n$ tel que $1,05^n > 2$, soit $n > \dfrac{\ln 2}{\ln 1,05} \approx 14,2$ : $n = 15$. Vérification : $1,05^{14} \approx 1,98$ et $1,05^{15} \approx 2,08$.

## limite-e · numeric
Quelle est la limite de $\left(1 + \dfrac{1}{n}\right)^n$ quand $n$ tend vers $+\infty$ (à $0,001$ près) ?

= 2,718 ± 0,001

> $\left(1 + \frac{1}{n}\right)^n = e^{n\ln(1 + 1/n)}$, et $n\ln\left(1 + \frac{1}{n}\right) = \dfrac{\ln(1 + h)}{h}$ avec $h = \frac{1}{n} \to 0$ : c'est le taux d'accroissement de $\ln$ en 1, qui tend vers $\ln'(1) = 1$. La limite vaut $e^1 = e$. Le « $1^\infty$ » est une forme indéterminée.

## integrales-relation · single
On pose $I_n = \displaystyle\int_0^1 x^n\,e^x\,\mathrm{d}x$. Quelle relation donne une intégration par parties ?

- [x] $I_{n+1} = e - (n+1)\,I_n$
- [ ] $I_{n+1} = (n+1)\,I_n$
- [ ] $I_{n+1} = e + (n+1)\,I_n$
- [ ] $I_{n+1} = \dfrac{I_n}{n+1}$

> Avec $u = x^{n+1}$ et $v' = e^x$ : $I_{n+1} = \big[x^{n+1}e^x\big]_0^1 - (n+1)\displaystyle\int_0^1 x^n e^x\,\mathrm{d}x = e - (n+1)\,I_n$. Avec $I_0 = e - 1$, on calcule ainsi toutes les intégrales de proche en proche.

## sans-limite · single
La suite $u_n = (-1)^n + \dfrac{1}{n}$ ($n \geq 1$) a-t-elle une limite ?

- [x] Non : ses termes pairs tendent vers 1, ses termes impairs vers $-1$
- [ ] Oui, 0
- [ ] Oui, 1
- [ ] Oui, $+\infty$

> $u_{2p} = 1 + \frac{1}{2p} \to 1$ et $u_{2p+1} = -1 + \frac{1}{2p+1} \to -1$. Deux sous-suites ayant des limites différentes, la suite n'a pas de limite, bien qu'elle soit bornée.

## limite-n-ln · numeric
Quelle est la limite de $n\ln\left(1 + \dfrac{1}{n}\right)$ quand $n$ tend vers $+\infty$ ?

= 1

> Forme « $\infty \times 0$ ». En posant $h = \frac{1}{n}$ : $\dfrac{\ln(1 + h)}{h} \to \ln'(1) = 1$ quand $h \to 0$. C'est la clé de la limite de $\left(1 + \frac{1}{n}\right)^n$.
