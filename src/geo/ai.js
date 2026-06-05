// ====== AI SYSTEM ======
import { NATIONS, BLDS } from './data.js';
import { rnd, burst, floatText, addLog } from './helpers.js';
import { spawnShockwave } from './effects.js';
import { playBuildAI } from './audio.js';

export function createAIState(key) {
  const n = NATIONS[key];
  return {
    money: n.money,
    income: 10 + n.eco * 2,
    mil: n.mil * 2,
    tech: 0,
    defense: n.mil,
    offense: 0,
    buildings: [],
    buildTimer: 0,
    buildRate: n.buildRate,
    personality: n.personality,
    upgradeTimer: 0,
    upgradeCooldown: 20,
    lastBuildType: null,
    totalBuilt: 0,
  };
}

function aiPickBuild(key, G) {
  const ai = G.ai[key];
  const factories = ai.buildings.filter(b => b.type === 'factory').length;
  const mils = ai.buildings.filter(b => b.type === 'milbase').length;
  const labs = ai.buildings.filter(b => b.type === 'lab').length;
  const defs = ai.buildings.filter(b => b.type === 'defense').length;
  const silos = ai.buildings.filter(b => b.type === 'silo').length;
  const spyhq = ai.buildings.filter(b => b.type === 'spyhq').length;

  switch (ai.personality) {
    case 'aggressive':
      if (factories < 1 && ai.money >= 60) return 'factory';
      if (mils < 2 && ai.money >= 80) return 'milbase';
      if (factories < mils && ai.money >= 60) return 'factory';
      if (silos < 1 && ai.money >= 150) return 'silo';
      if (mils < 4 && ai.money >= 80) return 'milbase';
      if (defs < 1 && ai.money >= 100) return 'defense';
      if (spyhq < 1 && ai.money >= 120) return 'spyhq';
      if (labs < 1 && ai.money >= 70) return 'lab';
      if (Math.random() < 0.4) return 'milbase';
      return 'factory';
    case 'defensive':
      if (factories < 2 && ai.money >= 60) return 'factory';
      if (defs < 2 && ai.money >= 100) return 'defense';
      if (mils < 1 && ai.money >= 80) return 'milbase';
      if (labs < 1 && ai.money >= 70) return 'lab';
      if (factories < 4 && ai.money >= 60) return 'factory';
      if (defs < 3 && ai.money >= 100) return 'defense';
      if (silos < 1 && ai.money >= 150) return 'silo';
      return Math.random() < 0.5 ? 'defense' : 'factory';
    case 'diplomatic':
      if (factories < 3 && ai.money >= 60) return 'factory';
      if (labs < 2 && ai.money >= 70) return 'lab';
      if (spyhq < 2 && ai.money >= 120) return 'spyhq';
      if (defs < 1 && ai.money >= 100) return 'defense';
      if (mils < 1 && ai.money >= 80) return 'milbase';
      if (factories < 5 && ai.money >= 60) return 'factory';
      if (defs < 2 && ai.money >= 100) return 'defense';
      if (Math.random() < 0.3) return 'lab';
      return 'factory';
    case 'expansive':
      if (factories < mils + 2 && ai.money >= 60) return 'factory';
      if (mils < 2 && ai.money >= 80) return 'milbase';
      if (labs < mils && ai.money >= 70) return 'lab';
      if (factories < 3 && ai.money >= 60) return 'factory';
      if (defs < 2 && ai.money >= 100) return 'defense';
      if (silos < 1 && ai.money >= 150) return 'silo';
      if (Math.random() < 0.3) return 'factory';
      if (Math.random() < 0.5) return 'milbase';
      return 'lab';
  }
  const r = Math.random();
  if (r < 0.35) return 'factory';
  if (r < 0.55) return 'milbase';
  if (r < 0.7) return 'lab';
  if (r < 0.8) return 'defense';
  if (r < 0.9) return 'silo';
  return 'spyhq';
}

