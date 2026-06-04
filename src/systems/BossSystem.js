// ====== BOSS ABILITY SYSTEM ======
// 4 unique boss types with special abilities

import { burst, floatText } from './ParticleSystem.js';
import {
  playBossEMP, playBossHeal, playBossShieldHit, playBossSwarmSpawn,
} from './AudioSystem.js';

export const BOSS_TYPES = {
  emp: {
    name: 'EMP-Boss',
    color: '#ffb000',
    auraColor: 'rgba(255,176,0,0.15)',
    abilityRadius: 200,
    abilityCooldown: 8,
    abilityDuration: 4,
    description: 'Deaktiviert Türme',
  },
  swarm: {
    name: 'Swarm-Boss',
    color: '#00ff9d',
    auraColor: 'rgba(0,255,157,0.12)',
    spawnCount: 5,
    spawnHp: 40,
    spawnSpeed: 80,
    spawnSize: 7,
    description: 'Spawnt Minis beim Tod',
  },
  heal: {
    name: 'Heal-Boss',
    color: '#ff345d',
    auraColor: 'rgba(255,52,93,0.12)',
    abilityRadius: 150,
    abilityCooldown: 6,
    healPercent: 0.15,
    description: 'Heilt andere Enemies',
  },
  shield: {
    name: 'Shield-Boss',
    color: '#7d5cff',
    auraColor: 'rgba(125,92,255,0.15)',
    reflectPercent: 0.3,
    reflectSpeed: 350,
    description: 'Reflektiert 30% Schaden',
  },
};

// Boss type rotation order for boss waves
const BOSS_ROTATION = ['emp', 'swarm', 'heal', 'shield'];

export function getBossType(wave) {
  const idx = Math.floor((wave / 5) - 1) % BOSS_ROTATION.length;
  return BOSS_ROTATION[idx];
}

// Process all boss abilities each frame
export function updateBossAbilities(state, dt) {
  for (const enemy of state.enemies) {
    if (!enemy.isBoss || !enemy.bossType) continue;
    const spec = BOSS_TYPES[enemy.bossType];

    switch (enemy.bossType) {
      case 'emp':
        updateEMPBoss(state, enemy, spec, dt);
        break;
      case 'heal':
        updateHealBoss(state, enemy, spec, dt);
        break;
      // swarm & shield are handled in CombatSystem (on-death and on-hit)
    }
  }
}

// === EMP BOSS ===
// Periodically deactivates all turrets in range
function updateEMPBoss(state, enemy, spec, dt) {
  enemy.abilityTimer = (enemy.abilityTimer || 0) - dt;

  if (enemy.abilityTimer <= 0) {
    enemy.abilityTimer = spec.abilityCooldown;

    // Find turrets in range
    let affected = 0;
    for (const b of state.buildings) {
      if (b.type === 'generator' || b.type === 'shield') continue;
      const d = Math.hypot(b.x - enemy.x, b.y - enemy.y);
      if (d < spec.abilityRadius) {
        b.empUntil = (b.empUntil || 0) > state.gameTime
          ? b.empUntil
          : state.gameTime + spec.abilityDuration;
        affected++;
      }
    }

    if (affected > 0) {
      // Visual: expanding EMP ring
      burst(state, enemy.x, enemy.y, spec.color, 30, 1.5);
      state.empRings = state.empRings || [];
      state.empRings.push({
        x: enemy.x, y: enemy.y,
        radius: 0, maxRadius: spec.abilityRadius,
        life: 0.8, max: 0.8, color: spec.color,
      });
      floatText(state, enemy.x, enemy.y - 50, 'EMP!', spec.color);
      state.shake = Math.max(state.shake || 0, 8);
      playBossEMP();
    }
  }
}

// Check if a building is EMP-disabled
export function isEmpDisabled(building, gameTime) {
  return building.empUntil && building.empUntil > gameTime;
}

