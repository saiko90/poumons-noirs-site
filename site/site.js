/* Opération Poumons Noirs — interactions du site */
(() => {
  "use strict";
  const L = document.documentElement.lang.startsWith("en") ? "en" : "fr";
  const T = JSON.parse(document.getElementById("textes").textContent);
  const API = "https://srcvnqfgtazupuzwznrr.supabase.co/rest/v1/rpc/pn_recrue";
  const CLE = "sb_publishable_YUwom0kvnMbpn8Rpug1FaA_1H35zkY_";
  const MOTIFS = ["lundi", "cachette", "vape", "craque", "pause", "prix", "bravo"];
  const ORIGINE = location.hostname.endsWith(".vercel.app") ? "https://www.poumonsnoirs.com" : location.origin;
  const visageDuSergent = (img, nom) => { if (img) img.src = `/img/sergent/${nom}.webp`; };

  // ---------- Comptage anonyme des visites (aucun cookie, aucune IP) ----------
  const SOURCES = [["tiktok", /(^|\.)tiktok\.com$/], ["youtube", /(^|\.)(youtube\.com|youtu\.be)$/],
    ["instagram", /(^|\.)instagram\.com$/], ["facebook", /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/],
    ["whatsapp", /(^|\.)whatsapp\.(com|net)$/], ["google", /(^|\.)google\.[a-z.]+$/], ["bing", /(^|\.)bing\.com$/],
    ["linkedin", /(^|\.)(linkedin\.com|lnkd\.in)$/], ["x", /(^|\.)(twitter\.com|x\.com|t\.co)$/]];
  const hote = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  const REFERENT = hote(document.referrer);
  const SOURCE = (() => {
    const q = new URLSearchParams(location.search);
    const s = (q.get("src") || q.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 20);
    if (s) return s;
    if (!REFERENT) return "direct";
    if (REFERENT === location.hostname.replace(/^www\./, "")) return "interne";
    for (const [nom, motif] of SOURCES) if (motif.test(REFERENT)) return nom;
    return REFERENT.slice(0, 40);
  })();
  if (!navigator.webdriver && !/bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent)) {
    fetch(API.replace("pn_recrue", "pn_visite"), {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json", apikey: CLE },
      body: JSON.stringify({ p_page: location.pathname.slice(0, 80), p_langue: L, p_source: SOURCE,
        p_referent: SOURCE === "interne" ? null : REFERENT || null,
        p_appareil: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "ordi" }),
    }).catch(() => {});
  }

  // ---------- Voix du Sergent ----------
  let voix = null;
  function jouer(nom, fin) {
    if (voix) { voix.pause(); voix.onended = null; }
    voix = new Audio(`/audio/${L}/${nom}.mp3`);
    voix.onended = () => { if (fin) fin(); };
    voix.play().catch(() => { if (fin) fin(); });
    return voix;
  }

  function frapper(bouton) {
    bouton.classList.remove("frappe");
    void bouton.offsetWidth;
    bouton.classList.add("frappe");
  }

  function empreinte(feuille, texte) {
    const e = feuille && feuille.querySelector(".empreinte");
    if (!e) return;
    e.textContent = texte;
    e.classList.remove("visible");
    void e.offsetWidth;
    e.classList.add("visible");
  }

  document.querySelectorAll("[data-tampon]").forEach((b) => {
    b.addEventListener("click", () => {
      const lignes = b.dataset.tampon.split(",");
      frapper(b);
      jouer(lignes[Math.floor(Math.random() * lignes.length)]);
      if (b.dataset.empreinte) empreinte(b.closest(".feuille"), b.dataset.empreinte);
    });
  });

  // ---------- Liste d'attente (signer l'ordre) ----------
  document.querySelectorAll("form[data-recrue]").forEach((form) => {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const champ = form.querySelector("input[type=email]");
      const msg = form.querySelector(".message");
      const bouton = form.querySelector("button[type=submit]");
      const email = champ.value.trim();
      const dire = (texte, etat) => { msg.textContent = texte; msg.dataset.etat = etat; };
      if (!email || !champ.checkValidity()) { dire(T.erreurEmail, "erreur"); champ.focus(); return; }
      bouton.disabled = true;
      try {
        const r = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: CLE },
          body: JSON.stringify({ p_email: email, p_langue: L, p_source: `${form.dataset.recrue}:${SOURCE}`.slice(0, 40) }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.ok) {
          dire(T.recrueOk, "ok");
          champ.value = "";
          jouer("recrue");
          empreinte(form.closest(".feuille"), T.empreinteSigne);
        } else {
          dire(T.erreurEmail, "erreur");
        }
      } catch (e) {
        dire(T.erreurReseau, "erreur");
      } finally {
        bouton.disabled = false;
      }
    });
  });

  // ---------- Calculateur « Combien t'as cramé ? » ----------
  const nombre = (n, dec = 0) => new Intl.NumberFormat(L === "fr" ? "fr-CH" : "en-US", { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
  const argent = (n, devise) => {
    const v = nombre(Math.round(n));
    if (L === "fr") return `${v} ${devise}`;
    return devise === "CHF" ? `CHF ${v}` : `${devise}${v}`;
  };
  const pertes = document.getElementById("pertes");
  if (pertes) {
    const sortie = document.getElementById("pertes-resultat");
    const vide = document.getElementById("pertes-vide");
    let derniereReaction = "calc_1";
    const visage = document.getElementById("pertes-visage");
    const VISAGES = { calc_1: "sourire-en-coin", calc_2: "degout", calc_3: "pointe", calc_4: "crie" };
    pertes.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const v = (nom) => Math.max(0, parseFloat(String(pertes.elements[nom].value).replace(",", ".")) || 0);
      const parJour = v("parjour"), prix = v("prix"), parPaquet = Math.max(1, v("parpaquet")), annees = v("annees");
      const devise = pertes.elements.devise.value;
      const parAn = (parJour / parPaquet) * prix * 365;
      const total = parAn * annees;
      const clopes = parJour * 365 * annees;
      const km = (clopes * 0.084) / 1000;
      const somme = sortie.querySelector(".pertes-somme");
      somme.textContent = argent(total, devise);
      somme.classList.remove("roule"); void somme.offsetWidth; somme.classList.add("roule");
      sortie.querySelector('[data-r="an"]').textContent = argent(parAn, devise);
      sortie.querySelector('[data-r="mois"]').textContent = argent(parAn / 12, devise);
      sortie.querySelector('[data-r="clopes"]').textContent = nombre(clopes);
      sortie.querySelector('[data-r="km"]').textContent = L === "fr" ? `${nombre(km, 1)} km` : `${nombre(km, 1)} km (${nombre(km * 0.621371, 1)} miles)`;
      vide.hidden = true;
      sortie.hidden = false;
      derniereReaction = total < 2000 ? "calc_1" : total < 10000 ? "calc_2" : total < 30000 ? "calc_3" : "calc_4";
      visageDuSergent(visage, VISAGES[derniereReaction]);
      jouer(derniereReaction);
    });
    const rejouer = document.getElementById("pertes-rejouer");
    if (rejouer) rejouer.addEventListener("click", () => { frapper(rejouer); jouer(derniereReaction); });
  }

  // ---------- Envoie le Sergent à un pote ----------
  const nettoyerNom = (s) => String(s || "").normalize("NFC").replace(/[^\p{L}\p{M} '\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 20);
  const mission = document.getElementById("mission");
  if (mission) {
    const bloc = document.getElementById("mission-lien");
    const sortie = document.getElementById("mission-url");
    const wa = document.getElementById("mission-wa");
    const copier = document.getElementById("mission-copier");
    const partager = document.getElementById("mission-partager");
    const msg = document.getElementById("mission-message");
    const motifChoisi = () => (mission.querySelector("input[name=motif]:checked") || {}).value || "lundi";
    const construire = () => {
      const nom = nettoyerNom(mission.elements.prenom.value);
      const url = new URL(L === "fr" ? "/ordre" : "/order", ORIGINE);
      url.searchParams.set("m", motifChoisi());
      if (nom) url.searchParams.set("n", nom);
      const texte = (nom ? T.waNom.replace("{n}", nom) : T.waSans) + " " + url.toString();
      return { url: url.toString(), texte };
    };
    document.getElementById("mission-ecouter").addEventListener("click", (ev) => {
      jouer("envoi_" + motifChoisi());
    });
    mission.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const { url, texte } = construire();
      sortie.value = url;
      sortie.textContent = url;
      wa.href = "https://wa.me/?text=" + encodeURIComponent(texte);
      bloc.hidden = false;
      msg.textContent = "";
      if (partager) partager.hidden = !navigator.share;
      bloc.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    });
    copier.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(sortie.textContent); msg.textContent = T.copie; }
      catch (e) { msg.textContent = T.copieManuelle; }
    });
    if (partager) partager.addEventListener("click", async () => {
      const { url, texte } = construire();
      try { await navigator.share({ title: T.partageTitre, text: texte.replace(" " + url, ""), url }); } catch (e) { /* annulé */ }
    });
  }

  // ---------- Page « un ordre t'attend » ----------
  if (document.body.dataset.page === "recu") {
    const p = new URLSearchParams(location.search);
    const m = MOTIFS.includes(p.get("m")) ? p.get("m") : "lundi";
    const nom = nettoyerNom(p.get("n"));
    document.getElementById("recu-nom").textContent = (nom || T.soldat) + ".";
    document.getElementById("recu-motif").textContent = T.motifs[m];
    const suite = document.getElementById("recu-suite");
    const b = document.getElementById("recu-ecouter");
    const visage = document.getElementById("recu-visage");
    visageDuSergent(visage, m === "bravo" ? "sourire" : "pointe");
    b.addEventListener("click", () => {
      frapper(b);
      b.setAttribute("aria-pressed", "true");
      empreinte(b.closest(".feuille"), T.empreinteRecu);
      visageDuSergent(visage, "crie");
      jouer("envoi_" + m, () => { suite.hidden = false; visageDuSergent(visage, m === "bravo" ? "salut" : "pointe"); });
      setTimeout(() => { suite.hidden = false; }, 6000);
    });
  }
})();