export function aiBuild(key, G, W, H) {
  const ai = G.ai[key];
  const n = NATIONS[key];
  const pos = MAP_POS[key];
  const type = aiPickBuild(key, G);
  const spec = BLDS[type];
  if (!spec || ai.money < spec.cost) return;

  const cx_ = pos.x * W, cy_ = pos.y * H;
  const buildingIndex = ai.buildings.length;
  const ring = Math.floor(buildingIndex / 6);
  const angleInRing = (buildingIndex % 6) / 6 * Math.PI * 2 + ring * 0.5;
  const dist = 35 + ring * 30 + rnd(-10, 10);
  const bx = cx_ + Math.cos(angleInRing) * dist;
  const by = cy_ + Math.sin(angleInRing) * dist;

  for (const b of ai.buildings) { if (Math.hypot(b.x - bx, b.y - by) < 25) return; }

  ai.money -= spec.cost;
  ai.buildings.push({ type, x: bx, y: by, level: 1, hp: 100, maxHp: 100, builtAt: Date.now() });
  ai.totalBuilt++;

  if (type === 'milbase') ai.mil += 3;
  if (type === 'defense') ai.defense += 5;
  if (type === 'silo') ai.offense += 15;

  G.aiBuildAnims.push({ x: bx, y: by, color: n.color, type, nation: key, timer: 0, duration: 1.5 });
  burst(G, bx, by, n.color, 15, 0.8);
  burst(G, bx, by, spec.color, 8, 0.6);
  floatText(G, bx, by - 30, `${n.flag}${spec.label}`, n.color);
  addLog(G, `\u{1F4E1} Intel: ${n.flag} baut ${spec.label} (${ai.buildings.length} Geb\u00e4ude)`, 'y');
  playBuildAI();
}

export function aiUpgrade(key, G) {
  const ai = G.ai[key];
  const n = NATIONS[key];
  if (ai.buildings.length === 0) return;
  const upgradeable = ai.buildings.filter(b => b.level < 3);
  if (upgradeable.length === 0) return;

  const b = upgradeable[Math.floor(Math.random() * upgradeable.length)];
  const spec = BLDS[b.type];
  const upgradeCost = Math.floor(spec.cost * b.level * 0.8);
  if (ai.money < upgradeCost) return;

  ai.money -= upgradeCost;
  b.level++;
  b.hp = 100 * b.level;
  b.maxHp = 100 * b.level;

  if (b.type === 'milbase') ai.mil += 2;
  if (b.type === 'defense') ai.defense += 3;
  if (b.type === 'silo') ai.offense += 10;

  G.aiBuildAnims.push({ x: b.x, y: b.y, color: n.color, type: 'upgrade', nation: key, timer: 0, duration: 1 });
  burst(G, b.x, b.y, '#ffffff', 10, 0.6);
  floatText(G, b.x, b.y - 25, `\u2B06 Lvl ${b.level}`, n.color);
  addLog(G, `\u{1F4E1} Intel: ${n.flag} verbessert ${spec.label} \u2192 Lvl ${b.level}`, 'y');
}

export function updateAI(key, G, dt, W, H) {
  const ai = G.ai[key];
  const n = NATIONS[key];
  if (!ai) return;

  const facs = ai.buildings.filter(b => b.type === 'factory');
  const facIncome = facs.reduce((s, b) => s + 15 * b.level, 0);
  ai.income = 10 + n.eco * 2 + facIncome;
  ai.money += ai.income * dt;

  const labs = ai.buildings.filter(b => b.type === 'lab');
  const labTech = labs.reduce((s, b) => s + 2 * b.level, 0);
  ai.tech += labTech * dt;

  const mils = ai.buildings.filter(b => b.type === 'milbase');
  const milGrowth = mils.reduce((s, b) => s + 0.5 * b.level, 0);
  ai.mil += (0.5 + milGrowth) * dt;

  const defs = ai.buildings.filter(b => b.type === 'defense');
  const defTotal = defs.reduce((s, b) => s + 5 * b.level, 0);
  const silos = ai.buildings.filter(b => b.type === 'silo');
  const siloTotal = silos.reduce((s, b) => s + 15 * b.level, 0);
  ai.defense = n.mil + defTotal;
  ai.offense = siloTotal;

  ai.buildTimer += dt;
  const moneyBoost = ai.money > 500 ? 0.7 : ai.money > 300 ? 0.85 : 1;
  const buildInterval = 7 / ai.buildRate * moneyBoost;
  if (ai.buildTimer >= buildInterval) { ai.buildTimer = 0; aiBuild(key, G, W, H); }

  ai.upgradeTimer += dt;
  if (ai.upgradeTimer >= ai.upgradeCooldown && ai.buildings.length >= 3) { ai.upgradeTimer = 0; aiUpgrade(key, G); }
}

import { MAP_POS } from './data.js';