// === HEAL BOSS ===
// Periodically heals nearby enemies
function updateHealBoss(state, enemy, spec, dt) {
  enemy.abilityTimer = (enemy.abilityTimer || 0) - dt;

  if (enemy.abilityTimer <= 0) {
    enemy.abilityTimer = spec.abilityCooldown;

    let healed = 0;
    for (const e of state.enemies) {
      if (e === enemy) continue;
      const d = Math.hypot(e.x - enemy.x, e.y - enemy.y);
      if (d < spec.abilityRadius && e.hp < e.maxHp) {
        const healAmount = e.maxHp * spec.healPercent;
        e.hp = Math.min(e.maxHp, e.hp + healAmount);
        healed++;
        // Small green particles on healed enemy
        burst(state, e.x, e.y, '#00ff9d', 4, 0.5);
      }
    }

    if (healed > 0) {
      // Visual: heal pulse ring
      state.healPulses = state.healPulses || [];
      state.healPulses.push({
        x: enemy.x, y: enemy.y,
        radius: 0, maxRadius: spec.abilityRadius,
        life: 0.6, max: 0.6, color: '#00ff9d',
      });
      floatText(state, enemy.x, enemy.y - 50, `HEAL x${healed}`, '#00ff9d');
      playBossHeal();
    }
  }
}

// === SWARM BOSS ===
// Spawns mini-enemies on death
export function spawnSwarmMinions(state, boss) {
  const spec = BOSS_TYPES.swarm;
  const count = spec.spawnCount;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const offset = 30;
    state.enemies.push({
      x: boss.x + Math.cos(angle) * offset,
      y: boss.y + Math.sin(angle) * offset,
      hp: spec.spawnHp,
      maxHp: spec.spawnHp,
      speed: spec.spawnSpeed,
      size: spec.spawnSize,
      reward: 5,
      color: spec.color,
      energy: 3,
      isBoss: false,
      isSwarmMinion: true,
    });
  }

  // Visual: burst of green particles
  burst(state, boss.x, boss.y, spec.color, 40, 1.8);
  floatText(state, boss.x, boss.y - 50, 'SWARM!', spec.color);
  state.shake = Math.max(state.shake || 0, 10);
  playBossSwarmSpawn();
}

// === SHIELD BOSS ===
// Reflects a percentage of damage back as projectiles
export function reflectDamage(state, boss, damage, sourceX, sourceY) {
  const spec = BOSS_TYPES.shield;
  const reflectDmg = damage * spec.reflectPercent;

  // Create a reflected projectile aimed at the nearest building or core
  const targets = state.buildings.filter(b =>
    b.type !== 'generator' && b.type !== 'shield'
  );

  let target;
  if (targets.length > 0) {
    // Pick random turret
    target = targets[Math.floor(Math.random() * targets.length)];
  } else {
    // Aim at core
    target = state.core;
  }

  const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
  state.projectiles.push({
    x: boss.x,
    y: boss.y,
    vx: Math.cos(angle) * spec.reflectSpeed,
    vy: Math.sin(angle) * spec.reflectSpeed,
    dmg: reflectDmg,
    color: spec.color,
    type: 'reflected',
    life: 3,
    splash: 0,
    trail: [],
    isEnemyProjectile: true,
  });

  // Visual: purple flash on boss
  burst(state, boss.x, boss.y, spec.color, 8, 0.6);
  playBossShieldHit();
}

// Update visual effects (rings, pulses)
export function updateBossEffects(state, dt) {
  // EMP rings
  if (state.empRings) {
    for (let i = state.empRings.length - 1; i >= 0; i--) {
      const r = state.empRings[i];
      r.life -= dt;
      r.radius = r.maxRadius * (1 - r.life / r.max);
      if (r.life <= 0) state.empRings.splice(i, 1);
    }
  }

  // Heal pulses
  if (state.healPulses) {
    for (let i = state.healPulses.length - 1; i >= 0; i--) {
      const p = state.healPulses[i];
      p.life -= dt;
      p.radius = p.maxRadius * (1 - p.life / p.max);
      if (p.life <= 0) state.healPulses.splice(i, 1);
    }
  }
}
