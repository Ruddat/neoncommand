// ====== UI SYSTEM (HUD, Intel, BuildBar) ======
import { NATIONS, BLDS, MAP_POS } from './data.js';
import { playAlert } from './audio.js';

export function drawHUD(G) {
  const el = document.getElementById('hud');
  if (!el) return;
  if (G.mode === 'menu') { el.innerHTML = '<div style="font-family:Orbitron,sans-serif;font-size:18px;font-weight:900;color:#00d9ff;text-shadow:0 0 10px #00d9ff">NEON COMMAND</div><div style="font-family:Orbitron,sans-serif;font-size:12px;color:#ff2bd6;text-shadow:0 0 8px #ff2bd6">GEOPOLITIK</div>'; return; }
  const n = NATIONS[G.nation];
  const nt = Math.max(0, Math.ceil(G.turnLength - G.turnTimer));
  const aiBldCount = G.enemyNations.reduce((s, k) => s + (G.ai[k]?.buildings.length || 0), 0);
  const moneyColor = G.money > 200 ? '#fbbf24' : G.money > 50 ? '#ffb000' : '#ff345d';
  const diploCount = G.diplomacyCooldown > 0 ? Math.ceil(G.diplomacyCooldown) : 0;
  el.innerHTML = `<div style="font-family:Orbitron,sans-serif;font-size:14px;font-weight:900;color:${n.color};text-shadow:0 0 8px ${n.color}">${n.flag} ${n.name}</div>
    <div>Geld <b style="color:${moneyColor};font-size:14px">${Math.floor(G.money)}$</b> <span style="color:#666">(+${Math.floor(G.income)}/s)</span>${G.nuclearWinter ? ' <span style="color:#88ccff">\u2744\uFE0F -30%</span>' : ''}</div>
    <div style="display:flex;gap:10px;margin:2px 0">
      <span>Mil <b style="color:#ef4444">${Math.floor(G.mil)}</b></span>
      <span>Def <b style="color:#22c55e">${Math.floor(G.defense)}</b></span>
      <span>Off <b style="color:#a855f7">${G.offense}</b></span>
    </div>
    <div>Tech <b style="color:#3b82f6">${Math.floor(G.tech)}</b> \u00b7 Spione <b style="color:#ff2bd6">${G.spies || 0}</b></div><hr>
    <div style="font-family:Orbitron,sans-serif;font-size:11px">Runde <b>${G.turn}</b> \u00b7 <b style="color:#00d9ff">${nt}s</b></div>
    <div style="font-size:10px;color:#555">Geb\u00e4ude: ${G.buildings.length} \u00b7 KI: ${aiBldCount} \u00b7 Verb\u00fcndete: ${G.allies.length}/4</div>
    ${G.attackMode ? '<div style="font-family:Orbitron,sans-serif;font-size:12px;font-weight:900;color:#a855f7;text-shadow:0 0 8px #a855f7">\u{1F3AF} ANGRIFFSMODUS \u2013 Klicke auf Feind!</div>' : ''}
    ${G.diplomacyMode ? '<div style="font-family:Orbitron,sans-serif;font-size:12px;font-weight:900;color:#00ff9d;text-shadow:0 0 8px #00ff9d">\u{1F91D} DIPLOMATIE \u2013 Klicke auf Nation!</div>' : ''}
    ${G.spyMode ? '<div style="font-family:Orbitron,sans-serif;font-size:12px;font-weight:900;color:#ff2bd6;text-shadow:0 0 8px #ff2bd6">\u{1F575}\uFE0F SPIONAGE \u2013 Klicke auf Nation!</div>' : ''}
    ${G.attackCooldown > 0 ? `<div style="font-size:10px;color:#ff345d">\u23F3 Raketen laden: ${Math.ceil(G.attackCooldown)}s</div>` : ''}
    ${G.spyCooldown > 0 ? `<div style="font-size:10px;color:#ff2bd6">\u{1F575}\uFE0F Spione auf Mission: ${Math.ceil(G.spyCooldown)}s</div>` : ''}
    ${diploCount > 0 ? `<div style="font-size:10px;color:#00ff9d">\u{1F91D} Diplomatie-Abklingzeit: ${diploCount}s</div>` : ''}
    ${G.nuclearWinter ? '<div style="font-family:Orbitron,sans-serif;font-size:11px;font-weight:900;color:#88ccff;text-shadow:0 0 8px #88ccff">\u2744\uFE0F NUKLEARWINTER!</div>' : ''}
    ${G.nukeCount > 0 && !G.nuclearWinter ? `<div style="font-size:10px;color:#ffb000">\u2622\uFE0F Nukes: ${G.nukeCount}/3 bis Winter</div>` : ''}
    ${G.musicPlaying ? `<div style="font-size:9px;color:#444;cursor:pointer" data-action="toggleMusic">\u{1F3B5} ${G.defcon <= 2 ? 'Fallout Protocol' : G.defcon <= 3 ? 'Red Alert' : 'Defcon Ice'} (M)</div>` : ''}`;
}

