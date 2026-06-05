// ====== RENDERER ======
import { NATIONS, BLDS, MAP_POS } from './data.js';
import { rnd } from './helpers.js';
import {
  drawMushroomCloud, drawShockwave, drawEMP, drawBanner,
  drawScanlines, drawScreenCrack,
} from './effects.js';

// ====== TITLE SCREEN IMAGE ======
let titleImg = null;
let titleImgLoaded = false;
try {
  titleImg = new Image();
  titleImg.onload = () => { titleImgLoaded = true; };
  titleImg.onerror = () => { titleImgLoaded = false; };
  titleImg.src = '/img/startscreen.png';
} catch (e) { titleImgLoaded = false; }

// ====== DRAW: TITLE SCREEN ======
export function drawTitleScreen(cx, G, W, H) {
  const t = Date.now() * 0.001;

  // Dark background
  cx.fillStyle = '#040714';
  cx.fillRect(0, 0, W, H);

  // Draw startscreen image if loaded, cover-style
  if (titleImgLoaded && titleImg) {
    const imgAspect = titleImg.width / titleImg.height;
    const canAspect = W / H;
    let dw, dh, dx, dy;
    if (canAspect > imgAspect) {
      dw = W; dh = W / imgAspect; dx = 0; dy = (H - dh) / 2;
    } else {
      dh = H; dw = H * imgAspect; dy = 0; dx = (W - dw) / 2;
    }
    cx.save();
    cx.globalAlpha = 0.85;
    cx.drawImage(titleImg, dx, dy, dw, dh);
    cx.restore();

    // Dark overlay at bottom for text readability
    const overlayGrad = cx.createLinearGradient(0, H * 0.6, 0, H);
    overlayGrad.addColorStop(0, 'rgba(4,7,20,0)');
    overlayGrad.addColorStop(0.5, 'rgba(4,7,20,0.6)');
    overlayGrad.addColorStop(1, 'rgba(4,7,20,0.92)');
    cx.fillStyle = overlayGrad;
    cx.fillRect(0, 0, W, H);

    // Dark overlay at top
    const topGrad = cx.createLinearGradient(0, 0, 0, H * 0.25);
    topGrad.addColorStop(0, 'rgba(4,7,20,0.5)');
    topGrad.addColorStop(1, 'rgba(4,7,20,0)');
    cx.fillStyle = topGrad;
    cx.fillRect(0, 0, W, H * 0.25);
  } else {
    // Fallback: animated neon grid
    cx.save();
    cx.strokeStyle = 'rgba(0,217,255,.03)';
    cx.lineWidth = 1;
    const gridOffset = (t * 10) % 60;
    for (let x = -60 + gridOffset; x < W + 60; x += 60) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
    for (let y = -60 + gridOffset; y < H + 60; y += 60) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
    cx.restore();

    // Title text fallback
    cx.textAlign = 'center';
    cx.save(); cx.shadowColor = '#00d9ff'; cx.shadowBlur = 40;
    cx.fillStyle = '#00d9ff'; cx.font = '900 72px Orbitron, Arial'; cx.fillText('NEON COMMAND', W / 2, H * 0.35);
    cx.restore();
    cx.save(); cx.shadowColor = '#ff2bd6'; cx.shadowBlur = 25;
    cx.fillStyle = '#ff2bd6'; cx.font = '900 36px Orbitron, Arial'; cx.fillText('GEOPOLITIK', W / 2, H * 0.35 + 50);
    cx.restore();
  }

  // Animated neon border frame
  cx.save();
  const borderPulse = 0.3 + 0.2 * Math.sin(t * 1.5);
  cx.strokeStyle = `rgba(0,217,255,${borderPulse})`;
  cx.lineWidth = 1;
  const margin = 20;
  cx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);
  // Corner accents
  const cornerLen = 40;
  cx.strokeStyle = `rgba(0,217,255,${0.5 + 0.3 * Math.sin(t * 2)})`;
  cx.lineWidth = 2;
  // Top-left
  cx.beginPath(); cx.moveTo(margin, margin + cornerLen); cx.lineTo(margin, margin); cx.lineTo(margin + cornerLen, margin); cx.stroke();
  // Top-right
  cx.beginPath(); cx.moveTo(W - margin - cornerLen, margin); cx.lineTo(W - margin, margin); cx.lineTo(W - margin, margin + cornerLen); cx.stroke();
  // Bottom-left
  cx.beginPath(); cx.moveTo(margin, H - margin - cornerLen); cx.lineTo(margin, H - margin); cx.lineTo(margin + cornerLen, H - margin); cx.stroke();
  // Bottom-right
  cx.beginPath(); cx.moveTo(W - margin - cornerLen, H - margin); cx.lineTo(W - margin, H - margin); cx.lineTo(W - margin, H - margin - cornerLen); cx.stroke();
  cx.restore();

  // Floating particles
  cx.save();
  for (let i = 0; i < 40; i++) {
    const px = ((i * 137.5 + t * 8) % (W + 40)) - 20;
    const py = ((i * 97.3 + t * (3 + i * 0.3)) % (H + 40)) - 20;
    cx.globalAlpha = 0.08 + 0.08 * Math.sin(t + i);
    cx.fillStyle = i % 3 === 0 ? '#00d9ff' : i % 3 === 1 ? '#ff2bd6' : '#7d5cff';
    cx.beginPath(); cx.arc(px, py, 1 + (i % 3), 0, 7); cx.fill();
  }
  cx.restore();

  // Horizontal neon line
  cx.save();
  const lineY = H * 0.72;
  const lineGrad = cx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, 'rgba(0,217,255,0)');
  lineGrad.addColorStop(0.3, 'rgba(0,217,255,.3)');
  lineGrad.addColorStop(0.5, 'rgba(0,217,255,.5)');
  lineGrad.addColorStop(0.7, 'rgba(0,217,255,.3)');
  lineGrad.addColorStop(1, 'rgba(0,217,255,0)');
  cx.strokeStyle = lineGrad; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(0, lineY); cx.lineTo(W, lineY); cx.stroke();
  cx.restore();

  // Title overlay text (on top of image)
  cx.textAlign = 'center';
  cx.save(); cx.shadowColor = '#00d9ff'; cx.shadowBlur = 30;
  cx.fillStyle = '#00d9ff'; cx.font = '900 48px Orbitron, Arial';
  cx.fillText('NEON COMMAND', W / 2, H * 0.76);
  cx.restore();
  cx.save(); cx.shadowColor = '#ff2bd6'; cx.shadowBlur = 20;
  cx.fillStyle = '#ff2bd6'; cx.font = '900 24px Orbitron, Arial';
  cx.fillText('GEOPOLITIK', W / 2, H * 0.76 + 36);
  cx.restore();

  // Tagline
  cx.fillStyle = '#667'; cx.font = '12px "Share Tech Mono", Arial';
  cx.fillText('Strategie · Diplomatie · Nuklearkrieg · Weltherrschaft', W / 2, H * 0.76 + 60);

  // Pulsing "Press any key" prompt
  const promptAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2));
  cx.save(); cx.globalAlpha = promptAlpha;
  cx.shadowColor = '#00d9ff'; cx.shadowBlur = 15;
  cx.fillStyle = '#00d9ff'; cx.font = '900 18px Orbitron, Arial';
  cx.fillText('[ DRÜCKE EINE TASTE ]', W / 2, H * 0.91);
  cx.restore();

  // Controls hint
  cx.fillStyle = '#444'; cx.font = '10px "Share Tech Mono", Arial';
  cx.fillText('1-6 Bauen · D Diplomatie · K Angriff · X Spionage · U Upgrade · M Musik · R Neustart', W / 2, H * 0.95);

  cx.textAlign = 'left';
}

