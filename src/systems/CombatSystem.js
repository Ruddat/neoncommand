import { BUILDINGS } from '../config/buildings.js';
import { TILE } from '../core/constants.js';
import { burst } from './ParticleSystem.js';

export function updateCombat(state, dt) {
  const { buildings, enemies, projectiles, core } = state;

  // Shield healing
  for (const b of buildings) {
    if (b.type === 'shield' && core.hp < core.maxHp) {
      core.hp = Math.min(core.maxHp, core.hp + 8 * dt);
    }
  }

  // Kill streak tracker
  state.killTimer = (state.killTimer || 0) - dt;
  if (state.killTimer <= 0) state.killStreak = 0;

  // Turrets fire
  for (const building of buildings) {
    if (building.type === 'generator' || building.type === 'shield') continue;
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
      building.cooldown = 1 / (spec.rate * state.upgRate);
      const angle = Math.atan2(target.y - building.y, target.x - building.x);
      const speed = building.type === 'missile' ? 320 : building.type === 'sniper' ? 850 : 600;
      const dmg = spec.damage * state.upgDmg;
      state.projectiles.push({
        x: building.x, y: building.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        dmg, color: spec.color, type: building.type,
        life: 3, splash: spec.splash || 0, trail: [],
      });
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

    let hit = false;
    for (const enemy of enemies) {
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (d < enemy.size + 8) {
        enemy.hp -= p.dmg;
        burst(state, p.x, p.y, p.color, 6);

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
            }
          }
          burst(state, p.x, p.y, p.color, 24, 1.3);
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
    enemy.x += (dx / d) * enemy.speed * dt;
    enemy.y += (dy / d) * enemy.speed * dt;

    if (d < TILE * 0.7) {
      core.hp -= (enemy.isBoss ? 18 : 10) * dt;
      burst(state, core.x, core.y, '#ff345d', 2);
      state.shake = Math.max(state.shake, 3);
    }

    for (let j = buildings.length - 1; j >= 0; j--) {
      const b = buildings[j];
      const bd = Math.hypot(enemy.x - b.x, enemy.y - b.y);
      const cr = b.type === 'shield' ? TILE * 0.7 : TILE * 0.45;
      if (bd < cr) {
        b.hp -= (enemy.isBoss ? 16 : 6) * dt;
        if (b.type === 'shield') { enemy.hp -= 6 * dt; enemy.speed = Math.max(8, enemy.speed * 0.97); }
        if (b.hp <= 0) { burst(state, b.x, b.y, '#ff345d', 30); buildings.splice(j, 1); }
      }
    }

    if (enemy.hp <= 0) {
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
      if (enemy.isBoss) { state.shake = 15; burst(state, enemy.x, enemy.y, '#fff', 60, 2); }
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
