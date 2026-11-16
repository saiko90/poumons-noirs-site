#!/usr/bin/env python3
"""Construit le site Opération Poumons Noirs (FR + EN) dans site/."""
import html, json, os, re

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, "site")
BASE = os.environ.get("PN_BASE", "https://www.poumonsnoirs.com")
MOTIFS = ["lundi", "cachette", "vape", "craque", "pause", "prix", "bravo"]

e = html.escape


def typo_fr(s):
    """Espaces insécables de la typographie française."""
    s = re.sub(r" ([?!:;»])", " \\1", s)
    s = s.replace("« ", "« ")
    return s


TXT = {
    "fr": {
        "chemin": "/", "autre": "en", "autreChemin": "/en", "autreLangue": "English", "locale": "fr_FR",
        "recuChemin": "/ordre",
        "title": "Opération Poumons Noirs : arrête de fumer avec un sergent instructeur",
        "desc": "Un sergent instructeur dans ta poche pour arrêter de fumer ou de vapoter : 365 ordres vocaux, un SOS contre les envies, un mini-jeu et zéro pitié. Bientôt sur Android.",
        "marque": "Poumons Noirs", "navLabel": "Navigation", "navProgramme": "Le programme", "navCalcul": "Combien t'as cramé", "navMission": "Envoie le Sergent", "navJeu": "Écrase-Clopes", "navMedias": "Médias",
        "h1": "Arrête de fumer. C'est un ordre.",
        "chapeau": "Opération Poumons Noirs, c'est l'appli où un sergent instructeur te sort de la clope. Un ordre vocal par jour pendant un an, un SOS quand l'envie monte, et pas une once de pitié.",
        "statut": "En test sur Android. Sortie sur Google Play très bientôt.",
        "ordreTitre": "Ordre de mobilisation", "ordreRef": "Réf. PN-365",
        "destLabel": "Destinataire", "dest": "Toi.", "objetLabel": "Objet", "objet": "Ta dernière cigarette.", "dureeLabel": "Durée", "duree": "365 jours. Pas un de moins.",
        "ordreTexte": "Chaque matin, le Sergent te donne ton ordre du jour. Chaque envie, tu l'écrases. Tu ne discutes pas.",
        "ecouterOrdre": "Écouter l'ordre", "ecouterAide": "Monte le son. Il ne parle pas, il aboie.",
        "ordreLigne": "Destinataire : toi. Objet : ta dernière cigarette. Durée : 365 jours, pas un de moins.",
        "barreCta": "Signer l'ordre", "barreCtaCourt": "Signer", "langueCourt": "EN",
        "altSergent": "Le Sergent Noclope te pointe du doigt en hurlant.", "altEcrase": "Le Sergent écrase une cigarette dans son poing.",
        "signatureLabel": "Signature de la recrue (ton e-mail)", "emailPlaceholder": "ton@email.ch", "signer": "Signer l'ordre",
        "signatureMini": "Tu reçois un seul e-mail, le jour de la sortie. Ton adresse est effacée au bout de 6 mois.",
        "progTitre": "Le programme", "progChapeau": "Douze mois de discipline, dans ta poche.",
        "prog": [
            ("365 ordres vocaux", "Chaque jour, un nouvel ordre, avec la vraie voix du Sergent. Il te parle de ta journée, pas d'une brochure."),
            ("SOS envie", "L'envie monte ? Un bouton. Trois minutes avec le Sergent ou sur Écrase-Clopes, et l'envie est morte."),
            ("Alertes à tes pires moments", "Le café, la pause, l'après-repas : il te tombe dessus juste avant."),
            ("Ton argent, ton objectif", "Tu choisis ce que tu t'offres avec l'argent sauvé. Il compte chaque franc avec toi."),
            ("Le binôme", "Fais équipe avec un pote. Chacun voit si l'autre a tenu sa journée."),
            ("Clope ou vape", "Tu vapotes ? Même combat, même sergent."),
        ],
        "progAvert": "Langage cru, réservé aux adultes. Si tu veux des câlins, passe ton chemin.",
        "capturesLabel": "Captures d'écran de l'appli",
        "captures": ["Un sergent dans ta poche : l'ordre du jour", "Le compteur : argent, série, objectif", "SOS envie : trois minutes pour tuer l'envie", "Les trophées, de recrue à légende", "Le rapport de guerre", "Les alertes et le binôme", "Mode clope ou vape"],
        "calcTitre": "Combien t'as cramé ?", "calcChapeau": "Rentre tes chiffres. Le Sergent fait le compte, et il te dit ce qu'il en pense.",
        "calcFeuille": "Rapport des pertes", "calcRef": "Formulaire PN-02",
        "parJour": "Clopes par jour", "prixPaquet": "Prix du paquet", "devise": "Devise", "parPaquet": "Clopes par paquet", "annees": "Années de clope",
        "devises": [("CHF", "CHF"), ("€", "€")], "prixDefaut": "9.50",
        "calculer": "Calculer les dégâts", "calcVide": "Remplis le rapport. Le Sergent attend.",
        "tuAsCrame": "Tu as cramé", "parAn": "Par an :", "parMois": "Par mois :", "clopesFumees": "Clopes fumées :", "boutABout": "Mises bout à bout :",
        "reecouter": "Rejouer", "reactionTexte": "Le Sergent a vu tes chiffres.",
        "missionTitre": "Envoie le Sergent à un pote",
        "missionChapeau": "Un pote qui arrête « lundi » depuis trois ans ? Choisis le motif, envoie-lui le lien. Il clique, et le Sergent s'occupe de lui.",
        "missionExemple": "« Paraît que t'arrêtes lundi ? Quel lundi, soldat ? On commence aujourd'hui. »",
        "missionFeuille": "Ordre de mission", "missionRef": "Réf. PN-07",
        "prenomLabel": "Prénom de ton pote (facultatif)", "prenomPlaceholder": "Kevin",
        "motifLegend": "Motif de l'intervention",
        "motifs": {
            "lundi": "Arrête « lundi » depuis des années", "cachette": "Fume en cachette", "vape": "Vapote toute la journée",
            "craque": "Vient de craquer", "pause": "Vit en pause clope", "prix": "Se plaint du prix des clopes", "bravo": "A arrêté : à féliciter",
        },
        "ecouterMessage": "Écouter le message", "preparerLien": "Préparer le lien", "lienPret": "Le lien de ton pote",
        "envoyerWa": "Envoyer sur WhatsApp", "copierLien": "Copier le lien", "partager": "Partager",
        "jeuTitre": "Écrase-Clopes", "jeuSansJs": "Le jeu a besoin de JavaScript pour tourner.", "jeuChapeau": "Le mini-jeu du SOS envie. Aligne trois clopes pour les écraser, enchaîne les combos, tiens trois minutes. Joue ici, puis bats ton score dans l'appli.",
        "mediasTitre": "Médias", "mediasChapeau": "Vidéos, captures et dossier presse. Journalistes : contact@swissdigitalstudio.ch",
        "video1": "Lève-toi", "video2": "Ton sergent de poche", "videosSergent": ["Toi, oui, toi", "Debout, soldat"],
        "presseTexte": "Le dossier presse contient l'icône, les bannières, les captures en français et en anglais, les visuels du Sergent (avec détourages), des textes de présentation et des extraits de sa voix.",
        "presseBouton": "Télécharger le dossier presse (ZIP, 10 Mo)",
        "faqTitre": "Questions des recrues",
        "faq": [
            ("C'est quoi, Opération Poumons Noirs ?", "Une appli Android pour arrêter de fumer ou de vapoter. Un sergent instructeur te donne un ordre vocal par jour pendant 365 jours, t'aide à tenir face aux envies et suit tes progrès : jours tenus, argent économisé, trophées."),
            ("Pourquoi un sergent qui t'insulte ?", "Parce que certains en ont marre des applis qui les félicitent pour rien. Le Sergent est dur, drôle et cru. Il est réservé aux adultes."),
            ("Combien ça coûte ?", "7 jours d'essai gratuits. Ensuite, le programme complet en paiement unique (49.90 CHF ou 49,99 €), ou un abonnement à 9.90 CHF par mois ou 19.90 CHF par trimestre (9,99 € et 19,99 € en euros), résiliable à tout moment dans Google Play."),
            ("Ça marche pour la vape ?", "Oui. Le mode vape adapte le programme, les calculs et les ordres à la vapoteuse."),
            ("Et sur iPhone ?", "Pour l'instant, l'appli sort uniquement sur Android."),
            ("Mes données sont-elles en sécurité ?", "Tout reste sur ton téléphone. Seul le mode binôme, si tu l'actives, envoie quelques infos pour les montrer à ton binôme. Pas de pub, pas de pisteurs."),
            ("C'est un traitement médical ?", "Non. Opération Poumons Noirs n'est pas un dispositif médical et ne remplace pas un avis médical. Pour un accompagnement, parles-en à ton médecin ou à ton pharmacien."),
            ("Quand sort l'appli ?", "Elle est en test fermé sur Google Play. Signe ton ordre en haut de la page : tu reçois un e-mail le jour de la sortie."),
        ],
        "faqLien": "Les détails sont dans la politique de confidentialité.",
        "pied": "Opération Poumons Noirs est une appli de Swiss Digital Studio, Krystel Fiorbianco, Valais, Suisse.",
        "confidentialite": "Confidentialité", "suppression": "Supprimer mes données",
        # Page « un ordre t'attend »
        "recuTitle": "Le Sergent a un ordre de mission pour toi", "recuDesc": "Quelqu'un qui tient à toi t'envoie le Sergent. Ouvre et écoute.",
        "recuTitre": "Ordre de mission", "recuRef": "Réf. PN-07", "recuPour": "À l'attention de",
        "recuIntro": "Quelqu'un qui tient à toi a envoyé le Sergent. Écoute ton ordre jusqu'au bout.",
        "recuMotifLabel": "Motif", "recuAide": "Monte le son, soldat.",
        "recuSuiteTitre": "Et maintenant ?", "recuSuiteTexte": "Signe ton ordre de mobilisation : tu reçois un e-mail le jour où l'appli sort.",
        "recuRenvoyer": "Envoyer le Sergent à quelqu'un d'autre", "recuDecouvrir": "Découvrir l'appli",
        "js": {
            "erreurEmail": "Cette adresse ne passe pas. Vérifie ton e-mail.", "erreurReseau": "Pas de réseau. Réessaie dans un instant.",
            "recrueOk": "Recrue enregistrée. Le jour J, le Sergent vient te chercher.", "empreinteSigne": "Mobilisé", "empreinteRecu": "Ordre reçu",
            "copie": "Lien copié.", "copieManuelle": "Copie le lien ci-dessus à la main.",
            "waNom": "{n}, le Sergent a un ordre de mission pour toi :", "waSans": "Le Sergent a un ordre de mission pour toi :",
            "partageTitre": "Un ordre du Sergent", "soldat": "Soldat",
        },
    },
    "en": {
        "chemin": "/en", "autre": "fr", "autreChemin": "/", "autreLangue": "Français", "locale": "en_US",
        "recuChemin": "/order",
        "title": "Operation Black Lungs: quit smoking with a drill sergeant",
        "desc": "A drill sergeant in your pocket to quit smoking or vaping: 365 voiced orders, a craving SOS, a mini-game and zero mercy. Coming soon on Android.",
        "marque": "Black Lungs", "navLabel": "Navigation", "navProgramme": "The program", "navCalcul": "Money burned", "navMission": "Send the Sergeant", "navJeu": "Cig Crush", "navMedias": "Media",
        "h1": "Quit smoking. That's an order.",
        "chapeau": "Operation Black Lungs is the app where a drill sergeant gets you off cigarettes. One voiced order a day for a year, an SOS when cravings hit, and not an ounce of mercy.",
        "statut": "In testing on Android. Coming to Google Play very soon.",
        "ordreTitre": "Mobilization order", "ordreRef": "Ref. BL-365",
        "destLabel": "To", "dest": "You.", "objetLabel": "Subject", "objet": "Your last cigarette.", "dureeLabel": "Duration", "duree": "365 days. Not one less.",
        "ordreTexte": "Every morning, the Sergeant gives you your order of the day. Every craving, you crush it. No discussion.",
        "ecouterOrdre": "Hear the order", "ecouterAide": "Turn the sound up. He doesn't talk, he barks.",
        "ordreLigne": "To: you. Subject: your last cigarette. Duration: 365 days, not one less.",
        "barreCta": "Sign up", "barreCtaCourt": "Sign up", "langueCourt": "FR",
        "altSergent": "Sergeant Noclope points at you, yelling.", "altEcrase": "The Sergeant crushes a cigarette in his fist.",
        "signatureLabel": "Recruit's signature (your email)", "emailPlaceholder": "you@email.com", "signer": "Sign the order",
        "signatureMini": "You get one single email, on launch day. Your address is deleted after 6 months.",
        "progTitre": "The program", "progChapeau": "Twelve months of discipline, in your pocket.",
        "prog": [
            ("365 voiced orders", "A new order every day, in the Sergeant's real voice. He talks about your day, not a leaflet."),
            ("Craving SOS", "Craving coming? One button. Three minutes with the Sergeant or on Cig Crush, and the craving is dead."),
            ("Alerts at your worst moments", "Coffee, breaks, after meals: he jumps on you right before."),
            ("Your money, your goal", "Pick what you'll buy with the money you save. He counts every cent with you."),
            ("Buddy mode", "Team up with a friend. Each of you sees whether the other held the line today."),
            ("Smoke or vape", "You vape? Same fight, same sergeant."),
        ],
        "progAvert": "Crude language, adults only. If you want hugs, keep walking.",
        "capturesLabel": "App screenshots",
        "captures": ["A sergeant in your pocket: the order of the day", "The counter: money, streak, goal", "Craving SOS: three minutes to kill the craving", "Trophies, from recruit to legend", "The war report", "Alerts and buddy mode", "Smoke or vape mode"],
        "calcTitre": "How much have you burned?", "calcChapeau": "Enter your numbers. The Sergeant does the math, and tells you what he thinks.",
        "calcFeuille": "Damage report", "calcRef": "Form BL-02",
        "parJour": "Cigarettes per day", "prixPaquet": "Pack price", "devise": "Currency", "parPaquet": "Cigarettes per pack", "annees": "Years smoking",
        "devises": [("$", "$"), ("€", "€"), ("£", "£"), ("CHF", "CHF")], "prixDefaut": "9.00",
        "calculer": "Count the damage", "calcVide": "Fill in the report. The Sergeant is waiting.",
        "tuAsCrame": "You've burned", "parAn": "Per year:", "parMois": "Per month:", "clopesFumees": "Cigarettes smoked:", "boutABout": "End to end:",
        "reecouter": "Replay", "reactionTexte": "The Sergeant has seen your numbers.",
        "missionTitre": "Send the Sergeant to a friend",
        "missionChapeau": "A friend who's been quitting “on Monday” for three years? Pick the reason, send them the link. They click, and the Sergeant takes care of them.",
        "missionExemple": "“I hear you're quitting on Monday? Which Monday, soldier? We start today.”",
        "missionFeuille": "Mission order", "missionRef": "Ref. BL-07",
        "prenomLabel": "Your friend's first name (optional)", "prenomPlaceholder": "Alex",
        "motifLegend": "Reason for intervention",
        "motifs": {
            "lundi": "Has been quitting “on Monday” for years", "cachette": "Smokes in secret", "vape": "Vapes all day long",
            "craque": "Just slipped", "pause": "Lives on smoke breaks", "prix": "Complains about cigarette prices", "bravo": "Quit: to be congratulated",
        },
        "ecouterMessage": "Hear the message", "preparerLien": "Get the link", "lienPret": "Your friend's link",
        "envoyerWa": "Send on WhatsApp", "copierLien": "Copy the link", "partager": "Share",
        "jeuTitre": "Cig Crush", "jeuSansJs": "The game needs JavaScript to run.", "jeuChapeau": "The craving SOS mini-game. Line up three cigarettes to crush them, chain combos, hold out for three minutes. Play here, then beat your score in the app.",
        "mediasTitre": "Media", "mediasChapeau": "Videos, screenshots and press kit. Journalists: contact@swissdigitalstudio.ch",
        "video1": "Get up (in French)", "video2": "Your pocket sergeant (in French)", "videosSergent": ["You, yes, you (in French)", "Up, soldier (in French)"],
        "presseTexte": "The press kit contains the icon, banners, screenshots in English and French, the Sergeant's artwork (with cut-outs), descriptions and clips of his voice.",
        "presseBouton": "Download the press kit (ZIP, 10 MB)",
        "faqTitre": "Recruits' questions",
        "faq": [
            ("What is Operation Black Lungs?", "An Android app to quit smoking or vaping. A drill sergeant gives you one voiced order a day for 365 days, helps you hold out against cravings and tracks your progress: days held, money saved, trophies."),
            ("Why a sergeant who insults you?", "Because some people are fed up with apps that congratulate them for nothing. The Sergeant is tough, funny and crude. Adults only."),
            ("How much does it cost?", "A 7-day free trial. Then the full program as a one-time purchase, or a monthly or quarterly subscription you can cancel anytime in Google Play. Prices are shown in your currency in the app."),
            ("Does it work for vaping?", "Yes. Vape mode adapts the program, the numbers and the orders to vaping."),
            ("What about iPhone?", "For now, the app is launching on Android only."),
            ("Is my data safe?", "Everything stays on your phone. Only buddy mode, if you turn it on, sends a few details to show them to your buddy. No ads, no trackers."),
            ("Is it a medical treatment?", "No. Operation Black Lungs is not a medical device and is not a substitute for medical advice. For support, talk to your doctor or pharmacist."),
            ("When does the app launch?", "It's in closed testing on Google Play. Sign your order at the top of the page: you'll get an email on launch day."),
        ],
        "faqLien": "Details are in the privacy policy.",
        "pied": "Operation Black Lungs is an app by Swiss Digital Studio, Krystel Fiorbianco, Valais, Switzerland.",
        "confidentialite": "Privacy", "suppression": "Delete my data",
        "recuTitle": "The Sergeant has orders for you", "recuDesc": "Someone who cares about you sent the Sergeant. Open and listen.",
        "recuTitre": "Mission order", "recuRef": "Ref. BL-07", "recuPour": "For the attention of",
        "recuIntro": "Someone who cares about you sent the Sergeant. Listen to your order until the end.",
        "recuMotifLabel": "Reason", "recuAide": "Turn the sound up, soldier.",
        "recuSuiteTitre": "Now what?", "recuSuiteTexte": "Sign your mobilization order: you'll get an email the day the app launches.",
        "recuRenvoyer": "Send the Sergeant to someone else", "recuDecouvrir": "Discover the app",
        "js": {
            "erreurEmail": "That address doesn't work. Check your email.", "erreurReseau": "No connection. Try again in a moment.",
            "recrueOk": "Recruit registered. On D-Day, the Sergeant is coming for you.", "empreinteSigne": "Enlisted", "empreinteRecu": "Order received",
            "copie": "Link copied.", "copieManuelle": "Copy the link above by hand.",
            "waNom": "{n}, the Sergeant has orders for you:", "waSans": "The Sergeant has orders for you:",
            "partageTitre": "Orders from the Sergeant", "soldat": "Soldier",
        },
    },
}


