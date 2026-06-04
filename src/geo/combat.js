// ====== COMBAT SYSTEM ======
// Uses scheduleEvent() instead of setTimeout for proper game-loop integration
import { NATIONS, BLDS, MAP_POS, ALLY_MAP } from './data.js';
import { rnd, burst, floatText, addLog, scheduleEvent } from './helpers.js';
import { spawnMushroom, spawnShockwave, spawnEMP, spawnSmoke, showBanner } from './effects.js';
import { playBoom, playNuke, playSiren, playBuild, playAlert } from './audio.js';

// ====== AI ATTACK ON PLAYER ======
export function launchAttack(G, fromKey) {
  const ai = G.ai[fromKey]; const n = NATIONS[fromKey];
  const strength = Math.floor((ai ? ai.mil : n.mil * 2) * (1 + G.turn * 0.04) + rnd(5, 15));
  G.threats.push({ from: fromKey, strength, timer: 0, duration: 3 + Math.random() * 2 });
  addLog(G, `${n.flag} ${n.name} greift an! St\u00e4rke: ${strength}`, 'r'); playSiren();
  G.shake = 8; G.flash = 1; G.flashColor = '#ff345d';
  if (strength > 40) showBanner(G, `\u2694\uFE0F ANGRIFF! ${n.flag} ${n.name}!`, '#ff345d', 2.5);
  else showBanner(G, `${n.flag} greift an!`, '#ff345d', 1.5);
  startAttackScene(G, fromKey, strength);
}

function startAttackScene(G, fromKey, strength) {
  const from = MAP_POS[fromKey], to = MAP_POS[G.nation];
  const fx = from.x * W, fy = from.y * H, tx = to.x * W, ty = to.y * H;
  const angle = Math.atan2(ty - fy, tx - fx), speed = 200;
  const missiles = [];
  const count = Math.min(8, Math.floor(strength / 10) + 1);
  for (let i = 0; i < count; i++) {
    missiles.push({
      x: fx + rnd(-20, 20), y: fy + rnd(-20, 20),
      vx: Math.cos(angle) * speed + rnd(-20, 20), vy: Math.sin(angle) * speed + rnd(-20, 20),
      color: '#ff345d',
    });
  }
  G.attackScene = { missiles, explosions: [] }; G.sceneTimer = 4;
  const timeToTarget = Math.hypot(tx - fx, ty - fy) / speed;

  spawnSmoke(G, fx, fy, NATIONS[fromKey].color);

  // Schedule explosions (replaces setTimeout)
  for (let i = 0; i < count; i++) {
    scheduleEvent(G, timeToTarget + i * 0.3, () => {
      if (!G.attackScene) return;
      const ex = tx + rnd(-60, 60), ey = ty + rnd(-60, 60);
      G.attackScene.explosions.push({ x: ex, y: ey, life: 1, max: 1, size: rnd(30, 80), color: '#ff345d' });
      burst(G, ex, ey, '#ff345d', 15, 1.5); burst(G, ex, ey, '#ffb000', 10);
      if (strength > 30) spawnMushroom(G, ex, ey, '#ff345d', 0.8);
      else { playBoom(0.4); spawnShockwave(G, ex, ey, '#ff345d', 80); }
      G.shake = Math.max(G.shake, 12); G.flash = 0.8; G.flashColor = '#ff345d';
    });
  }
  scheduleEvent(G, timeToTarget + count * 0.3 + 0.5, () => resolveAttack(G, fromKey, strength));
}

