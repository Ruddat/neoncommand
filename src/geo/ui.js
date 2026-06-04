// ====== UI SYSTEM (HUD, Intel, BuildBar) ======
import { NATIONS, BLDS, MAP_POS } from './data.js';
import { playAlert } from './audio.js';

export function drawHUD(G) {
  const el = document.getElementById('hud');
  if (!el) return;
  if (G.mode === 'menu') { el.innerHTML = '<b style="color:#00d9ff">NEON COMMAND</b><br>Geopolitik'; return; }
  const n = NATIONS[G.nation];
  const nt = Math.max(0, Math.ceil(G.turnLength - G.turnTimer));
  const aiBldCount = G.enemyNations.reduce((s, k) => s + (G.ai[k]?.buildings.length || 0), 0);
  el.innerHTML = `<div style="font-size:13px;font-weight:900;color:${n.color}">${n.flag} ${n.name}</div>
    <div>Geld <b style="color:#ffb000">${Math.floor(G.money)}$</b> <span style="color:#888">(+${Math.floor(G.income)}/s)</span></div>
    <div>Mil <b style="color:#ef4444">${Math.floor(G.mil)}</b> \u00b7 Def <b style="color:#22c55e">${Math.floor(G.defense)}</b> \u00b7 Off <b style="color:#a855f7">${G.offense}</b></div>
    <div>Tech <b style="color:#3b82f6">${Math.floor(G.tech)}</b></div><hr>
    <div>Runde <b>${G.turn}</b> \u00b7 N\u00e4chste in <b style="color:#00d9ff">${nt}s</b></div>
    <div style="font-size:10px;color:#888">Deine Geb\u00e4ude: ${G.buildings.length} | KI Geb\u00e4ude: ${aiBldCount} | Verb\u00fcndete: ${G.allies.length}/4</div>
    ${G.attackMode ? '<div style="font-size:12px;font-weight:900;color:#a855f7">\u{1F3AF} ANGRIFFSMODUS \u2013 Klicke auf Feind!</div>' : ''}
    ${G.diplomacyMode ? '<div style="font-size:12px;font-weight:900;color:#00ff9d">\u{1F91D} DIPLOMATIE \u2013 Klicke auf Nation! (-20$)</div>' : ''}
    ${G.attackCooldown > 0 ? `<div style="font-size:10px;color:#ff345d">\u23F3 Raketen laden: ${Math.ceil(G.attackCooldown)}s</div>` : ''}
    ${G.nuclearWinter ? '<div style="font-size:11px;font-weight:900;color:#88ccff">\u2744\uFE0F NUKLEARWINTER! Einkommen -30%</div>' : ''}
    ${G.nukeCount > 0 && !G.nuclearWinter ? `<div style="font-size:10px;color:#ffb000">\u2622\uFE0F Nukes: ${G.nukeCount}/3 bis Winter</div>` : ''}`;
}

export function drawIntel(G) {
  const el = document.getElementById('intel');
  if (!el) return;
  if (G.mode !== 'playing') { el.innerHTML = ''; return; }
  let html = '<div style="font-size:12px;font-weight:900;color:#7d5cff;margin-bottom:4px">\u{1F4E1} GEHEIMDIENST</div>';
  for (const k of G.enemyNations) {
    const n = NATIONS[k]; const ai = G.ai[k]; const h = G.hostility[k];
    if (!ai) continue;
    const isAlly = G.allies.includes(k);
    const hCol = isAlly ? '#00ff9d' : h > 60 ? '#ff345d' : h > 30 ? '#ffb000' : '#00ff9d';
    const status = isAlly ? 'ALLY' : h > 60 ? 'FEIND' : h > 30 ? 'SPANNUNG' : 'FREUNDLICH';
    const pIcon = { aggressive: '\u2694\uFE0F', defensive: '\u{1F6E1}\uFE0F', diplomatic: '\u{1F91D}', expansive: '\u{1F4C8}' }[ai.personality] || '';
    const types = {}; ai.buildings.forEach(b => { types[b.type] = (types[b.type] || 0) + 1; });
    const bldSummary = Object.entries(types).map(([t, c]) => `${BLDS[t].symbol}${c}`).join(' ');
    const filled = Math.min(10, Math.max(0, Math.floor(h / 10)));
    const hBar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
    html += `<div style="margin:3px 0;border-bottom:1px solid rgba(125,92,255,.1);padding-bottom:2px">${n.flag} <span style="color:${hCol}">${status}</span> ${pIcon} <span style="font-size:8px;color:#888">${hBar}</span></div>`;
    html += `<div style="font-size:9px;color:#999;margin-bottom:3px">\u{1F3ED}${ai.buildings.length} ${bldSummary} | \u{1F4B0}${Math.floor(ai.money)}$</div>`;
  }
  el.innerHTML = html;
}

