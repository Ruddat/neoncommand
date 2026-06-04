// ====== WOW EFFECTS ======
import { rnd, burst, floatText } from './helpers.js';
import { playDramatic, playEMP as playEMPSound } from './audio.js';

// ====== DRAMATIC BANNER ======
export function showBanner(G, text, color = '#fff', duration = 3) {
  G.banner = { text, color };
  G.bannerTimer = duration;
  playDramatic();
}

// ====== MUSHROOM CLOUD ======
export function spawnMushroom(G, x, y, color = '#ff345d', size = 1) {
  G.mushroomClouds.push({ x, y, color, size, timer: 0, duration: 2.5 });
  G.shockwaves.push({ x, y, radius: 0, maxRadius: 200 * size, speed: 300 * size, life: 1, max: 1, color });
  G.shake = Math.max(G.shake, 20 * size);
  G.flash = 1;
  G.flashColor = color;
  burst(G, x, y, '#ffb000', 30, 2 * size);
  burst(G, x, y, color, 20, 1.5 * size);
  burst(G, x, y, '#ffffff', 10, 1 * size);
  if (size > 0.8) { G.slowMo = 0.8; G.slowMoFactor = 0.3; }
}

// ====== SHOCKWAVE ======
export function spawnShockwave(G, x, y, color = '#ff345d', maxR = 150) {
  G.shockwaves.push({ x, y, radius: 0, maxRadius: maxR, speed: 250, life: 1, max: 1, color });
}

// ====== EMP LIGHTNING ======
export function spawnEMP(G, x, y) {
  G.empFlashes.push({ x, y, life: 0.6, max: 0.6 });
  playEMPSound();
  G.flash = 0.8;
  G.flashColor = '#ffffff';
}

// ====== SMOKE TRAIL ======
export function spawnSmoke(G, x, y, color = '#888') {
  for (let i = 0; i < 8; i++) {
    G.smokeTrails.push({
      x: x + rnd(-5, 5), y: y + rnd(-5, 5),
      vx: rnd(-20, 20), vy: rnd(-60, -20),
      life: rnd(0.5, 1.5), max: 1.5,
      size: rnd(4, 10), color,
    });
  }
}

// ====== DEFCON CALCULATOR ======
export function calcDefcon(G) {
  let maxThreat = 0;
  for (const k of G.enemyNations) {
    const h = G.hostility[k] || 0;
    if (!G.allies.includes(k)) maxThreat = Math.max(maxThreat, h);
  }
  const activeThreats = G.threats.length;
  const hasActiveAttack = G.attackScene !== null;
  if (hasActiveAttack || activeThreats > 1) return 1;
  if (maxThreat > 80) return 2;
  if (maxThreat > 60 || activeThreats > 0) return 3;
  if (maxThreat > 35) return 4;
  return 5;
}

// ====== DEFCON DISPLAY ======
export function updateDefconDisplay(G) {
  const el = document.getElementById('defcon');
  if (!el) return;
  const dc = G.defcon;
  const colors = { 1: '#ff0000', 2: '#ff345d', 3: '#ffb000', 4: '#fbbf24', 5: '#00ff9d' };
  const labels = { 1: 'DEFCON 1 \u2013 ATOMKRIEG', 2: 'DEFCON 2 \u2013 KRITISCH', 3: 'DEFCON 3 \u2013 ERH\u00d6HT', 4: 'DEFCON 4 \u2013 WACHSAM', 5: 'DEFCON 5 \u2013 FRIEDEN' };
  const bg = { 1: 'rgba(255,0,0,.25)', 2: 'rgba(255,52,93,.2)', 3: 'rgba(255,176,0,.15)', 4: 'rgba(251,191,36,.1)', 5: 'rgba(0,255,157,.08)' };
  el.style.background = bg[dc];
  el.style.border = `2px solid ${colors[dc]}`;
  el.style.color = colors[dc];
  el.textContent = labels[dc];
  if (dc <= 2) el.style.textShadow = `0 0 10px ${colors[dc]}`;
  else el.style.textShadow = 'none';
}

// ====== DRAW: MUSHROOM CLOUD ======
export function drawMushroomCloud(cx, mc) {
  const progress = mc.timer / mc.duration;
  const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
  if (alpha <= 0) return;
  const x = mc.x, y = mc.y, s = mc.size;
  cx.save(); cx.globalAlpha = alpha * 0.8;
  const stemH = 80 * s * Math.min(1, progress * 3);
  const stemW = 12 * s;
  const stemGrad = cx.createLinearGradient(x, y, x, y - stemH);
  stemGrad.addColorStop(0, mc.color); stemGrad.addColorStop(0.5, '#ffb000'); stemGrad.addColorStop(1, '#ffffff');
  cx.fillStyle = stemGrad;
  cx.fillRect(x - stemW, y - stemH, stemW * 2, stemH);
  if (progress > 0.1) {
    const capProgress = Math.min(1, (progress - 0.1) / 0.4);
    const capW = 60 * s * capProgress;
    const capH = 25 * s * capProgress;
    const capY = y - stemH;
    const capGrad = cx.createRadialGradient(x, capY, 0, x, capY, capW);
    capGrad.addColorStop(0, '#ffffff'); capGrad.addColorStop(0.3, '#ffb000'); capGrad.addColorStop(0.7, mc.color); capGrad.addColorStop(1, 'rgba(255,50,50,0)');
    cx.fillStyle = capGrad;
    cx.beginPath(); cx.ellipse(x, capY, capW, capH, 0, 0, Math.PI * 2); cx.fill();
    cx.globalAlpha = alpha * 0.5 * capProgress;
    cx.fillStyle = '#ffffff';
    cx.beginPath(); cx.ellipse(x, capY, capW * 0.4, capH * 0.5, 0, 0, Math.PI * 2); cx.fill();
  }
  if (progress < 0.6) {
    for (let i = 0; i < 3; i++) {
      const px = x + rnd(-15 * s, 15 * s);
      const py = y - rnd(0, stemH);
      const ps = rnd(2, 6) * s;
      cx.globalAlpha = alpha * 0.6;
      cx.fillStyle = Math.random() > 0.5 ? '#ffb000' : '#ff345d';
      cx.beginPath(); cx.arc(px, py, ps, 0, 7); cx.fill();
    }
  }
  cx.restore();
}