def appliquer_typo(d):
    if isinstance(d, str):
        return typo_fr(d)
    if isinstance(d, list):
        return [appliquer_typo(x) for x in d]
    if isinstance(d, tuple):
        return tuple(appliquer_typo(x) for x in d)
    if isinstance(d, dict):
        return {k: (v if k in ("chemin", "autre", "autreChemin", "locale", "recuChemin", "prixDefaut", "emailPlaceholder") else appliquer_typo(v)) for k, v in d.items()}
    return d


TXT["fr"] = appliquer_typo(TXT["fr"])


def tete(d, l, titre, desc, chemin, noindex=False, extra="", og=None):
    og = og or f"og-{l}-v2"
    autres = f'<link rel="alternate" hreflang="fr" href="{BASE}/"><link rel="alternate" hreflang="en" href="{BASE}/en"><link rel="alternate" hreflang="x-default" href="{BASE}/">' if not noindex else ""
    robots = '<meta name="robots" content="noindex">' if noindex else ""
    return f"""<!doctype html>
<html lang="{l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titre)}</title>
<meta name="description" content="{e(desc)}">
{robots}
<link rel="canonical" href="{BASE}{chemin}">
{autres}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{e('Opération Poumons Noirs' if l == 'fr' else 'Operation Black Lungs')}">
<meta property="og:title" content="{e(titre)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{BASE}/img/{og}.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="{BASE}{chemin}">
<meta property="og:locale" content="{d['locale']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#070707">
<link rel="icon" href="/favicon-v2.png" type="image/png" sizes="96x96">
<link rel="apple-touch-icon" href="/apple-touch-icon-v2.png">
<link rel="preload" href="/fonts/stardos-stencil-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/courier-prime-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v=2">
{extra}
</head>"""


