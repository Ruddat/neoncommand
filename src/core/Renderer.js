import { TILE } from './constants.js';
import { BUILDINGS } from '../config/buildings.js';
import { BOSS_TYPES, isEmpDisabled } from '../systems/BossSystem.js';
import { SYNERGIES } from '../systems/SynergySystem.js';

const C = {
  bg1: '#040714', bg2: '#03040a',
  cyan: '#00d9ff', pink: '#ff2bd6', red: '#ff345d', green: '#00ff9d',
  yellow: '#ffb000', violet: '#7d5cff', white: '#fff', orange: '#ff6b35',
};

export class Renderer {
  constructor(ctx) { this.ctx = ctx; }

  draw(state, w, h, canBuildFn) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    this.drawBG(ctx, w, h);

    if (state.mode === 'menu') { this.drawMenu(ctx, state, w, h); return; }

    this.drawBuildings(ctx, state);
    this.drawSynergyLinks(ctx, state);
    this.drawCore(ctx, state);
    this.drawEnemies(ctx, state);
    this.drawProjectiles(ctx, state);
    this.drawBossEffects(ctx, state);
    this.drawParticles(ctx, state);
    this.drawMsg(ctx, state, w);

    if (state.mode === 'playing') this.drawGhost(ctx, state, canBuildFn);
    if (state.mode === 'gameover') this.drawOverlay(ctx, w, h, 'CORE DESTROYED', C.red, state);
    if (state.mode === 'victory') this.drawOverlay(ctx, w, h, 'SIEG!', C.green, state, true);
    if (state.paused) this.drawOverlay(ctx, w, h, 'PAUSED', C.cyan, state);
    if (state.mode === 'upgrading') this.drawUpgradeScreen(ctx, state, w, h);
  }

  drawBG(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,217,255,.06)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }

  drawCore(ctx, state) {
    const { core } = state, pulse = 1 + Math.sin(Date.now() * .003) * .1;
    ctx.save(); ctx.shadowColor = C.cyan; ctx.shadowBlur = 35 + pulse * 12;
    ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(core.x, core.y, 24, 0, 7); ctx.fill(); ctx.restore();
    ctx.strokeStyle = C.violet; ctx.lineWidth = 2; ctx.globalAlpha = .5;
    ctx.beginPath(); ctx.arc(core.x, core.y, 32 * pulse, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(core.x, core.y - 12); ctx.lineTo(core.x + 9, core.y); ctx.lineTo(core.x, core.y + 12); ctx.lineTo(core.x - 9, core.y); ctx.closePath(); ctx.fill();
    this.drawBar(ctx, core.x - 34, core.y + 36, 68, 7, core.hp / core.maxHp, core.hp > core.maxHp * .35 ? C.green : C.red);
  }

  drawBuildings(ctx, state) {
    const gameTime = state.gameTime || 0;
    for (const b of state.buildings) {
      const spec = BUILDINGS[b.type]; if (!spec) continue;
      const range = spec.range * state.upgRange;
      const empOff = isEmpDisabled(b, gameTime);

      ctx.save();
      if (empOff) {
        // EMP-disabled: dim + flicker
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.15;
        ctx.shadowColor = '#ff345d';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#555';
      } else {
        ctx.shadowColor = spec.color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = spec.color;
      }

      if (b.type === 'generator') {
        ctx.beginPath(); ctx.moveTo(b.x, b.y - 17); ctx.lineTo(b.x + 15, b.y); ctx.lineTo(b.x, b.y + 17); ctx.lineTo(b.x - 15, b.y); ctx.closePath(); ctx.fill();
        if (!empOff) { ctx.fillStyle = 'rgba(0,255,157,.25)'; const p = 1 + Math.sin(Date.now() * .004 + b.x) * .4; ctx.beginPath(); ctx.arc(b.x, b.y, 7 * p, 0, 7); ctx.fill(); }
      } else if (b.type === 'shield') {
        ctx.globalAlpha = empOff ? 0.15 : .2; ctx.beginPath(); ctx.arc(b.x, b.y, TILE * .75, 0, 7); ctx.fill();
        ctx.globalAlpha = empOff ? 0.3 : .7; ctx.strokeStyle = empOff ? '#555' : spec.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, TILE * .75, 0, 7); ctx.stroke();
        ctx.globalAlpha = empOff ? 0.3 : 1; ctx.fillStyle = empOff ? '#555' : C.white; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('S', b.x, b.y + 5); ctx.textAlign = 'left';
      } else if (b.type === 'sniper') {
        ctx.beginPath(); ctx.moveTo(b.x, b.y - 17); ctx.lineTo(b.x + 15, b.y + 11); ctx.lineTo(b.x - 15, b.y + 11); ctx.closePath(); ctx.fill();
      } else if (b.type === 'missile') {
        ctx.fillRect(b.x - 10, b.y - 10, 20, 20); ctx.strokeStyle = empOff ? '#555' : spec.color; ctx.lineWidth = 2; ctx.strokeRect(b.x - 10, b.y - 10, 20, 20);
      } else {
        ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, 7); ctx.fill();
      }

      // EMP disabled icon
      if (empOff) {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.strokeStyle = C.red; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, 18, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b.x - 8, b.y - 8); ctx.lineTo(b.x + 8, b.y + 8); ctx.stroke();
      }

      // Synergy glow ring
      if (b.synergies && b.synergies.length > 0 && !empOff) {
        const synColors = b.synergies.map(id => SYNERGIES[id]?.color).filter(Boolean);
        const glowColor = synColors[0] || C.cyan;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.004) * 0.2;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = glowColor;
        ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();

      if (spec.range > 0 && !empOff) { ctx.save(); ctx.strokeStyle = spec.color; ctx.globalAlpha = .05; ctx.beginPath(); ctx.arc(b.x, b.y, range, 0, 7); ctx.stroke(); ctx.restore(); }
      const maxHp = b.maxHp || (b.type === 'shield' ? 220 : b.type === 'generator' ? 80 : 100);
      if (b.hp < maxHp) this.drawBar(ctx, b.x - 18, b.y - 24, 36, 4, b.hp / maxHp, spec.color);
    }
  }

  // Draw glowing synergy connection lines between buildings
  drawSynergyLinks(ctx, state) {
    if (!state.synergyLinks || state.synergyLinks.length === 0) return;
    const time = Date.now();

    for (const link of state.synergyLinks) {
      ctx.save();
      // Outer glow
      ctx.strokeStyle = link.color;
      ctx.globalAlpha = 0.12 + Math.sin(time * 0.003 + link.x1 * 0.1) * 0.06;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(link.x1, link.y1);
      ctx.lineTo(link.x2, link.y2);
      ctx.stroke();

      // Inner line
      ctx.globalAlpha = 0.5 + Math.sin(time * 0.004 + link.y1 * 0.1) * 0.2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(link.x1, link.y1);
      ctx.lineTo(link.x2, link.y2);
      ctx.stroke();

      // Traveling pulse dot
      const t = ((time * 0.001 + link.x1 * 0.01) % 1);
      const px = link.x1 + (link.x2 - link.x1) * t;
      const py = link.y1 + (link.y2 - link.y1) * t;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = link.color;
      ctx.shadowColor = link.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Overcharge visual: pulsing generators
    if (state.overchargeActive) {
      for (const b of state.buildings) {
        if (b.synOvercharge) {
          ctx.save();
          ctx.globalAlpha = 0.2 + Math.sin(time * 0.008) * 0.15;
          ctx.fillStyle = '#44ffaa';
          ctx.shadowColor = '#44ffaa';
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 25, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  drawEnemies(ctx, state) {
    for (const e of state.enemies) {
      ctx.save();
      const bossSpec = e.isBoss && e.bossType ? BOSS_TYPES[e.bossType] : null;
      const color = bossSpec ? bossSpec.color : e.color;

      ctx.shadowColor = color;
      ctx.shadowBlur = e.isBoss ? 28 : 14;
      ctx.fillStyle = color;

      if (e.isBoss) {
        // Boss: 8-pointed star
        ctx.beginPath();
        const points = bossSpec ? 12 : 8; // more points for special bosses
        for (let i = 0; i < points; i++) {
          const a = i / points * Math.PI * 2 - .4;
          const r = e.size + Math.sin(Date.now() * .005 + i) * 4;
          const inner = i % 2 === 0 ? r : r * 0.7;
          ctx.lineTo(e.x + Math.cos(a) * inner, e.y + Math.sin(a) * inner);
        }
        ctx.closePath(); ctx.fill();

        // Boss aura
        if (bossSpec) {
          ctx.globalAlpha = 0.15 + Math.sin(Date.now() * .003) * 0.08;
          ctx.fillStyle = bossSpec.auraColor;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size + 20 + Math.sin(Date.now() * .004) * 8, 0, 7);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Boss type indicator icon
          ctx.fillStyle = C.white;
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          if (e.bossType === 'emp') ctx.fillText('⚡', e.x, e.y + 5);
          else if (e.bossType === 'swarm') ctx.fillText('◎', e.x, e.y + 5);
          else if (e.bossType === 'heal') ctx.fillText('+', e.x, e.y + 5);
          else if (e.bossType === 'shield') ctx.fillText('◆', e.x, e.y + 5);
          ctx.textAlign = 'left';
        }
      } else if (e.isSwarmMinion) {
        // Swarm minion: small diamond
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - e.size);
        ctx.lineTo(e.x + e.size, e.y);
        ctx.lineTo(e.x, e.y + e.size);
        ctx.lineTo(e.x - e.size, e.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // Regular enemy: hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 - .5; ctx.lineTo(e.x + Math.cos(a) * e.size, e.y + Math.sin(a) * e.size); }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      // HP bar
      if (e.hp < e.maxHp) {
        const barW = e.isBoss ? 52 : e.isSwarmMinion ? 20 : 32;
        const barH = e.isBoss ? 6 : 4;
        this.drawBar(ctx, e.x - barW / 2, e.y - e.size - 10, barW, barH, e.hp / e.maxHp, e.hp > e.maxHp * .3 ? C.white : C.red);
      }

      // Boss type label
      if (e.isBoss && bossSpec) {
        ctx.save();
        ctx.fillStyle = C.white;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText(bossSpec.name.toUpperCase(), e.x, e.y - e.size - 18);
        ctx.restore();
      }
    }
  }

  drawProjectiles(ctx, state) {
    for (const p of state.projectiles) {
      // Enemy projectiles (reflected)
      if (p.isEnemyProjectile) {
        ctx.save();
        ctx.shadowColor = p.color; ctx.shadowBlur = 18;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill();
        // Trail
        if (p.trail.length > 1) {
          ctx.strokeStyle = p.color; ctx.globalAlpha = .3; ctx.lineWidth = 2;
          ctx.beginPath();
          p.trail.forEach((t, i) => i ? ctx.lineTo(t.x, t.y) : ctx.moveTo(t.x, t.y));
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }

      if (p.trail.length > 1) { ctx.save(); ctx.strokeStyle = p.color; ctx.globalAlpha = .3; ctx.lineWidth = 2; ctx.beginPath(); p.trail.forEach((t, i) => i ? ctx.lineTo(t.x, t.y) : ctx.moveTo(t.x, t.y)); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = p.type === 'sniper' ? 20 : 12; ctx.fillStyle = p.color;
      if (p.type === 'sniper') { ctx.strokeStyle = p.color; ctx.lineWidth = 2.5; const a = Math.atan2(p.vy, p.vx); ctx.beginPath(); ctx.moveTo(p.x - Math.cos(a) * 20, p.y - Math.sin(a) * 20); ctx.lineTo(p.x + Math.cos(a) * 10, p.y + Math.sin(a) * 10); ctx.stroke(); }
      else { const sz = p.type === 'missile' ? 5 : 3; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }

  // Boss visual effects (EMP rings, heal pulses)
  drawBossEffects(ctx, state) {
    // EMP rings
    if (state.empRings) {
      for (const r of state.empRings) {
        const alpha = r.life / r.max;
        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = alpha * 0.6;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill
        ctx.globalAlpha = alpha * 0.08;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fill();

        // Lightning streaks
        if (alpha > 0.4) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.strokeStyle = C.white;
          ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.001;
            ctx.beginPath();
            ctx.moveTo(r.x + Math.cos(angle) * 10, r.y + Math.sin(angle) * 10);
            let cx = r.x + Math.cos(angle) * r.radius * 0.5;
            let cy = r.y + Math.sin(angle) * r.radius * 0.5;
            cx += (Math.random() - 0.5) * 30;
            cy += (Math.random() - 0.5) * 30;
            ctx.lineTo(cx, cy);
            const ex = r.x + Math.cos(angle) * r.radius;
            const ey = r.y + Math.sin(angle) * r.radius;
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    // Heal pulses
    if (state.healPulses) {
      for (const p of state.healPulses) {
        const alpha = p.life / p.max;
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha * 0.5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Green cross glow at center
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 4, p.y - 12, 8, 24);
        ctx.fillRect(p.x - 12, p.y - 4, 24, 8);
        ctx.restore();
      }
    }
  }

  drawParticles(ctx, state) {
    for (const p of state.particles) { const a = Math.max(0, p.life / p.max); ctx.globalAlpha = a; ctx.fillStyle = p.color; const sz = p.size || 3; ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz); }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of state.texts) { const a = Math.max(0, t.life / t.max); ctx.globalAlpha = a; ctx.fillStyle = t.color; ctx.font = 'bold 14px Arial'; ctx.fillText(t.text, t.x, t.y); }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  drawGhost(ctx, state, canBuildFn) {
    const spec = BUILDINGS[state.selected]; if (!spec) return;
    const gx = state.mouse.gridX, gy = state.mouse.gridY, can = canBuildFn(state.selected, gx, gy);
    const range = spec.range * state.upgRange;
    ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = can ? spec.color : C.red;
    if (state.selected === 'generator') { ctx.beginPath(); ctx.moveTo(gx, gy - 17); ctx.lineTo(gx + 15, gy); ctx.lineTo(gx, gy + 17); ctx.lineTo(gx - 15, gy); ctx.closePath(); ctx.fill(); }
    else if (state.selected === 'shield') { ctx.beginPath(); ctx.arc(gx, gy, TILE * .75, 0, 7); ctx.fill(); }
    else if (state.selected === 'sniper') { ctx.beginPath(); ctx.moveTo(gx, gy - 17); ctx.lineTo(gx + 15, gy + 11); ctx.lineTo(gx - 15, gy + 11); ctx.closePath(); ctx.fill(); }
    else if (state.selected === 'missile') { ctx.fillRect(gx - 10, gy - 10, 20, 20); }
    else { ctx.beginPath(); ctx.arc(gx, gy, 13, 0, 7); ctx.fill(); }
    if (spec.range > 0) { ctx.strokeStyle = can ? spec.color : C.red; ctx.globalAlpha = .2; ctx.beginPath(); ctx.arc(gx, gy, range, 0, 7); ctx.stroke(); }
    ctx.restore();
  }

  drawMsg(ctx, state, w) {
    if (!state.message || state.msgTimer <= 0) return;
    const a = Math.min(1, state.msgTimer);
    const bossColor = state.currentBossType ? (BOSS_TYPES[state.currentBossType]?.color || C.pink) : C.pink;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(w / 2 - 250, 78, 500, 52);
    ctx.strokeStyle = state.isBossWave ? bossColor : C.cyan; ctx.lineWidth = state.isBossWave ? 2 : 1.5; ctx.strokeRect(w / 2 - 250, 78, 500, 52);
    ctx.fillStyle = C.white; ctx.font = '900 22px Arial'; ctx.fillText(state.message, w / 2, 112);
    ctx.textAlign = 'left'; ctx.restore();
  }

  drawMenu(ctx, state, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cyan; ctx.font = '900 80px Arial'; ctx.fillText('NEON', w / 2, h / 2 - 120);
    ctx.fillStyle = C.pink; ctx.font = '900 60px Arial'; ctx.fillText('COMMAND', w / 2, h / 2 - 50);
    ctx.fillStyle = C.green; ctx.font = '17px Arial'; ctx.fillText('Tower Defense – Synergy Edition', w / 2, h / 2 - 5);

    // Boss type preview
    ctx.fillStyle = '#aaa'; ctx.font = '13px Arial';
    ctx.fillText('4 Boss-Typen: EMP ⚡ · Swarm ◎ · Heal + · Shield ◆', w / 2, h / 2 + 20);

    // Synergy preview
    ctx.fillStyle = '#ff88ff'; ctx.font = '12px Arial';
    ctx.fillText('Synergien: Laser+Sniper · Rakete+Schild · 3x Generator · Laser+Laser · Sniper+Schild · Rakete+Rakete', w / 2, h / 2 + 40);

    ctx.fillStyle = C.white; ctx.font = '14px Arial';
    ctx.fillText('Klick = Bauen · 1-5 = Gebäudetyp · Q = Orbital Strike', w / 2, h / 2 + 55);
    ctx.fillText('U = Upgrades · Leertaste = Pause · R = Neustart', w / 2, h / 2 + 80);
    ctx.fillStyle = C.yellow; ctx.font = '13px Arial';
    ctx.fillText('Tipp: Baue erst Generatoren, dann Laser!', w / 2, h / 2 + 110);
    ctx.fillStyle = C.cyan; ctx.font = '900 22px Arial'; ctx.fillText('Enter = Start', w / 2, h / 2 + 150);
    ctx.textAlign = 'left';
  }

  drawOverlay(ctx, w, h, text, color, state, isVictory = false) {
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = '900 52px Arial'; ctx.fillText(text, w / 2, h / 2 - 35);
    ctx.fillStyle = C.white; ctx.font = '20px Arial';
    if (isVictory) {
      ctx.fillText(`Welle ${state.wave} erreicht! Alle ${state.winWave} Wellen überstanden!`, w / 2, h / 2 + 15);
    } else {
      ctx.fillText(`Welle ${state.wave} · Kills ${state.kills} · Score ${state.score}`, w / 2, h / 2 + 15);
    }
    ctx.fillStyle = C.yellow; ctx.font = '16px Arial'; ctx.fillText(`Bester Combo: ${state.bestStreak || 0}x`, w / 2, h / 2 + 45);
    ctx.fillStyle = '#aaa'; ctx.font = '16px Arial'; ctx.fillText('R = Neustart', w / 2, h / 2 + 80);
    ctx.textAlign = 'left';
  }

  drawUpgradeScreen(ctx, state, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.fillStyle = C.cyan; ctx.font = '900 40px Arial'; ctx.fillText('UPGRADES', w / 2, 80);
    ctx.fillStyle = '#aaa'; ctx.font = '14px Arial'; ctx.fillText(`Data: ${Math.floor(state.data)} · Wähle mit 1-4 · Esc = Zurück`, w / 2, 115);
    state.upgChoices.forEach((u, i) => {
      const x = w / 2 - 240 + i * 160, y = 150;
      const affordable = state.data >= u.cost;
      ctx.fillStyle = affordable ? 'rgba(0,217,255,.12)' : 'rgba(60,60,60,.2)';
      ctx.fillRect(x, y, 140, 110); ctx.strokeStyle = affordable ? C.cyan : '#444'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, 140, 110);
      ctx.fillStyle = affordable ? C.white : '#666'; ctx.font = '900 18px Arial'; ctx.fillText(`[${i + 1}]`, x + 70, y + 30);
      ctx.font = '13px Arial'; ctx.fillText(u.label, x + 70, y + 55);
      ctx.fillStyle = affordable ? C.yellow : '#444'; ctx.font = '12px Arial'; ctx.fillText(`${u.cost} Data`, x + 70, y + 80);
    });
    ctx.textAlign = 'left';
  }

  drawBar(ctx, x, y, w, h, v, c) {
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = c; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, v)), h);
  }
}
