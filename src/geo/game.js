// ====== MAIN GAME MODULE (Entry Point for Geopolitik) ======
import { NATIONS, BLDS, MAP_POS, ALLY_MAP, WIN_ROUNDS, WIN_ALLIES } from './data.js';
import { createState, selectNation } from './state.js';
import { rnd, burst, floatText, addLog, scheduleEvent, processScheduledEvents, clearScheduledEvents } from './helpers.js';
import { spawnShockwave, spawnMushroom, spawnSmoke, showBanner, calcDefcon, updateDefconDisplay } from './effects.js';
import { updateAI } from './ai.js';
import { drawCountrySelect, drawWorldMap, drawGameOver, drawVictory } from './renderer.js';
import { launchAttack, counterAttack, aiVsAiAttack, setDimensions } from './combat.js';
import { drawHUD, drawIntel, drawBuildBar, setupBuildBarEvents } from './ui.js';
import { initAudio, playBuild, playAlert, playVictory as playVictorySound, startMusic, updateMusic } from './audio.js';

// ====== CANVAS SETUP ======
const cv = document.getElementById('gc');
const cx = cv.getContext('2d');
let W, H;

function resize() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
  setDimensions(W, H);
}
resize();
addEventListener('resize', resize);

// ====== GAME STATE ======
let G = createState();

// ====== PLAYER BUILDING ======
function canBuild(type, mx, my) {
  const spec = BLDS[type];
  if (!spec || G.money < spec.cost) return false;
  const cp = MAP_POS[G.nation];
  if (Math.hypot(mx - cp.x * W, my - cp.y * H) > 180) return false;
  for (const b of G.buildings) { if (Math.hypot(b.x - mx, b.y - my) < 25) return false; }
  return true;
}

function build(type, mx, my) {
  if (!canBuild(type, mx, my)) {
    if (G.money < (BLDS[type]?.cost || 0)) addLog(G, 'Nicht genug Geld!', 'r');
    else addLog(G, 'Zu weit weg! Baue n\u00e4her am Kern.', 'r');
    playAlert(); return;
  }
  const spec = BLDS[type];
  G.money -= spec.cost;
  G.buildings.push({ type, x: mx, y: my, level: 1, hp: 100, maxHp: 100, builtAt: Date.now() });
  burst(G, mx, my, spec.color, 20, 1.2);
  floatText(G, mx, my - 30, `${spec.label}!`, spec.color);
  addLog(G, `\u{1F3D7}\uFE0F ${spec.label} gebaut! (-${spec.cost}$)`, 'g');
  playBuild();
  if (type === 'milbase') G.mil += 3;
  if (type === 'defense') G.defense += 5;
  if (type === 'silo') { G.offense += 15; addLog(G, '\u{1F680} Raketen bereit!', 'p'); }
}

function upgradePlayerBuilding(mx, my) {
  let closest = -1, closestDist = 999;
  for (let i = 0; i < G.buildings.length; i++) {
    const b = G.buildings[i];
    const d = Math.hypot(b.x - mx, b.y - my);
    if (d < 30 && d < closestDist && b.level < 3) { closest = i; closestDist = d; }
  }
  if (closest < 0) { addLog(G, 'Kein Geb\u00e4ude in der N\u00e4he zum Upgraden!', 'y'); playAlert(); return; }
  const b = G.buildings[closest];
  const spec = BLDS[b.type];
  const cost = Math.floor(spec.cost * b.level * 0.8);
  if (G.money < cost) { addLog(G, `Nicht genug Geld! (${cost}$ n\u00f6tig)`, 'r'); playAlert(); return; }
  G.money -= cost;
  b.level++; b.hp = 100 * b.level; b.maxHp = 100 * b.level;
  burst(G, b.x, b.y, '#ffffff', 15, 1);
  burst(G, b.x, b.y, spec.color, 10, 0.8);
  floatText(G, b.x, b.y - 30, `\u2B06 Lvl ${b.level}!`, spec.color, 18);
  spawnShockwave(G, b.x, b.y, spec.color, 60);
  addLog(G, `\u2B06 ${spec.label} \u2192 Lvl ${b.level}! (-${cost}$)`, 'g');
  playBuild();
}

