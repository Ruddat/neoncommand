// ====== UI SYSTEM (HUD, Intel, BuildBar) — PIMPED EDITION ======
import { NATIONS, BLDS, MAP_POS } from './data.js';
import { playAlert } from './audio.js';

// Stat bar helper — returns HTML for a mini progress bar with gradient
function statBar(label, value, maxVal, color, icon = '') {
  const pct = Math.min(100, Math.max(0, (value / maxVal) * 100));
  const barBg = 'rgba(255,255,255,.06)';
  return `<div style="display:flex;align-items:center;gap:4px;margin:1px 0">
  <span style="color:#777;font-size:9px;min-width:26px">${icon}${label}</span>
  <div style="flex:1;height:4px;background:${barBg};border-radius:2px;overflow:hidden">
    <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color}66,${color});border-radius:2px;transition:width .3s"></div>
  </div>
  <b style="color:${color};font-size:10px;min-width:28px;text-align:right">${Math.floor(value)}</b>
</div>`;
}

export function drawHUD(G) {
  const el = document.getElementById('hud');
  if (!el) return;
  if (G.mode === 'title') { el.innerHTML = ''; return; }
  if (G.mode === 'menu') {
    el.innerHTML = `<div style="font-family:Orbitron,sans-serif;font-size:18px;font-weight:900;color:#00d9ff;text-shadow:0 0 10px #00d9ff,0 0 30px rgba(0,217,255,.3)">NEON COMMAND</div><div style="font-family:Orbitron,sans-serif;font-size:12px;color:#ff2bd6;text-shadow:0 0 8px #ff2bd6,0 0 20px rgba(255,43,214,.3)">GEOPOLITIK</div>`;
    return;
  }
  const n = NATIONS[G.nation];
  const nt = Math.max(0, Math.ceil(G.turnLength - G.turnTimer));
  const aiBldCount = G.enemyNations.reduce((s, k) => s + (G.ai[k]?.buildings.length || 0), 0);
  const moneyColor = G.money > 200 ? '#fbbf24' : G.money > 50 ? '#ffb000' : '#ff345d';
  const moneyPct = Math.min(100, Math.max(0, G.money / 5));
  const diploCount = G.diplomacyCooldown > 0 ? Math.ceil(G.diplomacyCooldown) : 0;

  // Turn progress bar
  const turnPct = Math.min(100, (G.turnTimer / G.turnLength) * 100);
  const turnBarColor = G.defcon <= 2 ? '#ff345d' : G.defcon <= 3 ? '#ffb000' : '#00d9ff';

  el.innerHTML = `
  <div style="font-family:Orbitron,sans-serif;font-size:14px;font-weight:900;color:${n.color};text-shadow:0 0 10px ${n.color},0 0 25px ${n.color}44;margin-bottom:2px">${n.flag} ${n.name}</div>

  <div style="display:flex;align-items:center;gap:6px;margin:3px 0">
    <span style="color:#999;font-size:9px">GELD</span>
    <b style="color:${moneyColor};font-size:15px;text-shadow:0 0 8px ${moneyColor}66">${Math.floor(G.money)}$</b>
    <span style="color:#555;font-size:9px">+${Math.floor(G.income)}/s</span>
    ${G.nuclearWinter ? '<span style="color:#88ccff;font-size:9px;text-shadow:0 0 6px #88ccff">&#x2744 -30%</span>' : ''}
  </div>

  ${statBar('MIL', G.mil, 100, '#ef4444')}
  ${statBar('DEF', G.defense, 100, '#22c55e')}
  ${statBar('OFF', G.offense, 100, '#a855f7')}
  ${statBar('TECH', G.tech, 100, '#3b82f6')}

  <div style="margin:2px 0;color:#777;font-size:9px">Spione <b style="color:#ff2bd6;text-shadow:0 0 6px #ff2bd666">${G.spies || 0}</b></div>

  <hr style="border:0;border-top:1px solid rgba(0,217,255,.12);margin:4px 0">

  <div style="display:flex;align-items:center;gap:6px">
    <span style="font-family:Orbitron,sans-serif;font-size:10px;color:#aaa">Runde <b style="color:#fff">${G.turn}</b></span>
    <div style="flex:1;height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden">
      <div style="width:${turnPct}%;height:100%;background:linear-gradient(90deg,${turnBarColor}66,${turnBarColor});border-radius:2px;transition:width .2s"></div>
    </div>
    <b style="color:${turnBarColor};font-family:Orbitron,sans-serif;font-size:11px">${nt}s</b>
  </div>

  <div style="font-size:9px;color:#555;margin-top:2px">Geb&auml;ude: <b style="color:#aaa">${G.buildings.length}</b> &middot; KI: <b style="color:#aaa">${aiBldCount}</b> &middot; Verb&uuml;ndete: <b style="color:#00ff9d">${G.allies.length}</b>/4</div>

  ${G.attackMode ? '<div style="font-family:Orbitron,sans-serif;font-size:11px;font-weight:900;color:#a855f7;text-shadow:0 0 10px #a855f7,0 0 25px rgba(168,85,247,.4);margin-top:4px;animation:neonPulse 1s ease-in-out infinite">&#x1F3AF ANGRIFFSMODUS &mdash; Klicke auf Feind!</div>' : ''}
  ${G.diplomacyMode ? '<div style="font-family:Orbitron,sans-serif;font-size:11px;font-weight:900;color:#00ff9d;text-shadow:0 0 10px #00ff9d,0 0 25px rgba(0,255,157,.4);margin-top:4px;animation:neonPulse 1s ease-in-out infinite">&#x1F91D DIPLOMATIE &mdash; Klicke auf Nation!</div>' : ''}
  ${G.spyMode ? '<div style="font-family:Orbitron,sans-serif;font-size:11px;font-weight:900;color:#ff2bd6;text-shadow:0 0 10px #ff2bd6,0 0 25px rgba(255,43,214,.4);margin-top:4px;animation:neonPulse 1s ease-in-out infinite">&#x1F575 SPIONAGE &mdash; Klicke auf Nation!</div>' : ''}

  ${G.attackCooldown > 0 ? `<div style="font-size:9px;color:#ff345d;margin-top:2px">&#x23F3 Raketen laden: ${Math.ceil(G.attackCooldown)}s</div>` : ''}
  ${G.spyCooldown > 0 ? `<div style="font-size:9px;color:#ff2bd6;margin-top:2px">&#x1F575 Spione auf Mission: ${Math.ceil(G.spyCooldown)}s</div>` : ''}
  ${diploCount > 0 ? `<div style="font-size:9px;color:#00ff9d;margin-top:2px">&#x1F91D Diplomatie-Abklingzeit: ${diploCount}s</div>` : ''}
  ${G.nuclearWinter ? '<div style="font-family:Orbitron,sans-serif;font-size:10px;font-weight:900;color:#88ccff;text-shadow:0 0 10px #88ccff,0 0 20px rgba(136,204,255,.4);margin-top:3px;animation:neonPulse 2s ease-in-out infinite">&#x2744 NUKLEARWINTER!</div>' : ''}
  ${G.nukeCount > 0 && !G.nuclearWinter ? `<div style="font-size:9px;color:#ffb000;margin-top:2px">&#x2622 Nukes: ${G.nukeCount}/3 bis Winter</div>` : ''}
  ${G.musicPlaying ? `<div style="font-size:8px;color:#444;cursor:pointer;margin-top:2px" data-action="toggleMusic">&#x1F3B5 ${G.defcon <= 2 ? 'Fallout Protocol' : G.defcon <= 3 ? 'Red Alert' : 'Defcon Ice'} (M)</div>` : ''}`;
}

export function drawIntel(G) {
  const el = document.getElementById('intel');
  if (!el) return;
  if (G.mode !== 'playing') { el.innerHTML = ''; return; }

  let html = `<div style="font-family:Orbitron,sans-serif;font-size:11px;font-weight:900;color:#7d5cff;text-shadow:0 0 8px #7d5cff,0 0 20px rgba(125,92,255,.3);margin-bottom:6px;letter-spacing:1px">&#x1F4E1 GEHEIMDIENST</div>`;

  for (const k of G.enemyNations) {
    const n = NATIONS[k]; const ai = G.ai[k]; const h = G.hostility[k];
    if (!ai) continue;
    const isAlly = G.allies.includes(k);
    const hCol = isAlly ? '#00ff9d' : h > 60 ? '#ff345d' : h > 30 ? '#ffb000' : '#00ff9d';
    const status = isAlly ? 'VERBÜNDET' : h > 60 ? 'FEIND' : h > 30 ? 'SPANNUNG' : 'FREUNDLICH';
    const statusBg = isAlly ? 'rgba(0,255,157,.1)' : h > 60 ? 'rgba(255,52,93,.1)' : h > 30 ? 'rgba(255,176,0,.1)' : 'rgba(0,255,157,.06)';
    const pIcon = { aggressive: '&#x2694', defensive: '&#x1F6E1', diplomatic: '&#x1F91D', expansive: '&#x1F4C8' }[ai.personality] || '';
    const types = {}; ai.buildings.forEach(b => { types[b.type] = (types[b.type] || 0) + 1; });
    const bldSummary = Object.entries(types).map(([t, c]) => `${BLDS[t].symbol}${c}`).join(' ');
    const hPct = Math.min(100, Math.max(0, h));

    html += `<div style="margin:4px 0;padding:4px 6px;border-left:2px solid ${hCol};background:${statusBg};border-radius:0 4px 4px 0">
      <div style="display:flex;align-items:center;gap:4px">
        <span style="font-size:14px">${n.flag}</span>
        <span style="color:${hCol};font-family:Orbitron,sans-serif;font-size:8px;font-weight:700;letter-spacing:1px;text-shadow:0 0 6px ${hCol}44">${status}</span>
        ${pIcon}
      </div>
      <div style="margin-top:2px;height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden">
        <div style="width:${hPct}%;height:100%;background:linear-gradient(90deg,${hCol}44,${hCol});border-radius:2px"></div>
      </div>
      <div style="font-size:8px;color:#666;margin-top:2px">&#x1F3ED${ai.buildings.length} ${bldSummary} | <span style="color:#fbbf24">&#x1F4B0${Math.floor(ai.money)}$</span></div>
    </div>`;
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
    const glow = active ? `box-shadow:0 0 15px ${s.color}44,inset 0 0 10px ${s.color}11;border-color:${s.color}` : '';
    html += `<div class="bb${active ? ' active' : ''}" style="opacity:${aff ? 1 : 0.35};${glow}" data-action="select" data-type="${k}"><div class="k" style="color:${s.color};text-shadow:0 0 8px ${s.color}66">${s.key}</div><div class="n" style="color:${s.color}">${s.label}</div><div class="c">${s.cost}$</div></div>`;
  }
  // Diplomacy: show cheapest available cost
  const minDiploCost = G.enemyNations.reduce((min, k) => {
    const c = G.diplomacyCount[k] || 0;
    return Math.min(min, Math.floor(20 + c * 12 + c * c * 2));
  }, 999);
  const diploReady = G.money >= minDiploCost && G.diplomacyCooldown <= 0;
  html += `<div class="bb" data-action="diplomacy" style="border-color:${diploReady ? '#ff2bd6' : '#333'};opacity:${diploReady ? 1 : 0.35};${diploReady ? 'box-shadow:0 0 10px rgba(255,43,214,.2)' : ''}"><div class="k" style="color:#ff2bd6;text-shadow:0 0 8px rgba(255,43,214,.5)">D</div><div class="n" style="color:#ff2bd6">Diplomatie</div><div class="c">${minDiploCost}$+</div></div>`;
  const atkReady = G.offense > 0 && G.attackCooldown <= 0;
  html += `<div class="bb" data-action="attack" style="border-color:${atkReady ? '#a855f7' : '#333'};opacity:${atkReady ? 1 : 0.35};${atkReady ? 'box-shadow:0 0 10px rgba(168,85,247,.2)' : ''}"><div class="k" style="color:#a855f7;text-shadow:0 0 8px rgba(168,85,247,.5)">K</div><div class="n" style="color:#a855f7">Angriff</div><div class="c">${G.offense > 0 ? Math.floor(G.offense / 15) + ' Rak' : 'Silo!'}</div></div>`;
  const spyReady = (G.spies || 0) > 0 && (G.spyCooldown || 0) <= 0;
  html += `<div class="bb" data-action="spy" style="border-color:${spyReady ? '#ff2bd6' : '#333'};opacity:${spyReady ? 1 : 0.35};${spyReady ? 'box-shadow:0 0 10px rgba(255,43,214,.2)' : ''}"><div class="k" style="color:#ff2bd6;text-shadow:0 0 8px rgba(255,43,214,.5)">X</div><div class="n" style="color:#ff2bd6">Spionage</div><div class="c">${(G.spies || 0) > 0 ? G.spies + ' Spione' : 'HQ!'}</div></div>`;
  html += `<div class="bb" data-action="upgrade" style="border-color:#fbbf24;box-shadow:0 0 8px rgba(251,191,36,.15)"><div class="k" style="color:#fbbf24;text-shadow:0 0 8px rgba(251,191,36,.5)">U</div><div class="n" style="color:#fbbf24">Upgrade</div><div class="c">Klick</div></div>`;
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
      if (G.money < 20) { addLog(G, 'Nicht genug Geld! (20$ nötig)', 'r'); playAlert(); return; }
      if (G.diplomacyMode) { G.diplomacyMode = false; addLog(G, 'Diplomatie abgebrochen', 'c'); return; }
      G.diplomacyMode = true; G.attackMode = false; G.spyMode = false;
      addLog(G, '&#x1F91D Klicke auf eine Nation für Diplomatie! (-20$)', 'g'); playAlert();
    } else if (action === 'attack') {
      if (G.offense <= 0) { addLog(G, 'Kein Raketensilo! Baue erst Silos!', 'r'); playAlert(); return; }
      if (G.attackCooldown > 0) { addLog(G, 'Raketen laden noch nach!', 'y'); playAlert(); return; }
      if (G.attackMode) { G.attackMode = false; addLog(G, 'Angriff abgebrochen', 'c'); return; }
      G.attackMode = true; G.diplomacyMode = false; G.spyMode = false;
      addLog(G, '&#x1F3AF Klicke auf eine Nation zum Angreifen! (K=Abbruch)', 'p'); playAlert();
    } else if (action === 'spy') {
      if ((G.spies || 0) <= 0) { addLog(G, 'Kein Spionage-HQ! Baue erst Spionage-HQs!', 'r'); playAlert(); return; }
      if ((G.spyCooldown || 0) > 0) { addLog(G, 'Spione auf Mission!', 'y'); playAlert(); return; }
      if (G.spyMode) { G.spyMode = false; addLog(G, 'Spionage abgebrochen', 'c'); return; }
      G.spyMode = true; G.attackMode = false; G.diplomacyMode = false;
      addLog(G, '&#x1F575 Klicke auf eine Nation für Spionage! (X=Abbruch)', 'p'); playAlert();
    } else if (action === 'upgrade') {
      addLog(G, '&#x2B06 Klicke auf dein Gebäude zum Upgraden! (oder U+Klick)', 'y'); playAlert();
      G.selected = '__upgrade';
    }
  });
}
