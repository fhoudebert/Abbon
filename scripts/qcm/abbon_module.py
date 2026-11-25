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