// ====== DRAW: SINGLE BUILDING (PIMPED) ======
export function drawBuilding(cx, b, alpha = 1, nationColor = null) {
  const spec = BLDS[b.type]; if (!spec) return;
  const age = b.builtAt ? Math.min(1, (Date.now() - b.builtAt) / 500) : 1;
  const pulse = 1 + Math.sin(Date.now() * 0.003 + b.x) * 0.08;
  const levelScale = 1 + (b.level - 1) * 0.12;
  const col = nationColor || spec.color;
  cx.save();
  cx.shadowColor = col;
  cx.shadowBlur = (10 * pulse + (b.level - 1) * 5) * age;
  cx.fillStyle = col;
  cx.globalAlpha = alpha * age * 0.9;
  const s = levelScale * age;
  cx.translate(b.x, b.y); cx.scale(s, s);
  if (b.type === 'factory') {
    // Factory: rounded square with gradient fill
    const fg = cx.createLinearGradient(-9, -9, 9, 9);
    fg.addColorStop(0, col); fg.addColorStop(1, col + 'aa');
    cx.fillStyle = fg;
    cx.beginPath();
    cx.moveTo(-7, -9); cx.lineTo(7, -9); cx.quadraticCurveTo(9, -9, 9, -7);
    cx.lineTo(9, 7); cx.quadraticCurveTo(9, 9, 7, 9);
    cx.lineTo(-7, 9); cx.quadraticCurveTo(-9, 9, -9, 7);
    cx.lineTo(-9, -7); cx.quadraticCurveTo(-9, -9, -7, -9);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 11px Arial'; cx.textAlign = 'center'; cx.fillText('$', 0, 4);
    if (b.level > 1) { cx.fillStyle = '#fff'; cx.font = 'bold 7px Arial'; cx.fillText('L' + b.level, 7, -6); }
  } else if (b.type === 'milbase') {
    // Military: sharp triangle with gradient
    const mg = cx.createLinearGradient(0, -12, 0, 8);
    mg.addColorStop(0, col); mg.addColorStop(1, col + '88');
    cx.fillStyle = mg;
    cx.beginPath(); cx.moveTo(0, -13); cx.lineTo(12, 9); cx.lineTo(-12, 9); cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 9px Arial'; cx.textAlign = 'center'; cx.fillText('M', 0, 4);
    if (b.level > 1) { cx.fillStyle = '#fff'; cx.font = 'bold 7px Arial'; cx.fillText('L' + b.level, 8, -6); }
    // Small shield ring
    cx.globalAlpha = alpha * age * 0.15; cx.strokeStyle = col; cx.lineWidth = 1;
    cx.beginPath(); cx.arc(0, 0, 15, 0, 7); cx.stroke();
  } else if (b.type === 'lab') {
    // Lab: diamond with gradient
    const lg = cx.createRadialGradient(0, 0, 0, 0, 0, 12);
    lg.addColorStop(0, '#ffffff44'); lg.addColorStop(0.5, col); lg.addColorStop(1, col + '88');
    cx.fillStyle = lg;
    cx.beginPath(); cx.moveTo(0, -12); cx.lineTo(10, 0); cx.lineTo(0, 12); cx.lineTo(-10, 0); cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 9px Arial'; cx.textAlign = 'center'; cx.fillText('T', 0, 4);
    if (b.level > 1) { cx.fillStyle = '#fff'; cx.font = 'bold 7px Arial'; cx.fillText('L' + b.level, 7, -7); }
  } else if (b.type === 'defense') {
    // Defense: circle with radial gradient + shield ring
    const dg = cx.createRadialGradient(0, -3, 0, 0, 0, 12);
    dg.addColorStop(0, '#ffffff33'); dg.addColorStop(0.5, col); dg.addColorStop(1, col + 'aa');
    cx.fillStyle = dg;
    cx.beginPath(); cx.arc(0, 0, 12, 0, 7); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 9px Arial'; cx.textAlign = 'center'; cx.fillText('D', 0, 3);
    if (b.level > 1) { cx.fillStyle = '#fff'; cx.font = 'bold 7px Arial'; cx.fillText('L' + b.level, 8, -7); }
    cx.strokeStyle = col; cx.lineWidth = 1 + b.level * 0.5; cx.globalAlpha = alpha * age * 0.25;
    cx.beginPath(); cx.arc(0, 0, 15 + b.level * 2, 0, 7); cx.stroke();
    // Second ring for level 3
    if (b.level >= 3) { cx.globalAlpha = alpha * age * 0.12; cx.beginPath(); cx.arc(0, 0, 22, 0, 7); cx.stroke(); }
  } else if (b.type === 'silo') {
    // Silo: tall rect with gradient + missile tip
    const sg = cx.createLinearGradient(-5, -12, 5, 12);
    sg.addColorStop(0, col + 'cc'); sg.addColorStop(0.5, col); sg.addColorStop(1, col + '99');
    cx.fillStyle = sg;
    cx.fillRect(-6, -13, 12, 26);
    // Missile tip
    cx.fillStyle = '#ffb000';
    cx.beginPath(); cx.moveTo(0, -17); cx.lineTo(4, -13); cx.lineTo(-4, -13); cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 9px Arial'; cx.textAlign = 'center'; cx.fillText('R', 0, 4);
    if (b.level > 1) { cx.fillStyle = '#fff'; cx.font = 'bold 7px Arial'; cx.fillText('L' + b.level, 6, -8); }
  } else if (b.type === 'spyhq') {
    // Spy HQ: hexagon with radial gradient + pulsing rings
    const spg = cx.createRadialGradient(0, 0, 0, 0, 0, 12);
    spg.addColorStop(0, '#ffffff33'); spg.addColorStop(0.5, col); spg.addColorStop(1, col + '99');
    cx.fillStyle = spg;
    cx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 - Math.PI / 6;
      const r = 12;
      cx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    cx.closePath(); cx.fill();
    cx.fillStyle = '#000'; cx.font = 'bold 9px Arial'; cx.textAlign = 'center'; cx.fillText('S', 0, 3);
    if (b.level > 1) { cx.fillStyle = '#fff'; cx.font = 'bold 7px Arial'; cx.fillText('L' + b.level, 8, -8); }
    // Pulsing detection ring
    const pulseR = 17 + b.level * 3 + Math.sin(Date.now() * 0.004 + b.x) * 3;
    cx.globalAlpha = alpha * age * 0.2; cx.strokeStyle = col; cx.lineWidth = 1;
    cx.beginPath(); cx.arc(0, 0, pulseR, 0, 7); cx.stroke();
    // Second scan ring
    const scanR = 24 + b.level * 4 + Math.sin(Date.now() * 0.003 + b.y) * 4;
    cx.globalAlpha = alpha * age * 0.08;
    cx.beginPath(); cx.arc(0, 0, scanR, 0, 7); cx.stroke();
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
  // Animated dark background with subtle grid
  cx.fillStyle = '#040714'; cx.fillRect(0, 0, W, H);
  const t = Date.now() * 0.001;
  // Animated neon grid
  cx.save();
  cx.strokeStyle = 'rgba(0,217,255,.03)';
  cx.lineWidth = 1;
  const gridOffset = (t * 10) % 60;
  for (let x = -60 + gridOffset; x < W + 60; x += 60) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
  for (let y = -60 + gridOffset; y < H + 60; y += 60) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
  cx.restore();

  // Floating background particles
  cx.save();
  for (let i = 0; i < 30; i++) {
    const px = ((i * 137.5 + t * 8) % (W + 40)) - 20;
    const py = ((i * 97.3 + t * (3 + i * 0.3)) % (H + 40)) - 20;
    cx.globalAlpha = 0.1 + 0.1 * Math.sin(t + i);
    cx.fillStyle = i % 3 === 0 ? '#00d9ff' : i % 3 === 1 ? '#ff2bd6' : '#7d5cff';
    cx.beginPath(); cx.arc(px, py, 1 + (i % 3), 0, 7); cx.fill();
  }
  cx.restore();

  // Horizontal neon lines
  cx.save();
  const lineY = H * 0.17;
  const lineGrad = cx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, 'rgba(0,217,255,0)');
  lineGrad.addColorStop(0.3, 'rgba(0,217,255,.3)');
  lineGrad.addColorStop(0.5, 'rgba(0,217,255,.5)');
  lineGrad.addColorStop(0.7, 'rgba(0,217,255,.3)');
  lineGrad.addColorStop(1, 'rgba(0,217,255,0)');
  cx.strokeStyle = lineGrad; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(0, lineY); cx.lineTo(W, lineY); cx.stroke();
  cx.globalAlpha = 0.3; cx.lineWidth = 3;
  cx.beginPath(); cx.moveTo(W * 0.2, lineY); cx.lineTo(W * 0.8, lineY); cx.stroke();
  cx.restore();

  cx.textAlign = 'center';
  // Glitch effect
  const glitchX = Math.random() < 0.04 ? rnd(-4, 4) : 0;
  const glitchY = Math.random() < 0.04 ? rnd(-2, 2) : 0;
  // Title: NEON COMMAND
  cx.save(); cx.shadowColor = '#00d9ff'; cx.shadowBlur = 40;
  cx.fillStyle = '#00d9ff'; cx.font = '900 72px Orbitron, Arial'; cx.fillText('NEON COMMAND', W / 2 + glitchX, H * 0.08 + glitchY);
  cx.restore();
  // Subtitle: GEOPOLITIK
  cx.save(); cx.shadowColor = '#ff2bd6'; cx.shadowBlur = 25;
  cx.fillStyle = '#ff2bd6'; cx.font = '900 36px Orbitron, Arial'; cx.fillText('GEOPOLITIK', W / 2, H * 0.08 + 50);
  cx.restore();
  // Tagline
  cx.fillStyle = '#667'; cx.font = '13px "Share Tech Mono", Arial';
  cx.fillText('Strategie \u00b7 Diplomatie \u00b7 Nuklearkrieg \u00b7 Weltherrschaft', W / 2, H * 0.08 + 78);

  // Nation cards
  const keys = Object.keys(NATIONS);
  const cardW = 155, cardH = 210, gap = 14;
  const totalW = keys.length * cardW + (keys.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const startY = H * 0.25;

  keys.forEach((k, i) => {
    const n = NATIONS[k];
    const x = startX + i * (cardW + gap);
    const hover = G.mouseX > x && G.mouseX < x + cardW && G.mouseY > startY && G.mouseY < startY + cardH;

    // Card background with gradient
    cx.save();
    const cardGrad = cx.createLinearGradient(x, startY, x, startY + cardH);
    if (hover) {
      cardGrad.addColorStop(0, 'rgba(0,217,255,.12)');
      cardGrad.addColorStop(1, 'rgba(0,217,255,.04)');
    } else {
      cardGrad.addColorStop(0, 'rgba(20,20,40,.9)');
      cardGrad.addColorStop(1, 'rgba(10,10,30,.95)');
    }
    cx.fillStyle = cardGrad;
    // Rounded rect
    const cr = 8;
    cx.beginPath();
    cx.moveTo(x + cr, startY); cx.lineTo(x + cardW - cr, startY);
    cx.quadraticCurveTo(x + cardW, startY, x + cardW, startY + cr);
    cx.lineTo(x + cardW, startY + cardH - cr);
    cx.quadraticCurveTo(x + cardW, startY + cardH, x + cardW - cr, startY + cardH);
    cx.lineTo(x + cr, startY + cardH);
    cx.quadraticCurveTo(x, startY + cardH, x, startY + cardH - cr);
    cx.lineTo(x, startY + cr);
    cx.quadraticCurveTo(x, startY, x + cr, startY);
    cx.closePath(); cx.fill();

    // Border glow on hover
    cx.strokeStyle = hover ? n.color : 'rgba(255,255,255,.1)';
    cx.lineWidth = hover ? 2 : 1;
    if (hover) { cx.shadowColor = n.color; cx.shadowBlur = 15; }
    cx.stroke();
    cx.restore();

    // Top accent line
    cx.save();
    const accentGrad = cx.createLinearGradient(x, 0, x + cardW, 0);
    accentGrad.addColorStop(0, n.color + '00');
    accentGrad.addColorStop(0.5, n.color + (hover ? 'cc' : '66'));
    accentGrad.addColorStop(1, n.color + '00');
    cx.strokeStyle = accentGrad; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(x + 10, startY); cx.lineTo(x + cardW - 10, startY); cx.stroke();
    cx.restore();

    // Flag
    cx.fillStyle = n.color; cx.font = '38px Arial'; cx.fillText(n.flag, x + cardW / 2, startY + 42);
    // Name
    cx.save(); cx.shadowColor = n.color; cx.shadowBlur = hover ? 10 : 0;
    cx.fillStyle = '#fff'; cx.font = '900 15px Orbitron, Arial'; cx.fillText(n.name, x + cardW / 2, startY + 68);
    cx.restore();

    // Stat bars with labels
    const drawStat = (label, value, max, yPos, color) => {
      cx.fillStyle = '#555'; cx.font = '9px "Share Tech Mono", Arial';
      cx.fillText(label, x + cardW / 2, yPos);
      const barW = 80, barH = 5, bx = x + (cardW - barW) / 2, by = yPos + 3;
      cx.fillStyle = 'rgba(255,255,255,.08)'; cx.fillRect(bx, by, barW, barH);
      const fillW = barW * (value / max);
      const barGrad = cx.createLinearGradient(bx, 0, bx + fillW, 0);
      barGrad.addColorStop(0, color + '88');
      barGrad.addColorStop(1, color);
      cx.fillStyle = barGrad; cx.fillRect(bx, by, fillW, barH);
      cx.fillStyle = color; cx.font = '8px Arial'; cx.fillText(value, x + cardW / 2, yPos + 14);
    };
    drawStat('MILIT\u00c4R', n.mil, 10, startY + 85, '#ef4444');
    drawStat('\u00d6KONOMIE', n.eco, 10, startY + 105, '#fbbf24');
    drawStat('TECHNOLOGIE', n.tech, 10, startY + 125, '#3b82f6');

    // Personality badge
    const pLabel = { aggressive: '\u2694\uFE0F AGGRESSIV', defensive: '\u{1F6E1}\uFE0F DEFENSIV', diplomatic: '\u{1F91D} DIPLOMATISCH', expansive: '\u{1F4C8} EXPANSIV' }[n.personality] || '';
    cx.fillStyle = n.color; cx.font = 'bold 9px Orbitron, Arial'; cx.fillText(pLabel, x + cardW / 2, startY + 150);

    // Description
    cx.fillStyle = '#666'; cx.font = '9px "Share Tech Mono", Arial';
    const words = n.desc.split(' '); let line = '', ly = startY + 168;
    for (const w of words) { if ((line + ' ' + w).length > 18) { cx.fillText(line.trim(), x + cardW / 2, ly); ly += 11; line = w; } else { line += ' ' + w; } }
    if (line) cx.fillText(line.trim(), x + cardW / 2, ly);

    // Starting money indicator
    cx.fillStyle = '#555'; cx.font = '8px "Share Tech Mono", Arial';
    cx.fillText(`Start: ${n.money}$`, x + cardW / 2, startY + 200);
  });

  // Bottom neon line
  cx.save();
  const blineY = H - 55;
  const blineGrad = cx.createLinearGradient(0, 0, W, 0);
  blineGrad.addColorStop(0, 'rgba(255,43,214,0)');
  blineGrad.addColorStop(0.5, 'rgba(255,43,214,.3)');
  blineGrad.addColorStop(1, 'rgba(255,43,214,0)');
  cx.strokeStyle = blineGrad; cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(0, blineY); cx.lineTo(W, blineY); cx.stroke();
  cx.restore();

  // Start prompt with pulsing animation
  const promptAlpha = 0.5 + 0.5 * Math.sin(t * 2);
  cx.save(); cx.globalAlpha = promptAlpha;
  cx.fillStyle = '#00d9ff'; cx.font = '14px Orbitron, Arial';
  cx.fillText('[ KLICKE AUF EINE NATION ]', W / 2, H - 30);
  cx.restore();

  // Controls hint
  cx.fillStyle = '#333'; cx.font = '10px "Share Tech Mono", Arial';
  cx.fillText('1-6 Bauen \u00b7 D Diplomatie \u00b7 K Angriff \u00b7 X Spionage \u00b7 U Upgrade \u00b7 M Musik \u00b7 R Neustart', W / 2, H - 12);
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
      else if (G.selected === 'spyhq') {
        cx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3 - Math.PI / 6;
          cx[i === 0 ? 'moveTo' : 'lineTo'](G.mouseX + Math.cos(a) * 11, G.mouseY + Math.sin(a) * 11);
        }
        cx.closePath(); cx.fill();
      }
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
    // Spy mode targeting
    if (G.spyMode && !isP) {
      cx.save(); cx.strokeStyle = mouseNear ? '#ff2bd6' : '#ff2bd633';
      cx.lineWidth = mouseNear ? 3 : 1; cx.setLineDash(mouseNear ? [] : [3, 5]);
      cx.beginPath(); cx.arc(px, py, 35 + Math.sin(Date.now() * 0.006) * 5, 0, 7); cx.stroke();
      if (mouseNear) {
        // Crosshair
        cx.setLineDash([]); cx.strokeStyle = '#ff2bd6'; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(px - 20, py); cx.lineTo(px + 20, py); cx.stroke();
        cx.beginPath(); cx.moveTo(px, py - 20); cx.lineTo(px, py + 20); cx.stroke();
      }
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

  // Trade route lines between player and allies
  if (G.nation && G.allies.length > 0) {
    const mp = MAP_POS[G.nation], mx = mp.x * W, my = mp.y * H;
    for (const a of G.allies) {
      const ap = MAP_POS[a]; if (!ap) continue;
      const ax = ap.x * W, ay = ap.y * H;
      const pulse = G.tradePulse || 0;
      // Draw trade route line
      cx.save();
      cx.strokeStyle = '#00ff9d33';
      cx.lineWidth = 2;
      cx.setLineDash([8, 12]);
      cx.lineDashOffset = -pulse * 10;
      cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(ax, ay); cx.stroke();
      cx.setLineDash([]);
      // Animated trade packet dots
      const dist = Math.hypot(ax - mx, ay - my);
      const numDots = Math.max(2, Math.floor(dist / 60));
      for (let i = 0; i < numDots; i++) {
        const t = ((i / numDots) + pulse * 0.15) % 1;
        const dx = mx + (ax - mx) * t;
        const dy = my + (ay - my) * t;
        const dotAlpha = 0.3 + 0.4 * Math.sin(t * Math.PI);
        cx.globalAlpha = dotAlpha;
        cx.fillStyle = '#00ff9d';
        cx.beginPath(); cx.arc(dx, dy, 2, 0, 7); cx.fill();
      }
      cx.restore();
    }
  }

  // Nuclear Winter overlay
  if (G.nuclearWinter) {
    cx.save();
    // Snow particle overlay
    const t = Date.now() * 0.001;
    cx.globalAlpha = 0.15;
    cx.fillStyle = '#88ccff';
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 137.5 + t * 30) % W);
      const sy = ((i * 97.3 + t * (20 + i * 0.5)) % H);
      const sz = 1 + (i % 3);
      cx.beginPath(); cx.arc(sx, sy, sz, 0, 7); cx.fill();
    }
    // Blue-grey fog overlay
    cx.globalAlpha = 0.08;
    cx.fillStyle = '#446688';
    cx.fillRect(0, 0, W, H);
    // DEFCON 1 locked indicator
    cx.globalAlpha = 0.6;
    cx.fillStyle = '#88ccff';
    cx.font = 'bold 10px Arial';
    cx.textAlign = 'right';
    cx.fillText('\u2744\uFE0F NUKLEARWINTER \u2744\uFE0F', W - 10, H - 80);
    cx.textAlign = 'left';
    cx.restore();
  }

  drawScanlines(cx, W, H);
  drawBanner(cx, G, W, H);

  // ====== WEATHER OVERLAY ======
  drawWeather(cx, G, W, H);

  // ====== NUCLEAR WINTER OVERLAY ======
  if (G.nuclearWinter) {
    cx.save();
    // Blue-tinted frost overlay
    cx.fillStyle = 'rgba(100,150,200,0.08)';
    cx.fillRect(0, 0, W, H);
    // Vignette frost
    const frostGrad = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
    frostGrad.addColorStop(0, 'rgba(136,204,255,0)');
    frostGrad.addColorStop(1, 'rgba(136,204,255,0.15)');
    cx.fillStyle = frostGrad;
    cx.fillRect(0, 0, W, H);
    cx.restore();
  }
}