def barre(d, l, avec_sections=True):
    sections = ""
    if avec_sections:
        sections = f"""<div class="liens-sections"><a href="#programme">{e(d['navProgramme'])}</a><a href="#pertes-section">{e(d['navCalcul'])}</a><a href="#mission-section">{e(d['navMission'])}</a><a href="#medias">{e(d['navMedias'])}</a></div>"""
    return f"""<header class="barre"><div class="cadre">
<a class="marque" href="{d['chemin']}"><img src="/img/icone-192-v2.png" alt="" width="38" height="38"><span>{e(d['marque'])}</span></a>
<nav aria-label="{e(d['navLabel'])}">{sections}<a class="langue" href="{d['autreChemin']}" lang="{d['autre']}" hreflang="{d['autre']}" aria-label="{e(d['autreLangue'])}"><span class="langue-long" aria-hidden="true">{e(d['autreLangue'])}</span><span class="langue-court" aria-hidden="true">{d['langueCourt']}</span></a><a class="bouton bouton-barre" href="{'' if avec_sections else d['chemin']}#signer" aria-label="{e(d['barreCta'])}"><span class="cta-long" aria-hidden="true">{e(d['barreCta'])}</span><span class="cta-court" aria-hidden="true">{e(d['barreCtaCourt'])}</span></a></nav>
</div></header>"""


