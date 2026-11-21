---
id: suites-02
title: { fr: "Suites : approfondissement" }
description: { fr: "Suites arithmético-géométriques, suite auxiliaire, limites, seuil, terme général à écrire" }
level: approfondissement
tags: [maths, bac, prog-2019]
---

## auxiliaire-raison · single
On pose $u_0 = 10$ et $u_{n+1} = 0,5\,u_n + 3$, puis $v_n = u_n - 6$. Que peut-on dire de la suite $(v_n)$ ?

- [x] Elle est géométrique de raison $0,5$
- [ ] Elle est arithmétique de raison $3$
- [ ] Elle est géométrique de raison $3$
- [ ] Elle est constante

> $v_{n+1} = u_{n+1} - 6 = 0,5\,u_n + 3 - 6 = 0,5\,u_n - 3 = 0,5\,(u_n - 6) = 0,5\,v_n$. Le nombre $6$ est le point fixe : c'est la solution de $\ell = 0,5\,\ell + 3$. Soustraire le point fixe transforme une suite arithmético-géométrique en suite géométrique.

## auxiliaire-terme · expression
Avec la même suite ($u_0 = 10$, $u_{n+1} = 0,5\,u_n + 3$), écrivez $u_n$ en fonction de $n$.

= $6 + 4 \times 0{,}5^{n}$

> $v_n = v_0 \times 0,5^n$ avec $v_0 = u_0 - 6 = 4$, donc $u_n = v_n + 6 = 6 + 4 \times 0,5^n$. Les écritures équivalentes sont acceptées, par exemple $6 + 4\left(\dfrac{1}{2}\right)^n$ ou $6 + \dfrac{4}{2^n}$. Vérification : $u_0 = 10$, $u_1 = 8$.

## auxiliaire-limite · numeric
Toujours avec $u_n = 6 + 4 \times 0,5^n$, quelle est la limite de $(u_n)$ ?

= 6

> Comme $-1 < 0,5 < 1$, $0,5^n \to 0$ ; donc $u_n \to 6$. La limite est le point fixe de la relation $u_{n+1} = 0,5\,u_n + 3$, ce qui est attendu pour une suite convergente définie par une fonction continue.

## seuil · numeric
On cherche le plus petit entier $n$ tel que $0,5^n < 0,001$. Quelle est sa valeur ?

= 10

> $0,5^9 \approx 0,00195$ et $0,5^{10} \approx 0,00098$ : le seuil est atteint pour $n = 10$. Par le calcul : $0,5^n < 0,001 \iff n\ln 0,5 < \ln 0,001 \iff n > \dfrac{\ln 0,001}{\ln 0,5} \approx 9,97$ — attention, diviser par $\ln 0,5 < 0$ change le sens de l'inégalité. C'est ce que calcule un algorithme « tant que ».

## limite-quotient · numeric
Quelle est la limite de $u_n = \dfrac{3n^2 + 1}{n^2 + n}$ quand $n$ tend vers $+\infty$ ?

= 3

> Forme indéterminée « $\infty / \infty$ » : on factorise par le terme de plus haut degré, $u_n = \dfrac{n^2\left(3 + \frac{1}{n^2}\right)}{n^2\left(1 + \frac{1}{n}\right)} = \dfrac{3 + \frac{1}{n^2}}{1 + \frac{1}{n}} \to 3$.

## somme-impairs · expression
On pose $u_k = 2k + 1$. Écrivez $S_n = u_0 + u_1 + \dots + u_n$ en fonction de $n$.

= $(n+1)^2$

> La suite est arithmétique de raison 2 ; la somme compte $n + 1$ termes, de $1$ à $2n + 1$ : $S_n = (n+1) \times \dfrac{1 + (2n+1)}{2} = (n+1)^2$. La somme des premiers nombres impairs est un carré : $1$, $1 + 3 = 4$, $1 + 3 + 5 = 9$.

## inverse-terme · expression
On pose $u_0 = 1$ et $u_{n+1} = \dfrac{u_n}{1 + u_n}$. En étudiant $v_n = \dfrac{1}{u_n}$, écrivez $u_n$ en fonction de $n$.

= $\frac{1}{n+1}$

> $v_{n+1} = \dfrac{1 + u_n}{u_n} = \dfrac{1}{u_n} + 1 = v_n + 1$ : $(v_n)$ est arithmétique de raison 1, avec $v_0 = 1$, donc $v_n = n + 1$ et $u_n = \dfrac{1}{n+1}$. Vérification : $u_1 = \dfrac{1}{2}$, $u_2 = \dfrac{1}{3}$.

## heredite · single
On veut montrer par récurrence que $0 \leq u_n \leq 6$ pour $u_0 = 1$ et $u_{n+1} = f(u_n)$, où $f$ est croissante sur $[0\,;6]$ avec $f(0) = 3$ et $f(6) = 6$. Sur quoi repose l'hérédité ?

- [x] Si $0 \leq u_n \leq 6$, la croissance de $f$ donne $f(0) \leq u_{n+1} \leq f(6)$, soit $3 \leq u_{n+1} \leq 6$
- [ ] Sur le calcul de $u_1$, $u_2$ et $u_3$
- [ ] Sur le fait que $(u_n)$ converge vers 6
- [ ] Si $0 \leq u_n \leq 6$, alors $u_{n+1} \leq u_n$

> L'hérédité suppose la propriété vraie à un rang $n$ et la démontre au rang $n + 1$. Appliquer $f$ croissante aux inégalités les conserve ; on conclut avec $0 \leq 3$. Calculer quelques termes ne prouve rien, et la convergence serait une conséquence, pas un argument.

## comparaison · single
On sait que $u_n \geq n^2 - 5$ pour tout entier $n$. Que peut-on en conclure ?

- [x] $(u_n)$ tend vers $+\infty$, par comparaison
- [ ] $(u_n)$ converge vers $n^2 - 5$
- [ ] On ne peut rien conclure sans majorant
- [ ] $(u_n)$ est croissante

> $n^2 - 5 \to +\infty$ et $u_n$ est au-dessus : par le théorème de comparaison, $u_n \to +\infty$. Une minoration ne dit rien du sens de variation : la suite peut osciller tout en tendant vers $+\infty$.

## gendarmes · single
Pourquoi la suite $u_n = \dfrac{\cos n}{n}$ ($n \geq 1$) tend-elle vers 0 ?

- [x] Car $-\dfrac{1}{n} \leq u_n \leq \dfrac{1}{n}$ et les deux bornes tendent vers 0
- [ ] Car $\cos n$ tend vers 0
- [ ] Car la suite est décroissante
- [ ] Car $\cos n$ tend vers 1

> $\cos n$ reste entre $-1$ et $1$ sans avoir de limite ; en divisant par $n > 0$, on encadre $u_n$ entre $-\frac{1}{n}$ et $\frac{1}{n}$. Le théorème des gendarmes donne la limite 0. La suite n'est d'ailleurs pas monotone.
