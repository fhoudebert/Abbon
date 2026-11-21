## Dérivées usuelles

| Fonction | Dérivée |
| --- | --- |
| $x^n$ | $n\,x^{n-1}$ |
| $\dfrac{1}{x}$ | $-\dfrac{1}{x^2}$ |
| $\sqrt{x}$ | $\dfrac{1}{2\sqrt{x}}$ |
| $e^x$ | $e^x$ |
| $\ln x$ | $\dfrac{1}{x}$ |

| Opération | Dérivée |
| --- | --- |
| $u\,v$ | $u'v + uv'$ |
| $\dfrac{u}{v}$ | $\dfrac{u'v - uv'}{v^2}$ |
| $u^n$ | $n\,u'\,u^{n-1}$ |
| $e^u$ | $u'\,e^u$ |
| $\ln u$, avec $u > 0$ | $\dfrac{u'}{u}$ |

Composée : $\big(f(ax + b)\big)' = a\,f'(ax + b)$ et plus généralement $(g \circ u)' = u' \times (g' \circ u)$.

## Tangente et convexité

- Tangente au point d'abscisse $a$ : $y = f'(a)\,(x - a) + f(a)$.
- $f$ est **convexe** sur $I$ si $f'$ y est croissante, soit $f'' \geq 0$ : la courbe est au-dessus de ses tangentes. **Concave** si $f'' \leq 0$.
- **Point d'inflexion** : la courbe traverse sa tangente ; $f''$ s'y annule en changeant de signe.
- Inégalités de convexité : $e^x \geq 1 + x$ pour tout $x$ ; $\ln x \leq x - 1$ pour tout $x > 0$.
- Limite d'un taux d'accroissement : $\dfrac{f(x) - f(a)}{x - a} \to f'(a)$ ; par exemple $\dfrac{e^x - 1}{x} \to 1$ et $\dfrac{\ln(1 + x)}{x} \to 1$ quand $x \to 0$.

## Exponentielle

- $e^0 = 1$, $e^x > 0$ pour tout $x$, $\exp$ est strictement croissante.
- $e^{a+b} = e^a\,e^b$, $e^{a-b} = \dfrac{e^a}{e^b}$, $e^{-a} = \dfrac{1}{e^a}$, $(e^a)^n = e^{na}$.
- $\lim\limits_{x \to -\infty} e^x = 0$, $\lim\limits_{x \to +\infty} e^x = +\infty$.

## Logarithme népérien

- Défini sur $]0\,;+\infty[$ ; $\ln 1 = 0$, $\ln e = 1$ ; $\ln 0$ n'existe pas.
- $e^{\ln x} = x$ pour $x > 0$, et $\ln(e^x) = x$ pour tout $x$.
- $\ln(ab) = \ln a + \ln b$, $\ln\dfrac{a}{b} = \ln a - \ln b$, $\ln(a^n) = n\ln a$, $\ln\sqrt{a} = \frac{1}{2}\ln a$.
- $\lim\limits_{x \to 0^+} \ln x = -\infty$, $\lim\limits_{x \to +\infty} \ln x = +\infty$.

## Croissances comparées

- $\lim\limits_{x \to +\infty} \dfrac{e^x}{x^n} = +\infty$ et $\lim\limits_{x \to -\infty} x^n\,e^x = 0$ : l'exponentielle l'emporte sur les puissances.
- $\lim\limits_{x \to +\infty} \dfrac{\ln x}{x} = 0$ et $\lim\limits_{x \to 0^+} x\ln x = 0$ : les puissances l'emportent sur le logarithme.

## Continuité

- **Théorème des valeurs intermédiaires** : si $f$ est continue et strictement monotone sur $[a\,;b]$, toute valeur $k$ comprise entre $f(a)$ et $f(b)$ est atteinte exactement une fois.

## Pièges classiques

- Oublier le facteur $u'$ dans la dérivée d'une composée.
- Confondre $\ln(a^p) = p\ln a$ et $(\ln a)^p$ ; écrire $\ln(a + b) = \ln a + \ln b$ (faux).
- Écrire l'équation de la tangente avec $f'(x)$ au lieu de $f'(a)$.
- Confondre « $f$ croissante » ($f' \geq 0$) et « $f$ convexe » ($f'' \geq 0$).