export function drawIntel(G) {
  const el = document.getElementById('intel');
  if (!el) return;
  if (G.mode !== 'playing') { el.innerHTML = ''; return; }
  let html = '<div style="font-family:Orbitron,sans-serif;font-size:12px;font-weight:900;color:#7d5cff;text-shadow:0 0 8px #7d5cff;margin-bottom:4px">\u{1F4E1} GEHEIMDIENST</div>';
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
    const hBar = '<span style="color:' + hCol + '">' + '\u2588'.repeat(filled) + '</span>' + '<span style="color:#333">' + '\u2591'.repeat(10 - filled) + '</span>';
    html += `<div style="margin:3px 0;border-bottom:1px solid rgba(125,92,255,.1);padding-bottom:2px">${n.flag} <span style="color:${hCol};font-family:Orbitron,sans-serif;font-size:9px;font-weight:700">${status}</span> ${pIcon} <span style="font-size:8px">${hBar}</span></div>`;
    html += `<div style="font-size:9px;color:#777;margin-bottom:3px">\u{1F3ED}${ai.buildings.length} ${bldSummary} | <span style="color:#fbbf24">\u{1F4B0}${Math.floor(ai.money)}$</span></div>`;
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
  // Diplomacy: show cheapest available cost
  const minDiploCost = G.enemyNations.reduce((min, k) => {
    const c = G.diplomacyCount[k] || 0;
    return Math.min(min, Math.floor(20 + c * 12 + c * c * 2));
  }, 999);
  html += `<div class="bb" data-action="diplomacy" style="border-color:#ff2bd6;opacity:${G.money >= minDiploCost && G.diplomacyCooldown <= 0 ? 1 : 0.4}"><div class="k" style="color:#ff2bd6">D</div><div class="n" style="color:#ff2bd6">Diplomatie</div><div class="c">${minDiploCost}$+</div></div>`;
  html += `<div class="bb" data-action="attack" style="border-color:#a855f7;opacity:${G.offense > 0 && G.attackCooldown <= 0 ? 1 : 0.4}"><div class="k" style="color:#a855f7">K</div><div class="n" style="color:#a855f7">Angriff</div><div class="c">${G.offense > 0 ? Math.floor(G.offense / 15) + ' Rak' : 'Silo!'}</div></div>`;
  html += `<div class="bb" data-action="spy" style="border-color:#ff2bd6;opacity:${(G.spies || 0) > 0 && (G.spyCooldown || 0) <= 0 ? 1 : 0.4}"><div class="k" style="color:#ff2bd6">X</div><div class="n" style="color:#ff2bd6">Spionage</div><div class="c">${(G.spies || 0) > 0 ? G.spies + ' Spione' : 'HQ!'}</div></div>`;
  html += `<div class="bb" data-action="upgrade" style="border-color:#fbbf24"><div class="k" style="color:#fbbf24">U</div><div class="n" style="color:#fbbf24">Upgrade</div><div class="c">Klick</div></div>`;
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
      G.diplomacyMode = true; G.attackMode = false; G.spyMode = false;
      addLog(G, '\u{1F91D} Klicke auf eine Nation f\u00fcr Diplomatie! (-20$)', 'g'); playAlert();
    } else if (action === 'attack') {
      if (G.offense <= 0) { addLog(G, 'Kein Raketensilo! Baue erst Silos!', 'r'); playAlert(); return; }
      if (G.attackCooldown > 0) { addLog(G, 'Raketen laden noch nach!', 'y'); playAlert(); return; }
      if (G.attackMode) { G.attackMode = false; addLog(G, 'Angriff abgebrochen', 'c'); return; }
      G.attackMode = true; G.diplomacyMode = false; G.spyMode = false;
      addLog(G, '\u{1F3AF} Klicke auf eine Nation zum Angreifen! (K=Abbruch)', 'p'); playAlert();
    } else if (action === 'spy') {
      if ((G.spies || 0) <= 0) { addLog(G, 'Kein Spionage-HQ! Baue erst Spionage-HQs!', 'r'); playAlert(); return; }
      if ((G.spyCooldown || 0) > 0) { addLog(G, 'Spione auf Mission!', 'y'); playAlert(); return; }
      if (G.spyMode) { G.spyMode = false; addLog(G, 'Spionage abgebrochen', 'c'); return; }
      G.spyMode = true; G.attackMode = false; G.diplomacyMode = false;
      addLog(G, '\u{1F575}\uFE0F Klicke auf eine Nation f\u00fcr Spionage! (X=Abbruch)', 'p'); playAlert();
    } else if (action === 'upgrade') {
      addLog(G, '\u2B06 Klicke auf dein Geb\u00e4ude zum Upgraden! (oder U+Klick)', 'y'); playAlert();
      G.selected = '__upgrade';
    }
  });
}
