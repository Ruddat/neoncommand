import { BUILDINGS } from '../config/buildings.js';
import { TILE } from '../core/constants.js';
import { burst } from './ParticleSystem.js';

/**
 * CombatSystem – handles turret targeting, shooting, projectile movement,
 * enemy damage, shield healing and core damage each frame.
 */

export function updateCombat(state, dt) {
  const { buildings, enemies, projectiles, core } = state;

  // --- Shield healing ---
  for (const building of buildings) {
    if (building.type !== 'shield') continue;
    const spec = BUILDINGS.shield;
    if (core.hp < core.maxHp) {
      core.hp = Math.min(core.maxHp, core.hp + (spec.healRate || 6) * dt);
    }
  }

  // --- Turrets fire at enemies in range ---
  for (const building of buildings) {
    if (building.type === 'generator' || building.type === 'shield') continue;
    const spec = BUILDINGS[building.type];
    if (!spec || spec.range === 0) continue;

    building.cooldown -= dt;
    if (building.cooldown > 0) continue;

    // Find nearest enemy in range
    let target = null;
    let bestDist = spec.range;
    for (const enemy of enemies) {
      const dist = Math.hypot(enemy.x - building.x, enemy.y - building.y);
      if (dist < bestDist) {
        bestDist = dist;
        target = enemy;
      }
    }

    if (target) {
      building.cooldown = 1 / (spec.fireRate || 1);
      const angle = Math.atan2(target.y - building.y, target.x - building.x);
      const speed = building.type === 'missile' ? 340 : building.type === 'sniper' ? 900 : 620;
      projectiles.push({
        x: building.x,
        y: building.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: spec.damage,
        color: spec.color,
        type: building.type,
        life: 3,
        splash: building.type === 'missile' ? 80 : 0,
      });
    }
  }

  // --- Move projectiles ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    // Remove if off-screen or expired
    if (p.life <= 0 || p.x < -200 || p.x > 4000 || p.y < -200 || p.y > 4000) {
      projectiles.splice(i, 1);
      continue;
    }

    // Check collision with enemies
    let hit = false;
    for (const enemy of enemies) {
      const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      const hitRadius = p.type === 'sniper' ? enemy.size + 10 : enemy.size + 6;
      if (dist < hitRadius) {
        // Direct hit
        enemy.hp -= p.damage;
        burst(state, p.x, p.y, p.color, 8);

        // Sniper knockback
        if (p.type === 'sniper') {
          const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
          enemy.x += Math.cos(angle) * 8;
          enemy.y += Math.sin(angle) * 8;
        }

        // Splash damage (missiles)
        if (p.splash > 0) {
          for (const other of enemies) {
            if (other === enemy) continue;
            const sd = Math.hypot(p.x - other.x, p.y - other.y);
            if (sd < p.splash) {
              other.hp -= p.damage * (1 - sd / p.splash) * 0.6;
              burst(state, other.x, other.y, p.color, 4);
            }
          }
          burst(state, p.x, p.y, p.color, 20);
        }

        hit = true;
        break;
      }
    }

    if (hit) {
      projectiles.splice(i, 1);
    }
  }

  // --- Move enemies and check core/building collision ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // Move towards core
    const dx = core.x - enemy.x;
    const dy = core.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;

    // Damage core if close
    if (dist < TILE * 0.8) {
      core.hp -= (enemy.isBoss ? 25 : 12) * dt;
      burst(state, core.x, core.y, '#ff345d', 3);
    }

    // Check collision with buildings (enemies damage buildings they walk through)
    for (let j = buildings.length - 1; j >= 0; j--) {
      const b = buildings[j];
      const bd = Math.hypot(enemy.x - b.x, enemy.y - b.y);

      // Shields have larger collision to block enemies
      const collisionRange = b.type === 'shield' ? TILE * 0.8 : TILE * 0.5;
      if (bd < collisionRange) {
        const dmgToBuilding = enemy.isBoss ? 20 : 8;
        b.hp -= dmgToBuilding * dt;

        // Shield also damages enemies that touch it
        if (b.type === 'shield') {
          enemy.hp -= 5 * dt;
          // Slow enemies near shield
          enemy.speed = Math.max(10, enemy.speed * 0.98);
        }

        if (b.hp <= 0) {
          burst(state, b.x, b.y, '#ff345d', 25);
          buildings.splice(j, 1);
        }
      }
    }

    // Remove dead enemies
    if (enemy.hp <= 0) {
      state.kills++;
      state.score += enemy.reward || 100;
      state.energy += (enemy.reward || 7) * 0.5;
      burst(state, enemy.x, enemy.y, enemy.color || '#00d9ff', enemy.isBoss ? 40 : 14);
      enemies.splice(i, 1);
    }
  }
}
