import { burst } from './ParticleSystem.js';

/**
 * WaveSystem – spawns increasingly difficult enemy waves.
 *
 * Wave structure:
 *   - Budget = base + wave * scaling
 *   - Enemies spawn one-by-one with a short delay
 *   - Every 5th wave is a boss wave
 *   - After budget is spent and all enemies dead → next wave after a pause
 */

const ENEMY_TYPES = {
  scout: {
    hp: 42,
    speed: 68,
    size: 10,
    reward: 6,
    color: '#ff345d',
    energyReward: 3,
  },
  soldier: {
    hp: 80,
    speed: 48,
    size: 14,
    reward: 10,
    color: '#ff6b35',
    energyReward: 5,
  },
  tank: {
    hp: 200,
    speed: 28,
    size: 20,
    reward: 22,
    color: '#ffb000',
    energyReward: 10,
  },
  runner: {
    hp: 35,
    speed: 130,
    size: 9,
    reward: 8,
    color: '#00ff9d',
    energyReward: 4,
  },
  boss: {
    hp: 1200,
    speed: 22,
    size: 36,
    reward: 200,
    color: '#ff2bd6',
    energyReward: 50,
    isBoss: true,
  },
};

export function spawnWave(state) {
  state.wave += 1;
  const isBossWave = state.wave % 5 === 0;

  if (isBossWave) {
    state.waveBudget = 3 + Math.floor(state.wave / 5);
  } else {
    state.waveBudget = 6 + state.wave * 3;
  }

  state.waveTimer = 0;
  state.isBossWave = isBossWave;

  // Message
  if (isBossWave) {
    state.message = `BOSS WELLE ${state.wave}!`;
    burst(state, state.core.x, state.core.y, '#ff2bd6', 30);
  } else {
    state.message = `Welle ${state.wave}`;
  }
}

export function updateWaves(state, width, height, dt) {
  state.waveTimer += dt;

  // Spawn enemies from budget
  if (state.waveBudget > 0) {
    const spawnDelay = Math.max(0.15, 0.7 - state.wave * 0.02);
    if (state.waveTimer > spawnDelay) {
      spawnOneEnemy(state, width, height);
      state.waveBudget--;
      state.waveTimer = 0;
    }
  }

  // When budget is spent and all enemies dead → next wave
  if (state.waveBudget === 0 && state.enemies.length === 0 && state.waveTimer > 3.5) {
    spawnWave(state);
  }
}

function spawnOneEnemy(state, width, height) {
  const isBossWave = state.isBossWave;

  // Boss wave: first enemy is boss
  if (isBossWave && state.waveBudget === 3 + Math.floor(state.wave / 5)) {
    spawnSpecificEnemy(state, width, height, 'boss');
    return;
  }

  // Pick enemy type based on wave number
  const wave = state.wave;
  const roll = Math.random();

  let type;
  if (wave < 3) {
    type = 'scout';
  } else if (wave < 6) {
    type = roll < 0.5 ? 'scout' : roll < 0.85 ? 'soldier' : 'runner';
  } else if (wave < 10) {
    type = roll < 0.25 ? 'scout' : roll < 0.55 ? 'soldier' : roll < 0.75 ? 'runner' : 'tank';
  } else {
    type = roll < 0.15 ? 'scout' : roll < 0.40 ? 'soldier' : roll < 0.60 ? 'runner' : roll < 0.85 ? 'tank' : 'runner';
  }

  spawnSpecificEnemy(state, width, height, type);
}

function spawnSpecificEnemy(state, width, height, typeName) {
  const spec = ENEMY_TYPES[typeName];
  if (!spec) return;

  // Spawn from right side or top/bottom edge
  const side = Math.random();
  let x, y;

  if (side < 0.6) {
    // Right side
    x = width + 40;
    y = Math.random() * height;
  } else if (side < 0.8) {
    // Top
    x = Math.random() * width;
    y = -40;
  } else {
    // Bottom
    x = Math.random() * width;
    y = height + 40;
  }

  const waveScale = 1 + (state.wave - 1) * 0.08;

  state.enemies.push({
    x,
    y,
    hp: spec.hp * waveScale,
    maxHp: spec.hp * waveScale,
    speed: spec.speed,
    size: spec.size,
    reward: spec.reward,
    color: spec.color,
    isBoss: spec.isBoss || false,
  });
}