// ====== GAME LOGIC ======
function updateGame(dt) {
  if (G.mode !== 'playing') return;

  // Slow motion
  if (G.slowMo > 0) { G.slowMo -= dt; dt *= G.slowMoFactor; if (G.slowMo <= 0) G.slowMoFactor = 1; }

  G.turnTimer += dt;
  if (G.attackCooldown > 0) G.attackCooldown -= dt;

  // Player income (Nuclear Winter penalty)
  const facs = G.buildings.filter(b => b.type === 'factory');
  const facIncome = facs.reduce((s, b) => s + 15 * b.level, 0);
  const winterPenalty = G.nuclearWinter ? 0.7 : 1; // -30% income
  G.income = (10 + NATIONS[G.nation].eco * 2 + facIncome) * winterPenalty; G.money += G.income * dt;
  const labs = G.buildings.filter(b => b.type === 'lab');
  const labTech = labs.reduce((s, b) => s + 2 * b.level, 0);
  G.tech += labTech * dt;
  const mils = G.buildings.filter(b => b.type === 'milbase');
  const milGrowth = mils.reduce((s, b) => s + 0.5 * b.level, 0);
  G.mil += (0.5 + milGrowth) * dt;
  const defs = G.buildings.filter(b => b.type === 'defense');
  const defTotal = defs.reduce((s, b) => s + 5 * b.level, 0);
  const silos = G.buildings.filter(b => b.type === 'silo');
  const siloTotal = silos.reduce((s, b) => s + 15 * b.level, 0);
  G.defense = NATIONS[G.nation].mil + defTotal;
  G.offense = siloTotal;

  // AI updates
  for (const k of G.enemyNations) updateAI(k, G, dt, W, H);

  // Hostility dynamics (Nuclear Winter increases all)
  const winterHostility = G.nuclearWinter ? 1 : 0;
  for (const k of G.enemyNations) {
    const isAlly = G.allies.includes(k);
    const baseInc = (isAlly ? 0.2 : 0.8) + winterHostility;
    G.hostility[k] = Math.min(100, G.hostility[k] + baseInc * dt);
  }
  G.allies.forEach(a => { G.hostility[a] = Math.max(0, G.hostility[a] - 1.5 * dt); });

  // Ally betrayal
  for (let i = G.allies.length - 1; i >= 0; i--) {
    const a = G.allies[i];
    if (G.hostility[a] > 75) {
      G.allies.splice(i, 1);
      addLog(G, `\u{1F494} ${NATIONS[a].flag} ${NATIONS[a].name} bricht das B\u00fcndnis!`, 'r');
      playSiren(); G.shake = 5; G.flash = 0.5; G.flashColor = '#ff345d';
      showBanner(G, `\u{1F494} VERRAT! ${NATIONS[a].flag} bricht B\u00fcndnis!`, '#ff345d', 3);
      spawnEMP(G, MAP_POS[a].x * W, MAP_POS[a].y * H);
    }
  }
  // Make peace
  for (const k of [...G.enemyNations]) {
    if (!G.allies.includes(k) && G.hostility[k] < 8) {
      G.allies.push(k);
      addLog(G, `\u{1F91D} ${NATIONS[k].flag} ${NATIONS[k].name} ist jetzt VERB\u00dcNDET!`, 'g');
      playBuild(); G.flash = 0.3; G.flashColor = '#00ff9d';
      showBanner(G, `\u{1F91D} FRIEDEN! ${NATIONS[k].flag} verb\u00fcndet!`, '#00ff9d', 3);
      spawnShockwave(G, MAP_POS[k].x * W, MAP_POS[k].y * H, '#00ff9d', 120);
    }
  }

  // Turn system
  if (G.turnTimer >= G.turnLength) { G.turnTimer = 0; G.turn++; processTurn(); }

  // DEFCON
  G.defcon = calcDefcon(G);
  updateDefconDisplay(G);

  // Nuclear Winter: lock DEFCON to 1 if winter active
  if (G.nuclearWinter) G.defcon = 1;

  // Weather particles
  G.weatherTimer += dt;
  if (G.weatherTimer > 0.05) {
    G.weatherTimer = 0;
    updateWeather(G, W, H);
  }
  for (let i = G.weatherParticles.length - 1; i >= 0; i--) {
    const p = G.weatherParticles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0 || p.y > H + 20 || p.x < -20 || p.x > W + 20) G.weatherParticles.splice(i, 1);
  }

  // Background music
  updateMusic(G);

  // Process scheduled events (replaces setTimeout)
  processScheduledEvents(G, dt);

  // Threats
  for (let i = G.threats.length - 1; i >= 0; i--) { G.threats[i].timer += dt; if (G.threats[i].timer >= G.threats[i].duration) G.threats.splice(i, 1); }

  // Attack scene
  if (G.attackScene) {
    G.sceneTimer -= dt;
    for (const m of G.attackScene.missiles || []) { m.x += m.vx * dt; m.y += m.vy * dt; }
    for (let i = (G.attackScene.explosions || []).length - 1; i >= 0; i--) { G.attackScene.explosions[i].life -= dt; if (G.attackScene.explosions[i].life <= 0) G.attackScene.explosions.splice(i, 1); }
    if (G.sceneTimer <= 0) G.attackScene = null;
  }

  // AI build animations
  for (let i = G.aiBuildAnims.length - 1; i >= 0; i--) { G.aiBuildAnims[i].timer += dt; if (G.aiBuildAnims[i].timer >= G.aiBuildAnims[i].duration) G.aiBuildAnims.splice(i, 1); }
  // AI missiles
  for (let i = G.aiMissiles.length - 1; i >= 0; i--) { const m = G.aiMissiles[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; if (m.life <= 0) G.aiMissiles.splice(i, 1); }
  // AI explosions
  for (let i = G.aiExplosions.length - 1; i >= 0; i--) { G.aiExplosions[i].life -= dt; if (G.aiExplosions[i].life <= 0) G.aiExplosions.splice(i, 1); }
  // Mushroom clouds
  for (let i = G.mushroomClouds.length - 1; i >= 0; i--) { G.mushroomClouds[i].timer += dt; if (G.mushroomClouds[i].timer >= G.mushroomClouds[i].duration) G.mushroomClouds.splice(i, 1); }
  // Shockwaves
  for (let i = G.shockwaves.length - 1; i >= 0; i--) { const sw = G.shockwaves[i]; sw.radius += sw.speed * dt; sw.life -= dt; if (sw.life <= 0 || sw.radius > sw.maxRadius) G.shockwaves.splice(i, 1); }
  // EMP
  for (let i = G.empFlashes.length - 1; i >= 0; i--) { G.empFlashes[i].life -= dt; if (G.empFlashes[i].life <= 0) G.empFlashes.splice(i, 1); }
  // Smoke
  for (let i = G.smokeTrails.length - 1; i >= 0; i--) { const s = G.smokeTrails[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy -= 30 * dt; s.life -= dt; if (s.life <= 0) G.smokeTrails.splice(i, 1); }
  // Banner
  if (G.bannerTimer > 0) G.bannerTimer -= dt;
  // Screen crack
  if (G.screenCrack) { G.screenCrack.life -= dt; if (G.screenCrack.life <= 0) G.screenCrack = null; }

  // Particles
  for (let i = G.particles.length - 1; i >= 0; i--) { const p = G.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt; if (p.life <= 0) G.particles.splice(i, 1); }
  for (let i = G.texts.length - 1; i >= 0; i--) { G.texts[i].y -= 35 * dt; G.texts[i].life -= dt; if (G.texts[i].life <= 0) G.texts.splice(i, 1); }

  G.shake = Math.max(0, G.shake - 25 * dt);
  G.flash = Math.max(0, G.flash - 2 * dt);

  // LOSE condition
  if (G.money < -100) {
    G.mode = 'gameover';
    addLog(G, '\u{1F4A5} Nation zusammengebrochen!', 'r');
    showBanner(G, '\u{1F480} NATION GEFALLEN!', '#ff345d', 5);
  }

  // WIN condition: survive WIN_ROUNDS rounds with WIN_ALLIES+ allies (including yourself)
  if (!G.won && G.turn >= WIN_ROUNDS && G.allies.length >= WIN_ALLIES) {
    G.won = true;
    G.mode = 'victory';
    addLog(G, `\u{1F389} WELTHERRSCHAFT! ${G.allies.length + 1}/5 Nationen verb\u00fcndet!`, 'g');
    showBanner(G, '\u{1F389} SIEG! WELTHERRSCHAFT!', '#00ff9d', 5);
    playVictorySound();
  }
}

function processTurn() {
  addLog(G, `\u2500\u2500 Runde ${G.turn} \u2500\u2500`, 'c');

  // Diplomatic events
  if (G.allies.length > 0 && Math.random() < 0.2) {
    const ally = G.allies[Math.floor(Math.random() * G.allies.length)];
    const b = Math.floor(50 + G.tech * 2); G.money += b;
    addLog(G, `${NATIONS[ally].flag} Handel: +${b}$`, 'g');
  }

  const eventRoll = Math.random();
  if (eventRoll < 0.08) {
    if (G.allies.length > 0) {
      const a = G.allies[Math.floor(Math.random() * G.allies.length)];
      G.hostility[a] += 20;
      addLog(G, `\u{1F575}\uFE0F Spionage-Skandal! ${NATIONS[a].flag} ist w\u00fctend! (+20 Feindseligkeit)`, 'r');
      showBanner(G, `\u{1F575}\uFE0F SPIONAGE! ${NATIONS[a].flag} entdeckt!`, '#ffb000', 2);
    }
  } else if (eventRoll < 0.14) {
    const enemies = G.enemyNations.filter(k => !G.allies.includes(k) && G.hostility[k] > 20);
    if (enemies.length > 0) {
      const e = enemies[Math.floor(Math.random() * enemies.length)];
      G.hostility[e] = Math.max(0, G.hostility[e] - 25);
      addLog(G, `\u{1F54A}\uFE0F ${NATIONS[e].flag} bietet Frieden an! (-25 Feindseligkeit)`, 'g');
      showBanner(G, `\u{1F54A}\uFE0F Friedensangebot von ${NATIONS[e].flag}!`, '#00ff9d', 2);
    }
  } else if (eventRoll < 0.18) {
    const all = G.enemyNations;
    if (all.length > 0) {
      const t = all[Math.floor(Math.random() * all.length)];
      G.hostility[t] += 15;
      addLog(G, `\u{1F5FA}\uFE0F Grenzstreit mit ${NATIONS[t].flag} ${NATIONS[t].name}! (+15)`, 'y');
    }
  } else if (eventRoll < 0.22) {
    const all = G.enemyNations;
    if (all.length > 0) {
      const t = all[Math.floor(Math.random() * all.length)];
      G.hostility[t] = Math.max(0, G.hostility[t] - 10);
      addLog(G, `\u{1F3AD} Kulturaustausch mit ${NATIONS[t].flag}! (-10)`, 'g');
    }
  } else if (eventRoll < 0.25) {
    if (G.allies.length > 0) {
      const a = G.allies[Math.floor(Math.random() * G.allies.length)];
      if (G.hostility[a] > 40) {
        G.hostility[a] += 10;
        addLog(G, `\u26A0\uFE0F ${NATIONS[a].flag} zweifelt am B\u00fcndnis! (${Math.floor(G.hostility[a])}/75 = Verrat)`, 'y');
      }
    }
  }

  // AI attacks on player
  for (const k of G.enemyNations) {
    if (G.allies.includes(k)) continue;
    const h = G.hostility[k];
    if (h > 60 && Math.random() < h / 200) launchAttack(G, k);
    if (h > 80 && Math.random() < 0.3) launchAttack(G, k);
  }

  // AI vs AI conflicts
  if (Math.random() < 0.15 + G.turn * 0.01) {
    const nonPlayer = G.enemyNations;
    if (nonPlayer.length >= 2) {
      const a = nonPlayer[Math.floor(Math.random() * nonPlayer.length)];
      const aAllies = ALLY_MAP[a] || [];
      const possible = nonPlayer.filter(k => k !== a && !aAllies.includes(k));
      if (possible.length > 0) {
        const b = possible[Math.floor(Math.random() * possible.length)];
        aiVsAiAttack(G, a, b);
      }
    }
  }

  // Intel reports
  if (Math.random() < 0.3) {
    const randomNation = G.enemyNations[Math.floor(Math.random() * G.enemyNations.length)];
    const ai = G.ai[randomNation]; if (ai && ai.buildings.length > 0) {
      const n = NATIONS[randomNation];
      const types = {}; ai.buildings.forEach(b => { types[b.type] = (types[b.type] || 0) + 1; });
      const summary = Object.entries(types).map(([t, c]) => `${BLDS[t].label}\u00d7${c}`).join(', ');
      addLog(G, `\u{1F4E1} ${n.flag} ${n.name}: ${summary} \u{1F4B0}${Math.floor(ai.money)}$`, 'c');
    }
  }
}

// ====== DRAW ======
function draw() {
  cx.save();
  if (G.shake > 0) cx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  if (G.mode === 'menu') drawCountrySelect(cx, G, W, H);
  else if (G.mode === 'playing') drawWorldMap(cx, G, W, H, canBuild);
  else if (G.mode === 'gameover') { drawWorldMap(cx, G, W, H, canBuild); drawGameOver(cx, G, W, H); }
  else if (G.mode === 'victory') { drawWorldMap(cx, G, W, H, canBuild); drawVictory(cx, G, W, H); }
  cx.restore();

  // Screen crack overlay
  if (G.screenCrack) {
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

  // Red flash overlay for low DEFCON
  if (G.defcon <= 2 && G.mode === 'playing') {
    const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
    cx.save(); cx.fillStyle = `rgba(255,0,0,${pulse * 0.08})`; cx.fillRect(0, 0, W, H); cx.restore();
  }
  // Nuclear Winter blue pulse
  if (G.nuclearWinter && G.mode === 'playing') {
    const pulse = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
    cx.save(); cx.fillStyle = `rgba(136,204,255,${pulse * 0.04})`; cx.fillRect(0, 0, W, H); cx.restore();
  }

  drawHUD(G); drawIntel(G); drawBuildBar(G);
}

// ====== INPUT ======
cv.addEventListener('mousemove', e => { G.mouseX = e.clientX; G.mouseY = e.clientY; });

cv.addEventListener('click', e => {
  initAudio();
  if (G.mode === 'menu') {
    const keys = Object.keys(NATIONS);
    const cardW = 150, cardH = 190, gap = 14;
    const totalW = keys.length * cardW + (keys.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = H * 0.24;
    keys.forEach((k, i) => {
      const x = startX + i * (cardW + gap);
      if (e.clientX > x && e.clientX < x + cardW && e.clientY > startY && e.clientY < startY + cardH) {
        selectNation(G, k);
        addLog(G, `${NATIONS[k].flag} ${NATIONS[k].name} gew\u00e4hlt!`, 'g');
        addLog(G, `Milit\u00e4r: ${NATIONS[k].mil} | Wirtschaft: ${NATIONS[k].eco} | Tech: ${NATIONS[k].tech}`, 'c');
        addLog(G, 'Alle Nationen bauen und entwickeln sich!', 'y');
        addLog(G, 'Baue Fabriken f\u00fcr Geld, dann Verteidigung!', 'y');
        showBanner(G, `${NATIONS[k].flag} ${NATIONS[k].name} AUFGEBAUT!`, NATIONS[k].color, 2);
        playBuild();
      }
    });
    return;
  }
  if (G.mode === 'playing') {
    // Upgrade mode
    if (G.selected === '__upgrade') {
      upgradePlayerBuilding(e.clientX, e.clientY);
      G.selected = 'factory';
      return;
    }
    // Diplomacy mode
    if (G.diplomacyMode) {
      for (const k of G.enemyNations) {
        const pos = MAP_POS[k]; const px = pos.x * W, py = pos.y * H;
        if (Math.hypot(e.clientX - px, e.clientY - py) < 40) {
          G.diplomacyMode = false;
          if (k === G.nation) return;
          G.money -= 20;
          const reduction = G.allies.includes(k) ? 8 : 18;
          G.hostility[k] = Math.max(0, G.hostility[k] - reduction);
          spawnShockwave(G, px, py, '#00ff9d', 80);
          if (G.allies.includes(k)) {
            addLog(G, `\u{1F91D} ${NATIONS[k].flag} B\u00fcndnis gest\u00e4rkt! (-${reduction} Feindseligkeit)`, 'g');
          } else {
            addLog(G, `\u{1F91D} ${NATIONS[k].flag} Beziehungen verbessert! (-${reduction} Feindseligkeit)`, 'g');
            if (G.hostility[k] < 8 && !G.allies.includes(k)) {
              G.allies.push(k);
              addLog(G, `\u{1F91D} ${NATIONS[k].flag} ${NATIONS[k].name} ist jetzt VERB\u00dcNDET!`, 'g');
              showBanner(G, `\u{1F91D} FRIEDEN! ${NATIONS[k].flag} verb\u00fcndet!`, '#00ff9d', 3);
              G.flash = 0.3; G.flashColor = '#00ff9d';
            }
          }
          playBuild(); return;
        }
      }
      addLog(G, 'Klicke auf eine Nation! (D=Abbruch)', 'y'); return;
    }
    // Attack mode
    if (G.attackMode) {
      for (const k of G.enemyNations) {
        const pos = MAP_POS[k]; const px = pos.x * W, py = pos.y * H;
        if (Math.hypot(e.clientX - px, e.clientY - py) < 40) {
          if (G.allies.includes(k)) { addLog(G, `${NATIONS[k].flag} Verb\u00fcndete kannst du nicht angreifen!`, 'y'); G.attackMode = false; return; }
          G.attackMode = false; counterAttack(G, k); return;
        }
      }
      addLog(G, 'Klicke auf einen Feind! (K=Abbruch)', 'y'); return;
    }
    // Normal building
    if (canBuild(G.selected, e.clientX, e.clientY)) build(G.selected, e.clientX, e.clientY);
  }
});

addEventListener('keydown', e => {
  initAudio();
  if (e.key === 'r' || e.key === 'R') {
    G = createState();
    return;
  }
  if (G.mode !== 'playing') return;
  if (e.key === '1') G.selected = 'factory';
  if (e.key === '2') G.selected = 'milbase';
  if (e.key === '3') G.selected = 'lab';
  if (e.key === '4') G.selected = 'defense';
  if (e.key === '5') G.selected = 'silo';
  if (e.key === 'd' || e.key === 'D') {
    if (G.money < 20) { addLog(G, 'Nicht genug Geld! (20$ n\u00f6tig)', 'r'); playAlert(); return; }
    if (G.diplomacyMode) { G.diplomacyMode = false; addLog(G, 'Diplomatie abgebrochen', 'c'); return; }
    G.diplomacyMode = true; G.attackMode = false;
    addLog(G, '\u{1F91D} Klicke auf eine Nation f\u00fcr Diplomatie! (-20$)', 'g'); playAlert();
    return;
  }
  if (e.key === 'k' || e.key === 'K') {
    if (G.offense <= 0) { addLog(G, 'Kein Raketensilo! Baue erst Silos!', 'r'); playAlert(); return; }
    if (G.attackCooldown > 0) { addLog(G, 'Raketen laden noch nach!', 'y'); playAlert(); return; }
    if (G.attackMode) { G.attackMode = false; addLog(G, 'Angriff abgebrochen', 'c'); return; }
    G.attackMode = true; G.diplomacyMode = false;
    addLog(G, '\u{1F3AF} Klicke auf eine Nation zum Angreifen! (K=Abbruch)', 'p'); playAlert();
    return;
  }
  if (e.key === 'u' || e.key === 'U') {
    addLog(G, '\u2B06 Klicke auf dein Geb\u00e4ude zum Upgraden! (oder U+Klick)', 'y'); playAlert();
    G.selected = '__upgrade';
    return;
  }
  playAlert();
});

// Setup build bar events
setupBuildBarEvents(G, addLog, playAlert);

// Import for combat module
import { playSiren } from './audio.js';
import { spawnEMP } from './effects.js';

// ====== WEATHER SYSTEM ======
function updateWeather(G, W, H) {
  const dc = G.defcon;
  const maxParticles = G.nuclearWinter ? 250 : dc <= 2 ? 120 : dc <= 3 ? 40 : dc >= 5 ? 15 : 20;

  // Limit total weather particles
  if (G.weatherParticles.length >= maxParticles) return;

  // Nuclear Winter: blizzard snow
  if (G.nuclearWinter) {
    for (let i = 0; i < 3; i++) {
      G.weatherParticles.push({
        x: Math.random() * W, y: -10,
        vx: 30 + Math.random() * 60, vy: 60 + Math.random() * 100,
        size: 2 + Math.random() * 4,
        life: 4 + Math.random() * 3,
        type: 'snow',
      });
    }
    return;
  }

  // DEFCON-based weather
  if (dc <= 2) {
    // Rain + wind at DEFCON 1-2
    G.weatherParticles.push({
      x: Math.random() * W * 1.3 - W * 0.15, y: -10,
      vx: -40 + Math.random() * -30, vy: 300 + Math.random() * 200,
      size: 1.5, life: 2, type: 'rain',
    });
  } else if (dc <= 3) {
    // Light rain at DEFCON 3
    if (Math.random() < 0.3) {
      G.weatherParticles.push({
        x: Math.random() * W, y: -10,
        vx: -20 + Math.random() * -10, vy: 200 + Math.random() * 100,
        size: 1, life: 3, type: 'rain',
      });
    }
  } else if (dc >= 5) {
    // Peaceful: occasional gentle light particles
    if (Math.random() < 0.05) {
      G.weatherParticles.push({
        x: Math.random() * W, y: Math.random() * H * 0.5,
        vx: Math.random() * 10 - 5, vy: 5 + Math.random() * 10,
        size: 1 + Math.random() * 2, life: 5 + Math.random() * 5,
        type: 'peace',
      });
    }
  }
}

// ====== NUCLEAR WINTER TRACKER ======
export function registerNuke(G) {
  G.nukeCount++;
  if (G.nukeCount >= 3 && !G.nuclearWinter) {
    G.nuclearWinter = true;
    addLog(G, '❄️ NUKLEARWINTER! Einkommen -30%, alle Feindseligkeiten steigen!', 'r');
    showBanner(G, '❄️ NUKLEARWINTER! Die Welt erfriert!', '#88ccff', 5);
    G.shake = 15; G.flash = 1; G.flashColor = '#88ccff';
  }
}

// Start music on first interaction
cv.addEventListener('click', () => { initAudio(); startMusic(G); }, { once: true });
addEventListener('keydown', () => { initAudio(); startMusic(G); }, { once: true });

// ====== GAME LOOP ======
function loop(t = 0) {
  const dt = Math.min(0.033, (t - G.lastT) / 1000 || 0);
  G.lastT = t;
  updateGame(dt);
  draw();
  requestAnimationFrame(loop);
}
loop();
