// ====== RENDERER ======
import { NATIONS, BLDS, MAP_POS } from './data.js';
import { rnd } from './helpers.js';
import {
  drawMushroomCloud, drawShockwave, drawEMP, drawBanner,
  drawScanlines, drawScreenCrack,
} from './effects.js';

// ====== DRAW: SINGLE BUILDING ======
export function drawBuilding(cx, b, alpha = 1, nationColor = null) {
  const spec = BLDS[b.type]; if (!spec) return;
  const age = b.builtAt ? Math.min(1, (Date.now() - b.builtAt) / 500) : 1;
  const pulse = 1 + Math.sin(Date.now() * 0.003 + b.x) * 0.1;
  const levelScale = 1 + (b.level - 1) * 0.12;
  cx.save();
  cx.shadowColor = nationColor || spec.color;
  cx.shadowBlur = (8 * pulse + (b.level - 1) * 4) * age;
  cx.fillStyle = nationColor || spec.color;
  cx.globalAlpha = alpha * age * 0.9;
  const s = levelScale * age;
  cx.translate(b.x, b.y); cx.scale(s, s);
  if (b.type === 'factory') {
    cx.fillRect(-9, -9, 18, 18); cx.fillStyle = '#000'; cx.font = 'bold 11px Arial'; cx.textAlign = 'center'; cx.fillText('$', 0, 4);
    if (b.level > 1) { cx.fillStyle = spec.color; cx.font = 'bold 7px Arial'; cx.fillText(b.level, 7, -6); }
  } else if (b.type === 'milbase') {
    cx.beginPath(); cx.moveTo(0, -12); cx.lineTo(11, 8); cx.lineTo(-11, 8); cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = '9px Arial'; cx.textAlign = 'center'; cx.fillText('M', 0, 4);
    if (b.level > 1) { cx.fillStyle = spec.color; cx.font = 'bold 7px Arial'; cx.fillText(b.level, 7, -6); }
  } else if (b.type === 'lab') {
    cx.beginPath(); cx.moveTo(0, -11); cx.lineTo(9, 0); cx.lineTo(0, 11); cx.lineTo(-9, 0); cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = '9px Arial'; cx.textAlign = 'center'; cx.fillText('T', 0, 4);
    if (b.level > 1) { cx.fillStyle = spec.color; cx.font = 'bold 7px Arial'; cx.fillText(b.level, 7, -6); }
  } else if (b.type === 'defense') {
    cx.beginPath(); cx.arc(0, 0, 11, 0, 7); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 9px Arial'; cx.textAlign = 'center'; cx.fillText('D', 0, 3);
    if (b.level > 1) { cx.fillStyle = spec.color; cx.font = 'bold 7px Arial'; cx.fillText(b.level, 7, -6); }
    cx.strokeStyle = nationColor || spec.color; cx.lineWidth = 1 + b.level; cx.globalAlpha = alpha * age * 0.3;
    cx.beginPath(); cx.arc(0, 0, 14 + b.level * 2, 0, 7); cx.stroke();
  } else if (b.type === 'silo') {
    cx.fillRect(-5, -12, 10, 24); cx.fillStyle = '#000'; cx.font = '9px Arial'; cx.textAlign = 'center'; cx.fillText('R', 0, 3);
    if (b.level > 1) { cx.fillStyle = spec.color; cx.font = 'bold 7px Arial'; cx.fillText(b.level, 5, -8); }
  }
  cx.textAlign = 'left'; cx.globalAlpha = 1; cx.restore();
}

// ====== DRAW: CONTINENT ======
function drawContinent(cx, W, H, x, y, w, h, color) {
  cx.fillStyle = color; cx.beginPath();
  cx.moveTo(W * x, H * y);
  cx.quadraticCurveTo(W * (x + w * 0.3), H * (y - h * 0.1), W * (x + w), H * (y + h * 0.2));
  cx.quadraticCurveTo(W * (x + w * 1.1), H * (y + h * 0.6), W * (x + w * 0.7), H * (y + h));
  cx.quadraticCurveTo(W * (x + w * 0.3), H * (y + h * 1.05), W * x, H * (y + h * 0.7));
  cx.quadraticCurveTo(W * (x - w * 0.05), H * (y + h * 0.3), W * x, H * y);
  cx.fill(); cx.strokeStyle = 'rgba(0,217,255,.06)'; cx.lineWidth = 1; cx.stroke();
}