def form_signature(d, source):
    return f"""<form class="signature" data-recrue="{source}" novalidate>
<div class="signature-ligne">
<label class="champ"><span class="champ-label">{e(d['signatureLabel'])}</span><input type="email" name="email" autocomplete="email" placeholder="{e(d['emailPlaceholder'])}" required></label>
<button class="bouton" type="submit">{e(d['signer'])}</button>
</div>
<p class="message" role="status" aria-live="polite"></p>
<p class="mini">{e(d['signatureMini'])}</p>
</form>"""


def pied(d):
    return f"""<footer class="pied"><div class="cadre">
<p>{e(d['pied'])}</p>
<nav aria-label="{e(d['confidentialite'])}"><a href="/privacy{'#en' if d['locale'] == 'en_US' else ''}">{e(d['confidentialite'])}</a><a href="/suppression{'#en' if d['locale'] == 'en_US' else ''}">{e(d['suppression'])}</a><a href="mailto:contact@swissdigitalstudio.ch">contact@swissdigitalstudio.ch</a><a href="{d['autreChemin']}" lang="{d['autre']}">{e(d['autreLangue'])}</a></nav>
</div></footer>"""


def script_textes(d, avec_motifs=False):
    js = dict(d["js"])
    if avec_motifs:
        js["motifs"] = d["motifs"]
    return f'<script id="textes" type="application/json">{json.dumps(js, ensure_ascii=False)}</script>\n<script src="/site.js?v=4" defer></script>'


