#!/usr/bin/env python3
"""
Audit d'accessibilité d'Abbon avec axe-core (règles WCAG 2.1 A et AA), dans WebKitGTK,
le moteur de l'application sous Linux.

Prérequis (Debian / Ubuntu) : python3-gi, gir1.2-webkit2-4.1, un affichage (xvfb-run).
L'interface est servie par `npm run preview` (données de démonstration, stockage en mémoire).

Usage :
    xvfb-run -a python3 scripts/a11y/audit.py --base http://127.0.0.1:4173 [--themes light,dark]

Code de sortie 1 s'il reste une violation (toutes gravités).
"""
import argparse
import json
import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import GLib, Gtk, WebKit2  # noqa: E402

ROUTES = [
    "/",
    "/quiz/demo-culture",
    "/attempt/demo-attempt-english",
    "/attempt/demo-attempt-network/result",
    "/attempt/demo-attempt-network/review",
    "/attempt/demo-attempt-typed/review",
    "/admin/quiz/demo-typed",
    "/admin/quiz/demo-typed/preview",
    "/admin",
    "/admin/categories",
    "/admin/quiz/demo-culture",
    "/admin/quiz/demo-culture/preview",
    "/admin/quiz/demo-english",
    "/admin/import",
    "/sheet/cat-lang",
    "/settings",
    "/about",
]
TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]


def wait_server(base: str, seconds: int = 60) -> bool:
    """Attend que le serveur de prévisualisation réponde (sinon on auditerait des pages d'erreur)."""
    import time
    import urllib.request

    for _ in range(seconds):
        try:
            with urllib.request.urlopen(base, timeout=2) as r:
                if r.status == 200:
                    return True
        except OSError:
            pass
        time.sleep(1)
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:4173")
    ap.add_argument("--axe", default="node_modules/axe-core/axe.min.js")
    ap.add_argument("--themes", default="light,dark")
    ap.add_argument("--routes", default=",".join(ROUTES))
    ap.add_argument("--width", type=int, default=1100)
    ap.add_argument("--json", help="rapport détaillé (JSON)")
    ap.add_argument("--wait", type=int, default=2500, help="attente après chargement (ms)")
    ap.add_argument("--shots", help="dossier où enregistrer une capture de chaque écran (PNG)")
    ap.add_argument("--height", type=int, default=900)
    args = ap.parse_args()

    axe = open(args.axe, encoding="utf-8").read()
    if not wait_server(args.base):
        print(f"Serveur injoignable : {args.base} (lancer « npx vite preview --port 4173 »)", file=sys.stderr)
        return 2
    jobs = [(t, r) for t in args.themes.split(",") for r in args.routes.split(",")]
    results: list[dict] = []

    win = Gtk.OffscreenWindow()
    win.set_default_size(args.width, args.height)
    view = WebKit2.WebView()
    view.get_settings().set_enable_developer_extras(False)
    win.add(view)
    win.show_all()

    state = {"i": -1}

    def js(script: str, done):
        def cb(v, res):
            try:
                done(v.evaluate_javascript_finish(res).to_string())
            except GLib.Error as e:  # erreur JS
                done(json.dumps({"error": e.message}))

        view.evaluate_javascript(script, -1, None, None, None, cb)

    def next_job():
        state["i"] += 1
        if state["i"] >= len(jobs):
            Gtk.main_quit()
            return
        theme, route = jobs[state["i"]]
        view.load_uri(args.base.rstrip("/") + route)

    def on_load(_v, event):
        if event == WebKit2.LoadEvent.FINISHED:
            GLib.timeout_add(args.wait, shoot if args.shots else run_axe)

    def shoot():
        theme, route = jobs[state["i"]]
        js(f"document.documentElement.dataset.theme={json.dumps(theme)};'ok'", lambda _r: GLib.timeout_add(200, snap))
        return False

    def snap():
        theme, route = jobs[state["i"]]

        def done(v, res):
            import os

            try:
                surface = v.get_snapshot_finish(res)
                os.makedirs(args.shots, exist_ok=True)
                name = (route.strip("/").replace("/", "_") or "accueil") + f"-{theme}.png"
                surface.write_to_png(os.path.join(args.shots, name))
            except Exception as e:  # capture impossible : on poursuit l'audit
                print(f"capture impossible pour {route} : {e}", file=sys.stderr)
            run_axe()

        view.get_snapshot(WebKit2.SnapshotRegion.FULL_DOCUMENT, WebKit2.SnapshotOptions.NONE, None, done)
        return False

    def run_axe():
        theme, route = jobs[state["i"]]
        script = (
            axe
            + f";document.documentElement.dataset.theme={json.dumps(theme)};"
            + "window.__axe=null;"
            + "setTimeout(()=>!document.getElementById('main')"
            + "?(window.__axe=JSON.stringify({error:'application non rendue'})):axe.run(document,{runOnly:{type:'tag',values:"
            + json.dumps(TAGS)
            + "}}).then(r=>{window.__axe=JSON.stringify(r.violations.map(v=>({id:v.id,impact:v.impact,"
            + "help:v.help,nodes:v.nodes.map(n=>({target:n.target.join(' '),summary:n.failureSummary}))})))})"
            + ".catch(e=>{window.__axe=JSON.stringify({error:String(e)})}),300);'ok'"
        )
        js(script, lambda _r: GLib.timeout_add(300, poll))
        return False

    def poll():
        def got(value: str):
            if value in ("null", "undefined", ""):
                GLib.timeout_add(300, poll)
                return
            theme, route = jobs[state["i"]]
            data = json.loads(value)
            results.append({"theme": theme, "route": route, "violations": data})
            next_job()

        js("window.__axe", got)
        return False

    view.connect("load-changed", on_load)
    GLib.idle_add(lambda: (next_job(), False)[1])
    Gtk.main()

    total = 0
    for r in results:
        v = r["violations"]
        if isinstance(v, dict):
            print(f"[{r['theme']:5}] {r['route']}: ERREUR {v.get('error')}")
            total += 1
            continue
        mark = "OK " if not v else "KO "
        print(f"{mark}[{r['theme']:5}] {r['route']}" + ("" if not v else f" — {len(v)} règle(s)"))
        for x in v:
            total += 1
            print(f"     · {x['impact']:8} {x['id']}: {x['help']} ({len(x['nodes'])} élément(s))")
            for n in x["nodes"][:3]:
                print(f"         {n['target']}")
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n{len(results)} écran(s) audité(s), {total} problème(s).")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
