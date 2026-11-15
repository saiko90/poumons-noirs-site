# Site d'Opération Poumons Noirs

Site vitrine de l'appli Android Opération Poumons Noirs (EN : Operation Black Lungs), en français et en anglais.
En ligne : https://poumons-noirs.vercel.app

## Ce qu'il y a dedans

- `site/` : le site statique servi par Vercel (dossier racine du projet Vercel).
  - `index.html` (FR), `en.html` (EN) : page d'accueil.
  - `ordre.html`, `order.html` : la page que reçoit un pote quand on lui « envoie le Sergent ».
  - `privacy.html`, `suppression.html` : politique de confidentialité et suppression des données. Leurs adresses (`/privacy`, `/suppression`) sont déclarées dans la Play Console : ne pas les renommer.
  - `site.js` : voix du Sergent, liste d'attente (Supabase, fonction `pn_recrue`), calculateur, envoi du Sergent.
  - `jeu.js` : Écrase-Clopes en version web, portage du moteur de l'appli (`Jeu.kt`, `EcranJeu.kt`).
  - `presse/` : dossier presse en ZIP.
- `build.py` : génère les pages HTML FR/EN à partir des textes qu'il contient. Après une modif : `python3 build.py`.
- `voix/` : textes des répliques du Sergent générées pour le site (ElevenLabs).
- `tests/test_moteur.js` : teste le moteur du jeu (`node tests/test_moteur.js site/jeu.js`).
- `tests/jouer.py`, `outils/capture.py` : captures d'écran et partie automatique avec Playwright.

## Mettre à jour

1. Modifier les textes dans `build.py` (ou `site/style.css`, `site/site.js`, `site/jeu.js`).
2. `python3 build.py`
3. Commit et push sur `main` : Vercel redéploie.
