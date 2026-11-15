/*
 * Écrase-Clopes, version web.
 * Portage du moteur de l'appli (Jeu.kt) et de son écran de jeu (EcranJeu.kt) :
 * mêmes règles, mêmes points, mêmes bonbons, mêmes voix du Sergent.
 */
(() => {
  "use strict";
  const racine = document.getElementById("ecrase-clopes");
  if (!racine) return;
  const EN = (racine.dataset.lang || document.documentElement.lang) === "en";
  const t = (fr, en) => (EN ? en : fr);
  const REDUIT = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ═════════════ MOTEUR (logique pure, sans DOM) ═════════════

  const COTE = 8, NB_TYPES = 5, TYPE_CRANE = -1, DUREE = 180;
  const AUCUNE = 0, ROQ_H = 1, ROQ_V = 2, GRENADE = 3, CRANE = 4;
  const K = (l, c) => l * COTE + c;
  const Lg = (k) => (k / COTE) | 0;
  const Cl = (k) => k % COTE;
  const dans = (l, c) => l >= 0 && l < COTE && c >= 0 && c < COTE;
  const voisins = (a, b) => Math.abs(Lg(a) - Lg(b)) + Math.abs(Cl(a) - Cl(b)) === 1;
  const hasard = (n) => Math.floor(Math.random() * n);
  const TOUTES = Array.from({ length: COTE * COTE }, (_, k) => k);
  const ligne = (l) => Array.from({ length: COTE }, (_, c) => K(l, c));
  const colonne = (c) => Array.from({ length: COTE }, (_, l) => K(l, c));
  const carre = (k, r) => {
    const out = [];
    for (let l = Lg(k) - r; l <= Lg(k) + r; l++) for (let c = Cl(k) - r; c <= Cl(k) + r; c++) if (dans(l, c)) out.push(K(l, c));
    return out;
  };
  const piece = (id, type, sp = AUCUNE) => ({ id, type, sp });
  const estSpeciale = (p) => p.sp !== AUCUNE;
  const estCombinaison = (a, b) => a.sp === CRANE || b.sp === CRANE || (estSpeciale(a) && estSpeciale(b));
  const declenchement = (k, sp, cibles, grosse = false) => ({ k, sp, cibles, grosse });

  class Grille {
    constructor() {
      this.cases = Array.from({ length: COTE }, () => new Array(COTE).fill(null));
      this.prochainId = 1;
    }
    nid() { return this.prochainId++; }
    get(k) { return this.cases[Lg(k)][Cl(k)]; }
    set(k, p) { this.cases[Lg(k)][Cl(k)] = p; }
    typeEn(k) { const p = this.get(k); return p ? p.type : -2; }

    /** Grille de départ : aucun alignement tout fait, au moins un coup possible. */
    remplir() {
      do {
        for (let l = 0; l < COTE; l++) for (let c = 0; c < COTE; c++) {
          let ty;
          do { ty = hasard(NB_TYPES); } while (this.creeAlignement(l, c, ty));
          this.cases[l][c] = piece(this.nid(), ty);
        }
      } while (this.indice() === null);
    }
    creeAlignement(l, c, ty) {
      const g = this.cases;
      return (c >= 2 && g[l][c - 1] && g[l][c - 1].type === ty && g[l][c - 2] && g[l][c - 2].type === ty) ||
        (l >= 2 && g[l - 1][c] && g[l - 1][c].type === ty && g[l - 2][c] && g[l - 2][c].type === ty);
    }

    alignements() {
      const series = [];
      for (let l = 0; l < COTE; l++) {
        let c = 0;
        while (c < COTE) {
          const ty = this.typeEn(K(l, c));
          let fin = c;
          while (fin + 1 < COTE && ty >= 0 && this.typeEn(K(l, fin + 1)) === ty) fin++;
          if (ty >= 0 && fin - c + 1 >= 3) { const s = []; for (let i = c; i <= fin; i++) s.push(K(l, i)); series.push({ cases: s, h: true }); }
          c = fin + 1;
        }
      }
      for (let c = 0; c < COTE; c++) {
        let l = 0;
        while (l < COTE) {
          const ty = this.typeEn(K(l, c));
          let fin = l;
          while (fin + 1 < COTE && ty >= 0 && this.typeEn(K(fin + 1, c)) === ty) fin++;
          if (ty >= 0 && fin - l + 1 >= 3) { const s = []; for (let i = l; i <= fin; i++) s.push(K(i, c)); series.push({ cases: s, h: false }); }
          l = fin + 1;
        }
      }
      // Fusion des séries qui se croisent (formes en L et en T)
      const restantes = series.slice(), groupes = [];
      while (restantes.length) {
        const lot = [restantes.shift()];
        let change = true;
        while (change) {
          change = false;
          for (let i = 0; i < restantes.length; i++) {
            const s = restantes[i];
            if (lot.some((x) => x.cases.some((k) => s.cases.includes(k)))) { lot.push(s); restantes.splice(i, 1); i--; change = true; }
          }
        }
        const vu = new Set(), cases = [];
        for (const s of lot) for (const k of s.cases) if (!vu.has(k)) { vu.add(k); cases.push(k); }
        groupes.push({
          type: this.get(lot[0].cases[0]).type, cases,
          hz: lot.filter((s) => s.h).map((s) => s.cases), vt: lot.filter((s) => !s.h).map((s) => s.cases),
          plusLongue: Math.max(...lot.map((s) => s.cases.length)),
        });
      }
      return groupes;
    }

    echanger(a, b) { const p = this.get(a); this.set(a, this.get(b)); this.set(b, p); }

    coupValide(a, b) {
      if (!voisins(a, b)) return false;
      const pa = this.get(a), pb = this.get(b);
      if (!pa || !pb) return false;
      if (estCombinaison(pa, pb)) return true;
      this.echanger(a, b);
      const ok = this.alignementTouche(a) || this.alignementTouche(b);
      this.echanger(a, b);
      return ok;
    }
    alignementTouche(k) {
      const p = this.get(k);
      if (!p || p.type < 0) return false;
      const ty = p.type, l = Lg(k), c = Cl(k);
      const n = (dl, dc) => {
        let i = 1, x = 0;
        while (dans(l + dl * i, c + dc * i) && this.typeEn(K(l + dl * i, c + dc * i)) === ty) { x++; i++; }
        return x;
      };
      return n(0, -1) + n(0, 1) >= 2 || n(-1, 0) + n(1, 0) >= 2;
    }

    /** Un coup jouable (pour l'indice), ou null s'il n'y en a plus. */
    indice() {
      const coups = [];
      for (let l = 0; l < COTE; l++) for (let c = 0; c < COTE; c++) {
        const a = K(l, c);
        if (c + 1 < COTE && this.coupValide(a, K(l, c + 1))) coups.push([a, K(l, c + 1)]);
        if (l + 1 < COTE && this.coupValide(a, K(l + 1, c))) coups.push([a, K(l + 1, c)]);
      }
      return coups.length ? coups[hasard(coups.length)] : null;
    }

    /** Joue a↔b. null si le coup est refusé (grille inchangée), sinon toutes les vagues jusqu'à stabilité. */
    jouer(a, b) {
      if (!this.coupValide(a, b)) return null;
      const pa = this.get(a), pb = this.get(b);
      this.echanger(a, b);
      const vagues = [estCombinaison(pa, pb) ? this.vagueCombinaison(b, pa, a, pb) : this.vagueAlignements(1, [b, a])];
      let rang = 2;
      while (this.alignements().length) vagues.push(this.vagueAlignements(rang++, []));
      return vagues;
    }

    vagueAlignements(rang, pivots) {
      const groupes = this.alignements();
      const aDetruire = new Set(), creations = new Map();
      let bonus = 0;
      for (const g of groupes) {
        for (const k of g.cases) aDetruire.add(k);
        let sp = AUCUNE;
        if (g.plusLongue >= 5) sp = CRANE;
        else if (g.hz.length && g.vt.length) sp = GRENADE;
        else if (g.plusLongue === 4) sp = g.hz.some((s) => s.length >= 4) ? ROQ_H : ROQ_V;
        if (sp === AUCUNE) continue;
        const cand = g.cases.filter((k) => { const p = this.get(k); return !(p && estSpeciale(p)) && !creations.has(k); });
        let ou = pivots.find((k) => cand.includes(k));
        if (ou === undefined && sp === GRENADE) { const v = g.vt.flat(); ou = g.hz.flat().find((k) => v.includes(k) && cand.includes(k)); }
        if (ou === undefined) {
          let m = null;
          for (const s of g.hz.concat(g.vt)) if (!m || s.length > m.length) m = s;
          const milieu = m[(m.length / 2) | 0];
          if (cand.includes(milieu)) ou = milieu;
        }
        if (ou === undefined) ou = cand[0];
        if (ou === undefined) continue;
        creations.set(ou, piece(this.nid(), sp === CRANE ? TYPE_CRANE : g.type, sp));
        bonus += sp === CRANE ? 250 : sp === GRENADE ? 120 : 60;
      }
      return this.destruction(rang, [...aDetruire], creations, [], [], new Set(), bonus, false);
    }

    /** Deux pièces spéciales (ou un crâne) échangées : effet immédiat, sans alignement. */
    vagueCombinaison(ici, p1, la, p2) {
      const decl = [], transfo = [], cibles = new Set([ici, la]), deja = new Set([p1.id, p2.id]);
      let bonus;
      const crane1 = p1.sp === CRANE, crane2 = p2.sp === CRANE;
      if (crane1 && crane2) {
        for (const k of TOUTES) cibles.add(k);
        decl.push(declenchement(ici, CRANE, TOUTES, true));
        bonus = 3000;
      } else if (crane1 || crane2) {
        const posCrane = crane1 ? ici : la, autre = crane1 ? p2 : p1, posAutre = crane1 ? la : ici;
        const memes = TOUTES.filter((k) => this.typeEn(k) === autre.type);
        if (estSpeciale(autre)) {
          // Toutes les pièces de cette couleur deviennent la même spéciale… et sautent
          for (const k of memes) {
            const sp = autre.sp === GRENADE ? GRENADE : (Math.random() < 0.5 ? ROQ_H : ROQ_V);
            const np = { ...this.get(k), sp };
            this.set(k, np);
            transfo.push([k, np]);
          }
          deja.delete(autre.id);
          bonus = 1500;
        } else bonus = 600;
        for (const k of memes) cibles.add(k);
        cibles.add(posAutre);
        decl.push(declenchement(posCrane, CRANE, memes, estSpeciale(autre)));
      } else {
        const r1 = p1.sp === ROQ_H || p1.sp === ROQ_V, r2 = p2.sp === ROQ_H || p2.sp === ROQ_V;
        const l = Lg(ici), c = Cl(ici);
        if (r1 && r2) {
          for (const k of ligne(l).concat(colonne(c))) cibles.add(k);
          decl.push(declenchement(ici, ROQ_H, ligne(l)), declenchement(ici, ROQ_V, colonne(c)));
          bonus = 500;
        } else if (r1 || r2) {
          for (let d = -1; d <= 1; d++) {
            if (l + d >= 0 && l + d < COTE) { for (const k of ligne(l + d)) cibles.add(k); decl.push(declenchement(K(l + d, c), ROQ_H, ligne(l + d))); }
            if (c + d >= 0 && c + d < COTE) { for (const k of colonne(c + d)) cibles.add(k); decl.push(declenchement(K(l, c + d), ROQ_V, colonne(c + d))); }
          }
          bonus = 900;
        } else {
          const zone = carre(ici, 2);
          for (const k of zone) cibles.add(k);
          decl.push(declenchement(ici, GRENADE, zone, true));
          bonus = 800;
        }
      }
      return this.destruction(1, [...cibles], new Map(), decl, transfo, deja, bonus, true);
    }

    /** Détruit les cases (et déclenche en chaîne les spéciales touchées), pose les créations, fait tomber et recharge. */
    destruction(rang, initiales, creations, declInit, transfo, dejaInit, bonusInit, combinaison) {
      const decl = declInit.slice(), deja = new Set(dejaInit), file = initiales.slice(), detruites = new Map();
      // Les pièces absorbées par une nouvelle spéciale disparaissent aussi
      for (const k of creations.keys()) { const p = this.get(k); if (p) detruites.set(k, p); }
      let bonus = bonusInit;
      for (let i = 0; i < file.length; i++) {
        const k = file[i];
        if (detruites.has(k) || creations.has(k)) continue;
        const p = this.get(k);
        if (!p) continue;
        detruites.set(k, p);
        if (estSpeciale(p) && !deja.has(p.id)) {
          deja.add(p.id);
          let cibles;
          if (p.sp === ROQ_H) cibles = ligne(Lg(k));
          else if (p.sp === ROQ_V) cibles = colonne(Cl(k));
          else if (p.sp === GRENADE) cibles = carre(k, 1);
          else {
            let meilleur = 0, nb = -1;
            for (let ty = 0; ty < NB_TYPES; ty++) { const n = TOUTES.filter((q) => this.typeEn(q) === ty).length; if (n > nb) { nb = n; meilleur = ty; } }
            cibles = TOUTES.filter((q) => this.typeEn(q) === meilleur);
          }
          decl.push(declenchement(k, p.sp, cibles));
          bonus += p.sp === CRANE ? 300 : p.sp === GRENADE ? 150 : 100;
          for (const q of cibles) file.push(q);
        }
      }
      for (const k of detruites.keys()) this.set(k, null);
      for (const [k, p] of creations) this.set(k, p);
      const points = (detruites.size * 20 + bonus) * rang;
      const { chutes, apparitions } = this.gravite();
      return { rang, detruites: [...detruites], transformees: transfo, declenchements: decl, creees: [...creations], chutes, apparitions, points, combinaison };
    }

    gravite() {
      const chutes = [], apparitions = [], g = this.cases;
      for (let c = 0; c < COTE; c++) {
        let ecriture = COTE - 1;
        for (let l = COTE - 1; l >= 0; l--) {
          const p = g[l][c];
          if (!p) continue;
          if (l !== ecriture) { g[ecriture][c] = p; g[l][c] = null; chutes.push({ id: p.id, c, de: l, vers: ecriture }); }
          ecriture--;
        }
        const manquantes = ecriture + 1;
        for (let l = ecriture; l >= 0; l--) {
          const p = piece(this.nid(), hasard(NB_TYPES));
          g[l][c] = p;
          apparitions.push({ piece: p, c, de: l - manquantes, vers: l });
        }
      }
      return { chutes, apparitions };
    }

    /** Plus aucun coup : on rebat les pièces (sans alignement tout fait, avec au moins un coup). */
    melanger() {
      const pieces = TOUTES.map((k) => this.get(k)).filter(Boolean);
      for (let essai = 0; essai < 200; essai++) {
        for (let i = pieces.length - 1; i > 0; i--) { const j = hasard(i + 1); [pieces[i], pieces[j]] = [pieces[j], pieces[i]]; }
        TOUTES.forEach((k, i) => this.set(k, pieces[i]));
        if (!this.alignements().length && this.indice() !== null) return this.positions();
      }
      this.remplir();
      return this.positions();
    }
    positions() { const m = new Map(); for (const k of TOUTES) m.set(this.get(k).id, k); return m; }
  }

  // ─────────── Une partie : moteur + animations + chrono ───────────

  const COULEURS = [
    ["#FF3D57", "#FFA3B0", "#9E0F2A"],
    ["#2FD36A", "#A8F7C2", "#0B7F36"],
    ["#FFC23A", "#FFEDAA", "#C07F00"],
    ["#2EB2FF", "#ADE4FF", "#0A5BB8"],
    ["#AE5CFF", "#DDBBFF", "#5419AE"],
  ];
  const couleurBonbon = (ty) => (ty >= 0 && ty < COULEURS.length ? COULEURS[ty][0] : "#FFE27A");
  const visuel = (p, x, y) => ({ piece: p, x, y, vy: 0, cibleY: y, gx0: 0, gy0: 0, gx1: 0, gy1: 0, gt: -1, gd: 0.13, ecrase: 0, meurt: -1, flash: 0, nait: -1 });

  class Partie {
    constructor(retours, apercu = false) {
      this.r = retours;
      this.grille = new Grille();
      this.grille.remplir();
      this.visuels = new Map();
      this.particules = []; this.ondes = []; this.rayons = []; this.eclairs = []; this.textes = [];
      this.score = 0; this.scoreAffiche = 0; this.temps = DUREE; this.fini = false; this.abandon = false;
      this.meilleurCombo = 0; this.nbSpeciales = 0;
      this.selection = null; this.indiceVisible = null;
      this.secousse = 0; this.flash = 0; this.horloge = 0;
      this.etape = apercu ? "AUCUNE" : "CHUTE"; this.tEtape = 0; this.dureePop = 0.17;
      this.file = []; this.vagueCourante = null; this.echange = null; this.vaguesEnAttente = null;
      this.rangMax = 0; this.combinaison = false; this.inactif = 0; this.depuisVoix = 99;
      this.dixDit = false; this.vitesseDite = -99; this.dernierTic = 99; this.demarre = apercu;
      // Entrée en scène : toute la grille tombe du ciel
      for (const k of TOUTES) {
        const p = this.grille.get(k), l = Lg(k);
        const v = visuel(p, Cl(k), apercu ? l : l - COTE - (COTE - l) * 0.35);
        v.cibleY = l;
        this.visuels.set(p.id, v);
      }
    }

    libre() { return !this.fini && this.temps > 0 && this.etape === "AUCUNE"; }

    /** Tap : sélectionne, désélectionne, ou échange avec la pièce voisine sélectionnée. */
    taper(k) {
      if (!this.libre()) return;
      const s = this.selection;
      if (s === null) { this.selection = k; this.r.son("sfx_tic", 0.35, 1.4); }
      else if (s === k) this.selection = null;
      else if (voisins(s, k)) { this.selection = null; this.tenter(s, k); }
      else { this.selection = k; this.r.son("sfx_tic", 0.35, 1.4); }
    }

    /** Glissement d'une pièce vers sa voisine. */
    tenter(a, b) {
      if (!this.libre() || !voisins(a, b)) return;
      const pa = this.grille.get(a), pb = this.grille.get(b);
      if (!pa || !pb) return;
      const va = this.visuels.get(pa.id), vb = this.visuels.get(pb.id);
      if (!va || !vb) return;
      this.selection = null; this.indiceVisible = null; this.inactif = 0;
      this.glisser(va, Cl(b), Lg(b), 0.13);
      this.glisser(vb, Cl(a), Lg(a), 0.13);
      this.r.son("sfx_swap", 0.7);
      this.echange = [a, b];
      this.vaguesEnAttente = this.grille.jouer(a, b);
      this.etape = "ECHANGE"; this.tEtape = 0;
    }

    glisser(v, x, y, d) { v.gx0 = v.x; v.gy0 = v.y; v.gx1 = x; v.gy1 = y; v.gt = 0; v.gd = d; v.cibleY = y; v.vy = 0; }

    parler(id, force = false) {
      if (!force && (this.depuisVoix < 3.5 || Math.random() > 0.8)) return;
      this.r.voix(id); this.depuisVoix = 0;
    }

    avancer(dt) {
      this.horloge += dt;
      if (!this.demarre) { this.demarre = true; this.r.son("sfx_sifflet", 0.8); this.parler("jeu_go", true); }
      this.depuisVoix += dt;
      if (!this.fini && this.temps > 0) {
        this.temps = Math.max(0, this.temps - dt);
        const s = Math.ceil(this.temps);
        if (this.temps <= 10 && s !== this.dernierTic && s > 0) { this.dernierTic = s; this.r.son("sfx_tic", 0.75); }
        if (this.temps <= 10.6 && !this.dixDit) { this.dixDit = true; this.parler("jeu_dix", true); }
      }
      if (this.libre()) {
        this.inactif += dt;
        if (this.inactif > 5 && this.indiceVisible === null) this.indiceVisible = this.grille.indice();
        if (this.inactif > 7 && this.horloge - this.vitesseDite > 25) { this.vitesseDite = this.horloge; this.parler("jeu_vite", true); }
      }
      this.tEtape += dt;
      switch (this.etape) {
        case "ECHANGE":
          if (this.tEtape >= 0.13) {
            const v = this.vaguesEnAttente;
            if (v === null) {
              const [a, b] = this.echange;
              for (const k of [a, b]) { const p = this.grille.get(k), vi = p && this.visuels.get(p.id); if (vi) this.glisser(vi, Cl(k), Lg(k), 0.15); }
              this.r.son("sfx_non", 0.8); this.r.vibrer(25);
              this.etape = "RETOUR"; this.tEtape = 0;
            } else {
              this.file.push(...v); this.rangMax = 0; this.combinaison = v.length > 0 && v[0].combinaison;
              this.vagueSuivante();
            }
          }
          break;
        case "RETOUR": if (this.tEtape >= 0.15) this.etape = "AUCUNE"; break;
        case "POP": if (this.tEtape >= this.dureePop) { this.appliquerChutes(); this.etape = "CHUTE"; this.tEtape = 0; } break;
        case "CHUTE": {
          let pret = true;
          for (const v of this.visuels.values()) if (v.gt >= 0 || v.y !== v.cibleY || v.meurt >= 0) { pret = false; break; }
          if (pret) {
            if (this.vagueCourante) this.r.son("sfx_toc", 0.45);
            if (this.file.length) this.vagueSuivante(); else this.finCoup();
          }
          break;
        }
        case "MELANGE": if (this.tEtape >= 0.5) this.etape = "AUCUNE"; break;
      }
      this.animerVisuels(dt);
      this.animerEffets(dt);
      this.secousse = Math.max(0, this.secousse - dt * 2.4);
      this.flash = Math.max(0, this.flash - dt * 2.6);
      this.scoreAffiche += (this.score - this.scoreAffiche) * Math.min(1, dt * 9);
      if (Math.abs(this.score - this.scoreAffiche) < 1) this.scoreAffiche = this.score;
      if (!this.fini && this.temps <= 0 && this.etape === "AUCUNE") this.terminer();
    }

    animerVisuels(dt) {
      for (const [id, v] of this.visuels) {
        if (v.gt >= 0) {
          v.gt += dt;
          const k = Math.min(1, v.gt / v.gd), e = 1 - (1 - k) * (1 - k);
          v.x = v.gx0 + (v.gx1 - v.gx0) * e; v.y = v.gy0 + (v.gy1 - v.gy0) * e;
          if (k >= 1) { v.gt = -1; v.x = v.gx1; v.y = v.gy1; }
        } else if (v.y < v.cibleY) {
          v.vy = Math.min(28, v.vy + 80 * dt);
          v.y += v.vy * dt;
          if (v.y >= v.cibleY) { v.y = v.cibleY; if (v.vy > 5) v.ecrase = 1; v.vy = 0; }
        } else if (v.y > v.cibleY) v.y = v.cibleY;
        if (v.ecrase > 0) v.ecrase = Math.max(0, v.ecrase - dt * 6);
        if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 3);
        if (v.nait >= 0) { v.nait += dt; if (v.nait > 0.4) v.nait = -1; }
        if (v.meurt >= 0) { v.meurt += dt; if (v.meurt > 0.22) this.visuels.delete(id); }
      }
    }

    animerEffets(dt) {
      for (const p of this.particules) {
        p.vie += dt;
        if (p.genre === 0) { p.vy += 16 * dt; p.vx *= 1 - 1.2 * dt; p.rot += p.vrot * dt; }
        else if (p.genre === 1) { p.vy += 6 * dt; p.vx *= 1 - 2.5 * dt; p.vy *= 1 - 2.5 * dt; }
        else if (p.genre === 2) p.vx *= 1 - dt;
        else p.vy -= 1.5 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      const vivant = (e) => e.vie === undefined ? e.t < e.duree : e.vie < e.duree;
      this.particules = this.particules.filter(vivant);
      for (const liste of [this.ondes, this.rayons, this.eclairs]) for (const e of liste) e.t += dt;
      this.ondes = this.ondes.filter(vivant); this.rayons = this.rayons.filter(vivant); this.eclairs = this.eclairs.filter(vivant);
      for (const x of this.textes) { x.t += dt; if (!x.grand) x.y -= dt * 0.9; }
      this.textes = this.textes.filter(vivant);
    }

    vagueSuivante() {
      const v = this.file.shift();
      this.vagueCourante = v;
      this.rangMax = Math.max(this.rangMax, v.rang);
      this.meilleurCombo = Math.max(this.meilleurCombo, v.rang);
      this.etape = "POP"; this.tEtape = 0;
      this.dureePop = 0.17;
      let gros = false;
      for (const [, p] of v.transformees) { const vi = this.visuels.get(p.id); if (vi) { vi.piece = p; vi.flash = 1; } }
      if (v.transformees.length) this.dureePop = 0.4;
      for (const d of v.declenchements) {
        const cx = Cl(d.k) + 0.5, cy = Lg(d.k) + 0.5;
        if (d.sp === ROQ_H || d.sp === ROQ_V) {
          const h = d.sp === ROQ_H;
          this.rayons.push({ h, l: Lg(d.k), c: Cl(d.k), t: 0, duree: 0.34 });
          for (let i = 0; i < COTE; i++) this.etincelles(h ? i + 0.5 : cx, h ? cy : i + 0.5, 2, 3);
          this.r.son("sfx_roquette", 0.85);
          this.secousse = Math.max(this.secousse, 0.45); this.dureePop = Math.max(this.dureePop, 0.26); gros = true;
        } else if (d.sp === GRENADE) {
          this.ondes.push({ x: cx, y: cy, t: 0, duree: d.grosse ? 0.55 : 0.4, rayon: d.grosse ? 3.4 : 2.1, couleur: "255,179,71" });
          this.etincelles(cx, cy, d.grosse ? 40 : 24, 9);
          this.r.son("sfx_grenade", 1);
          this.secousse = Math.max(this.secousse, d.grosse ? 1.1 : 0.75); this.flash = Math.max(this.flash, d.grosse ? 0.5 : 0.3);
          this.dureePop = Math.max(this.dureePop, 0.3); gros = true;
        } else if (d.sp === CRANE) {
          this.eclairs.push({ x: cx, y: cy, cibles: d.cibles.map((k) => [Cl(k) + 0.5, Lg(k) + 0.5]), t: 0, duree: 0.45, graine: hasard(1e9) });
          this.ondes.push({ x: cx, y: cy, t: 0, duree: 0.6, rayon: 4.5, couleur: "155,231,255" });
          this.r.son("sfx_crane", 1); this.parler("jeu_crane", true);
          this.secousse = Math.max(this.secousse, 1.3); this.flash = Math.max(this.flash, 0.7); this.dureePop = Math.max(this.dureePop, 0.45); gros = true;
        }
      }
      let sx = 0, sy = 0;
      for (const [k, p] of v.detruites) {
        const vi = this.visuels.get(p.id);
        if (vi) vi.meurt = 0;
        sx += Cl(k); sy += Lg(k);
        this.eclats(Cl(k) + 0.5, Lg(k) + 0.5, p.type, gros ? 1.3 : 1);
      }
      for (const [k, p] of v.creees) {
        const vi = visuel(p, Cl(k), Lg(k));
        vi.nait = 0; vi.flash = 1;
        this.visuels.set(p.id, vi);
        this.etincelles(Cl(k) + 0.5, Lg(k) + 0.5, 22, 7);
        this.r.son("sfx_creation", 0.85);
        this.nbSpeciales++;
      }
      this.r.son("sfx_pop" + Math.min(6, Math.max(1, v.rang)), 0.95, 1 + Math.random() * 0.06);
      this.r.vibrer(gros ? 70 : 15);
      this.score += v.points;
      const n = Math.max(1, v.detruites.length);
      this.textes.push({ texte: "+" + v.points, x: sx / n + 0.5, y: sy / n + 0.5, t: 0, duree: 0.95, couleur: couleurBonbon(v.detruites.length ? v.detruites[0][1].type : 2), grand: false });
      if (v.rang >= 2) this.comboTexte(v.rang);
      if (this.particules.length > 900) this.particules.splice(0, this.particules.length - 900);
    }

    appliquerChutes() {
      const v = this.vagueCourante;
      if (!v) return;
      for (const ch of v.chutes) { const vi = this.visuels.get(ch.id); if (vi) { vi.cibleY = ch.vers; vi.gt = -1; } }
      for (const a of v.apparitions) { const vi = visuel(a.piece, a.c, a.de); vi.cibleY = a.vers; this.visuels.set(a.piece.id, vi); }
    }

    finCoup() {
      this.etape = "AUCUNE";
      const avant = this.vagueCourante;
      this.vagueCourante = null;
      if (avant) {
        if (this.rangMax >= 6) this.parler("jeu_legende", true);
        else if (this.rangMax >= 4) this.parler(Math.random() < 0.5 ? "jeu_zero" : "jeu_excellent");
        else if (this.rangMax === 3) this.parler(Math.random() < 0.5 ? "jeu_boum" : "jeu_ecrase");
        else if (this.combinaison) this.parler("jeu_travail");
        else if (avant.creees.some(([, p]) => p.sp === GRENADE)) this.parler("jeu_explose");
      }
      this.rangMax = 0; this.combinaison = false;
      if (this.grille.indice() === null) this.melanger();
    }

    melanger() {
      const m = this.grille.melanger();
      for (const id of [...this.visuels.keys()]) if (!m.has(id)) this.visuels.delete(id);
      for (const [id, k] of m) {
        const v = this.visuels.get(id);
        if (v) this.glisser(v, Cl(k), Lg(k), 0.45);
        else { const vi = visuel(this.grille.get(k), Cl(k), Lg(k)); vi.nait = 0; this.visuels.set(id, vi); }
      }
      this.grandTexte(t("MÉLANGE !", "SHUFFLE!"), 1, 0.4);
      this.r.son("sfx_melange", 0.9);
      this.etape = "MELANGE"; this.tEtape = 0;
    }

    terminer() {
      this.fini = true;
      this.selection = null; this.indiceVisible = null;
      this.r.son("sfx_sifflet", 0.9); this.parler("jeu_fin", true);
      this.grandTexte(t("TEMPS ÉCOULÉ !", "TIME'S UP!"), 1.35, 0.4);
    }

    grandTexte(texte, duree, decalage) {
      this.textes = this.textes.filter((x) => !x.grand);
      this.textes.push({ texte, x: COTE / 2, y: COTE / 2 - decalage, t: 0, duree, couleur: "#fff", grand: true });
    }

    comboTexte(rang) {
      const [fr, en] = rang >= 8 ? ["LÉGENDAIRE !", "LEGENDARY!"] : rang >= 6 ? ["ZÉRO PITIÉ !", "ZERO MERCY!"] : rang === 5 ? ["DÉVASTATEUR !", "DEVASTATING!"]
        : rang === 4 ? ["EXPLOSIF !", "EXPLOSIVE!"] : rang === 3 ? ["BOUM !", "BOOM!"] : ["BIEN !", "NICE!"];
      this.grandTexte(t(fr, en), 1.05, 0.6);
    }

    eclats(cx, cy, type, force) {
      const c = couleurBonbon(type);
      const n = Math.floor(8 * force);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 2 * Math.PI, v = (2.5 + Math.random() * 5) * force;
        this.particules.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, vie: 0, duree: 0.45 + Math.random() * 0.35,
          couleur: i % 3 === 0 ? "#fff" : c, taille: 0.07 + Math.random() * 0.09, genre: 0, rot: Math.random() * 360, vrot: (Math.random() - 0.5) * 900 });
      }
      this.etincelles(cx, cy, 3, 8);
      // Petite bouffée de fumée : on écrase une clope, après tout
      this.particules.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 0.8, vy: -0.5 - Math.random() * 0.6, vie: 0, duree: 0.7 + Math.random() * 0.3,
        couleur: "#CFCFCF", taille: 0.22 + Math.random() * 0.1, genre: 2, rot: 0, vrot: 0 });
    }

    etincelles(cx, cy, n, vitesse) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 2 * Math.PI, v = vitesse * (0.4 + Math.random() * 0.8);
        this.particules.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 0.3 + Math.random() * 0.35,
          couleur: Math.random() < 0.5 ? "#FFF4B8" : "#FFB347", taille: 0.035 + Math.random() * 0.03, genre: 1, rot: 0, vrot: 0 });
      }
    }
  }

  // ═════════════ FIN DU MOTEUR ═════════════

  // ─────────── Dessin des bonbons (une fois par taille de case) ───────────

  const D2R = Math.PI / 180;
  const P_CRANE = new Path2D("M12 2C6.5 2 3 5.6 3 10c0 2.6 1.2 4.6 3 5.8V19c0 .6.4 1 1 1h1.5v-2h1.5v2h4v-2h1.5v2H17c.6 0 1-.4 1-1v-3.2c1.8-1.2 3-3.2 3-5.8 0-4.4-3.5-8-9-8z");
  const P_NEZ = new Path2D("M12 13.4l-1.3 2.3h2.6z");
  const FILTRE = "#F2A95E";
  const ARC_EN_CIEL = ["#FF3D57", "#FFC23A", "#2FD36A", "#2EB2FF", "#AE5CFF", "#FF3D57"];
  const POLICE = '"Stardos Stencil", Georgia, serif';

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function rr(x, gx, gy, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    x.beginPath();
    x.moveTo(gx + r, gy);
    x.arcTo(gx + w, gy, gx + w, gy + h, r);
    x.arcTo(gx + w, gy + h, gx, gy + h, r);
    x.arcTo(gx, gy + h, gx, gy, r);
    x.arcTo(gx, gy, gx + w, gy, r);
    x.closePath();
  }
  function rond(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2); }

  function dessinerBonbon(x, s, type, sp) {
    const m = s * 0.07, w = s - 2 * m, coin = w * 0.3;
    const [base, clair, sombre] = COULEURS[type];
    x.fillStyle = "rgba(0,0,0,.45)"; rr(x, m, m + s * 0.05, w, w, coin); x.fill();
    const g = x.createRadialGradient(s * 0.38, s * 0.3, 0, s * 0.38, s * 0.3, s * 0.78);
    g.addColorStop(0, clair); g.addColorStop(0.5, base); g.addColorStop(1, sombre);
    x.fillStyle = g; rr(x, m, m, w, w, coin); x.fill();
    x.save(); rr(x, m, m, w, w, coin); x.clip();
    if (sp === ROQ_H || sp === ROQ_V) {
      x.fillStyle = "rgba(255,255,255,.5)";
      for (let i = -1; i <= 1; i++) {
        if (sp === ROQ_H) x.fillRect(0, s / 2 + i * s * 0.22 - s * 0.04, s, s * 0.08);
        else x.fillRect(s / 2 + i * s * 0.22 - s * 0.04, 0, s * 0.08, s);
      }
    } else if (sp === GRENADE) {
      x.fillStyle = rgba(sombre, 0.9); x.fillRect(0, s * 0.43, s, s * 0.14);
      x.fillStyle = "rgba(255,255,255,.55)";
      for (let i = 0; i <= 6; i++) { rond(x, s * (0.14 + i * 0.12), s * 0.5, s * 0.018); x.fill(); }
    }
    x.restore();
    x.strokeStyle = rgba(sombre, 0.75); x.lineWidth = s * 0.03; rr(x, m, m, w, w, coin); x.stroke();
    const reflet = x.createLinearGradient(0, m, 0, s * 0.52);
    reflet.addColorStop(0, "rgba(255,255,255,.6)"); reflet.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = reflet; rr(x, m + s * 0.09, m + s * 0.05, w - s * 0.18, s * 0.36, w * 0.22); x.fill();
    x.fillStyle = "rgba(255,255,255,.9)"; rond(x, m + s * 0.17, m + s * 0.15, s * 0.045); x.fill();
    const u = (s * (sp === AUCUNE ? 0.62 : 0.5)) / 24;
    x.save(); x.translate(s / 2, s / 2 + s * 0.02); icone(x, type, u); x.restore();
    if (sp === GRENADE) {
      // Goupille
      x.strokeStyle = "#E6E9EC"; x.lineWidth = s * 0.025; rond(x, s * 0.8, s * 0.2, s * 0.07); x.stroke();
      x.fillStyle = "#B9C0C6"; rr(x, s * 0.62, s * 0.08, s * 0.12, s * 0.2, s * 0.03); x.fill();
    }
  }

  /** Icône blanche de chaque bonbon, centrée sur l'origine. u = 1/24 de la taille de l'icône. */
  function icone(x, type, u) {
    const boite = (gx, gy, w, h, r, c) => { x.fillStyle = c; rr(x, gx * u, gy * u, w * u, h * u, r * u); x.fill(); };
    const disque = (cx, cy, r, c) => { x.fillStyle = c; rond(x, cx * u, cy * u, r * u); x.fill(); };
    if (type === 0) { // Clope
      x.save(); x.rotate(-38 * D2R);
      boite(-9.5, -2.3, 15.5, 4.6, 1.2, "#fff");
      boite(-9.5, -2.3, 5, 4.6, 1.2, FILTRE);
      x.fillStyle = FILTRE; x.fillRect(-6 * u, -2.3 * u, 1.5 * u, 4.6 * u);
      for (let i = 0; i <= 3; i++) disque(-8.6 + i * 1.1, i % 2 === 0 ? -0.9 : 0.9, 0.42, "#C77A2E");
      const braise = x.createLinearGradient(4.6 * u, 0, 7.6 * u, 0);
      braise.addColorStop(0, "#6A6A6A"); braise.addColorStop(0.5, "#FF7A2F"); braise.addColorStop(1, "#FFE07A");
      x.fillStyle = braise; x.fillRect(4.6 * u, -2.3 * u, 3 * u, 4.6 * u);
      disque(7.4, 0, 3, "rgba(255,210,122,.45)");
      x.restore();
      x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 1.5 * u; x.lineCap = "round";
      x.beginPath(); x.moveTo(5.6 * u, -6.4 * u); x.bezierCurveTo(3.4 * u, -8.6 * u, 8.4 * u, -9.8 * u, 5.8 * u, -12.2 * u); x.stroke();
    } else if (type === 1) { // Briquet
      x.fillStyle = "#FFB020"; x.beginPath();
      x.moveTo(-0.6 * u, -13 * u); x.bezierCurveTo(3.9 * u, -9 * u, 3.4 * u, -5.9 * u, -0.6 * u, -5.5 * u);
      x.bezierCurveTo(-4.4 * u, -5.9 * u, -4.6 * u, -9.2 * u, -0.6 * u, -13 * u); x.closePath(); x.fill();
      x.fillStyle = "#FFF6C8"; x.beginPath();
      x.moveTo(-0.6 * u, -10.6 * u); x.bezierCurveTo(1.6 * u, -8.6 * u, 1.4 * u, -6.6 * u, -0.6 * u, -6.4 * u);
      x.bezierCurveTo(-2.5 * u, -6.6 * u, -2.6 * u, -8.6 * u, -0.6 * u, -10.6 * u); x.closePath(); x.fill();
      boite(-5, -5.2, 10, 3.6, 0.9, "#E3E8EC");
      disque(3.4, -5.4, 1.8, "#8E979E");
      boite(-5, -1.8, 10, 11.8, 2.2, "#fff");
    } else if (type === 2) { // Paquet
      for (const [gx, haut] of [[-3.2, -9.6], [0, -11.4], [3.2, -8.6]]) {
        boite(gx - 1.3, haut, 2.6, -3 - haut, 0.6, "#fff");
        boite(gx - 1.3, haut, 2.6, 2.3, 0.6, FILTRE);
      }
      boite(-6.6, -4.6, 13.2, 14.4, 1.6, "#fff");
      x.fillStyle = "#E5484D"; x.fillRect(-6.6 * u, 0.6 * u, 13.2 * u, 3.6 * u);
      x.strokeStyle = "#BDB6A6"; x.lineWidth = 0.7 * u; x.beginPath(); x.moveTo(-6.6 * u, -1.6 * u); x.lineTo(6.6 * u, -1.6 * u); x.stroke();
    } else if (type === 3) { // Vapoteuse
      disque(5.2, -8.6, 2.7, "rgba(255,255,255,.92)");
      disque(8.4, -10.6, 2.2, "rgba(255,255,255,.92)");
      disque(8.5, -7, 1.9, "rgba(255,255,255,.92)");
      boite(-2.1, -10.8, 4.2, 4.4, 1, "#2B3440");
      boite(-3.9, -6.9, 7.8, 16.9, 2.7, "#fff");
      boite(-2.1, -4.6, 4.2, 6.2, 1, "#7FD9FF");
      disque(0, 5.6, 0.95, "#1E90FF");
    } else { // Cendrier
      const interieur = "#CBC3DA";
      disque(0, 0, 9.4, "#fff");
      disque(0, 0, 6.7, interieur);
      for (const a of [0, 120, 240]) { x.save(); x.rotate(a * D2R); boite(-1.4, -9.9, 2.8, 3.8, 1, interieur); x.restore(); }
      x.save(); x.rotate(25 * D2R);
      boite(-4.6, -1.3, 7.2, 2.6, 0.9, "#fff");
      boite(-4.6, -1.3, 3, 2.6, 0.9, FILTRE);
      disque(2.9, 0, 1.3, "#6E6E6E");
      x.restore();
      disque(-2.2, 3.6, 0.8, "#8E8899");
      disque(3, 3.9, 0.6, "#8E8899");
    }
  }

  function dessinerCrane(x, s) {
    const r = s * 0.43;
    x.fillStyle = "rgba(0,0,0,.5)"; rond(x, s / 2, s / 2 + s * 0.05, r); x.fill();
    const g = x.createRadialGradient(s * 0.4, s * 0.35, 0, s * 0.4, s * 0.35, r * 1.3);
    g.addColorStop(0, "#5E5E70"); g.addColorStop(0.5, "#17171F"); g.addColorStop(1, "#050507");
    x.fillStyle = g; rond(x, s / 2, s / 2, r); x.fill();
    const k = (s * 0.6) / 24;
    x.save(); x.translate(s / 2 - 12 * k, s / 2 - 11 * k); x.scale(k, k);
    x.fillStyle = "#E6E1D3"; x.fill(P_CRANE);
    x.fillStyle = "#FF2D3A"; rond(x, 8.6, 11, 2.4); x.fill(); rond(x, 15.4, 11, 2.4); x.fill();
    x.fillStyle = "#FFC2C6"; rond(x, 8.1, 10.4, 0.8); x.fill(); rond(x, 14.9, 10.4, 0.8); x.fill();
    x.fillStyle = "#0B0B10"; x.fill(P_NEZ);
    x.restore();
    x.fillStyle = "rgba(255,255,255,.55)"; rond(x, s * 0.32, s * 0.26, s * 0.05); x.fill();
  }

  class Sprites {
    constructor(px) { this.px = Math.max(8, Math.round(px)); this.cache = new Map(); }
    de(type, sp) {
      const cle = sp === CRANE ? "crane" : type + ":" + sp;
      let c = this.cache.get(cle);
      if (!c) {
        c = document.createElement("canvas");
        c.width = c.height = this.px;
        const x = c.getContext("2d");
        if (sp === CRANE) dessinerCrane(x, this.px); else dessinerBonbon(x, this.px, type, sp);
        this.cache.set(cle, c);
      }
      return c;
    }
  }

  // Petit générateur pseudo-aléatoire à graine, pour des éclairs qui crépitent sans clignoter n'importe comment
  function graine(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let q = Math.imul(a ^ (a >>> 15), 1 | a);
      q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q;
      return ((q ^ (q >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ─────────── Dessin d'une image de la partie ───────────

  function dessinerPartie(x, p, W, sprites, curseur) {
    const cs = W / COTE, dp = cs / 45;
    const sh = REDUIT ? 0 : p.secousse;
    const dx = sh > 0 ? (Math.sin(p.horloge * 93) * 7 + Math.sin(p.horloge * 57) * 4) * sh * dp : 0;
    const dy = sh > 0 ? (Math.cos(p.horloge * 81) * 6 + Math.cos(p.horloge * 43) * 3) * sh * dp : 0;
    x.clearRect(0, 0, W, W);
    x.save();
    x.translate(dx, dy);
    x.fillStyle = "#130D0C"; rr(x, 0, 0, W, W, cs * 0.3); x.fill();
    for (let l = 0; l < COTE; l++) for (let c = 0; c < COTE; c++) {
      x.fillStyle = (l + c) % 2 === 0 ? "#241917" : "#1C1312";
      rr(x, c * cs + cs * 0.04, l * cs + cs * 0.04, cs * 0.92, cs * 0.92, cs * 0.2); x.fill();
    }
    const pulse = 0.5 + 0.5 * Math.sin(p.horloge * 7);
    const cadre = (k, couleur, epaisseur) => { x.strokeStyle = couleur; x.lineWidth = epaisseur; rr(x, Cl(k) * cs + cs * 0.02, Lg(k) * cs + cs * 0.02, cs * 0.96, cs * 0.96, cs * 0.22); x.stroke(); };
    if (p.indiceVisible) for (const k of p.indiceVisible) cadre(k, rgba("#FFE27A", 0.25 + 0.35 * pulse), cs * 0.07);
    if (p.selection !== null) cadre(p.selection, "rgba(255,255,255,.85)", cs * 0.06);
    if (curseur !== null) { x.setLineDash([cs * 0.12, cs * 0.08]); cadre(curseur, "#9AA36A", cs * 0.05); x.setLineDash([]); }

    x.save();
    x.beginPath(); x.rect(0, 0, W, W); x.clip();
    for (const v of p.visuels.values()) {
      const cx = (v.x + 0.5) * cs, cy = (v.y + 0.5) * cs;
      if (cy < -cs) continue;
      let sc = 1, alpha = 1;
      if (v.meurt >= 0) { const q = Math.min(1, Math.max(0, v.meurt / 0.22)); sc = 1 + 0.45 * q; alpha = 1 - q; }
      if (v.nait >= 0) { const q = Math.min(1, Math.max(0, v.nait / 0.4)); sc = 0.3 + 0.95 * q + 0.25 * Math.sin(q * Math.PI); }
      if (p.selection !== null && v.gt < 0 && p.selection === K(Math.round(v.y), Math.round(v.x))) sc *= 1.08;
      const indice = p.indiceVisible && p.indiceVisible.some((k) => Lg(k) === v.y && Cl(k) === v.x);
      const angle = indice ? Math.sin(p.horloge * 18) * 8 : 0;
      const sx = sc * (1 + 0.16 * v.ecrase), sy = sc * (1 - 0.16 * v.ecrase);
      const sp = v.piece.sp;
      x.globalAlpha = alpha;
      // Halo animé des spéciales
      if (sp === CRANE) {
        if (x.createConicGradient) {
          const g = x.createConicGradient(p.horloge * 160 * D2R, cx, cy);
          ARC_EN_CIEL.forEach((c, i) => g.addColorStop(i / (ARC_EN_CIEL.length - 1), c));
          x.strokeStyle = g;
        } else x.strokeStyle = "#FFE27A";
        x.lineWidth = cs * 0.07; rond(x, cx, cy, cs * 0.47 * sc); x.stroke();
      } else if (sp === GRENADE) {
        const R = cs * (0.68 + 0.08 * pulse);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, "rgba(255,179,71,.85)"); g.addColorStop(0.5, "rgba(255,106,0,.35)"); g.addColorStop(1, "rgba(255,106,0,0)");
        x.fillStyle = g; rond(x, cx, cy, R); x.fill();
      } else if (sp === ROQ_H || sp === ROQ_V) {
        const h = sp === ROQ_H, ec = cs * (0.5 + 0.05 * pulse);
        x.fillStyle = "rgba(255,255,255,.9)";
        for (const sens of [-1, 1]) {
          x.beginPath();
          if (h) { x.moveTo(cx + sens * ec, cy); x.lineTo(cx + sens * (ec - cs * 0.12), cy - cs * 0.1); x.lineTo(cx + sens * (ec - cs * 0.12), cy + cs * 0.1); }
          else { x.moveTo(cx, cy + sens * ec); x.lineTo(cx - cs * 0.1, cy + sens * (ec - cs * 0.12)); x.lineTo(cx + cs * 0.1, cy + sens * (ec - cs * 0.12)); }
          x.closePath(); x.fill();
        }
      }
      x.save();
      if (angle) { x.translate(cx, cy); x.rotate(angle * D2R); x.translate(-cx, -cy); }
      const py = cy + cs * 0.43;
      x.translate(cx, py); x.scale(sx, sy); x.translate(-cx, -py);
      x.drawImage(sprites.de(v.piece.type, sp), cx - cs / 2, cy - cs / 2, cs, cs);
      if (v.flash > 0) { x.globalAlpha = 0.75 * v.flash * alpha; x.fillStyle = "#fff"; rr(x, cx - cs * 0.43, cy - cs * 0.43, cs * 0.86, cs * 0.86, cs * 0.26); x.fill(); }
      x.restore();
    }
    x.globalAlpha = 1;
    x.restore();

    // Rayons des roquettes
    for (const r of p.rayons) {
      const a = Math.min(1, Math.max(0, 1 - r.t / r.duree)), avance = Math.min(1, r.t / 0.1);
      if (r.h) {
        const y = (r.l + 0.5) * cs, x0 = (r.c + 0.5) * cs, g = x0 * (1 - avance), d = x0 + (W - x0) * avance;
        x.fillStyle = `rgba(255,233,168,${0.35 * a})`; x.fillRect(g, y - cs * 0.48, d - g, cs * 0.96);
        x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(g, y - cs * 0.09, d - g, cs * 0.18);
      } else {
        const gx = (r.c + 0.5) * cs, y0 = (r.l + 0.5) * cs, h = y0 * (1 - avance), b = y0 + (W - y0) * avance;
        x.fillStyle = `rgba(255,233,168,${0.35 * a})`; x.fillRect(gx - cs * 0.48, h, cs * 0.96, b - h);
        x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(gx - cs * 0.09, h, cs * 0.18, b - h);
      }
    }
    // Ondes de choc
    for (const o of p.ondes) {
      const k = Math.min(1, Math.max(0, o.t / o.duree)), e = 1 - (1 - k) * (1 - k);
      x.fillStyle = `rgba(255,255,255,${0.4 * (1 - k)})`; rond(x, o.x * cs, o.y * cs, o.rayon * cs * e * 0.75); x.fill();
      x.strokeStyle = `rgba(${o.couleur},${0.95 * (1 - k)})`; x.lineWidth = cs * 0.22 * (1 - k) + 1;
      rond(x, o.x * cs, o.y * cs, o.rayon * cs * e); x.stroke();
    }
    // Éclairs du crâne
    x.lineCap = "round"; x.lineJoin = "round";
    for (const ec of p.eclairs) {
      const k = Math.min(1, Math.max(0, ec.t / ec.duree));
      const r = graine(ec.graine + Math.floor(p.horloge * 30));
      const dex = ec.x * cs, dey = ec.y * cs;
      for (const [tx, ty] of ec.cibles) {
        const vx = tx * cs, vy = ty * cs;
        const nx = -(vy - dey), ny = vx - dex, n = Math.max(1, Math.hypot(nx, ny));
        const pts = [[dex, dey]];
        for (let i = 1; i <= 5; i++) { const q = i / 6, j = (r() - 0.5) * cs * 0.7; pts.push([dex + (vx - dex) * q + (nx / n) * j, dey + (vy - dey) * q + (ny / n) * j]); }
        pts.push([vx, vy]);
        for (const [couleur, largeur] of [[`rgba(127,219,255,${0.45 * (1 - k)})`, cs * 0.16], [`rgba(255,255,255,${1 - k})`, cs * 0.05]]) {
          x.strokeStyle = couleur; x.lineWidth = largeur;
          x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke();
        }
      }
    }
    // Particules
    for (const q of p.particules) {
      const k = Math.min(1, Math.max(0, q.vie / q.duree)), px = q.x * cs, py = q.y * cs;
      if (q.genre === 0) {
        x.save(); x.translate(px, py); x.rotate(q.rot * D2R);
        x.globalAlpha = 1 - k; x.fillStyle = q.couleur;
        x.fillRect(-q.taille * cs / 2, -q.taille * cs / 3, q.taille * cs, q.taille * cs * 0.66);
        x.restore();
      } else if (q.genre === 1) {
        x.globalAlpha = 1 - k; x.strokeStyle = q.couleur; x.lineWidth = q.taille * cs;
        x.beginPath(); x.moveTo(px - q.vx * cs * 0.025, py - q.vy * cs * 0.025); x.lineTo(px, py); x.stroke();
      } else if (q.genre === 2) {
        x.globalAlpha = 0.32 * (1 - k); x.fillStyle = q.couleur; rond(x, px, py, q.taille * cs * (1 + 2.2 * k)); x.fill();
      } else {
        x.globalAlpha = 1 - k; x.fillStyle = q.couleur; rond(x, px, py, q.taille * cs); x.fill();
      }
    }
    x.globalAlpha = 1;
    // Textes : points et combos
    x.textAlign = "center"; x.textBaseline = "middle";
    for (const tx of p.textes) {
      const k = Math.min(1, Math.max(0, tx.t / tx.duree)), cx = tx.x * cs, cy = tx.y * cs;
      if (tx.grand) {
        const taille = cs * 1.02;
        x.font = `700 ${taille}px ${POLICE}`;
        const w = x.measureText(tx.texte).width;
        const sc = k < 0.12 ? 0.4 + 0.85 * (k / 0.12) : k < 0.25 ? 1.25 - 0.25 * ((k - 0.12) / 0.13) : 1;
        const a = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
        const ajust = Math.min(1, (W * 0.92) / w);
        x.save(); x.translate(cx, cy); x.rotate(-6 * D2R); x.scale(sc * ajust, sc * ajust);
        x.fillStyle = "#2A0A0A";
        x.globalAlpha = a * 0.6; x.fillText(tx.texte, 2 * dp, 4 * dp);
        x.globalAlpha = a; x.strokeStyle = "#2A0A0A"; x.lineWidth = 5 * dp; x.strokeText(tx.texte, 0, 0);
        const g = x.createLinearGradient(0, -taille / 2, 0, taille / 2);
        g.addColorStop(0, "#FFF7B0"); g.addColorStop(0.5, "#FFC21A"); g.addColorStop(1, "#FF5A1F");
        x.fillStyle = g; x.fillText(tx.texte, 0, 0);
        x.restore();
      } else {
        const a = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
        x.font = `700 ${cs * 0.44}px ${POLICE}`;
        x.globalAlpha = a;
        x.fillStyle = "#1A0A0A"; x.fillText(tx.texte, cx + 2 * dp, cy + 2 * dp);
        x.fillStyle = tx.couleur; x.fillText(tx.texte, cx, cy);
        x.globalAlpha = 1;
      }
    }
    x.restore();
    if (!REDUIT && p.flash > 0) { x.fillStyle = `rgba(255,255,255,${0.5 * p.flash})`; x.fillRect(0, 0, W, W); }
  }

  // ─────────── Sons et voix ───────────

  const SFX = ["sfx_tic", "sfx_swap", "sfx_non", "sfx_toc", "sfx_sifflet", "sfx_roquette", "sfx_grenade", "sfx_crane", "sfx_creation",
    "sfx_pop1", "sfx_pop2", "sfx_pop3", "sfx_pop4", "sfx_pop5", "sfx_pop6", "sfx_melange", "sfx_record"];
  const VOIX = ["jeu_go", "jeu_dix", "jeu_vite", "jeu_crane", "jeu_legende", "jeu_zero", "jeu_excellent", "jeu_boum", "jeu_ecrase",
    "jeu_travail", "jeu_explose", "jeu_fin", "jeu_record", "jeu_encore"];

  const lire = (cle, defaut) => { try { const v = localStorage.getItem(cle); return v === null ? defaut : v; } catch (e) { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, String(v)); } catch (e) { /* stockage indisponible */ } };

  const Son = {
    ctx: null, tampons: new Map(), pret: null,
    actif: lire("pn_jeu_son", "1") === "1",
    init() {
      if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return this.pret; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.pret = Promise.resolve(); return this.pret; }
      this.ctx = new AC();
      const L = EN ? "en" : "fr";
      const fichiers = SFX.map((n) => [n, `/audio/sfx/${n}.mp3`]).concat(VOIX.map((n) => [n, `/audio/${L}/${n}.mp3`]));
      this.pret = Promise.all(fichiers.map(async ([nom, url]) => {
        try {
          const brut = await (await fetch(url)).arrayBuffer();
          const tampon = await new Promise((ok, ko) => this.ctx.decodeAudioData(brut, ok, ko));
          this.tampons.set(nom, tampon);
        } catch (e) { /* un son manquant ne bloque pas la partie */ }
      }));
      return this.pret;
    },
    jouer(nom, volume = 1, vitesse = 1) {
      if (!this.actif || !this.ctx) return;
      const tampon = this.tampons.get(nom);
      if (!tampon) return;
      const src = this.ctx.createBufferSource();
      src.buffer = tampon;
      src.playbackRate.value = Math.min(2, Math.max(0.5, vitesse));
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      src.connect(gain); gain.connect(this.ctx.destination);
      src.start();
    },
  };
  const tactile = window.matchMedia("(pointer: coarse)").matches && "vibrate" in navigator;
  const retours = {
    son: (nom, volume = 1, vitesse = 1) => Son.jouer(nom, volume * 0.85, vitesse),
    voix: (id) => Son.jouer(id, 1, 1),
    vibrer: (ms) => { if (tactile && Son.actif) try { navigator.vibrate(ms); } catch (e) { /* refusé */ } },
  };

  // ─────────── L'écran ───────────

  const GRADES = EN
    ? [[0, "Recruit"], [8000, "Soldier"], [15000, "Corporal"], [22000, "Sergeant"], [30000, "Commando"], [40000, "Lieutenant"], [52000, "Captain"], [70000, "Legend"]]
    : [[0, "Recrue"], [8000, "Soldat"], [15000, "Caporal"], [22000, "Sergent"], [30000, "Commando"], [40000, "Lieutenant"], [52000, "Capitaine"], [70000, "Légende"]];
  const grade = (score) => GRADES.filter(([seuil]) => score >= seuil).pop()[1];
  const fmt = (n) => String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? "," : " ");
  const deuxPoints = EN ? ":" : " :";
  const ICONE_SON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path class="ondes" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="muet" d="M16 9l5 6M21 9l-5 6"/></svg>';

  racine.innerHTML = `
<div class="jeu-hud">
  <div class="jeu-score"><span class="jeu-label">Score</span><output>0</output></div>
  <div class="jeu-record"><span class="jeu-label">${t("Record", "Best")}</span><output>0</output></div>
  <button class="jeu-son" type="button" aria-pressed="${Son.actif}" aria-label="${t("Son du jeu", "Game sound")}">${ICONE_SON}</button>
</div>
<div class="jeu-temps"><div class="jeu-barre" aria-hidden="true"><span></span></div><span class="jeu-chrono" role="timer" aria-label="${t("Temps restant", "Time left")}">3:00</span></div>
<div class="jeu-plateau">
  <canvas role="application" tabindex="0" aria-label="${t("Plateau d'Écrase-Clopes, 8 cases sur 8. Au clavier : flèches pour se déplacer, Entrée pour choisir une pièce puis sa voisine.", "Cig Crush board, 8 by 8. Keyboard: arrows to move, Enter to pick a piece and then its neighbour.")}"></canvas>
  <div class="jeu-ecran jeu-depart">
    <p class="jeu-depart-titre">${t("Trois minutes. Écrase tout ce qui fume.", "Three minutes. Crush everything that smokes.")}</p>
    <button class="bouton jeu-lancer" type="button">${t("Lancer la partie", "Start the game")}</button>
    <p class="jeu-note">${t("Monte le son : le Sergent commente chaque coup.", "Turn the sound up: the Sergeant comments on every move.")}</p>
  </div>
  <div class="jeu-ecran jeu-fin" hidden>
    <p class="jeu-fin-titre"></p>
    <p class="jeu-fin-score"></p>
    <p class="jeu-fin-record"></p>
    <p class="jeu-fin-grade"></p>
    <p class="jeu-fin-combo"></p>
    <div class="jeu-fin-boutons">
      <button class="bouton jeu-rejouer" type="button">${t("Rejouer", "Play again")}</button>
      <button class="bouton bouton-trait jeu-defier" type="button">${t("Défier un pote", "Challenge a friend")}</button>
    </div>
    <p class="message jeu-fin-message" role="status" aria-live="polite"></p>
    <p class="jeu-note">${t("Dans l'appli, le Sergent te lance une partie à chaque envie.", "In the app, the Sergeant throws you a game every time a craving hits.")} <a href="#signer">${t("Signe ton ordre pour la sortie", "Sign up for launch day")}</a>.</p>
  </div>
</div>
<div class="jeu-pied">
  <p class="jeu-aide">${t("Glisse une pièce vers sa voisine pour en aligner 3 ou plus.", "Swipe a piece towards its neighbour to line up 3 or more.")}</p>
  <button class="jeu-arreter" type="button" hidden>${t("Arrêter la partie", "Stop the game")}</button>
</div>
<ul class="jeu-legende">
  <li><canvas width="26" height="26" data-type="0" data-sp="${ROQ_H}"></canvas>${t("4 en ligne : roquette", "4 in a row: rocket")}</li>
  <li><canvas width="26" height="26" data-type="3" data-sp="${GRENADE}"></canvas>${t("En L ou en T : grenade", "L or T shape: grenade")}</li>
  <li><canvas width="26" height="26" data-type="${TYPE_CRANE}" data-sp="${CRANE}"></canvas>${t("5 en ligne : crâne", "5 in a row: skull")}</li>
</ul>`;

  const $ = (s) => racine.querySelector(s);
  const toile = $(".jeu-plateau canvas"), ctx = toile.getContext("2d");
  const elScore = $(".jeu-score output"), elRecord = $(".jeu-record output"), elBarre = $(".jeu-barre span"), elChrono = $(".jeu-chrono");
  const elDepart = $(".jeu-depart"), elFin = $(".jeu-fin"), elLancer = $(".jeu-lancer"), elArreter = $(".jeu-arreter"), elSon = $(".jeu-son");
  const elMessage = $(".jeu-fin-message");

  let W = 0, dpr = 1, sprites = null;
  let partie = new Partie(retours, true);
  let enJeu = false, panneau = false, raf = 0, dernier = 0, visible = true;
  let recordAvant = parseInt(lire("pn_jeu_record", "0"), 10) || 0;
  let curseur = null, clavier = false;
  const affiche = { score: "", record: "", chrono: "", phase: "", urgence: null, mieux: null };

  function dimensionner() {
    const w = toile.clientWidth;
    if (!w) return;
    const d = window.devicePixelRatio || 1;
    if (w === W && d === dpr) return;
    W = w; dpr = d;
    toile.width = Math.round(W * dpr); toile.height = Math.round(W * dpr);
    sprites = new Sprites((W / COTE) * dpr);
    rendre();
  }
  function rendre() {
    if (!sprites) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dessinerPartie(ctx, partie, W, sprites, clavier && document.activeElement === toile && enJeu ? curseur : null);
  }
  function majHud() {
    const s = fmt(partie.scoreAffiche);
    if (s !== affiche.score) { elScore.textContent = s; affiche.score = s; }
    const r = fmt(Math.max(recordAvant, partie.score));
    if (r !== affiche.record) { elRecord.textContent = r; affiche.record = r; }
    const mieux = partie.score > recordAvant && recordAvant > 0;
    if (mieux !== affiche.mieux) { elRecord.classList.toggle("mieux", mieux); affiche.mieux = mieux; }
    const reste = partie.temps, sec = Math.ceil(reste);
    elBarre.style.transform = `scaleX(${Math.min(1, Math.max(0, reste / DUREE))})`;
    const phase = reste > 60 ? "1" : reste > 10 ? "2" : "3";
    if (phase !== affiche.phase) { elBarre.dataset.phase = phase; affiche.phase = phase; }
    const chrono = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    if (chrono !== affiche.chrono) { elChrono.textContent = chrono; affiche.chrono = chrono; }
    const urgence = reste <= 10 && enJeu && !partie.fini;
    if (urgence !== affiche.urgence) { elChrono.classList.toggle("urgence", urgence); affiche.urgence = urgence; }
    elChrono.style.transform = urgence && !REDUIT ? `scale(${1 + 0.12 * (sec % 2)})` : "";
  }

  function boucle(temps) {
    raf = 0;
    const dt = dernier ? Math.min(0.05, Math.max(0, (temps - dernier) / 1000)) : 0.016;
    dernier = temps;
    partie.avancer(dt);
    rendre();
    majHud();
    if (partie.fini && enJeu) {
      enJeu = false;
      elArreter.hidden = true;
      setTimeout(montrerFin, 1400);
    }
    if (!panneau && visible) raf = requestAnimationFrame(boucle);
  }
  function relancer() { if (!raf && !panneau && visible && (enJeu || partie.fini)) { dernier = 0; raf = requestAnimationFrame(boucle); } }

  async function lancer() {
    elLancer.disabled = true;
    elLancer.textContent = t("Chargement…", "Loading…");
    const charge = Son.init();
    if (Son.actif) await Promise.race([charge, new Promise((ok) => setTimeout(ok, 4000))]);
    if (navigator.vibrate && tactile) try { navigator.vibrate(1); } catch (e) { /* rien */ }
    recordAvant = parseInt(lire("pn_jeu_record", "0"), 10) || 0;
    partie = new Partie(retours);
    enJeu = true; panneau = false;
    elDepart.hidden = true; elFin.hidden = true; elArreter.hidden = false;
    elLancer.disabled = false; elLancer.textContent = t("Lancer la partie", "Start the game");
    curseur = K(3, 3);
    toile.focus({ preventScroll: true });
    if (raf) cancelAnimationFrame(raf);
    raf = 0; dernier = 0;
    relancer();
  }

  function montrerFin() {
    const score = partie.score, record = score > recordAvant;
    if (record) ecrire("pn_jeu_record", score);
    const meilleur = Math.max(recordAvant, score);
    $(".jeu-fin-titre").textContent = partie.abandon ? t("Partie arrêtée", "Game stopped") : t("Temps écoulé", "Time's up");
    $(".jeu-fin-score").textContent = fmt(score);
    $(".jeu-fin-score").classList.toggle("mieux", record);
    $(".jeu-fin-record").textContent = record ? t("Nouveau record !", "New record!") : `${t("Record", "Best")}${deuxPoints} ${fmt(meilleur)}`;
    $(".jeu-fin-grade").textContent = `${t("Grade", "Rank")}${deuxPoints} ${grade(score)}`;
    $(".jeu-fin-combo").textContent = partie.meilleurCombo >= 3 ? `${t("Meilleure réaction en chaîne", "Best chain reaction")}${deuxPoints} x${partie.meilleurCombo}` : "";
    elMessage.textContent = ""; elMessage.removeAttribute("data-etat");
    panneau = true;
    elFin.hidden = false;
    $(".jeu-rejouer").focus({ preventScroll: true });
    if (!partie.abandon) {
      if (record) { retours.son("sfx_record", 0.9); setTimeout(() => retours.voix("jeu_record"), 350); }
      else if (score < 12000) setTimeout(() => retours.voix("jeu_encore"), 300);
    }
  }

  function arreter() {
    if (!enJeu) return;
    partie.abandon = true; partie.fini = true; partie.selection = null; partie.indiceVisible = null;
    enJeu = false; elArreter.hidden = true;
    rendre();
    montrerFin();
  }

  async function defier() {
    const score = partie.score;
    const url = location.origin + (EN ? "/en" : "/") + "#jeu";
    const texte = t(`J'ai écrasé ${fmt(score)} points à Écrase-Clopes, grade ${grade(score)}. À toi, soldat :`, `I crushed ${fmt(score)} points at Cig Crush, rank ${grade(score)}. Your turn, soldier:`);
    if (navigator.share) {
      try { await navigator.share({ title: t("Écrase-Clopes", "Cig Crush"), text: texte, url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(`${texte} ${url}`);
      elMessage.dataset.etat = "ok";
      elMessage.textContent = t("Défi copié. Colle-le à ton pote.", "Challenge copied. Paste it to your friend.");
    } catch (e) {
      elMessage.textContent = `${texte} ${url}`;
    }
  }

  // Tactile et souris : glisser vers une voisine, ou taper deux pièces
  let geste = null;
  toile.addEventListener("pointerdown", (e) => {
    if (!enJeu || (e.pointerType === "mouse" && e.button !== 0)) return;
    clavier = false;
    const r = toile.getBoundingClientRect(), cs = r.width / COTE;
    const x = e.clientX - r.left, y = e.clientY - r.top;
    geste = { id: e.pointerId, x, y, cs, l: Math.min(COTE - 1, Math.max(0, Math.floor(y / cs))), c: Math.min(COTE - 1, Math.max(0, Math.floor(x / cs))), fait: false };
    try { toile.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
    e.preventDefault();
  });
  toile.addEventListener("pointermove", (e) => {
    if (!geste || geste.id !== e.pointerId || geste.fait) return;
    const r = toile.getBoundingClientRect();
    const dx = e.clientX - r.left - geste.x, dy = e.clientY - r.top - geste.y;
    if (Math.abs(dx) > geste.cs * 0.32 || Math.abs(dy) > geste.cs * 0.32) {
      geste.fait = true;
      const l = Math.abs(dx) > Math.abs(dy) ? geste.l : geste.l + (dy > 0 ? 1 : -1);
      const c = Math.abs(dx) > Math.abs(dy) ? geste.c + (dx > 0 ? 1 : -1) : geste.c;
      if (dans(l, c)) partie.tenter(K(geste.l, geste.c), K(l, c));
    }
  });
  const finGeste = (e) => {
    if (!geste || geste.id !== e.pointerId) return;
    if (!geste.fait && e.type === "pointerup") partie.taper(K(geste.l, geste.c));
    geste = null;
  };
  toile.addEventListener("pointerup", finGeste);
  toile.addEventListener("pointercancel", finGeste);

  // Clavier : flèches pour déplacer le curseur, Entrée ou Espace pour choisir
  toile.addEventListener("keydown", (e) => {
    if (!enJeu) return;
    const dir = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (curseur === null) curseur = K(3, 3);
    if (dir) {
      clavier = true;
      const l = Lg(curseur) + dir[0], c = Cl(curseur) + dir[1];
      if (dans(l, c)) curseur = K(l, c);
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      clavier = true;
      partie.taper(curseur);
      e.preventDefault();
    }
  });
  toile.addEventListener("blur", () => { clavier = false; });

  elLancer.addEventListener("click", lancer);
  $(".jeu-rejouer").addEventListener("click", lancer);
  $(".jeu-defier").addEventListener("click", defier);
  elArreter.addEventListener("click", arreter);
  elSon.addEventListener("click", () => {
    Son.actif = !Son.actif;
    ecrire("pn_jeu_son", Son.actif ? "1" : "0");
    elSon.setAttribute("aria-pressed", String(Son.actif));
    if (Son.actif) Son.init();
  });

  // Hors de l'écran, la partie se met en pause
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entrees) => {
      visible = entrees[0].isIntersecting;
      if (visible) relancer();
    }, { threshold: 0.3 }).observe(toile);
  }
  if ("ResizeObserver" in window) new ResizeObserver(dimensionner).observe(toile);
  window.addEventListener("resize", dimensionner);

  // Légende : les bonbons spéciaux en vrai
  for (const c of racine.querySelectorAll(".jeu-legende canvas")) {
    const d = window.devicePixelRatio || 1, px = Math.round(26 * d);
    c.width = px; c.height = px;
    c.getContext("2d").drawImage(new Sprites(px).de(parseInt(c.dataset.type, 10), parseInt(c.dataset.sp, 10)), 0, 0);
  }

  elRecord.textContent = fmt(recordAvant);
  dimensionner();
  majHud();
  if (document.fonts && document.fonts.load) document.fonts.load(`700 40px ${POLICE}`).catch(() => {});
})();
