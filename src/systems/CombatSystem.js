import { BUILDINGS } from '../config/buildings.js';
import { TILE } from '../core/constants.js';
import { burst, floatText } from './ParticleSystem.js';
import {
  playLaser, playMissileLaunch, playExplosion, playSniper,
  playEnemyKill, playCoreDamage, playBuildingDestroyed,
} from './AudioSystem.js';
import {
  isEmpDisabled, spawnSwarmMinions, reflectDamage, BOSS_TYPES,
} from './BossSystem.js';
import {
  getSynDmg, getSynRate, getSynSplash, hasSynEmpSlow, hasSynHealBoost, recalcSynergies,
} from './SynergySystem.js';

export function updateCombat(state, dt) {
  const { buildings, enemies, projectiles, core } = state;

  // Track game time for EMP
  state.gameTime = (state.gameTime || 0) + dt;

  // Shield healing (with synergy boost)
  for (const b of buildings) {
    if (b.type === 'shield' && core.hp < core.maxHp) {
      const healRate = hasSynHealBoost(b) ? 12 : 8;
      core.hp = Math.min(core.maxHp, core.hp + healRate * dt);
    }
  }

  // Kill streak tracker
  state.killTimer = (state.killTimer || 0) - dt;
  if (state.killTimer <= 0) state.killStreak = 0;

  // Turrets fire (with synergy bonuses)
  for (const building of buildings) {
    if (building.type === 'generator' || building.type === 'shield') continue;

    // EMP check — skip firing if disabled
    if (isEmpDisabled(building, state.gameTime)) continue;

    const spec = BUILDINGS[building.type];
    if (!spec || spec.range === 0) continue;

    building.cooldown -= dt;
    if (building.cooldown > 0) continue;

    const range = spec.range * state.upgRange;
    let target = null, bestDist = range;
    for (const enemy of enemies) {
      const d = Math.hypot(enemy.x - building.x, enemy.y - building.y);
      if (d < bestDist) { bestDist = d; target = enemy; }
    }

    if (target) {
      // Apply synergy rate bonus
      const synRate = getSynRate(building);
      building.cooldown = 1 / (spec.rate * state.upgRate * synRate);
      const angle = Math.atan2(target.y - building.y, target.x - building.x);
      const speed = building.type === 'missile' ? 320 : building.type === 'sniper' ? 850 : 600;
      // Apply synergy damage bonus
      const synDmg = getSynDmg(building);
      const dmg = spec.damage * state.upgDmg * synDmg;
      // Apply synergy splash bonus
      const synSplash = getSynSplash(building);
      const splashRadius = (spec.splash || 0) * synSplash;

      state.projectiles.push({
        x: building.x, y: building.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        dmg, color: spec.color, type: building.type,
        life: 3, splash: splashRadius, trail: [],
        synEmpSlow: hasSynEmpSlow(building),
      });
      if (building.type === 'laser') playLaser();
      else if (building.type === 'missile') playMissileLaunch();
      else if (building.type === 'sniper') playSniper();
    }
  }

  // Move projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 6) p.trail.shift();
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;

    if (p.life <= 0 || p.x < -200 || p.x > 5000 || p.y < -200 || p.y > 5000) {
      projectiles.splice(i, 1); continue;
    }

    // === ENEMY PROJECTILES (reflected by Shield Boss) ===
    if (p.isEnemyProjectile) {
      // Check hit on buildings
      for (let j = buildings.length - 1; j >= 0; j--) {
        const b = buildings[j];
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < TILE * 0.5) {
          b.hp -= p.dmg;
          burst(state, p.x, p.y, p.color, 6);
          if (b.hp <= 0) {
            burst(state, b.x, b.y, '#ff345d', 30);
            playBuildingDestroyed();
            buildings.splice(j, 1);
            recalcSynergies(state);
          }
          projectiles.splice(i, 1);
          break;
        }
      }
      // Check hit on core
      const cd = Math.hypot(p.x - core.x, p.y - core.y);
      if (cd < 24) {
        core.hp -= p.dmg;
        burst(state, core.x, core.y, p.color, 8);
        state.shake = Math.max(state.shake, 5);
        projectiles.splice(i, 1);
      }
      continue;
    }

    // === PLAYER PROJECTILES ===
    let hit = false;
    for (const enemy of enemies) {
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (d < enemy.size + 8) {
        const damage = p.dmg;

        // Shield Boss: reflect a portion of damage
        if (enemy.isBoss && enemy.bossType === 'shield') {
          reflectDamage(state, enemy, damage, p.x, p.y);
        }

        enemy.hp -= damage;
        burst(state, p.x, p.y, p.color, 6);
        playExplosion(0.05);

        // Synergy: EMP slow on hit (Missile+Shield)
        if (p.synEmpSlow) {
          enemy.speed = Math.max(8, enemy.speed * 0.7);
          enemy.empSlowUntil = (state.gameTime || 0) + 2;
        }

        if (p.type === 'sniper') {
          const a = Math.atan2(enemy.y - p.y, enemy.x - p.x);
          enemy.x += Math.cos(a) * 10; enemy.y += Math.sin(a) * 10;
        }

        if (p.splash > 0) {
          for (const other of enemies) {
            if (other === enemy) continue;
            const sd = Math.hypot(p.x - other.x, p.y - other.y);
            if (sd < p.splash) {
              other.hp -= p.dmg * (1 - sd / p.splash) * 0.6;
              burst(state, other.x, other.y, p.color, 4);
              // EMP slow on splash targets too
              if (p.synEmpSlow) {
                other.speed = Math.max(8, other.speed * 0.7);
                other.empSlowUntil = (state.gameTime || 0) + 2;
              }
            }
          }
          burst(state, p.x, p.y, p.color, 24, 1.3);
          playExplosion(0.12);
          state.shake = Math.max(state.shake, 5);
        }

        hit = true; break;
      }
    }
    if (hit) projectiles.splice(i, 1);
  }

  // Move enemies toward core
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = core.x - enemy.x, dy = core.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;

    // Restore speed after EMP slow wears off
    if (enemy.empSlowUntil && state.gameTime > enemy.empSlowUntil) {
      delete enemy.empSlowUntil;
      // Re-derive speed from type (approximate restore)
      if (!enemy.isBoss) {
        const speeds = { scout: 62, soldier: 44, tank: 24, runner: 110 };
        enemy.speed = speeds[Object.keys(speeds).find(k =>
          Math.abs(speeds[k] - enemy.speed / 0.7) < 20
        )] || enemy.speed;
      }
    }

    enemy.x += (dx / d) * enemy.speed * dt;
    enemy.y += (dy / d) * enemy.speed * dt;

    if (d < TILE * 0.7) {
      core.hp -= (enemy.isBoss ? 18 : 10) * dt;
      burst(state, core.x, core.y, '#ff345d', 2);
      playCoreDamage();
      state.shake = Math.max(state.shake, 3);
    }

    for (let j = buildings.length - 1; j >= 0; j--) {
      const b = buildings[j];
      const bd = Math.hypot(enemy.x - b.x, enemy.y - b.y);
      const cr = b.type === 'shield' ? TILE * 0.7 : TILE * 0.45;
      if (bd < cr) {
        b.hp -= (enemy.isBoss ? 16 : 6) * dt;
        if (b.type === 'shield') { enemy.hp -= 6 * dt; enemy.speed = Math.max(8, enemy.speed * 0.97); }
        if (b.hp <= 0) { burst(state, b.x, b.y, '#ff345d', 30); playBuildingDestroyed(); buildings.splice(j, 1); recalcSynergies(state); }
      }
    }

    if (enemy.hp <= 0) {
      // Swarm Boss: spawn minions on death
      if (enemy.isBoss && enemy.bossType === 'swarm') {
        spawnSwarmMinions(state, enemy);
      }

      state.kills++;
      state.score += enemy.reward;
      state.energy += enemy.energy || 5;
      state.killStreak = (state.killStreak || 0) + 1;
      state.killTimer = 2;

      // Combo bonus
      if (state.killStreak >= 3) {
        const bonus = Math.floor(state.killStreak * 5);
        state.score += bonus;
        state.energy += bonus * 0.5;
        burst(state, enemy.x, enemy.y, '#ffb000', 16, 1.2);
      }

      burst(state, enemy.x, enemy.y, enemy.color, enemy.isBoss ? 50 : 18, enemy.isBoss ? 1.8 : 1);
      playEnemyKill();
      if (enemy.isBoss) {
        state.shake = 15;
        burst(state, enemy.x, enemy.y, '#fff', 60, 2);
        playExplosion(0.2);
        floatText(state, enemy.x, enemy.y - 40, 'BOSS VERNICHTET!', '#fff');
      }
      enemies.splice(i, 1);
    }
  }
}

export function orbitalStrike(state) {
  if (state.orbitalCd > 0) return;
  state.orbitalCd = 20;
  const x = state.mouse.x, y = state.mouse.y;
  state.shake = 18;
  burst(state, x, y, '#7d5cff', 80, 2);
  burst(state, x, y, '#fff', 40, 1.5);

  for (const e of state.enemies) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < 180) { e.hp -= 200 * (1 - d / 200); }
  }
}
