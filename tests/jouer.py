import sys, random
from playwright.sync_api import sync_playwright
url, sortie, largeur = sys.argv[1], sys.argv[2], int(sys.argv[3])
with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    pg = b.new_page(viewport={"width": largeur, "height": 900 if largeur > 600 else 844}, device_scale_factor=2 if largeur < 600 else 1, has_touch=largeur < 600)
    erreurs, echecs = [], []
    pg.on("console", lambda m: erreurs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda ex: erreurs.append(str(ex)))
    pg.on("requestfailed", lambda r: echecs.append(r.url))
    pg.on("response", lambda r: echecs.append(f"{r.status} {r.url}") if r.status >= 400 else None)
    pg.goto(url, wait_until="networkidle")
    jeu = pg.locator("#ecrase-clopes")
    jeu.scroll_into_view_if_needed()
    pg.wait_for_timeout(300)
    jeu.screenshot(path=sortie + "_0_depart.png")
    pg.click(".jeu-lancer")
    pg.wait_for_timeout(2200)
    box = pg.locator(".jeu-plateau canvas").bounding_box()
    cs = box["width"] / 8
    random.seed(4)
    for i in range(40):
        l, c = random.randrange(8), random.randrange(8)
        x0, y0 = box["x"] + (c + .5) * cs, box["y"] + (l + .5) * cs
        dx, dy = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])
        pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 + dx * cs * .6, y0 + dy * cs * .6, steps=4); pg.mouse.up()
        pg.wait_for_timeout(350)
        if i == 20:
            jeu.screenshot(path=sortie + "_1_partie.png")
    pg.wait_for_timeout(150)
    jeu.screenshot(path=sortie + "_2_action.png")
    score = pg.locator(".jeu-score output").inner_text()
    pg.click(".jeu-arreter")
    pg.wait_for_timeout(400)
    jeu.screenshot(path=sortie + "_3_fin.png")
    print("score:", score, "| fin:", pg.locator(".jeu-fin-titre").inner_text(), "/", pg.locator(".jeu-fin-grade").inner_text())
    print("erreurs console:", erreurs[:5]); print("requêtes en échec:", echecs[:8])
    b.close()