def page_accueil(l, avec_jeu):
    d = TXT[l]
    jsonld = [
        {"@context": "https://schema.org", "@type": "MobileApplication", "name": "Opération Poumons Noirs" if l == "fr" else "Operation Black Lungs",
         "alternateName": "Black Lungs" if l == "fr" else "Opération Poumons Noirs", "operatingSystem": "Android",
         "applicationCategory": "HealthApplication", "inLanguage": ["fr", "en"], "description": d["desc"],
         "publisher": {"@type": "Organization", "name": "Swiss Digital Studio"}, "url": BASE + d["chemin"]},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in d["faq"]]},
    ]
    extra = "".join(f'<script type="application/ld+json">{json.dumps(j, ensure_ascii=False)}</script>' for j in jsonld)
    prog = "".join(f"<li><h3>{e(t)}</h3><p>{e(p)}</p></li>" for t, p in d["prog"])
    phones = "".join(f'<div class="telephone"><img src="/img/{l}/capture_{i}-v2.webp" alt="{e(d["captures"][i-1])}" width="540" height="960" loading="lazy"></div>' for i in (1, 3, 5))
    devises = "".join(f'<option value="{e(v)}">{e(t)}</option>' for v, t in d["devises"])
    motifs = "".join(
        f'<label class="motif"><input type="radio" name="motif" value="{m}"{" checked" if m == "lundi" else ""}><span class="case" aria-hidden="true"></span><span>{e(d["motifs"][m])}</span></label>'
        for m in MOTIFS)
    captures = "".join(f'<img src="/img/{l}/capture_{i}-v2.webp" alt="{e(d["captures"][i-1])}" width="540" height="960" loading="lazy" role="listitem">' for i in range(1, 8))
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in d["faq"])
    noms_videos = ["sergent-toi-oui-toi", "sergent-debout"]
    videos_sergent = "\n".join(
        f'<figure class="video"><video controls preload="none" playsinline poster="/video/{f}.jpg"><source src="/video/{f}.mp4" type="video/mp4"></video><figcaption>{e(t)}</figcaption></figure>'
        for f, t in zip([n + "-v4" for n in noms_videos], d["videosSergent"]))
    jeu = ""
    if avec_jeu:
        jeu = f"""
<section class="section sombre" id="jeu" aria-labelledby="jeu-titre">
<div class="cadre jeu-grille">
<div class="jeu-gauche">
<div class="section-tete"><h2 id="jeu-titre">{e(d['jeuTitre'])}</h2><p>{e(d['jeuChapeau'])}</p></div>
<img class="jeu-sergent" src="/img/sergent/ecrase.webp" alt="{e(d['altEcrase'])}" width="600" height="845" loading="lazy">
</div>
<div id="ecrase-clopes" class="jeu" data-lang="{l}"><p class="jeu-aide">{e(d['jeuSansJs'])}</p></div>
</div>
</section>"""
    medias_classe = "papier" if avec_jeu else "sombre"
    questions_classe = "sombre" if avec_jeu else "papier"
    return f"""{tete(d, l, d['title'], d['desc'], d['chemin'], extra=extra)}
<body>
<a class="visually-hidden" href="#titre">{'Aller au contenu' if l == 'fr' else 'Skip to content'}</a>
{barre(d, l)}
<main>
<section class="ouverture" aria-labelledby="titre">
<picture class="ouverture-photo">
<source media="(max-width: 1199px)" srcset="/img/sergent/accueil-mobile-v2.webp" type="image/webp">
<img src="/img/sergent/accueil-1400-v2.webp" srcset="/img/sergent/accueil-1400-v2.webp 1400w, /img/sergent/accueil-2330-v2.webp 2330w" sizes="(min-width: 1200px) 1500px, 100vw" alt="{e(d['altSergent'])}" width="2330" height="1438" fetchpriority="high">
</picture>
<div class="cadre ouverture-grille">
<div class="ouverture-texte">
<h1 id="titre">{e(d['h1'])}</h1>
<p class="chapeau">{e(d['chapeau'])}</p>
<p class="statut">{e(d['statut'])}</p>
</div>
<article class="feuille feuille-penchee" id="signer" aria-labelledby="ordre-titre">
<div class="feuille-tete"><span class="feuille-titre" id="ordre-titre">{e(d['ordreTitre'])}</span><span class="feuille-ref">{e(d['ordreRef'])}</span></div>
<p class="feuille-ligne">{e(d['ordreLigne'])}</p>
<div class="feuille-actions">
<button class="tampon" type="button" data-tampon="accueil_1,accueil_2,accueil_3" data-empreinte="{e(d['js']['empreinteRecu'])}"><span><span class="tampon-icone" aria-hidden="true">&#9654;</span>{e(d['ecouterOrdre'])}</span></button>
<p>{e(d['ecouterAide'])}</p>
</div>
{form_signature(d, 'site')}
<div class="empreinte" aria-hidden="true"></div>
</article>
</div>
</section>

<section class="section papier" id="programme" aria-labelledby="programme-titre">
<div class="cadre programme-grille">
<div>
<div class="section-tete"><h2 id="programme-titre">{e(d['progTitre'])}</h2><p>{e(d['progChapeau'])}</p></div>
<ul class="programme-liste">{prog}</ul>
<p class="avertissement">{e(d['progAvert'])}</p>
</div>
<figure class="telephones" aria-label="{e(d['capturesLabel'])}">{phones}</figure>
</div>
</section>

<section class="section sombre" id="pertes-section" aria-labelledby="pertes-titre">
<div class="cadre">
<div class="section-tete"><h2 id="pertes-titre">{e(d['calcTitre'])}</h2><p>{e(d['calcChapeau'])}</p></div>
<div class="pertes-grille">
<form class="feuille pertes-form" id="pertes">
<div class="feuille-tete"><span class="feuille-titre">{e(d['calcFeuille'])}</span><span class="feuille-ref">{e(d['calcRef'])}</span></div>
<div class="pertes-champs">
<label class="champ"><span class="champ-label">{e(d['parJour'])}</span><input name="parjour" type="number" inputmode="decimal" min="1" max="100" step="1" value="15"></label>
<div class="champ"><label class="champ-label" for="prix">{e(d['prixPaquet'])}</label><span class="prix-ligne"><input id="prix" name="prix" type="number" inputmode="decimal" min="0" step="0.05" value="{d['prixDefaut']}"><select name="devise" aria-label="{e(d['devise'])}">{devises}</select></span></div>
<label class="champ"><span class="champ-label">{e(d['parPaquet'])}</span><input name="parpaquet" type="number" inputmode="numeric" min="1" max="50" step="1" value="20"></label>
<label class="champ"><span class="champ-label">{e(d['annees'])}</span><input name="annees" type="number" inputmode="decimal" min="0" max="80" step="1" value="10"></label>
</div>
<button class="bouton" type="submit">{e(d['calculer'])}</button>
</form>
<div class="pertes-resultat" aria-live="polite">
<p class="pertes-vide" id="pertes-vide">{e(d['calcVide'])}</p>
<div id="pertes-resultat" hidden>
<p>{e(d['tuAsCrame'])}</p>
<p class="pertes-somme">0</p>
<ul class="pertes-details">
<li>{e(d['parAn'])} <strong data-r="an"></strong></li>
<li>{e(d['parMois'])} <strong data-r="mois"></strong></li>
<li>{e(d['clopesFumees'])} <strong data-r="clopes"></strong></li>
<li>{e(d['boutABout'])} <strong data-r="km"></strong></li>
</ul>
<div class="reaction">
<img class="reaction-visage" id="pertes-visage" src="/img/sergent/sourire-en-coin.webp" alt="" width="303" height="375" loading="lazy">
<div class="reaction-texte"><p>{e(d['reactionTexte'])}</p><button class="tampon tampon-petit" type="button" id="pertes-rejouer"><span>{e(d['reecouter'])}</span></button></div>
</div>
</div>
</div>
</div>
</div>
</section>

<section class="section papier" id="mission-section" aria-labelledby="mission-titre">
<div class="cadre mission-grille">
<div class="section-tete">
<h2 id="mission-titre">{e(d['missionTitre'])}</h2>
<p>{e(d['missionChapeau'])}</p>
<p class="mission-exemple">{e(d['missionExemple'])}</p>
</div>
<form class="feuille" id="mission">
<div class="feuille-tete"><span class="feuille-titre">{e(d['missionFeuille'])}</span><span class="feuille-ref">{e(d['missionRef'])}</span></div>
<label class="champ"><span class="champ-label">{e(d['prenomLabel'])}</span><input name="prenom" maxlength="20" autocomplete="off" placeholder="{e(d['prenomPlaceholder'])}"></label>
<fieldset class="motifs"><legend>{e(d['motifLegend'])}</legend>{motifs}</fieldset>
<div class="mission-boutons">
<button class="bouton bouton-trait" type="button" id="mission-ecouter">{e(d['ecouterMessage'])}</button>
<button class="bouton" type="submit">{e(d['preparerLien'])}</button>
</div>
<div class="mission-lien" id="mission-lien" hidden>
<span class="champ-label">{e(d['lienPret'])}</span>
<output id="mission-url"></output>
<div class="mission-boutons">
<a class="bouton" id="mission-wa" href="#" target="_blank" rel="noopener">{e(d['envoyerWa'])}</a>
<button class="bouton bouton-trait" type="button" id="mission-copier">{e(d['copierLien'])}</button>
<button class="bouton bouton-trait" type="button" id="mission-partager" hidden>{e(d['partager'])}</button>
</div>
<p class="message" id="mission-message" role="status" aria-live="polite"></p>
</div>
</form>
</div>
</section>
{jeu}
<section class="section {medias_classe}" id="medias" aria-labelledby="medias-titre">
<div class="cadre">
<div class="section-tete"><h2 id="medias-titre">{e(d['mediasTitre'])}</h2><p>{e(d['mediasChapeau'])}</p></div>
<div class="videos">
{videos_sergent}
<figure class="video"><video controls preload="none" playsinline poster="/video/leve-toi.jpg"><source src="/video/leve-toi.mp4" type="video/mp4"></video><figcaption>{e(d['video1'])}</figcaption></figure>
<figure class="video"><video controls preload="none" playsinline poster="/video/sergent-de-poche.jpg"><source src="/video/sergent-de-poche.mp4" type="video/mp4"></video><figcaption>{e(d['video2'])}</figcaption></figure>
</div>
<div class="captures" role="list" aria-label="{e(d['capturesLabel'])}">{captures}</div>
<div class="presse"><p>{e(d['presseTexte'])}</p><a class="bouton" href="/presse/poumons-noirs-dossier-presse.zip" download>{e(d['presseBouton'])}</a></div>
</div>
</section>

<section class="section {questions_classe}" id="questions" aria-labelledby="questions-titre">
<div class="cadre">
<div class="section-tete"><h2 id="questions-titre">{e(d['faqTitre'])}</h2></div>
<div class="questions">{faq}<p class="questions-lien"><a href="/privacy{'#en' if l == 'en' else ''}">{e(d['faqLien'])}</a></p></div>
</div>
</section>
</main>
{pied(d)}
{script_textes(d)}
{'<script src="/jeu.js?v=2" defer></script>' if avec_jeu else ''}
</body>
</html>
"""


