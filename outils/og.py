#!/usr/bin/env python3
"""Images de partage (1200 x 630) : accueil et « ordre de mission », en FR et EN.
Usage : servir site/ sur http://localhost:8765 puis lancer python3 outils/og.py"""
import os
from playwright.sync_api import sync_playwright

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, "..", "site", "img")
H = "http://localhost:8765"

GABARIT = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: S; src: url({H}/fonts/stardos-stencil-latin-700-normal.woff2); font-weight: 700; }}
@font-face {{ font-family: C; src: url({H}/fonts/courier-prime-latin-400-normal.woff2); font-weight: 400; }}
@font-face {{ font-family: C; src: url({H}/fonts/courier-prime-latin-700-normal.woff2); font-weight: 700; }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ width: 1200px; height: 630px; overflow: hidden; background: #070707; color: #e6e1d3; position: relative; font-family: C; }}
.photo {{ position: absolute; right: -40px; top: 0; height: 630px;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 32%), linear-gradient(to top, transparent, #000 18%); -webkit-mask-composite: source-in; }}
.texte {{ position: absolute; left: 60px; top: 58px; width: 540px; }}
.etiquette {{ font-weight: 700; font-size: 24px; color: #9aa36a; margin-bottom: 18px; }}
h1 {{ font: 700 {taille}px/.9 S; text-transform: uppercase; text-shadow: 0 4px 24px rgba(0,0,0,.7); }}
.sous {{ margin-top: 24px; font-size: 24px; line-height: 1.35; color: #d9d3c3; max-width: 480px; }}
.statut {{ display: inline-block; margin-top: 26px; padding: 8px 14px; border: 2px dashed #9aa36a; color: #9aa36a; font-size: 22px; font-weight: 700; background: rgba(7,7,7,.6); }}
.tampon {{ display: inline-block; margin-bottom: 26px; padding: 8px 16px; border: 5px solid #c1121f; color: #c1121f; font: 700 30px/1 S; text-transform: uppercase; letter-spacing: .05em; transform: rotate(-5deg); background: rgba(7,7,7,.4); }}
.marque {{ position: absolute; left: 60px; bottom: 44px; display: flex; align-items: center; gap: 14px; font: 700 26px/1 S; text-transform: uppercase; }}
.marque img {{ width: 48px; height: 48px; border-radius: 11px; }}
</style></head><body>
<img class="photo" src="{H}/img/sergent/accueil-2330-v2.webp">
<div class="texte">{contenu}</div>
<div class="marque"><img src="{H}/img/icone-192-v2.png"><span>{marque}</span></div>
</body></html>"""

PAGES = {
    "og-fr-v2": dict(taille=80, marque="Poumons Noirs", contenu="""<p class="etiquette">Opération Poumons Noirs</p><h1>Arrête de fumer. C'est un ordre.</h1><p class="statut">Bientôt sur Google Play</p>"""),
    "og-en-v2": dict(taille=80, marque="Black Lungs", contenu="""<p class="etiquette">Operation Black Lungs</p><h1>Quit smoking. That's an order.</h1><p class="statut">Coming soon on Google Play</p>"""),
    "og-ordre-fr-v2": dict(taille=66, marque="Poumons Noirs", contenu="""<p class="tampon">Ordre de mission</p><h1>Le Sergent a un ordre pour toi.</h1><p class="sous">Quelqu'un qui tient à toi l'a envoyé. Monte le son.</p>"""),
    "og-ordre-en-v2": dict(taille=66, marque="Black Lungs", contenu="""<p class="tampon">Mission order</p><h1>The Sergeant has orders for you.</h1><p class="sous">Someone who cares about you sent him. Turn the sound up.</p>"""),
}

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto(H + "/robots.txt")  # même origine que les polices, sinon elles sont bloquées
    for nom, v in PAGES.items():
        pg.set_content(GABARIT.format(H=H, **v), wait_until="networkidle")
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(300)
        chemin = os.path.join(SORTIE, nom + ".jpg")
        pg.screenshot(path=chemin, type="jpeg", quality=86)
        print(nom, round(os.path.getsize(chemin) / 1024), "Ko")
    b.close()
