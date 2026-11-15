// Teste le moteur d'Écrase-Clopes extrait de site/jeu.js (sans DOM).
const fs = require("fs");
const src = fs.readFileSync(process.argv[2], "utf8");
const debut = src.indexOf("// ═════════════ MOTEUR");
const fin = src.indexOf("// ═════════════ FIN DU MOTEUR");
if (debut < 0 || fin < 0) throw new Error("marqueurs introuvables");
const code = "const EN = false; const t = (fr, en) => fr;\n" + src.slice(debut, fin) +
  "\nreturn { Grille, Partie, TOUTES, COTE, K, Lg, Cl, AUCUNE, CRANE, GRENADE, ROQ_H, ROQ_V };";
const M = new Function(code)();
let erreurs = 0;
const verif = (cond, msg) => { if (!cond) { erreurs++; if (erreurs < 15) console.log("ÉCHEC :", msg); } };

function verifierGrille(g, ctx) {
  const ids = new Set();
  for (const k of M.TOUTES) {
    const p = g.get(k);
    verif(p, `${ctx} : case vide ${k}`);
    if (p) { verif(!ids.has(p.id), `${ctx} : id en double ${p.id}`); ids.add(p.id); }
  }
}

// 1) Moteur seul : des milliers de coups valides
const stats = { coups: 0, vagues: 0, combos: 0, cranes: 0, grenades: 0, roquettes: 0, melanges: 0, rangMax: 0, combinaisons: 0 };
for (let partie = 0; partie < 300; partie++) {
  const g = new M.Grille(); g.remplir();
  verifierGrille(g, "départ");
  verif(g.alignements().length === 0, "alignement au départ");
  for (let coup = 0; coup < 60; coup++) {
    let ind = g.indice();
    if (!ind) { g.melanger(); stats.melanges++; ind = g.indice(); verif(ind, "pas de coup après mélange"); verifierGrille(g, "mélange"); }
    const vagues = g.jouer(ind[0], ind[1]);
    verif(Array.isArray(vagues) && vagues.length > 0, "coup indiqué refusé");
    stats.coups++;
    for (const v of vagues) {
      stats.vagues++;
      verif(v.points > 0, "vague sans points");
      if (v.combinaison) stats.combinaisons++;
      stats.rangMax = Math.max(stats.rangMax, v.rang);
      for (const [, p] of v.creees) { if (p.sp === M.CRANE) stats.cranes++; else if (p.sp === M.GRENADE) stats.grenades++; else stats.roquettes++; }
    }
    verifierGrille(g, "après coup");
    verif(g.alignements().length === 0, "alignement restant après coup");
  }
  // Un coup invalide ne change rien
  const avant = JSON.stringify(g.cases);
  let invalide = null;
  for (let l = 0; l < M.COTE && !invalide; l++) for (let c = 0; c + 1 < M.COTE && !invalide; c++) if (!g.coupValide(M.K(l, c), M.K(l, c + 1))) invalide = [M.K(l, c), M.K(l, c + 1)];
  if (invalide) { verif(g.jouer(invalide[0], invalide[1]) === null, "coup invalide accepté"); verif(JSON.stringify(g.cases) === avant, "coup invalide a modifié la grille"); }
}
console.log("Moteur :", JSON.stringify(stats));

// 2) Combinaisons forcées : crâne + crâne, crâne + spéciale, roquette + grenade, grenade + grenade
for (const [sp1, sp2, nom] of [[M.CRANE, M.CRANE, "crâne+crâne"], [M.CRANE, M.ROQ_H, "crâne+roquette"], [M.CRANE, M.GRENADE, "crâne+grenade"], [M.CRANE, M.AUCUNE, "crâne+simple"], [M.ROQ_H, M.ROQ_V, "roquette+roquette"], [M.ROQ_V, M.GRENADE, "roquette+grenade"], [M.GRENADE, M.GRENADE, "grenade+grenade"]]) {
  for (let i = 0; i < 50; i++) {
    const g = new M.Grille(); g.remplir();
    const a = M.K(3, 3), b = M.K(3, 4);
    g.set(a, { id: g.nid(), type: sp1 === M.CRANE ? -1 : 1, sp: sp1 });
    g.set(b, { id: g.nid(), type: sp2 === M.CRANE ? -1 : 2, sp: sp2 });
    const v = g.jouer(a, b);
    verif(v && v[0].combinaison === (sp2 !== M.AUCUNE || sp1 === M.CRANE), `${nom} : pas de combinaison`);
    verifierGrille(g, nom);
    verif(g.alignements().length === 0, `${nom} : alignement restant`);
  }
}
console.log("Combinaisons forcées : OK");

// 3) Parties complètes avec animations, comme dans la page
const sons = new Map();
const retours = { son: (n) => sons.set(n, (sons.get(n) || 0) + 1), voix: (n) => sons.set(n, (sons.get(n) || 0) + 1), vibrer: () => {} };
for (let n = 0; n < 6; n++) {
  const p = new M.Partie(retours);
  let images = 0;
  while (!p.fini && images < 60 * 200) {
    p.avancer(1 / 60);
    images++;
    if (p.libre() && Math.random() < 0.08) {
      const ind = p.grille.indice();
      if (ind && Math.random() < 0.85) p.tenter(ind[0], ind[1]);
      else { const a = M.K(Math.floor(Math.random() * 8), Math.floor(Math.random() * 7)); p.tenter(a, a + 1); }
    }
    if (p.libre() && p.visuels.size !== 64) verif(false, `visuels au repos : ${p.visuels.size}`);
  }
  for (let i = 0; i < 120; i++) p.avancer(1 / 60);
  verif(p.fini, "partie jamais terminée");
  verif(p.score > 0, "score nul");
  verifierGrille(p.grille, "fin de partie");
  console.log(`Partie ${n + 1} : score ${p.score}, combo max x${p.meilleurCombo}, spéciales ${p.nbSpeciales}, durée ${(images / 60).toFixed(1)} s`);
}
console.log("Sons joués :", [...sons.keys()].sort().join(" "));
console.log(erreurs ? `${erreurs} ÉCHEC(S)` : "TOUT EST OK");
process.exit(erreurs ? 1 : 0);
