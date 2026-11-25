<p align="center"><img src="assets/abbon-icon.png" width="120" alt=""></p>

# Abbon

[Version française](lisezMoi.md)

An **offline** quiz app to revise for exams, prepare a certification or keep up your general knowledge.
Linux, Windows, macOS and Android; no account, no data sent anywhere.

## What Abbon does

- **Seven question types**: single or multiple choice, short answer, numerical answer (with unit and tolerance),
  fill-in-the-gaps (typed or drop-down), flashcard, and **mathematical expression** typed with a maths keyboard
  (any equivalent form is accepted).
- **Formulas, chemistry, figures**: LaTeX (KaTeX), equations and units (mhchem), molecules and SVG figures.
- **Practice or exam**: feedback after each question, or score and answers at the end, with a timer.
- **Review box** (Leitner method): questions to remember come back at increasing intervals; points and judo belts
  reward regular practice.
- **Quiz modules** installed in one click from the [catalogue](https://fhoudebert.github.io/abbon/questionnaires/):
  maths, physics and chemistry, biology, engineering, philosophy, history, English, Spanish, etymology… with
  revision sheets. Mostly in French, with a few English modules: *French for English speakers: classic traps*,
  *Word stories: playful English etymology*, and *Abbon showcase*, a short tour of every question type.
- **Editor** (rich text, images, formulas), categories, PIN-protected administration; `.qcm` and GIFT (Moodle)
  import and export, full backup.
- **Website export** of a quiz or a module, for shared hosting: practice as static pages, or an **exam graded by
  the server** (PHP) with no answers in the site, opened by the invigilator, with access code, class list, random
  draw of questions, submissions, statistics and answers published by the teacher.
- **Quick quizzes with an AI assistant**: a [ready-made prompt](docs/prompt-qcm-abbon.md) (in French) turns a few
  lines of notes into a `.qcm` file to import, for an end-of-lesson check, a quick test or revision; a
  [second prompt](docs/prompt-module-abbon.md) bundles `.qcm` files into a module, with categories and revision
  sheets, without the repository sources.
- **Formula workshop** (Tools menu, or a [single web page](https://fhoudebert.github.io/abbon/atelier/), also usable offline),
  to write a maths or chemistry formula and paste it into Word (as an editable equation), LibreOffice, LaTeX or
  as an image; formulas can be kept in a Markdown notebook
  ([how to](docs/formula-workshop.md)).
- **Accessible** (WCAG 2.1 AA, light and dark, adjustable text size), in English and French, usable on a phone.

## Download

- App: [latest release](https://github.com/fhoudebert/Abbon/releases/latest) (`.deb`, `.rpm`, AppImage, `.msi`,
  `.exe`, `.dmg`, `.apk`); Linux and Windows for Intel/AMD (x86-64) and ARM64 (Raspberry Pi 4/5, Snapdragon…),
  macOS for Apple silicon and Intel. The app tells you when a new version is out.
- Quizzes: [catalogue](https://fhoudebert.github.io/abbon/questionnaires/), or from the app (About → Quizzes),
  then Admin → Import.

### Keyboard shortcuts (taking a quiz)

| Key | Action |
|---|---|
| `1` … `9` | Tick / untick the matching answer |
| `Enter` | Check (practice), next question, or finish |

In the editor: `Ctrl+S` saves; in an answer, `Enter` creates the next answer (`Shift+Enter`: new line).

## Going further

- [Development](development.md): build, test, package, sign, continuous integration.
- [Writing a quiz module](docs/modules.md), [`.qcm` format](docs/format-qcm/README.md),
  [architecture](docs/architecture.md), [distribution and updates](docs/distribution.md) (in French).
- [Changelog](CHANGELOG.md).

## Licences

Free software under the [MIT](LICENSE) licence. Module content (`modules/` folder) is under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Formula rendering uses
[KaTeX](https://katex.org) (MIT), and visual formula input [MathLive](https://mathlive.io) (MIT). Molecules in
modules are drawn at build time by [RDKit](https://www.rdkit.org) (BSD), which is not shipped with the app.