// ====== DRAW: COUNTRY SELECTION SCREEN ======
export function drawCountrySelect(cx, G, W, H) {
  cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(0, 0, W, H);
  cx.textAlign = 'center';
  const glitchX = Math.random() < 0.05 ? rnd(-3, 3) : 0;
  const glitchY = Math.random() < 0.05 ? rnd(-2, 2) : 0;
  cx.save(); cx.shadowColor = '#ff2bd6'; cx.shadowBlur = 30;
  cx.fillStyle = '#00d9ff'; cx.font = '900 64px Arial'; cx.fillText('NEON COMMAND', W / 2 + glitchX, H * 0.1 + glitchY);
  cx.restore();
  cx.fillStyle = '#ff2bd6'; cx.font = '900 32px Arial'; cx.fillText('GEOPOLITIK', W / 2, H * 0.1 + 45);
  cx.fillStyle = '#aaa'; cx.font = '14px Arial';
  cx.fillText('W\u00e4hle deine Nation \u2013 Alle Nationen bauen, k\u00e4mpfen und entwickeln sich!', W / 2, H * 0.1 + 75);

  const keys = Object.keys(NATIONS);
  const cardW = 150, cardH = 190, gap = 14;
  const totalW = keys.length * cardW + (keys.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const startY = H * 0.24;

  keys.forEach((k, i) => {
    const n = NATIONS[k];
    const x = startX + i * (cardW + gap);
    const hover = G.mouseX > x && G.mouseX < x + cardW && G.mouseY > startY && G.mouseY < startY + cardH;
    cx.fillStyle = hover ? 'rgba(0,217,255,.12)' : 'rgba(20,20,40,.85)';
    cx.fillRect(x, startY, cardW, cardH);
    cx.strokeStyle = hover ? n.color : 'rgba(255,255,255,.15)'; cx.lineWidth = hover ? 2 : 1;
    cx.strokeRect(x, startY, cardW, cardH);
    cx.fillStyle = n.color; cx.font = '36px Arial'; cx.fillText(n.flag, x + cardW / 2, startY + 40);
    cx.fillStyle = '#fff'; cx.font = '900 15px Arial'; cx.fillText(n.name, x + cardW / 2, startY + 65);
    cx.fillStyle = '#aaa'; cx.font = '10px Arial';
    cx.fillText(`Mil ${'\u2588'.repeat(n.mil)}${'\u2591'.repeat(10 - n.mil)}`, x + cardW / 2, startY + 88);
    cx.fillText(`\u00d6ko ${'\u2588'.repeat(n.eco)}${'\u2591'.repeat(10 - n.eco)}`, x + cardW / 2, startY + 103);
    cx.fillText(`Tech ${'\u2588'.repeat(n.tech)}${'\u2591'.repeat(10 - n.tech)}`, x + cardW / 2, startY + 118);
    const pLabel = { aggressive: '\u2694\uFE0F Aggressiv', defensive: '\u{1F6E1}\uFE0F Defensiv', diplomatic: '\u{1F91D} Diplomatisch', expansive: '\u{1F4C8} Expansiv' }[n.personality] || '';
    cx.fillStyle = n.color; cx.font = '10px Arial'; cx.fillText(pLabel, x + cardW / 2, startY + 138);
    cx.fillStyle = '#888'; cx.font = '9px Arial';
    const words = n.desc.split(' '); let line = '', ly = startY + 155;
    for (const w of words) { if ((line + ' ' + w).length > 20) { cx.fillText(line.trim(), x + cardW / 2, ly); ly += 11; line = w; } else { line += ' ' + w; } }
    if (line) cx.fillText(line.trim(), x + cardW / 2, ly);
  });
  cx.fillStyle = '#555'; cx.font = '12px Arial'; cx.fillText('Klick auf eine Nation zum Starten', W / 2, H - 40);
  cx.textAlign = 'left';
}

// ====== DRAW: WORLD MAP (main game view) ======
export function drawWorldMap(cx, G, W, H, canBuild) {
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#040714'); g.addColorStop(1, '#020308');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  cx.strokeStyle = 'rgba(0,217,255,.04)'; cx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
  for (let y = 0; y < H; y += 60) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }

  cx.save();
  drawContinent(cx, W, H, 0.12, 0.2, 0.16, 0.25, '#1a2744');
  drawContinent(cx, W, H, 0.18, 0.5, 0.1, 0.25, '#1a2744');
  drawContinent(cx, W, H, 0.43, 0.18, 0.08, 0.18, '#1a2744');
  drawContinent(cx, W, H, 0.44, 0.42, 0.1, 0.25, '#1a2744');
  drawContinent(cx, W, H, 0.5, 0.12, 0.25, 0.2, '#1a2744');
  drawContinent(cx, W, H, 0.65, 0.25, 0.12, 0.22, '#1a2744');
  drawContinent(cx, W, H, 0.52, 0.35, 0.08, 0.1, '#1a2744');
  cx.restore();

  if (G.nation) {
    // AI build zones
    for (const k of G.enemyNations) {
      const ai = G.ai[k]; if (!ai || ai.buildings.length === 0) continue;
      const pos = MAP_POS[k]; const n = NATIONS[k];
      const maxRing = Math.floor(ai.buildings.length / 6) + 1;
      const zoneRadius = 35 + maxRing * 30 + 20;
      cx.save(); cx.strokeStyle = n.color + '15'; cx.lineWidth = 1; cx.setLineDash([4, 6]);
      cx.beginPath(); cx.arc(pos.x * W, pos.y * H, zoneRadius, 0, 7); cx.stroke(); cx.setLineDash([]); cx.restore();
    }
    // Player build zone
    const cp = MAP_POS[G.nation];
    cx.save(); cx.strokeStyle = NATIONS[G.nation].color + '33'; cx.lineWidth = 1.5; cx.setLineDash([6, 6]);
    cx.beginPath(); cx.arc(cp.x * W, cp.y * H, 180, 0, 7); cx.stroke(); cx.setLineDash([]); cx.restore();
    // AI buildings
    for (const k of G.enemyNations) {
      const ai = G.ai[k]; if (!ai) continue;
      const n = NATIONS[k];
      for (const b of ai.buildings) {
        cx.save(); cx.strokeStyle = n.color + '0a'; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(b.x, b.y); cx.lineTo(MAP_POS[k].x * W, MAP_POS[k].y * H); cx.stroke(); cx.restore();
        drawBuilding(cx, b, 0.65, n.color);
      }
    }
    // Player buildings
    for (const b of G.buildings) drawBuilding(cx, b, 1, NATIONS[G.nation].color);
    // AI build animations
    for (const a of G.aiBuildAnims) {
      const progress = a.timer / a.duration;
      const radius = 30 * progress;
      const alpha = 1 - progress;
      cx.save(); cx.strokeStyle = a.color; cx.globalAlpha = alpha * 0.6; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(a.x, a.y, radius, 0, 7); cx.stroke();
      cx.globalAlpha = alpha * 0.3; cx.fillStyle = a.color;
      cx.beginPath(); cx.arc(a.x, a.y, radius * 0.5, 0, 7); cx.fill(); cx.restore();
      if (a.type === 'upgrade') {
        cx.save(); cx.strokeStyle = '#ffffff'; cx.globalAlpha = alpha * 0.5; cx.lineWidth = 1;
        cx.beginPath(); cx.arc(a.x, a.y, radius * 1.5, 0, 7); cx.stroke(); cx.restore();
      }
    }
    // Ghost building at cursor
    if (G.selected && G.selected !== '__upgrade' && canBuild(G.selected, G.mouseX, G.mouseY)) {
      const spec = BLDS[G.selected];
      cx.save(); cx.globalAlpha = 0.4; cx.fillStyle = spec.color;
      if (G.selected === 'factory') cx.fillRect(G.mouseX - 9, G.mouseY - 9, 18, 18);
      else if (G.selected === 'milbase') { cx.beginPath(); cx.moveTo(G.mouseX, G.mouseY - 12); cx.lineTo(G.mouseX + 11, G.mouseY + 8); cx.lineTo(G.mouseX - 11, G.mouseY + 8); cx.closePath(); cx.fill(); }
      else if (G.selected === 'lab') { cx.beginPath(); cx.moveTo(G.mouseX, G.mouseY - 11); cx.lineTo(G.mouseX + 9, G.mouseY); cx.lineTo(G.mouseX, G.mouseY + 11); cx.lineTo(G.mouseX - 9, G.mouseY); cx.closePath(); cx.fill(); }
      else if (G.selected === 'defense') { cx.beginPath(); cx.arc(G.mouseX, G.mouseY, 11, 0, 7); cx.fill(); }
      else if (G.selected === 'silo') cx.fillRect(G.mouseX - 5, G.mouseY - 12, 10, 24);
      cx.restore();
    } else if (G.selected && G.selected !== '__upgrade') {
      cx.save(); cx.globalAlpha = 0.25; cx.fillStyle = '#ff345d';
      cx.beginPath(); cx.arc(G.mouseX, G.mouseY, 12, 0, 7); cx.fill(); cx.restore();
    }
  }

  // Smoke trails
  for (const s of G.smokeTrails) {
    const a = Math.max(0, s.life / s.max);
    cx.save(); cx.globalAlpha = a * 0.4; cx.fillStyle = s.color;
    cx.beginPath(); cx.arc(s.x, s.y, s.size, 0, 7); cx.fill(); cx.restore();
  }

  // AI vs AI missiles + player counter missiles
  for (const m of G.aiMissiles) {
    cx.save(); cx.shadowColor = m.color || '#ff345d'; cx.shadowBlur = 15; cx.fillStyle = m.color || '#ff345d';
    const angle = Math.atan2(m.vy, m.vx); cx.translate(m.x, m.y); cx.rotate(angle);
    cx.fillRect(-12, -3, 24, 6); cx.fillStyle = '#ffb000'; cx.fillRect(12, -2, 6, 4); cx.restore();
    cx.save(); cx.strokeStyle = (m.color || '#ff345d') + '66'; cx.lineWidth = 2; cx.beginPath();
    cx.moveTo(m.x, m.y); cx.lineTo(m.x - m.vx * 0.08, m.y - m.vy * 0.08); cx.stroke(); cx.restore();
  }
  for (const e of G.aiExplosions) {
    const a = e.life / e.max; cx.save();
    const eg = cx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * a);
    eg.addColorStop(0, `rgba(255,200,50,${a})`); eg.addColorStop(0.4, `rgba(255,100,30,${a * 0.6})`); eg.addColorStop(1, 'rgba(255,50,50,0)');
    cx.fillStyle = eg; cx.beginPath(); cx.arc(e.x, e.y, e.size * a, 0, 7); cx.fill(); cx.restore();
  }

  // Nation markers
  for (const [k, pos] of Object.entries(MAP_POS)) {
    const px = pos.x * W, py = pos.y * H, n = NATIONS[k], isP = k === G.nation, h = G.hostility[k] || 0;
    const ai = G.ai[k]; const bCount = ai ? ai.buildings.length : G.buildings.length;
    const mouseNear = Math.hypot(G.mouseX - px, G.mouseY - py) < 40;
    const isAttackTarget = G.attackMode && !isP && !G.allies.includes(k) && mouseNear;
    const radius = isP ? 50 : h > 50 ? 35 : h > 30 ? 28 : 22;
    cx.save();
    const glow = cx.createRadialGradient(px, py, 0, px, py, radius);
    if (isAttackTarget) { glow.addColorStop(0, '#a855f7aa'); glow.addColorStop(1, '#a855f700'); }
    else if (isP) { glow.addColorStop(0, n.color + '55'); glow.addColorStop(1, n.color + '00'); }
    else if (h > 60) { glow.addColorStop(0, '#ff345d44'); glow.addColorStop(1, '#ff345d00'); }
    else if (G.allies.includes(k)) { glow.addColorStop(0, '#00ff9d33'); glow.addColorStop(1, '#00ff9d00'); }
    else { glow.addColorStop(0, '#ffffff11'); glow.addColorStop(1, '#ffffff00'); }
    cx.fillStyle = glow; cx.beginPath(); cx.arc(px, py, isAttackTarget ? radius * 1.5 : radius, 0, 7); cx.fill(); cx.restore();

    if (G.attackMode && !isP && !G.allies.includes(k)) {
      cx.save(); cx.strokeStyle = mouseNear ? '#a855f7' : '#a855f733';
      cx.lineWidth = mouseNear ? 3 : 1; cx.setLineDash(mouseNear ? [] : [4, 4]);
      cx.beginPath(); cx.arc(px, py, 35 + Math.sin(Date.now() * 0.005) * 5, 0, 7); cx.stroke();
      cx.setLineDash([]); cx.restore();
    }
    if (G.diplomacyMode && !isP) {
      cx.save(); cx.strokeStyle = mouseNear ? '#00ff9d' : '#00ff9d33';
      cx.lineWidth = mouseNear ? 3 : 1; cx.setLineDash(mouseNear ? [] : [4, 4]);
      cx.beginPath(); cx.arc(px, py, 35 + Math.sin(Date.now() * 0.004) * 4, 0, 7); cx.stroke();
      cx.setLineDash([]); cx.restore();
    }

    cx.save(); cx.shadowColor = isAttackTarget ? '#a855f7' : n.color; cx.shadowBlur = isAttackTarget ? 25 : isP ? 20 : 10;
    cx.fillStyle = isAttackTarget ? '#a855f7' : isP ? n.color : h > 60 ? '#ff345d' : G.allies.includes(k) ? '#00ff9d' : '#666';
    cx.beginPath(); cx.arc(px, py, isP ? 10 : 7, 0, 7); cx.fill(); cx.restore();

    cx.textAlign = 'center'; cx.font = isP ? 'bold 13px Arial' : '11px Arial';
    cx.fillStyle = isP ? n.color : '#aaa';
    cx.fillText(`${n.flag} ${n.name}`, px, py - 18);

    if (!isP && ai) {
      cx.font = '8px Arial'; cx.fillStyle = '#888';
      cx.fillText(`\u{1F3ED}${bCount} \u2694\uFE0F${Math.floor(ai.mil)} \u{1F6E1}\uFE0F${Math.floor(ai.defense)} \u{1F4B0}${Math.floor(ai.money)}$`, px, py + 38);
      const pIcon = { aggressive: '\u2694\uFE0F', defensive: '\u{1F6E1}\uFE0F', diplomatic: '\u{1F91D}', expansive: '\u{1F4C8}' }[ai.personality] || '';
      cx.fillStyle = '#666'; cx.font = '8px Arial'; cx.fillText(pIcon, px, py + 48);
    }

    if (!isP) {
      const bw = 40, bh = 4, bx = px - bw / 2, by = py + 16;
      cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(bx, by, bw, bh);
      cx.fillStyle = h > 60 ? '#ff345d' : h > 30 ? '#ffb000' : '#00ff9d';
      cx.fillRect(bx, by, bw * Math.min(1, h / 100), bh);
      cx.fillStyle = '#666'; cx.font = '8px Arial';
      cx.fillText(G.allies.includes(k) ? 'VERB\u00dcNDET' : h > 60 ? 'FEINDLICH' : h > 30 ? 'SPANNUNG' : 'NEUTRAL', px, py + 28);
    }
    cx.textAlign = 'left';
  }

  // Threat lines
  if (G.nation) {
    const mp = MAP_POS[G.nation], mx = mp.x * W, my = mp.y * H;
    for (const k of G.enemyNations) {
      const h = G.hostility[k]; if (h > 40) {
        const tp = MAP_POS[k]; cx.save();
        cx.strokeStyle = h > 70 ? 'rgba(255,52,93,.3)' : 'rgba(255,176,0,.15)'; cx.lineWidth = h > 70 ? 2 : 1; cx.setLineDash([8, 8]);
        cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(tp.x * W, tp.y * H); cx.stroke(); cx.setLineDash([]); cx.restore();
      }
    }
  }

  // Threat missiles on map
  for (const t of G.threats) {
    const from = MAP_POS[t.from], to = MAP_POS[G.nation];
    const progress = Math.min(1, t.timer / t.duration);
    const px = from.x * W + (to.x * W - from.x * W) * progress, py = from.y * H + (to.y * H - from.y * H) * progress;
    const n = NATIONS[t.from];
    const angle = Math.atan2(to.y * H - from.y * H, to.x * W - from.x * W);
    cx.save(); cx.shadowColor = '#ff345d'; cx.shadowBlur = 15; cx.fillStyle = n.color || '#ff345d';
    cx.translate(px, py); cx.rotate(angle);
    cx.fillRect(-8, -3, 16, 6); cx.fillStyle = '#ffb000'; cx.fillRect(8, -2, 6, 4); cx.restore();
    cx.save(); cx.strokeStyle = 'rgba(255,52,93,.5)'; cx.lineWidth = 2; cx.beginPath();
    cx.moveTo(from.x * W, from.y * H); cx.lineTo(px, py); cx.stroke(); cx.restore();
    cx.save(); cx.fillStyle = '#ff345d'; cx.font = 'bold 10px Arial'; cx.textAlign = 'center';
    cx.fillText(`\u2694\uFE0F${t.strength}`, px, py - 12); cx.textAlign = 'left'; cx.restore();
  }

  // Attack scene
  if (G.flash > 0) { cx.fillStyle = G.flashColor + '22'; cx.fillRect(0, 0, W, H); }
  if (G.attackScene) {
    for (const m of G.attackScene.missiles || []) {
      const mc = m.color || '#ff345d';
      cx.save(); cx.shadowColor = mc; cx.shadowBlur = 20; cx.fillStyle = mc;
      const angle = Math.atan2(m.vy, m.vx); cx.translate(m.x, m.y); cx.rotate(angle);
      cx.fillRect(-14, -3, 28, 6); cx.fillStyle = '#ffb000'; cx.fillRect(14, -2, 8, 4); cx.restore();
      cx.save(); cx.strokeStyle = mc + '88'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(m.x, m.y); cx.lineTo(m.x - m.vx * 0.12, m.y - m.vy * 0.12); cx.stroke(); cx.restore();
    }
    for (const e of G.attackScene.explosions || []) {
      const a = e.life / e.max; const ec = e.color || '#ff345d'; cx.save();
      const eg = cx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * a);
      eg.addColorStop(0, `rgba(255,200,50,${a})`); eg.addColorStop(0.4, ec + '99'); eg.addColorStop(1, 'rgba(255,50,50,0)');
      cx.fillStyle = eg; cx.beginPath(); cx.arc(e.x, e.y, e.size * a, 0, 7); cx.fill(); cx.restore();
    }
  }

  // WOW effects
  for (const mc of G.mushroomClouds) drawMushroomCloud(cx, mc);
  for (const sw of G.shockwaves) drawShockwave(cx, sw);
  for (const emp of G.empFlashes) drawEMP(cx, emp);

  // Particles + texts
  for (const p of G.particles) { const a = Math.max(0, p.life / p.max); cx.globalAlpha = a; cx.fillStyle = p.color; cx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
  cx.globalAlpha = 1; cx.textAlign = 'center';
  for (const t of G.texts) { const a = Math.max(0, t.life / t.max); cx.globalAlpha = a; cx.fillStyle = t.color; cx.font = `bold ${t.size || 15}px Arial`; cx.fillText(t.text, t.x, t.y); }
  cx.globalAlpha = 1; cx.textAlign = 'left';

  drawScanlines(cx, W, H);
  drawBanner(cx, G, W, H);
}