// ====== DRAW: GAME OVER ======
export function drawGameOver(cx, G, W, H) {
  cx.fillStyle = 'rgba(0,0,0,.85)'; cx.fillRect(0, 0, W, H); cx.textAlign = 'center';
  const t = Date.now() * 0.001;
  // Red vignette
  cx.save();
  const vg = cx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.1, W/2, H/2, Math.max(W,H)*0.7);
  vg.addColorStop(0, 'rgba(255,52,93,0)');
  vg.addColorStop(1, 'rgba(255,52,93,.15)');
  cx.fillStyle = vg; cx.fillRect(0, 0, W, H); cx.restore();

  const gx = Math.random() < 0.08 ? rnd(-5, 5) : 0;
  cx.save(); cx.shadowColor = '#ff345d'; cx.shadowBlur = 50;
  cx.fillStyle = '#ff345d'; cx.font = '900 64px Orbitron, Arial'; cx.fillText('NATION GEFALLEN', W / 2 + gx, H / 2 - 50);
  cx.restore();

  cx.save(); cx.shadowColor = NATIONS[G.nation].color; cx.shadowBlur = 15;
  cx.fillStyle = '#fff'; cx.font = '22px "Share Tech Mono", Arial';
  cx.fillText(`${NATIONS[G.nation].flag} ${NATIONS[G.nation].name} \u2013 Runde ${G.turn}`, W / 2, H / 2 + 5);
  cx.restore();

  // Stats
  cx.fillStyle = '#888'; cx.font = '14px "Share Tech Mono", Arial';
  cx.fillText(`Geb\u00e4ude: ${G.buildings.length} \u00b7 Verb\u00fcndete: ${G.allies.length} \u00b7 Nukes: ${G.nukeCount}`, W / 2, H / 2 + 35);

  // Restart prompt
  const rAlpha = 0.5 + 0.5 * Math.sin(t * 2);
  cx.save(); cx.globalAlpha = rAlpha;
  cx.fillStyle = '#ff345d'; cx.font = '16px Orbitron, Arial';
  cx.fillText('[ R ] NEUSTART', W / 2, H / 2 + 70);
  cx.restore();
  cx.textAlign = 'left';
}

