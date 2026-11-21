## Forme algébrique

- $z = a + ib$, avec $a = \mathrm{Re}(z)$, $b = \mathrm{Im}(z)$ et $i^2 = -1$.
- **Conjugué** : $\overline{z} = a - ib$. On a $z + \overline{z} = 2a$, $z - \overline{z} = 2ib$, $z\,\overline{z} = a^2 + b^2$, $\overline{z + z'} = \overline{z} + \overline{z'}$, $\overline{z\,z'} = \overline{z}\;\overline{z'}$.
- Inverse : $\dfrac{1}{z} = \dfrac{\overline{z}}{z\,\overline{z}}$ — on multiplie par le conjugué du dénominateur.

## Module et argument

- $|z| = \sqrt{a^2 + b^2} = \sqrt{z\,\overline{z}}$ ; $|z\,z'| = |z|\,|z'|$, $\left|\dfrac{z}{z'}\right| = \dfrac{|z|}{|z'|}$.
- Argument $\theta$ : $\cos\theta = \dfrac{a}{|z|}$, $\sin\theta = \dfrac{b}{|z|}$ ; défini à $2\pi$ près.
- $\arg(z\,z') = \arg z + \arg z'$, $\arg\dfrac{z}{z'} = \arg z - \arg z'$, $\arg\overline{z} = -\arg z$ (modulo $2\pi$).

## Formes trigonométrique et exponentielle

- $z = r(\cos\theta + i\sin\theta) = r\,e^{i\theta}$, avec $r = |z|$.
- Valeurs à connaître : $e^{i\pi/2} = i$, $e^{i\pi} = -1$, $e^{2i\pi} = 1$.
- $e^{i\theta}\,e^{i\theta'} = e^{i(\theta + \theta')}$ et **formule de Moivre** : $\left(e^{i\theta}\right)^n = e^{in\theta}$.
- **Formules d'Euler** : $\cos\theta = \dfrac{e^{i\theta} + e^{-i\theta}}{2}$, $\sin\theta = \dfrac{e^{i\theta} - e^{-i\theta}}{2i}$.
- Linéarisation : $\cos^2 x = \dfrac{1 + \cos(2x)}{2}$ et $\sin^2 x = \dfrac{1 - \cos(2x)}{2}$ (Euler) ; $\cos(3\theta) = 4\cos^3\theta - 3\cos\theta$ (Moivre).

## Équations et polynômes

- $a z^2 + b z + c = 0$ à coefficients réels, $\Delta = b^2 - 4ac < 0$ : deux solutions conjuguées $\dfrac{-b \pm i\sqrt{-\Delta}}{2a}$.
- Si $P(\alpha) = 0$, alors $P(z) = (z - \alpha)\,Q(z)$.
- $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$ ; plus généralement $z^n - 1 = (z - 1)(1 + z + \dots + z^{n-1})$.
- Racines $n$-ièmes de l'unité : $e^{2ik\pi/n}$ pour $k = 0, \dots, n - 1$.
- Binôme de Newton : $(a + b)^n = \sum\limits_{k=0}^{n} \dbinom{n}{k}\,a^k\,b^{n-k}$ ; par exemple $(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$.

## Géométrie

- $AB = |z_B - z_A|$ ; l'affixe du milieu de $[AB]$ est $\dfrac{z_A + z_B}{2}$.
- $\left(\overrightarrow{AB}, \overrightarrow{AC}\right) = \arg\dfrac{z_C - z_A}{z_B - z_A}$ (modulo $2\pi$).

## Pièges classiques

- Changer le signe de la partie réelle en prenant le conjugué : seul celui de la partie imaginaire change.
- Diviser l'argument au lieu de le multiplier en élevant à une puissance.
- Oublier les termes croisés en développant $(1 + i)^3$.
- Écrire $|z + z'| = |z| + |z'|$ : c'est en général faux (seule l'inégalité $\leq$ est vraie).