export function drawBuildBar(G) {
  const el = document.getElementById('buildbar');
  if (!el) return;
  if (G.mode !== 'playing') { el.innerHTML = ''; return; }
  let html = '';
  for (const [k, s] of Object.entries(BLDS)) {
    const active = G.selected === k; const aff = G.money >= s.cost;
    html += `<div class="bb${active ? ' active' : ''}" style="opacity:${aff ? 1 : 0.4}" data-action="select" data-type="${k}"><div class="k">${s.key}</div><div class="n" style="color:${s.color}">${s.label}</div><div class="c">${s.cost}$</div></div>`;
  }
  html += `<div class="bb" data-action="diplomacy" style="border-color:#ff2bd6"><div class="k" style="color:#ff2bd6">D</div><div class="n" style="color:#ff2bd6">Diplomatie</div><div class="c">20$</div></div>`;
  html += `<div class="bb" data-action="attack" style="border-color:#a855f7;opacity:${G.offense > 0 && G.attackCooldown <= 0 ? 1 : 0.4}"><div class="k" style="color:#a855f7">K</div><div class="n" style="color:#a855f7">Angriff</div><div class="c">${G.offense > 0 ? Math.floor(G.offense / 15) + ' Raketen' : 'Baue Silo!'}</div></div>`;
  html += `<div class="bb" data-action="upgrade" style="border-color:#fbbf24"><div class="k" style="color:#fbbf24">U</div><div class="n" style="color:#fbbf24">Upgrade</div><div class="c">Klick+U</div></div>`;
  el.innerHTML = html;
}

// Build bar event delegation (replaces window.onclick handlers)
export function setupBuildBarEvents(G, addLog, playAlert) {
  const el = document.getElementById('buildbar');
  if (!el) return;
  el.addEventListener('click', (e) => {
    const bb = e.target.closest('.bb');
    if (!bb) return;
    const action = bb.dataset.action;
    if (action === 'select') {
      G.selected = bb.dataset.type;
      playAlert();
    } else if (action === 'diplomacy') {
      if (G.money < 20) { addLog(G, 'Nicht genug Geld! (20$ n\u00f6tig)', 'r'); playAlert(); return; }
      if (G.diplomacyMode) { G.diplomacyMode = false; addLog(G, 'Diplomatie abgebrochen', 'c'); return; }
      G.diplomacyMode = true; G.attackMode = false;
      addLog(G, '\u{1F91D} Klicke auf eine Nation f\u00fcr Diplomatie! (-20$)', 'g'); playAlert();
    } else if (action === 'attack') {
      if (G.offense <= 0) { addLog(G, 'Kein Raketensilo! Baue erst Silos!', 'r'); playAlert(); return; }
      if (G.attackCooldown > 0) { addLog(G, 'Raketen laden noch nach!', 'y'); playAlert(); return; }
      if (G.attackMode) { G.attackMode = false; addLog(G, 'Angriff abgebrochen', 'c'); return; }
      G.attackMode = true; G.diplomacyMode = false;
      addLog(G, '\u{1F3AF} Klicke auf eine Nation zum Angreifen! (K=Abbruch)', 'p'); playAlert();
    } else if (action === 'upgrade') {
      addLog(G, '\u2B06 Klicke auf dein Geb\u00e4ude zum Upgraden! (oder U+Klick)', 'y'); playAlert();
      G.selected = '__upgrade';
    }
  });
}
