# Atelier de formules

Écrire une formule de mathématiques ou de chimie et la coller dans un traitement de texte. L'atelier est dans
l'application (menu **Outils**) et en page web autonome, utilisable hors ligne :
<https://fhoudebert.github.io/abbon/atelier/> (un seul fichier HTML, à enregistrer et ouvrir par double-clic).
English version: [formula-workshop.md](formula-workshop.md).

## Saisir

- **Mathématiques** : éditeur visuel (clavier mathématique sur écran tactile) ou LaTeX ; les deux champs
  restent synchronisés.
- **Chimie** : notation mhchem, par exemple `2H2 + O2 -> 2H2O`, `CH3COOH <=> CH3COO- + H+`, `Fe^{3+}`,
  `CaCO3(s)`. La palette insère flèches, états physiques, charges, dégagement gazeux (`^`) et précipité (`v`).

Une formule incorrecte est signalée sous l'aperçu ; les boutons de copie restent alors inactifs.

## Coller

| Logiciel | Bouton | Puis |
|---|---|---|
| Microsoft Word (365, 2016 ou plus récent) | **Pour Word** | Coller (Ctrl+V) : la formule devient une équation modifiable. |
| [WordCraft](https://getartcraft.com/apps/wordcraft) (Linux) | **Pour Word** | Collage spécial → format HTML. |
| LibreOffice Writer | **Pour LibreOffice** | Insertion → Objet → Formule, puis Outils → Importer MathML depuis le presse-papiers. Sous Linux, installer d'abord le paquet `libreoffice-math`. |
| LaTeX, Overleaf, Pandoc, Markdown, Wikipédia | **LaTeX** | Coller la source (chimie : `\ce{…}`, extension `mhchem`). |
| Google Docs, présentations, courriels… | **Image** (ou **Enregistrer l'image**) | Image PNG à haute résolution, fond transparent ou blanc ; non modifiable. |

« Pour Word » copie du MathML en texte (`<math xmlns="http://www.w3.org/1998/Math/MathML">…`), que Word
reconnaît au collage ; « Pour LibreOffice » ajoute l'en-tête XML attendu par l'import de LibreOffice Math.

Si le navigateur refuse l'accès au presse-papiers, le texte à copier s'affiche, déjà sélectionné : Ctrl+C.
Certains navigateurs, ou l'application sous Linux, ne permettent pas de copier une image : utiliser
« Enregistrer l'image ».

## Carnet de formules

Les formules peuvent être gardées, avec un titre, dans un carnet conservé sur l'appareil (stockage du
navigateur ou de l'application ; il n'entre pas dans la sauvegarde complète d'Abbon). **Enregistrer (.md)**
l'écrit en Markdown, lisible et modifiable dans n'importe quel éditeur :

```markdown
# Carnet de formules

## Pythagore

$$a^2+b^2=c^2$$

## Eau

$$\ce{2H2 + O2 -> 2H2O}$$
```

**Ouvrir un carnet…** ajoute les formules d'un tel fichier : chaque titre `## …` suivi d'une formule `$$…$$`
(ou `$…$`). Pandoc en fait un document Word aux équations modifiables : `pandoc carnet.md -o carnet.docx`.

## Construire la page autonome

`npm run atelier` produit `dist/atelier/atelier-formules.html` (sources : `tools/atelier`, écran partagé
`src/lib/atelier/FormulaWorkshop.svelte`). Elle est publiée sous `abbon/atelier/index.html` sur
fhoudebert.github.io.
