# Prompt : module Abbon

*À copier en entier au début d'une nouvelle conversation, avec les fichiers `.qcm` à rassembler en pièces jointes,
puis remplir la partie « Ma demande » en bas. Scripts maintenus dans
[`scripts/qcm/abbon_module.py`](../scripts/qcm/abbon_module.py) et [`scripts/qcm/abbon_qcm.py`](../scripts/qcm/abbon_qcm.py) ;
format produit : [format-qcm](format-qcm/README.md#modules). Pour un QCM seul : [prompt-qcm-abbon.md](prompt-qcm-abbon.md).*

---

Tu assembles un **module** pour **Abbon**, une application libre de QCM hors ligne. Un module est un ensemble de
QCM rangés en catégories, avec des fiches de révision, livré dans un seul fichier `.qcm`, versionné : il
s'installe d'un bloc (*Administration › Importer*), son contenu est protégé, et une version plus récente du même
module le met à jour sans perdre l'historique des élèves. Il peut ensuite être exporté en site web depuis Abbon.
Pas besoin du dépôt d'Abbon : les deux scripts ci-dessous suffisent.

## Ce que tu reçois

- Des fichiers `.qcm` en pièces jointes : faits avec le prompt « QCM express » ou exportés depuis Abbon
  (*Administration › Exporter*, **avec le corrigé**). Un fichier peut contenir plusieurs QCM.
- Éventuellement des notes, pour les fiches de révision ou pour des QCM à écrire en plus.

## Ce que tu produis

1. **Le module** : écris `abbon_qcm.py` et `abbon_module.py` ci-dessous tels quels, dans le même dossier, puis un
   court script qui décrit le module (`Module`), ses catégories et leurs fiches (`category`), ajoute chaque QCM
   (`add`) et appelle `save()`. Exécute-le et donne-moi le fichier `Abbon-<nom>-<version>.qcm`.
2. **Ce script de construction**, en entier dans ta réponse : je le garde pour la prochaine version.
3. **Un sommaire** : catégories, QCM (titre, nombre de questions) et fiches.

Lis d'abord les fichiers reçus (ce sont des archives ZIP : `manifest.json`, `quizzes/*.json`) pour connaître
leurs titres et leurs questions ; ne modifie pas leurs questions sauf si je le demande. Si un fichier est sans
corrigé (`"solutions": false`), dis-le : il ne peut pas entrer dans un module.

## Règles

- **Identifiant** (`id`) : notation inversée en minuscules, propre à l'auteur et au sujet, par exemple
  `fr.college-jean-moulin.svt-5e` ou `fr.mmartin.histoire-4e`. Ne jamais le changer ensuite.
- **Version** : `1.0.0` pour la première ; ensuite `1.0.1` (corrections), `1.1.0` (ajouts), `2.0.0` (refonte).
- **Clés** (`key` des catégories et des QCM) : courtes et stables (`vegetaux`, `photosynthese`). Avec l'énoncé de
  chaque question, elles forment les identifiants qui relient l'historique des élèves aux versions suivantes :
  ne les renomme pas d'une version à l'autre. Une question dont on corrige l'énoncé repart de zéro dans
  l'historique, ce qui est sans gravité.
- **Catégories** : une par thème ou chapitre, 3 à 10 QCM chacune au mieux ; sous-catégories avec `parent`.
  Tout QCM est rangé dans une catégorie.
- **Fiches de révision** (`sheet`, en Markdown) : une par catégorie, l'essentiel à retenir en une page — titres
  `##` et `###`, listes, tableaux, formules `$…$` et `$$…$$`, **gras**, *italique*, citations `>`. Rédige-les
  à partir de mes notes et des QCM de la catégorie, avec des connaissances sûres ; signale ce qui te semble
  douteux au lieu de l'écrire.
- **Description** du module : deux ou trois phrases, ce qu'on y apprend et pour qui. **Licence** : identifiant
  SPDX (`CC-BY-4.0` par défaut, `CC-BY-NC-SA-4.0` pour interdire l'usage commercial).
- **QCM à écrire en plus**, si je le demande : avec la classe `Qcm` d'`abbon_qcm.py`, puis `m.add(q, key=…)`.
  Mêmes exigences que pour un QCM express : une idée par question, distracteurs plausibles, une explication pour
  chaque question, types variés (`single`, `multiple`, `vf`, `short`, `numeric`, `cloze`, `expression`,
  `flashcard`).

## Mise à jour d'un module

Je te redonne le script de construction de la version précédente et les fichiers `.qcm`, nouveaux ou corrigés.
Garde le même `id`, les mêmes clés de catégories et de QCM, et augmente `version`. Un QCM retiré du module est
retiré des appareils à la mise à jour.

## Le script `abbon_qcm.py` (à recopier sans modification)

```python
"""abbon_qcm.py — fabrique un fichier .qcm importable dans Abbon (Administration › Importer), sans dépendance.

Utilisé par le prompt docs/prompt-qcm-abbon.md, qui en contient une copie exacte (vérifiée par abbon_qcm.test.ts).
Format produit : docs/format-qcm/README.md.

    from abbon_qcm import Qcm
    q = Qcm("Fin de cours : la photosynthèse", lang="fr", description="Cinq minutes en fin de séance")
    q.single("Où a lieu la photosynthèse ?", ok="Dans les chloroplastes", ko=["Dans les mitochondries", "Dans le noyau"],
             expl="Les chloroplastes contiennent la chlorophylle.")
    q.save("photosynthese.qcm")

Textes : chaîne simple ; une ligne vide sépare deux paragraphes ; $x^2$ est une formule dans le texte, un paragraphe
réduit à $$…$$ une formule en bloc (LaTeX, KaTeX ; chimie : $\\ce{H2O}$) ; **gras** et *italique*.
"""
import datetime
import json
import re
import uuid
import zipfile

_INLINE = re.compile(r"\$([^$\n]+)\$|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*")


def _ident(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def _inline(text):
    """Texte d'un paragraphe → nœuds TipTap (texte, formule, gras, italique, sauts de ligne)."""
    nodes, pos = [], 0
    for m in _INLINE.finditer(text):
        if m.start() > pos:
            nodes += _plain(text[pos:m.start()])
        if m.group(1) is not None:
            nodes.append({"type": "math", "content": [{"type": "text", "text": m.group(1).strip()}]})
        elif m.group(2) is not None:
            nodes.append({"type": "text", "text": m.group(2), "marks": [{"type": "bold"}]})
        else:
            nodes.append({"type": "text", "text": m.group(3), "marks": [{"type": "italic"}]})
        pos = m.end()
    if pos < len(text):
        nodes += _plain(text[pos:])
    return nodes


def _plain(s):
    out = []
    for i, part in enumerate(s.split("\n")):
        if i:
            out.append({"type": "hardBreak"})
        if part:
            out.append({"type": "text", "text": part})
    return out


def rich(text):
    """Chaîne → contenu Abbon : texte simple s'il n'y a ni formule ni mise en forme, sinon document TipTap."""
    text = text.strip()
    if not _INLINE.search(text) and "$$" not in text:
        return text
    blocks = []
    for para in re.split(r"\n\s*\n", text):
        para = para.strip()
        block = re.fullmatch(r"\$\$(.+)\$\$", para, re.S)
        if block:
            blocks.append({"type": "mathBlock", "content": [{"type": "text", "text": block.group(1).strip()}]})
        elif para:
            blocks.append({"type": "paragraph", "content": _inline(para)})
    return {"type": "doc", "content": blocks}


class Qcm:
    def __init__(self, title, lang="fr", description="", level=None, tags=(), threshold=0.6, partial=True,
                 shuffle=True, solutions="after_submit", time_limit_min=None, author=None):
        """solutions : "after_submit" (corrigé après envoi), "after_pass" (après réussite), "never" (sondage, contrôle)."""
        self.lang, self.questions = lang, []
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        self.quiz = {
            "id": _ident("qcm"), "categoryId": None, "title": {lang: title},
            "description": {lang: description} if description else None,
            "languages": [lang], "level": level, "tags": list(tags),
            "timeLimitSec": int(time_limit_min * 60) if time_limit_min else None,
            "passThreshold": threshold, "scoring": "partial" if partial else "all_or_nothing",
            "solutionVisibility": solutions, "shuffle": shuffle, "status": "published", "version": 1,
            "author": author, "createdAt": now, "updatedAt": now, "questions": self.questions,
        }

    def _add(self, qtype, prompt, choices=(), expected=None, expl=None, points=1):
        t = lambda s: {self.lang: rich(s)}
        self.questions.append({
            "id": _ident("q"), "type": qtype, "prompt": t(prompt), "points": points,
            "position": len(self.questions), "explanation": t(expl) if expl else None,
            "choices": [{"id": _ident("c"), "content": t(c), "correct": ok, "position": i}
                        for i, (c, ok) in enumerate(choices)],
            "expected": expected,
        })
        return self

    def single(self, prompt, ok, ko, expl=None, points=1):
        """Choix unique : une bonne réponse `ok`, des mauvaises `ko` (2 à 4)."""
        return self._add("single", prompt, [(ok, True)] + [(k, False) for k in ko], None, expl, points)

    def multiple(self, prompt, ok, ko, expl=None, points=1):
        """Choix multiples : bonnes réponses `ok` (au moins une), mauvaises `ko` ; 5 propositions au plus."""
        return self._add("multiple", prompt, [(o, True) for o in ok] + [(k, False) for k in ko], None, expl, points)

    def vf(self, prompt, true, expl=None, points=1):
        """Vrai ou faux."""
        yes, no = ("Vrai", "Faux") if self.lang == "fr" else ("True", "False")
        return self._add("single", prompt, [(yes, bool(true)), (no, not true)], None, expl, points)

    def short(self, prompt, accepted, case_sensitive=False, expl=None, points=1):
        """Réponse courte : formes acceptées (majuscules ignorées ; les accents comptent)."""
        exp = {"accepted": list(accepted)} | ({"caseSensitive": True} if case_sensitive else {})
        return self._add("short", prompt, (), exp, expl, points)

    def numeric(self, prompt, value, tolerance=0, unit=None, expl=None, points=1):
        """Nombre : juste si |saisie − value| ≤ tolerance ; unité affichée, pas saisie."""
        return self._add("numeric", prompt, (), {"value": value, "tolerance": tolerance, "unit": unit}, expl, points)

    def cloze(self, prompt, text, expl=None, points=1):
        """Texte à trous : [[went|did go]] trou à saisir (formes acceptées), [[has~have~had]] liste déroulante
        (bonne réponse d'abord). Le texte est affiché tel quel (pas de formule ni de gras dedans)."""
        gaps = []

        def gap(m):
            body = m.group(1)
            if "~" in body:
                first, *others = [x.strip() for x in body.split("~")]
                gaps.append({"kind": "select", "accepted": [first], "options": others})
            else:
                gaps.append({"kind": "text", "accepted": [x.strip() for x in body.split("|")]})
            return "{{%d}}" % len(gaps)

        holed = re.sub(r"\[\[(.+?)\]\]", gap, text.strip())
        return self._add("cloze", prompt, (), {"text": {self.lang: holed}, "gaps": gaps}, expl, points)

    def expression(self, prompt, latex, constant=False, expl=None, points=1):
        """Formule à écrire (éditeur visuel) : égalité mathématique avec `latex` ; constant=True : primitive (+ C)."""
        return self._add("expression", prompt, (), {"latex": latex, "constant": constant}, expl, points)

    def flashcard(self, recto, verso):
        """Carte recto-verso (révision) : l'apprenant dit s'il savait."""
        return self._add("flashcard", recto, (), None, verso)

    def save(self, path):
        q = self.quiz
        manifest = {
            "format": "abbon-qcm", "formatVersion": 1, "kind": "content",
            "app": {"name": "abbon_qcm.py", "version": "1"}, "exportedAt": q["updatedAt"],
            "solutions": True, "quizzes": [{"id": q["id"], "file": f"quizzes/{q['id']}.json", "version": 1}],
            "media": [],
        }
        dump = lambda o: json.dumps(o, ensure_ascii=False, indent=1)
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("manifest.json", dump(manifest))
            z.writestr("categories.json", "[]")
            z.writestr(f"quizzes/{q['id']}.json", dump(q))
        return path
```

## Le script `abbon_module.py` (à recopier sans modification)

```python
"""abbon_module.py — assemble un module Abbon (QCM rangés en catégories, fiches de révision, version) à partir de
fichiers .qcm, sans les sources ni l'outillage du dépôt. Python seul ; s'appuie sur abbon_qcm.py (même dossier).

    from abbon_qcm import Qcm
    from abbon_module import Module
    m = Module("fr.college-exemple.svt-5e", "1.0.0", title="SVT 5e", description="…", license="CC-BY-4.0",
               authors=["Mme Martin"], level="5e")
    m.category("vegetaux", "Les végétaux", sheet=open("fiche-vegetaux.md").read())
    m.add("photosynthese.qcm", category="vegetaux")          # fichier .qcm (abbon_qcm.py ou export d'Abbon)
    q = Qcm("Les graines")…; m.add(q, key="graines", category="vegetaux")   # ou directement un Qcm
    m.save()                                                  # → Abbon-svt-5e-1.0.0.qcm

Identifiants stables d'une version à l'autre (ils relient l'historique des élèves aux nouvelles versions) :
module `id` en notation inversée ; QCM `<préfixe><key>` (key : titre simplifié par défaut) ; question
`<key>-<énoncé simplifié>` ; catégorie `<préfixe><key>`. Pour publier une mise à jour, garder `id`, les `key` et
les catégories, et augmenter `version` (SemVer). Utilisé par docs/prompt-module-abbon.md (copie exacte, vérifiée
par abbon_qcm.test.ts). Format : docs/format-qcm/README.md#modules.
"""
import json
import re
import unicodedata
import zipfile

from abbon_qcm import _inline  # nœuds en ligne : formules, gras, italique

MODULE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$")
SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def slug(text, size=40):
    """« Où a lieu la photosynthèse ? » → « ou-a-lieu-la-photosynthese »."""
    text = re.sub(r"[$*_`\\{}]", " ", str(text))
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return (text[:size].rstrip("-") or "x")


def _text(value):
    """Texte d'un contenu riche (chaîne ou document TipTap), formules comprises."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("text", "") + " ".join(_text(c) for c in value.get("content", []))
    return " ".join(_text(v) for v in value or [])


def markdown(src):
    """Sous-ensemble de Markdown → document TipTap (fiches) : titres ## et ###, paragraphes, listes - et 1.,
    tableaux | a | b |, citations >, filet ---, formules $…$ et $$…$$, **gras**, *italique*."""
    lines, out, i = src.strip().splitlines(), [], 0
    para = lambda text: {"type": "paragraph", "content": _inline(text.strip())}
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
        elif line.strip().startswith("$$"):
            body = line.strip()[2:]
            while not body.rstrip().endswith("$$") and i + 1 < len(lines):
                i += 1
                body += "\n" + lines[i]
            out.append({"type": "mathBlock", "content": [{"type": "text", "text": body.rstrip()[:-2].strip()}]})
            i += 1
        elif re.match(r"^#{1,4}\s", line):
            hashes, text = line.split(None, 1)
            out.append({"type": "heading", "attrs": {"level": max(1, len(hashes) - 1)}, "content": _inline(text.strip())})
            i += 1
        elif re.match(r"^\s*(-{3,}|\*{3,})\s*$", line):
            out.append({"type": "horizontalRule"})
            i += 1
        elif line.strip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?[\s:|-]+\|?\s*$", lines[i + 1]):
            cells = lambda l: [c.strip() for c in l.strip().strip("|").split("|")]
            row = lambda l, kind: {"type": "tableRow", "content": [{"type": kind, "content": [para(c)]} for c in cells(l)]}
            rows, i = [row(line, "tableHeader")], i + 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(row(lines[i], "tableCell"))
                i += 1
            out.append({"type": "table", "content": rows})
        elif line.lstrip().startswith(">"):
            body = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                body.append(re.sub(r"^\s*> ?", "", lines[i]))
                i += 1
            out.append({"type": "blockquote", "content": markdown("\n".join(body))["content"]})
        elif re.match(r"^\s*([-*+]|\d+[.)])\s+", line):
            ordered = bool(re.match(r"^\s*\d", line))
            items = []
            while i < len(lines) and re.match(r"^\s*([-*+]|\d+[.)])\s+", lines[i]):
                items.append({"type": "listItem", "content": [para(re.sub(r"^\s*([-*+]|\d+[.)])\s+", "", lines[i]))]})
                i += 1
            out.append({"type": "orderedList" if ordered else "bulletList", "content": items})
        else:
            text = []
            while i < len(lines) and lines[i].strip() and not re.match(r"^\s*(#{1,4}\s|>|\||\$\$|([-*+]|\d+[.)])\s)", lines[i]):
                text.append(lines[i].strip())
                i += 1
            if not text:
                text, i = [lines[i]], i + 1
            out.append(para("\n".join(text)))
    return {"type": "doc", "content": out}


def _read_qcm(path):
    """Fichier .qcm → (QCM, médias {nom dans l'archive: octets})."""
    with zipfile.ZipFile(path) as z:
        manifest = json.loads(z.read("manifest.json"))
        if not manifest.get("solutions", True):
            raise ValueError(f"{path} : fichier sans corrigé, inutilisable pour un module")
        quizzes = [json.loads(z.read(q["file"])) for q in manifest["quizzes"]]
        media = {n: z.read(n) for n in z.namelist() if n.startswith("media/")}
    return quizzes, media


class Module:
    def __init__(self, id, version, title, description="", license="CC-BY-4.0", authors=(), level=None, lang="fr",
                 homepage=None):
        if not MODULE_ID_RE.match(id):
            raise ValueError("id : notation inversée en minuscules, ex. fr.college-exemple.svt-5e")
        v = SEMVER_RE.match(version)
        if not v:
            raise ValueError("version : SemVer, ex. 1.0.0")
        self.id, self.version, self.lang, self.level = id, version, lang, level
        self.prefix = id.replace(".", "-") + "_"
        major, minor, patch = (int(x) for x in v.groups())
        self.quiz_version = major * 1_000_000 + minor * 1_000 + patch
        self.meta = {"title": {lang: title}, "description": {lang: description} if description else None,
                     "level": level, "license": license, "authors": list(authors), "homepage": homepage}
        self.categories, self.sheets, self.quizzes, self.media = [], {}, [], {}

    def category(self, key, name, sheet=None, parent=None, color=None):
        """Catégorie (dossier de QCM) ; `sheet` : fiche de révision en Markdown ; `parent` : clé d'une autre catégorie."""
        cid = self.prefix + slug(key)
        self.categories.append({"id": cid, "parentId": self.prefix + slug(parent) if parent else None,
                                "name": {self.lang: name}, "position": len(self.categories), "color": color})
        if sheet:
            self.sheets[cid] = {self.lang: markdown(sheet)}
        return cid

    def add(self, source, category=None, key=None, level=None):
        """Ajoute un Qcm (abbon_qcm.py) ou tous les QCM d'un fichier .qcm, rangés dans `category` (clé)."""
        if hasattr(source, "quiz"):
            quizzes, media = [json.loads(json.dumps(source.quiz))], {}
        else:
            quizzes, media = _read_qcm(source)
        self.media.update(media)
        for n, quiz in enumerate(quizzes):
            title = next(iter(quiz["title"].values()))
            k = slug(key if key and len(quizzes) == 1 else (f"{key}-{n + 1}" if key else title))
            qid = self.prefix + k
            if any(q["id"] == qid for q in self.quizzes):
                raise ValueError(f"deux QCM avec la clé « {k} » : donnez des `key` différentes")
            seen = set()
            for pos, question in enumerate(quiz["questions"]):
                prompt = next(iter(question["prompt"].values()))
                base = f"{k}-{slug(_text(prompt))}"
                ident, dup = base, 2
                while ident in seen:
                    ident, dup = f"{base}-{dup}", dup + 1
                seen.add(ident)
                question.update(id=ident[:100], position=pos)
                for c, choice in enumerate(question.get("choices", [])):
                    choice.update(id=f"{ident[:90]}-c{c + 1}", position=c)
            quiz.update(id=qid, categoryId=self.prefix + slug(category) if category else None,
                        version=self.quiz_version, status="published")
            if level or self.level:
                quiz["level"] = level or self.level
            quiz.pop("moduleId", None)
            self.quizzes.append(quiz)
        return self

    def save(self, path=None):
        """Écrit le module ; nom par défaut : Abbon-<fin de l'id>-<version>.qcm."""
        known = {c["id"] for c in self.categories}
        for q in self.quizzes:
            if q["categoryId"] and q["categoryId"] not in known:
                raise ValueError(f"{q['id']} : catégorie inconnue {q['categoryId']} (déclarez-la avec category())")
        text = json.dumps([self.quizzes, self.sheets], ensure_ascii=False)
        features = (["math"] if re.search(r'"type": "math(Block)?"', text) else []) + \
                   (["svg"] if any(n.endswith(".svg") for n in self.media) else [])
        module = {"format": "abbon-module", "formatVersion": 1, "id": self.id, "version": self.version,
                  **self.meta, "requires": {"app": ">=0.2.0", "features": features},
                  "categories": [c["id"] for c in self.categories], "quizzes": [q["id"] for q in self.quizzes],
                  "sheets": self.sheets}
        now = max((q["updatedAt"] for q in self.quizzes), default="2026-01-01T00:00:00.000Z")
        manifest = {"format": "abbon-qcm", "formatVersion": 1, "kind": "content",
                    "app": {"name": "abbon_module.py", "version": "1"}, "exportedAt": now, "solutions": True,
                    "quizzes": [{"id": q["id"], "file": f"quizzes/{q['id']}.json", "version": q["version"]}
                                for q in self.quizzes],
                    "media": sorted({n.split("/")[1].split(".")[0] for n in self.media})}
        path = path or f"Abbon-{self.id.split('.')[-1]}-{self.version}.qcm"
        dump = lambda o: json.dumps(o, ensure_ascii=False, indent=1)
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("manifest.json", dump(manifest))
            z.writestr("categories.json", dump(self.categories))
            z.writestr("module.json", dump(module))
            for q in self.quizzes:
                z.writestr(f"quizzes/{q['id']}.json", dump(q))
            for name, data in self.media.items():
                z.writestr(name, data)
        return path
```

## Exemple de script de construction

```python
from abbon_qcm import Qcm
from abbon_module import Module

m = Module("fr.college-exemple.svt-5e", "1.0.0", title="SVT 5e : les végétaux",
           description="Photosynthèse et graines : QCM d'entraînement et fiches de révision, niveau 5e.",
           license="CC-BY-4.0", authors=["Mme Martin"], level="5e")

m.category("vegetaux", "Les végétaux", sheet="""
## La photosynthèse

Les plantes vertes fabriquent leur matière à la **lumière**, dans les *chloroplastes* :

$$\\ce{6CO2 + 6H2O -> C6H12O6 + 6O2}$$

| Elle consomme | Elle produit |
| --- | --- |
| dioxyde de carbone, eau | glucose, dioxygène |
""")
m.category("graines", "Graines et germination", parent="vegetaux",
           sheet="## La graine\n\nElle contient un **embryon** et des **réserves**.")

m.add("photosynthese.qcm", category="vegetaux", key="photosynthese")   # fichier reçu

g = Qcm("Les graines")                                                   # QCM écrit en plus
g.vf("Une graine contient un embryon.", True, expl="Avec des réserves qui le nourrissent à la germination.")
g.single("De quoi une graine a-t-elle besoin pour germer ?", ok="D'eau, d'air et d'une température douce",
         ko=["De lumière seulement", "D'engrais", "De terre seulement"],
         expl="La lumière n'est pas nécessaire à la germination de la plupart des graines.")
m.add(g, category="graines", key="graines")

print(m.save())                                                          # Abbon-svt-5e-1.0.0.qcm
```

## Ma demande

- **Titre du module** :
- **Auteur(s)**, établissement ou nom pour l'identifiant :
- **Niveau / public** :
- **Version** : (1.0.0 pour une première version ; sinon, joindre le script de la version précédente)
- **Licence** : (CC-BY-4.0 par défaut)
- **Fichiers `.qcm` joints et catégorie de chacun** :
- **Fiches de révision** : (mes notes, ou « à rédiger d'après les QCM »)
- **QCM à écrire en plus** : (facultatif)
