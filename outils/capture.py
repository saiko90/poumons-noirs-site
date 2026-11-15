import sys
from playwright.sync_api import sync_playwright
url, sortie, largeur = sys.argv[1], sys.argv[2], int(sys.argv[3])
hauteur = 900 if largeur > 600 else 844
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": largeur, "height": hauteur}, device_scale_factor=1)
    erreurs = []
    pg.on("console", lambda m: erreurs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda ex: erreurs.append(str(ex)))
    pg.goto(url, wait_until="networkidle")
    pg.wait_for_timeout(400)
    for action in sys.argv[4:]:
        if action.startswith("click:"):
            pg.click(action[6:]); pg.wait_for_timeout(700)
        elif action.startswith("fill:"):
            sel, val = action[5:].split("|", 1); pg.fill(sel, val)
    pg.screenshot(path=sortie, full_page=True)
    print("erreurs console:", erreurs[:5])
    b.close()