def page_recu(l):
    d = TXT[l]
    return f"""{tete(d, l, d['recuTitle'], d['recuDesc'], d['recuChemin'], noindex=True, og=f"og-ordre-{l}-v2", extra='<link rel="preload" as="image" href="/img/sergent/crie.webp">')}
<body data-page="recu">
{barre(d, l, avec_sections=False)}
<main class="recu">
<div class="cadre">
<div class="recu-dossier">
<img class="recu-sergent" id="recu-visage" src="/img/sergent/pointe.webp" alt="" width="384" height="373">
<article class="feuille" aria-labelledby="recu-nom">
<div class="feuille-tete"><span class="feuille-titre">{e(d['recuTitre'])}</span><span class="feuille-ref">{e(d['recuRef'])}</span></div>
<p>{e(d['recuPour'])}</p>
<h1 class="recu-nom" id="recu-nom">{e(d['js']['soldat'])}.</h1>
<p>{e(d['recuIntro'])}</p>
<dl><dt>{e(d['recuMotifLabel'])}</dt><dd id="recu-motif"></dd></dl>
<div class="feuille-actions">
<button class="tampon" type="button" id="recu-ecouter" aria-pressed="false"><span><span class="tampon-icone" aria-hidden="true">&#9654;</span>{e(d['ecouterOrdre'])}</span></button>
<p>{e(d['recuAide'])}</p>
</div>
<div class="recu-suite" id="recu-suite" hidden>
<p><strong>{e(d['recuSuiteTitre'])}</strong> {e(d['recuSuiteTexte'])}</p>
{form_signature(d, 'ordre')}
<div class="recu-liens"><a href="{d['chemin']}#mission-section">{e(d['recuRenvoyer'])}</a><a href="{d['chemin']}">{e(d['recuDecouvrir'])}</a></div>
</div>
<div class="empreinte" aria-hidden="true"></div>
</article>
</div>
</div>
</main>
{pied(d)}
{script_textes(d, avec_motifs=True)}
</body>
</html>
"""


