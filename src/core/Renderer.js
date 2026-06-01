import { TILE } from './constants.js';
import { BUILDINGS } from '../config/buildings.js';

/**
 * Renderer – draws all game state to the 2d canvas.
 */

const COLORS = {
  bg1: '#040714',
  bg2: '#03040a',
  grid: 'rgba(0,217,255,0.07)',
  core: '#00d9ff',
  coreGlow: '#00d9ff',
  coreStroke: '#7d5cff',
  enemy: '#ff345d',
  hud: 'rgba(0,0,0,0.6)',
  text: '#ffffff',
};

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(state, w, h, canBuildFn) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    this.drawBackground(ctx, w, h);
    this.drawGrid(ctx, w, h);

    if (state.mode === 'menu') {
      this.drawMenu(ctx, state, w, h);
      return;
    }

    this.drawBuildings(ctx, state);
    this.drawCore(ctx, state);
    this.drawEnemies(ctx, state);
    this.drawProjectiles(ctx, state);
    this.drawParticles(ctx, state);
    this.drawMessage(ctx, state, w);

    // Ghost building at cursor
    if (state.mode === 'playing') {
      this.drawGhost(ctx, state, canBuildFn);
    }

    if (state.mode === 'gameover') {
      this.drawOverlay(ctx, w, h, 'CORE DESTROYED', '#ff345d', state);
    }

    if (state.paused) {
      this.drawOverlay(ctx, w, h, 'PAUSED', '#00d9ff', state);
    }
  }

  /* ---------- Background ---------- */

  drawBackground(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, COLORS.bg1);
    g.addColorStop(1, COLORS.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  drawGrid(ctx, w, h) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += TILE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  /* ---------- Core ---------- */

  drawCore(ctx, state) {
    const { core } = state;
    const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.08;

    // Glow
    ctx.save();
    ctx.shadowColor = COLORS.coreGlow;
    ctx.shadowBlur = 30 + pulse * 10;
    ctx.fillStyle = COLORS.core;
    ctx.beginPath();
    ctx.arc(core.x, core.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outer ring
    ctx.strokeStyle = COLORS.coreStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(core.x, core.y, 28 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Inner diamond
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(core.x, core.y - 10);
    ctx.lineTo(core.x + 8, core.y);
    ctx.lineTo(core.x, core.y + 10);
    ctx.lineTo(core.x - 8, core.y);
    ctx.closePath();
    ctx.fill();

    // HP bar
    this.drawBar(ctx, core.x - 30, core.y + 34, 60, 6, core.hp / core.maxHp, core.hp > 40 ? '#00ff9d' : '#ff345d');
  }

  /* ---------- Buildings ---------- */

  drawBuildings(ctx, state) {
    for (const b of state.buildings) {
      const spec = BUILDINGS[b.type];
      if (!spec) continue;

      ctx.save();
      ctx.shadowColor = spec.color;
      ctx.shadowBlur = 14;

      // Building body
      ctx.fillStyle = spec.color;
      if (b.type === 'generator') {
        // Diamond shape for generators
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 16);
        ctx.lineTo(b.x + 14, b.y);
        ctx.lineTo(b.x, b.y + 16);
        ctx.lineTo(b.x - 14, b.y);
        ctx.closePath();
        ctx.fill();

        // Pulsing inner glow
        ctx.fillStyle = 'rgba(0,255,157,0.3)';
        const p = 1 + Math.sin(Date.now() * 0.005 + b.x) * 0.3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6 * p, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'shield') {
        // Shield bubble
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(b.x, b.y, TILE * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, TILE * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        // Inner icon
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('S', b.x, b.y + 5);
        ctx.textAlign = 'left';
      } else if (b.type === 'sniper') {
        // Triangle shape for sniper
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 16);
        ctx.lineTo(b.x + 14, b.y + 10);
        ctx.lineTo(b.x - 14, b.y + 10);
        ctx.closePath();
        ctx.fill();
      } else {
        // Turret shape – circle for laser/missile
        ctx.beginPath();
        ctx.arc(b.x, b.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Range ring for turrets (subtle)
      if (spec.range > 0) {
        ctx.save();
        ctx.strokeStyle = spec.color;
        ctx.globalAlpha = 0.06;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, spec.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // HP bar
      const maxHp = b.type === 'shield' ? 200 : b.type === 'generator' ? 65 : 90;
      this.drawBar(ctx, b.x - 18, b.y - 24, 36, 4, b.hp / maxHp, spec.color);
    }
  }

  /* ---------- Enemies ---------- */

  drawEnemies(ctx, state) {
    for (const e of state.enemies) {
      ctx.save();
      ctx.shadowColor = e.color || COLORS.enemy;
      ctx.shadowBlur = e.isBoss ? 24 : 12;
      ctx.fillStyle = e.color || COLORS.enemy;

      if (e.isBoss) {
        // Boss: octagonal shape with pulsing aura
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI / 4) * i - Math.PI / 8;
          const r = e.size + Math.sin(Date.now() * 0.006) * 3;
          const px = e.x + Math.cos(a) * r;
          const py = e.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Boss inner skull marker
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.floor(e.size * 0.6)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('X', e.x, e.y + e.size * 0.2);
        ctx.textAlign = 'left';
      } else {
        // Regular: hexagonal shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const r = e.size;
          const px = e.x + Math.cos(a) * r;
          const py = e.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // HP bar
      if (e.hp < e.maxHp) {
        this.drawBar(
          ctx,
          e.x - (e.isBoss ? 24 : 16),
          e.y - e.size - 10,
          e.isBoss ? 48 : 32,
          e.isBoss ? 6 : 4,
          e.hp / e.maxHp,
          e.hp > e.maxHp * 0.35 ? '#fff' : '#ff345d'
        );
      }
    }
  }

  /* ---------- Projectiles ---------- */

  drawProjectiles(ctx, state) {
    for (const p of state.projectiles) {
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.type === 'sniper' ? 18 : 10;
      ctx.fillStyle = p.color;

      if (p.type === 'sniper') {
        // Long thin line for sniper
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        const angle = Math.atan2(p.vy, p.vx);
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(angle) * 16, p.y - Math.sin(angle) * 16);
        ctx.lineTo(p.x + Math.cos(angle) * 8, p.y + Math.sin(angle) * 8);
        ctx.stroke();
      } else {
        const size = p.type === 'missile' ? 5 : 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------- Particles ---------- */

  drawParticles(ctx, state) {
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = 2 + alpha * 3;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Ghost Building ---------- */

  drawGhost(ctx, state, canBuildFn) {
    const spec = BUILDINGS[state.selected];
    if (!spec) return;

    const gx = state.mouse.gridX;
    const gy = state.mouse.gridY;
    const can = canBuildFn(state.selected, gx, gy);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = can ? spec.color : '#ff345d';

    if (state.selected === 'generator') {
      ctx.beginPath();
      ctx.moveTo(gx, gy - 16);
      ctx.lineTo(gx + 14, gy);
      ctx.lineTo(gx, gy + 16);
      ctx.lineTo(gx - 14, gy);
      ctx.closePath();
      ctx.fill();
    } else if (state.selected === 'shield') {
      ctx.beginPath();
      ctx.arc(gx, gy, TILE * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.selected === 'sniper') {
      ctx.beginPath();
      ctx.moveTo(gx, gy - 16);
      ctx.lineTo(gx + 14, gy + 10);
      ctx.lineTo(gx - 14, gy + 10);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Range ring
    if (spec.range > 0) {
      ctx.strokeStyle = can ? spec.color : '#ff345d';
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(gx, gy, spec.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ---------- Message Banner ---------- */

  drawMessage(ctx, state, w) {
    if (!state.message || state.msgTimer <= 0) return;

    const alpha = Math.min(1, state.msgTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    // Banner background
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(w / 2 - 280, 80, 560, 50);
    ctx.strokeStyle = '#ff2bd6';
    ctx.lineWidth = 1;
    ctx.strokeRect(w / 2 - 280, 80, 560, 50);

    ctx.fillStyle = '#fff';
    ctx.font = '900 22px Arial';
    ctx.fillText(state.message, w / 2, 112);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  /* ---------- Menu / Overlays ---------- */

  drawMenu(ctx, state, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00d9ff';
    ctx.font = '900 76px Arial';
    ctx.fillText('NEON', w / 2, h / 2 - 100);

    ctx.fillStyle = '#ff2bd6';
    ctx.font = '900 56px Arial';
    ctx.fillText('COMMAND', w / 2, h / 2 - 35);

    ctx.fillStyle = '#00ff9d';
    ctx.font = '18px Arial';
    ctx.fillText('Tower Defense Strategy Game', w / 2, h / 2 + 15);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('1: Laser · 2: Raketen · 3: Generator · 4: Schild · 5: Sniper', w / 2, h / 2 + 55);
    ctx.fillText('Klick zum Bauen · Leertaste: Pause · R: Neustart', w / 2, h / 2 + 85);

    ctx.fillStyle = '#00d9ff';
    ctx.font = '20px Arial';
    ctx.fillText('Enter startet den Run', w / 2, h / 2 + 130);

    ctx.textAlign = 'left';
  }

  drawOverlay(ctx, w, h, text, color, state) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = '900 54px Arial';
    ctx.fillText(text, w / 2, h / 2 - 30);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Welle ${state.wave} · Kills ${state.kills} · Score ${state.score || state.kills * 100}`, w / 2, h / 2 + 20);
    ctx.fillText('R = Neustart', w / 2, h / 2 + 60);

    ctx.textAlign = 'left';
  }

  /* ---------- Utility ---------- */

  drawBar(ctx, x, y, w, h, value, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, value)), h);
  }
}
