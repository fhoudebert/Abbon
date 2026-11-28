# Formula workshop

Write a maths or chemistry formula and paste it into a word processor. The workshop is in the app (**Tools**
menu) and also a standalone web page that works offline: <https://fhoudebert.github.io/abbon/atelier/> (a
single HTML file; save it and open it with a double click). Version française : [atelier.md](atelier.md).

## Typing

- **Maths**: visual editor or LaTeX; both fields stay in sync. The keyboard button in the visual field opens the
  maths keyboard (exponential, powers, roots, integrals, Greek letters, symbols); on touch screens it opens by
  itself. MathLive-specific LaTeX (`\exponentialE`…) becomes standard LaTeX (`\mathrm{e}`) when leaving the field.
- **Chemistry**: mhchem notation, e.g. `2H2 + O2 -> 2H2O`, `CH3COOH <=> CH3COO- + H+`, `Fe^{3+}`, `CaCO3(s)`.
  The palette inserts arrows, states, charges, gas (`^`) and precipitate (`v`).

An invalid formula is reported under the preview, and the copy buttons are disabled.

## Pasting

| Software | Button | Then |
|---|---|---|
| Microsoft Word (365, 2016 or later) | **For Word** | Paste (Ctrl+V): the formula becomes an editable equation. |
| [WordCraft](https://getartcraft.com/apps/wordcraft) (Linux) | **For Word** | Paste Special → HTML format. |
| Any word processor, later or on another computer | **Save as HTML** | Open the file in a browser, select, copy, then paste (WordCraft: Paste Special → HTML format). The notebook can be saved as HTML too. |
| LibreOffice Writer | **For LibreOffice** | Insert → Object → Formula, then Tools → Import MathML from Clipboard. On Linux, install the `libreoffice-math` package first. |
| LaTeX, Overleaf, Pandoc, Markdown, Wikipedia | **LaTeX** | Paste the source (chemistry: `\ce{…}`, `mhchem` package). |
| Google Docs, slides, e-mail… | **Image** (or **Save image**) | High-resolution PNG, transparent or white background; not editable. |

“For Word” copies MathML as text (`<math xmlns="http://www.w3.org/1998/Math/MathML">…`), which Word recognises
when pasting; “For LibreOffice” adds the XML header expected by LibreOffice Math's import.

If the browser denies clipboard access, the text to copy is shown already selected: press Ctrl+C. Some browsers,
and the app on Linux, cannot copy images: use “Save image”.

## Formula notebook

Formulas can be kept, with a title, in a notebook stored on the device (browser or app storage; it is not part
of Abbon's full backup). **Save (.md)** writes it as Markdown, readable and editable in any editor: a `## title`
followed by `$$formula$$` for each entry. **Open a notebook…** adds the formulas of such a file. Pandoc turns it
into a Word document with editable equations: `pandoc notebook.md -o notebook.docx`.

## Building the standalone page

`npm run atelier` produces `dist/atelier/atelier-formules.html` (sources: `tools/atelier`, shared screen
`src/lib/atelier/FormulaWorkshop.svelte`). It is published as `abbon/atelier/index.html` on fhoudebert.github.io.