// ====== DRAW: VICTORY ======
export function drawVictory(cx, G, W, H) {
  cx.fillStyle = 'rgba(0,0,0,.85)'; cx.fillRect(0, 0, W, H); cx.textAlign = 'center';
  const t = Date.now() * 0.001;
  // Green vignette
  cx.save();
  const vg = cx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.1, W/2, H/2, Math.max(W,H)*0.7);
  vg.addColorStop(0, 'rgba(0,255,157,0)');
  vg.addColorStop(1, 'rgba(0,255,157,.12)');
  cx.fillStyle = vg; cx.fillRect(0, 0, W, H); cx.restore();

  // Victory sparkles
  cx.save();
  for (let i = 0; i < 20; i++) {
    const sx = W/2 + Math.cos(t * 0.5 + i * 0.314) * (100 + i * 15);
    const sy = H/2 - 30 + Math.sin(t * 0.7 + i * 0.5) * (60 + i * 8);
    cx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 3 + i);
    cx.fillStyle = i % 2 === 0 ? '#00ff9d' : '#fbbf24';
    cx.beginPath(); cx.arc(sx, sy, 2, 0, 7); cx.fill();
  }
  cx.restore();

  const gx = Math.random() < 0.06 ? rnd(-3, 3) : 0;
  cx.save(); cx.shadowColor = '#00ff9d'; cx.shadowBlur = 50;
  cx.fillStyle = '#00ff9d'; cx.font = '900 72px Orbitron, Arial'; cx.fillText('SIEG!', W / 2 + gx, H / 2 - 70);
  cx.restore();

  cx.save(); cx.shadowColor = '#fbbf24'; cx.shadowBlur = 20;
  cx.fillStyle = '#fbbf24'; cx.font = '900 26px Orbitron, Arial';
  cx.fillText(`${NATIONS[G.nation].flag} ${NATIONS[G.nation].name}`, W / 2, H / 2 - 15);
  cx.restore();

  cx.fillStyle = '#fff'; cx.font = '18px "Share Tech Mono", Arial';
  cx.fillText(`Runde ${G.turn} \u00b7 ${G.allies.length + 1}/5 Nationen verb\u00fcndet`, W / 2, H / 2 + 20);

  if (G.nuclearWinter) {
    cx.save(); cx.shadowColor = '#88ccff'; cx.shadowBlur = 10;
    cx.fillStyle = '#88ccff'; cx.font = '14px "Share Tech Mono", Arial';
    cx.fillText('Aber zu welchem Preis... Nuklearwinter!', W / 2, H / 2 + 50);
    cx.restore();
  }

  const rAlpha = 0.5 + 0.5 * Math.sin(t * 2);
  cx.save(); cx.globalAlpha = rAlpha;
  cx.fillStyle = '#00ff9d'; cx.font = '16px Orbitron, Arial';
  cx.fillText('[ R ] NEUSTART', W / 2, H / 2 + 80);
  cx.restore();
  cx.textAlign = 'left';
}