// ====== DRAW: GAME OVER ======
export function drawGameOver(cx, G, W, H) {
  cx.fillStyle = 'rgba(0,0,0,.8)'; cx.fillRect(0, 0, W, H); cx.textAlign = 'center';
  const gx = Math.random() < 0.1 ? rnd(-5, 5) : 0;
  cx.save(); cx.shadowColor = '#ff345d'; cx.shadowBlur = 40;
  cx.fillStyle = '#ff345d'; cx.font = '900 56px Arial'; cx.fillText('NATION GEFALLEN', W / 2 + gx, H / 2 - 40);
  cx.restore();
  cx.fillStyle = '#fff'; cx.font = '20px Arial';
  cx.fillText(`${NATIONS[G.nation].flag} ${NATIONS[G.nation].name} \u2013 Runde ${G.turn}`, W / 2, H / 2 + 10);
  cx.fillStyle = '#aaa'; cx.font = '16px Arial'; cx.fillText('R = Neustart', W / 2, H / 2 + 50);
  cx.textAlign = 'left';
}

// ====== DRAW: VICTORY ======
export function drawVictory(cx, G, W, H) {
  cx.fillStyle = 'rgba(0,0,0,.8)'; cx.fillRect(0, 0, W, H); cx.textAlign = 'center';
  const gx = Math.random() < 0.1 ? rnd(-3, 3) : 0;
  cx.save(); cx.shadowColor = '#00ff9d'; cx.shadowBlur = 40;
  cx.fillStyle = '#00ff9d'; cx.font = '900 56px Arial'; cx.fillText('SIEG!', W / 2 + gx, H / 2 - 60);
  cx.restore();
  cx.fillStyle = '#fbbf24'; cx.font = '900 28px Arial';
  cx.fillText(`${NATIONS[G.nation].flag} ${NATIONS[G.nation].name} dominiert die Welt!`, W / 2, H / 2 - 10);
  cx.fillStyle = '#fff'; cx.font = '18px Arial';
  cx.fillText(`Runde ${G.turn} \u00b7 ${G.allies.length + 1}/5 Nationen verb\u00fcndet`, W / 2, H / 2 + 25);
  cx.fillStyle = '#aaa'; cx.font = '16px Arial'; cx.fillText('R = Neustart', W / 2, H / 2 + 65);
  cx.textAlign = 'left';
}