def main():
    avec_jeu = os.path.exists(os.path.join(SORTIE, "jeu.js"))
    fichiers = {
        "index.html": page_accueil("fr", avec_jeu),
        "en.html": page_accueil("en", avec_jeu),
        "ordre.html": page_recu("fr"),
        "order.html": page_recu("en"),
        "robots.txt": f"User-agent: *\nAllow: /\nDisallow: /ordre\nDisallow: /order\nSitemap: {BASE}/sitemap.xml\n",
        "sitemap.xml": f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url><loc>{BASE}/</loc><xhtml:link rel="alternate" hreflang="fr" href="{BASE}/"/><xhtml:link rel="alternate" hreflang="en" href="{BASE}/en"/></url>
<url><loc>{BASE}/en</loc><xhtml:link rel="alternate" hreflang="fr" href="{BASE}/"/><xhtml:link rel="alternate" hreflang="en" href="{BASE}/en"/></url>
<url><loc>{BASE}/privacy</loc></url>
</urlset>
""",
    }
    for nom, contenu in fichiers.items():
        with open(os.path.join(SORTIE, nom), "w", encoding="utf-8") as f:
            f.write(contenu)
    print("Construit :", ", ".join(fichiers), "| jeu :", avec_jeu)


if __name__ == "__main__":
    main()
