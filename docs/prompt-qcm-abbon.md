# Prompt : QCM Abbon express

*À copier en entier au début d'une nouvelle conversation, puis remplir la partie « Ma demande » en bas.*

---

Tu prépares un QCM pour **Abbon**, une application libre de QCM hors ligne. Je l'importerai dans Abbon
(*Administration › Importer*), puis je le ferai passer tel quel, ou j'en exporterai un site d'entraînement ou
d'examen. C'est un QCM ponctuel : fin de cours, interrogation rapide, test de connaissances en début de séquence,
révision. Pas besoin du dépôt d'Abbon : le script ci-dessous suffit.

## Ce que tu produis

1. **Le fichier `.qcm`** : écris le script `abbon_qcm.py` ci-dessous tel quel, puis un court script qui l'importe,
   décrit les questions et appelle `save()`. Exécute-le et donne-moi le fichier.
2. **Un corrigé lisible** dans ta réponse : un tableau court (n°, type, question abrégée, bonne réponse).
3. Si tu ne peux pas exécuter de code : donne le QCM au **format GIFT** (texte de Moodle, qu'Abbon importe
   aussi : je l'enregistre en `.gift`). GIFT ne connaît que choix unique, choix multiples, vrai/faux, réponse
   courte et réponse numérique : n'emploie alors que ces types.

## Règles pour les questions

- **Contenu** : appuie-toi sur mes informations ci-dessous ; complète avec des connaissances sûres et classiques
  du sujet, jamais des détails douteux. Si une de mes informations te semble fausse ou discutable, ne l'utilise
  pas comme bonne réponse et signale-le moi dans ta réponse.
- **Nombre** : 10 questions si je ne précise pas (5 pour un sondage éclair, 15 au plus pour un contrôle).
- **Langue** : celle de ma demande (`lang="fr"` ou `"en"`).
- **Une question = une idée**, énoncé court et sans ambiguïté, au niveau indiqué.
- **Distracteurs** plausibles, de même longueur et même forme que la bonne réponse ; pas de « toutes les réponses
  précédentes », pas de piège sur une virgule. 3 ou 4 propositions pour un choix unique, 5 au plus pour un choix
  multiple. La bonne réponse ne doit pas toujours être la plus longue ni à la même place (l'ordre est mélangé à
  l'affichage).
- **Explication** (`expl`) pour chaque question : une ou deux phrases qui disent *pourquoi*, affichées après
  la réponse. C'est là qu'on apprend : soigne-la.
- **Types** : varie selon ce qui se vérifie le mieux.
  - `single` (choix unique), `multiple` (choix multiples), `vf` (vrai ou faux) ;
  - `short` (mot à saisir : donne toutes les formes acceptables, avec et sans article si besoin) ;
  - `numeric` (nombre, avec une tolérance raisonnable et l'unité) ;
  - `cloze` (texte à trous : `[[réponse|variante]]` à saisir, `[[bonne~mauvaise~mauvaise]]` liste déroulante) ;
  - `expression` (formule de maths à écrire, comparée mathématiquement : `x^2+2x` = `x(x+2)`) ;
  - `flashcard` (carte recto-verso, pour réviser plutôt que noter).
- **Formules** : `$...$` dans le texte, `$$...$$` seul dans un paragraphe pour une formule en bloc (LaTeX) ;
  chimie avec mhchem : `$\ce{2H2 + O2 -> 2H2O}$`. Dans un texte à trous, pas de formule ni de mise en forme.
- **Mise en forme** : `**gras**`, `*italique*`, ligne vide entre deux paragraphes. Pas d'image.

## Réglages selon l'usage

| Usage | Réglages de `Qcm(...)` |
|---|---|
| Fin de cours, révision | `solutions="after_submit"` (corrigé après envoi), `partial=True` |
| Interrogation notée, contrôle | `solutions="never"`, `time_limit_min=15`, `threshold=0.5` |
| Test de connaissances en début de séquence | `solutions="after_submit"`, 5 à 8 questions, `partial=True` |
| Entraînement jusqu'à réussite | `solutions="after_pass"`, `threshold=0.8` |

Abbon corrige et note toujours les réponses : pour un **sondage d'opinion** (sans bonne réponse), Abbon n'est pas l'outil adapté ;
pour un sondage de *connaissances*, prends la ligne « début de séquence ».

## Le script `abbon_qcm.py` (à recopier sans modification)

```python
"""abbon_qcm.py — fabrique un fichier .qcm importable dans Abbon (Administration › Importer), sans dépendance.

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

## Exemple d'utilisation

```python
from abbon_qcm import Qcm

q = Qcm("Fin de cours : la photosynthèse", lang="fr", level="5e",
        description="Cinq minutes en fin de séance", tags=["SVT", "fin de cours"])
q.single("Où a lieu la photosynthèse dans une cellule végétale ?",
         ok="Dans les chloroplastes", ko=["Dans les mitochondries", "Dans le noyau", "Dans la vacuole"],
         expl="Les chloroplastes contiennent la chlorophylle, qui capte la lumière.")
q.multiple("Que consomme la photosynthèse ?", ok=["Du dioxyde de carbone", "De l'eau"],
           ko=["Du dioxygène", "Du glucose"], expl="Elle produit du glucose et rejette du dioxygène.")
q.vf("Une plante ne respire que la nuit.", False, expl="Elle respire jour et nuit ; le jour, la photosynthèse domine.")
q.short("Quel pigment vert capte la lumière ?", ["chlorophylle", "la chlorophylle"])
q.numeric("Combien de molécules de $\\ce{CO2}$ pour une molécule de glucose ?", 6, 0,
          expl="$$\\ce{6CO2 + 6H2O -> C6H12O6 + 6O2}$$")
q.cloze("Complétez.", "La photosynthèse a lieu dans les [[feuilles|feuille]], à la [[lumière~nuit~chaleur]].")
q.save("photosynthese.qcm")
```

## Ma demande

- **Sujet** :
- **Niveau / public** :
- **Usage** : (fin de cours, contrôle, test de début de séquence, révision…)
- **Nombre de questions** :
- **Types souhaités** : (sinon : au choix)
- **Mes informations** (quelques lignes, notes de cours, points à vérifier) :