// ====== DRAW: WEATHER ======
function drawWeather(cx, G, W, H) {
  for (const p of G.weatherParticles) {
    cx.save();
    const a = Math.min(1, p.life / 1.5);

    if (p.type === 'snow') {
      // Snow: white/blue circles with wobble
      cx.globalAlpha = a * 0.8;
      cx.fillStyle = '#c8e0ff';
      cx.shadowColor = '#88ccff';
      cx.shadowBlur = 3;
      cx.beginPath();
      cx.arc(p.x + Math.sin(Date.now() * 0.002 + p.y * 0.01) * 8, p.y, p.size, 0, Math.PI * 2);
      cx.fill();
    } else if (p.type === 'rain') {
      // Rain: thin diagonal lines
      cx.globalAlpha = a * 0.5;
      cx.strokeStyle = '#6688cc';
      cx.lineWidth = 1;
      cx.beginPath();
      cx.moveTo(p.x, p.y);
      cx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02);
      cx.stroke();
    } else if (p.type === 'peace') {
      // Peace: soft glowing dots
      cx.globalAlpha = a * 0.3;
      cx.fillStyle = '#ffddaa';
      cx.shadowColor = '#ffddaa';
      cx.shadowBlur = 6;
      cx.beginPath();
      cx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      cx.fill();
    }

    cx.restore();
  }
}