function resolveAttack(G, fromKey, strength) {
  const n = NATIONS[fromKey]; const ai = G.ai[fromKey];
  const defPower = G.defense;
  const damage = Math.max(0, strength - defPower * 1.5);
  if (damage > 0) {
    const moneyLoss = Math.floor(damage * 8); const milLoss = Math.floor(damage * 0.3);
    G.money -= moneyLoss; G.mil = Math.max(0, G.mil - milLoss);
    addLog(G, `\u{1F4A5} ${n.flag} Angriff! -${moneyLoss}$ -${milLoss} Mil`, 'r');
    if (damage > 20 && G.buildings.length > 0) {
      const idx = Math.floor(Math.random() * G.buildings.length);
      const b = G.buildings[idx];
      addLog(G, `\u{1F3DE}\uFE0F ${BLDS[b.type].label} zerst\u00f6rt!`, 'r');
      spawnMushroom(G, b.x, b.y, '#ff345d', 0.6);
      G.buildings.splice(idx, 1);
    }
    G.shake = 15; G.flash = 1; G.flashColor = '#ff345d'; playNuke(0.6);
    if (damage > 30) G.screenCrack = { life: 3 };
  } else {
    addLog(G, `\u{1F6E1}\uFE0F ${n.flag} Angriff abgewehrt!`, 'g');
    G.hostility[fromKey] = Math.max(0, G.hostility[fromKey] - 5);
    playBuild();
    showBanner(G, '\u{1F6E1}\uFE0F ABGEWEHRT!', '#00ff9d', 1.5);
    spawnShockwave(G, MAP_POS[G.nation].x * W, MAP_POS[G.nation].y * H, '#00ff9d', 100);
  }

  // Counter-attack if player has offense
  if (G.offense > 0 && damage > 0) {
    const counter = Math.floor(G.offense * 0.8);
    G.hostility[fromKey] = Math.min(100, G.hostility[fromKey] + counter * 0.3);
    const pFrom = MAP_POS[G.nation], aTo = MAP_POS[fromKey];
    const pfx = pFrom.x * W, pfy = pFrom.y * H, atx = aTo.x * W, aty = aTo.y * H;
    const cAngle = Math.atan2(aty - pfy, atx - pfx), cSpeed = 220;
    const cCount = Math.min(4, Math.floor(G.offense / 20) + 1);
    for (let i = 0; i < cCount; i++) {
      scheduleEvent(G, i * 0.2, () => {
        const m = { x: pfx + rnd(-10, 10), y: pfy + rnd(-10, 10), vx: Math.cos(cAngle) * cSpeed + rnd(-10, 10), vy: Math.sin(cAngle) * cSpeed + rnd(-10, 10), color: '#a855f7', life: 2.5, max: 2.5 };
        G.aiMissiles.push(m);
        spawnSmoke(G, pfx, pfy, '#a855f7');
      });
    }
    const cTravelTime = Math.hypot(atx - pfx, aty - pfy) / cSpeed;
    scheduleEvent(G, cTravelTime + 0.5, () => {
      if (ai && ai.buildings.length > 0) {
        const idx = Math.floor(Math.random() * ai.buildings.length); const b = ai.buildings[idx];
        burst(G, b.x, b.y, '#a855f7', 20, 1.5); floatText(G, b.x, b.y - 25, 'ZERST\u00d6RT!', '#a855f7', 18);
        spawnMushroom(G, b.x, b.y, '#a855f7', 0.7);
        G.aiExplosions.push({ x: b.x, y: b.y, life: 1, max: 1, size: rnd(25, 50) });
        addLog(G, `\u{1F680} Gegenangriff zerst\u00f6rt ${n.flag} ${BLDS[b.type].label}!`, 'p'); ai.buildings.splice(idx, 1);
        if (b.type === 'milbase') ai.mil = Math.max(0, ai.mil - 3 * b.level);
        if (b.type === 'defense') ai.defense = Math.max(0, ai.defense - 5 * b.level);
        if (b.type === 'silo') ai.offense = Math.max(0, ai.offense - 15 * b.level);
      }
      addLog(G, `\u{1F680} Gegenangriff auf ${n.flag} ${n.name}!`, 'p'); playBoom(0.3);
    });
  }
}