// ====== DRAW: SHOCKWAVE ======
export function drawShockwave(cx, sw) {
  const alpha = sw.life / sw.max;
  cx.save(); cx.globalAlpha = alpha * 0.7;
  cx.strokeStyle = sw.color; cx.lineWidth = 3 * (1 - alpha) + 1;
  cx.beginPath(); cx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); cx.stroke();
  cx.globalAlpha = alpha * 0.2; cx.fillStyle = sw.color;
  cx.beginPath(); cx.arc(sw.x, sw.y, sw.radius * 0.8, 0, Math.PI * 2); cx.fill();
  cx.restore();
}

// ====== DRAW: EMP LIGHTNING ======
export function drawEMP(cx, emp) {
  const alpha = emp.life / emp.max;
  cx.save(); cx.globalAlpha = alpha; cx.strokeStyle = '#ffffff'; cx.lineWidth = 2;
  for (let b = 0; b < 3; b++) {
    const angle = b * 2.094 + rnd(-0.3, 0.3);
    let lx = emp.x, ly = emp.y;
    const len = rnd(60, 120);
    cx.beginPath(); cx.moveTo(lx, ly);
    for (let s = 0; s < 6; s++) {
      lx += Math.cos(angle + rnd(-0.5, 0.5)) * len / 6;
      ly += Math.sin(angle + rnd(-0.5, 0.5)) * len / 6;
      cx.lineTo(lx, ly);
    }
    cx.stroke();
  }
  cx.globalAlpha = alpha * 0.5; cx.fillStyle = '#ffffff';
  cx.beginPath(); cx.arc(emp.x, emp.y, 20 * alpha, 0, 7); cx.fill();
  cx.restore();
}

// ====== DRAW: BANNER ======
export function drawBanner(cx, G, W, H) {
  if (!G.banner || G.bannerTimer <= 0) return;
  const alpha = G.bannerTimer < 0.5 ? G.bannerTimer / 0.5 : G.bannerTimer > 2.5 ? 1 - (G.bannerTimer - 2.5) / 0.5 : 1;
  if (alpha <= 0) return;
  cx.save(); cx.globalAlpha = alpha;
  cx.fillStyle = 'rgba(0,0,0,.7)';
  const bannerY = H * 0.4;
  cx.fillRect(0, bannerY, W, 60);
  cx.fillStyle = G.banner.color; cx.fillRect(0, bannerY, W, 3); cx.fillRect(0, bannerY + 57, W, 3);
  cx.textAlign = 'center'; cx.font = '900 36px Arial'; cx.fillStyle = G.banner.color;
  cx.shadowColor = G.banner.color; cx.shadowBlur = 20;
  cx.fillText(G.banner.text, W / 2, bannerY + 40);
  cx.textAlign = 'left'; cx.restore();
}

// ====== DRAW: CRT SCANLINES ======
export function drawScanlines(cx, W, H) {
  cx.save(); cx.globalAlpha = 0.03;
  cx.fillStyle = '#000';
  for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
  const vg = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
  cx.globalAlpha = 1; cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
  cx.restore();
}

// ====== DRAW: SCREEN CRACK ======
export function drawScreenCrack(cx, G, W, H) {
  if (!G.screenCrack) return;
  const alpha = Math.min(1, G.screenCrack.life / 1);
  cx.save(); cx.globalAlpha = alpha * 0.4; cx.strokeStyle = '#ff345d'; cx.lineWidth = 2;
  const cx_ = W / 2, cy_ = H / 2;
  for (let i = 0; i < 8; i++) {
    const angle = i * 0.785 + rnd(-0.2, 0.2);
    cx.beginPath(); cx.moveTo(cx_, cy_);
    let lx = cx_, ly = cy_;
    for (let s = 0; s < 5; s++) {
      lx += Math.cos(angle + rnd(-0.3, 0.3)) * rnd(30, 80);
      ly += Math.sin(angle + rnd(-0.3, 0.3)) * rnd(30, 80);
      cx.lineTo(lx, ly);
    }
    cx.stroke();
  }
  cx.restore();
}
