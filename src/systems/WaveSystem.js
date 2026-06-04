import { burst } from './ParticleSystem.js';
import { playBossWarning, playWaveStart } from './AudioSystem.js';
import { BOSS_TYPES, getBossType } from './BossSystem.js';

const ENEMY_TYPES = {
  scout: { hp: 35, speed: 62, size: 9, reward: 8, color: '#ff345d', energy: 4 },
  soldier: { hp: 65, speed: 44, size: 13, reward: 12, color: '#ff6b35', energy: 6 },
  tank: { hp: 160, speed: 24, size: 19, reward: 25, color: '#ffb000', energy: 12 },
  runner: { hp: 28, speed: 110, size: 8, reward: 10, color: '#00ff9d', energy: 5 },
  boss: { hp: 800, speed: 18, size: 34, reward: 250, color: '#ff2bd6', energy: 60, isBoss: true },
};

export function spawnWave(state) {
  state.wave += 1;
  const isBoss = state.wave % 5 === 0;
  state.isBossWave = isBoss;
  state.waveBudget = isBoss ? 2 + Math.floor(state.wave / 5) : 5 + state.wave * 2;
  state.waveTimer = 0;

  if (isBoss) {
    const bossTypeKey = getBossType(state.wave);
    const bossSpec = BOSS_TYPES[bossTypeKey];
    state.currentBossType = bossTypeKey;
    state.currentBossName = bossSpec.name;
    state.message = `${bossSpec.name} – Welle ${state.wave}!`;
    burst(state, state.core.x, state.core.y, bossSpec.color, 40, 1.5);
    state.shake = 12;
    playBossWarning();
  } else {
    state.currentBossType = null;
    state.currentBossName = null;
    state.message = `Welle ${state.wave}`;
    if (state.wave <= 2) state.message += ' – Baue Verteidigung!';
    playWaveStart();
  }
  state.msgTimer = 3;
}

export function updateWaves(state, width, height, dt) {
  state.waveTimer += dt;

  if (state.waveBudget > 0) {
    const delay = Math.max(0.25, 1.0 - state.wave * 0.02);
    if (state.waveTimer > delay) {
      spawnOneEnemy(state, width, height);
      state.waveBudget--;
      state.waveTimer = 0;
    }
  }

  if (state.waveBudget === 0 && state.enemies.length === 0 && state.waveTimer > 3) {
    spawnWave(state);
  }
}

function spawnOneEnemy(state, width, height) {
  if (state.isBossWave && state.waveBudget === 2 + Math.floor(state.wave / 5)) {
    spawnSpecific(state, width, height, 'boss');
    return;
  }

  const w = state.wave;
  const r = Math.random();
  let type;

  if (w <= 2) type = 'scout';
  else if (w <= 4) type = r < 0.55 ? 'scout' : r < 0.85 ? 'soldier' : 'runner';
  else if (w <= 8) type = r < 0.3 ? 'scout' : r < 0.6 ? 'soldier' : r < 0.8 ? 'runner' : 'tank';
  else type = r < 0.15 ? 'scout' : r < 0.4 ? 'soldier' : r < 0.6 ? 'runner' : r < 0.85 ? 'tank' : 'runner';

  spawnSpecific(state, width, height, type);
}

function spawnSpecific(state, width, height, typeName) {
  const spec = ENEMY_TYPES[typeName];
  if (!spec) return;

  const side = Math.random();
  let x, y;
  if (side < 0.55) { x = width + 30; y = Math.random() * height; }
  else if (side < 0.78) { x = Math.random() * width; y = -30; }
  else { x = Math.random() * width; y = height + 30; }

  const scale = 1 + (state.wave - 1) * 0.06;

  const enemy = {
    x, y,
    hp: spec.hp * scale,
    maxHp: spec.hp * scale,
    speed: spec.speed,
    size: spec.size,
    reward: spec.reward,
    color: spec.color,
    energy: spec.energy,
    isBoss: spec.isBoss || false,
  };

  // Assign boss type for boss enemies
  if (spec.isBoss && state.currentBossType) {
    const bossSpec = BOSS_TYPES[state.currentBossType];
    enemy.bossType = state.currentBossType;
    enemy.color = bossSpec.color;
    enemy.abilityTimer = bossSpec.abilityCooldown || 999;
  }

  state.enemies.push(enemy);
}