// ====== PLAYER COUNTER-ATTACK ======
export function counterAttack(G, targetKey) {
  if (G.offense <= 0) { addLog(G, 'Kein Raketensilo! Baue erst Raketensilos!', 'r'); playAlert(); return; }
  if (G.attackCooldown > 0) { addLog(G, 'Raketen laden nach...', 'y'); playAlert(); return; }

  const n = NATIONS[targetKey]; const ai = G.ai[targetKey];
  const pN = NATIONS[G.nation];
  G.hostility[targetKey] = Math.min(100, G.hostility[targetKey] + 15);

  const from = MAP_POS[G.nation], to = MAP_POS[targetKey];
  const fx = from.x * W, fy = from.y * H, tx = to.x * W, ty = to.y * H;
  const angle = Math.atan2(ty - fy, tx - fx), speed = 250;

  const count = Math.min(6, Math.floor(G.offense / 15) + 1);
  const missiles = [];
  for (let i = 0; i < count; i++) {
    missiles.push({ x: fx + rnd(-15, 15), y: fy + rnd(-15, 15), vx: Math.cos(angle) * speed + rnd(-15, 15), vy: Math.sin(angle) * speed + rnd(-15, 15), color: '#a855f7' });
  }
  G.attackScene = { missiles, explosions: [] }; G.sceneTimer = 4;
  G.shake = 8; G.flash = 0.6; G.flashColor = '#a855f7';
  addLog(G, `\u{1F680} ${pN.flag} greift ${n.flag} ${n.name} an! ${count} Raketen!`, 'p'); playSiren();
  showBanner(G, `\u{1F680} ${pN.flag} \u2192 ${n.flag} ${n.name}!`, '#a855f7', 2);
  spawnSmoke(G, fx, fy, '#a855f7');
  G.attackCooldown = 5;

  const timeToTarget = Math.hypot(tx - fx, ty - fy) / speed;

  for (let i = 0; i < count; i++) {
    scheduleEvent(G, timeToTarget + i * 0.25, () => {
      if (!G.attackScene) return;
      const ex = tx + rnd(-50, 50), ey = ty + rnd(-50, 50);
      G.attackScene.explosions.push({ x: ex, y: ey, life: 1, max: 1, size: rnd(25, 60), color: '#a855f7' });
      burst(G, ex, ey, '#a855f7', 15, 1.5); burst(G, ex, ey, '#ffb000', 10);
      spawnMushroom(G, ex, ey, '#a855f7', 0.9);
      spawnEMP(G, ex, ey);
      G.shake = Math.max(G.shake, 10); G.flash = 0.7; G.flashColor = '#a855f7';
    });
  }

  scheduleEvent(G, timeToTarget + count * 0.25 + 0.5, () => {
    if (ai && ai.buildings.length > 0) {
      const idx = Math.floor(Math.random() * ai.buildings.length); const b = ai.buildings[idx];
      burst(G, b.x, b.y, '#ff345d', 20, 1.5); floatText(G, b.x, b.y - 25, 'BOOM!', '#ff345d', 20);
      spawnMushroom(G, b.x, b.y, '#a855f7', 1);
      addLog(G, `\u{1F4A5} ${BLDS[b.type].label} von ${n.flag} zerst\u00f6rt!`, 'p'); ai.buildings.splice(idx, 1);
      if (b.type === 'milbase') ai.mil = Math.max(0, ai.mil - 3 * b.level);
      if (b.type === 'defense') ai.defense = Math.max(0, ai.defense - 5 * b.level);
      if (b.type === 'silo') ai.offense = Math.max(0, ai.offense - 15 * b.level);
    }
    addLog(G, `\u{1F680} Angriff auf ${n.flag} ${n.name} abgeschlossen!`, 'p'); playNuke(0.5);
    G.hostility[targetKey] += 20;
    const theirAllies = ALLY_MAP[targetKey] || [];
    theirAllies.forEach(ally => {
      if (ally !== G.nation) { G.hostility[ally] += 10; addLog(G, `\u{1F621} ${NATIONS[ally].flag} ist w\u00fctend \u00fcber deinen Angriff! (+10)`, 'y'); }
    });
  });
}

// ====== AI vs AI COMBAT ======
export function aiVsAiAttack(G, attackerKey, defenderKey) {
  const atkN = NATIONS[attackerKey], defN = NATIONS[defenderKey];
  const atkAi = G.ai[attackerKey], defAi = G.ai[defenderKey];
  if (!atkAi || !defAi) return;

  const from = MAP_POS[attackerKey], to = MAP_POS[defenderKey];
  const fx = from.x * W, fy = from.y * H, tx = to.x * W, ty = to.y * H;
  const angle = Math.atan2(ty - fy, tx - fx);

  const count = Math.min(4, Math.floor(atkAi.mil / 15) + 1);
  for (let i = 0; i < count; i++) {
    scheduleEvent(G, i * 0.3, () => {
      const m = { x: fx + rnd(-15, 15), y: fy + rnd(-15, 15), vx: Math.cos(angle) * 180 + rnd(-15, 15), vy: Math.sin(angle) * 180 + rnd(-15, 15), color: atkN.color, life: 2.5, max: 2.5 };
      G.aiMissiles.push(m);
    });
  }

  const travelTime = Math.hypot(tx - fx, ty - fy) / 180;
  scheduleEvent(G, travelTime + 0.5, () => {
    const ex = tx + rnd(-40, 40), ey = ty + rnd(-40, 40);
    G.aiExplosions.push({ x: ex, y: ey, life: 1.2, max: 1.2, size: rnd(20, 50) });
    burst(G, ex, ey, defN.color, 12, 0.8); burst(G, ex, ey, '#ffb000', 8, 0.6);
    spawnMushroom(G, ex, ey, atkN.color, 0.5);
    spawnShockwave(G, ex, ey, atkN.color, 60);
    const atkPower = atkAi.mil * 0.6;
    const defPower = defAi.defense * 1.2;
    const dmg = Math.max(0, atkPower - defPower);
    if (dmg > 5 && defAi.buildings.length > 0) {
      const idx = Math.floor(Math.random() * defAi.buildings.length);
      const b = defAi.buildings[idx];
      floatText(G, b.x, b.y - 20, '\u{1F4A5}', atkN.color);
      defAi.buildings.splice(idx, 1);
      defAi.mil = Math.max(0, defAi.mil - dmg * 0.3);
      addLog(G, `\u2694\uFE0F ${atkN.flag} vs ${defN.flag}: ${BLDS[b.type].label} zerst\u00f6rt!`, 'y');
    } else {
      addLog(G, `\u2694\uFE0F ${atkN.flag} vs ${defN.flag}: Angriff abgewehrt!`, 'c');
    }
    playBoom(0.15);
  });
}

// We need W, H from the canvas - use a getter approach
let W = 0, H = 0;
export function setDimensions(w, h) { W = w; H = h; }
