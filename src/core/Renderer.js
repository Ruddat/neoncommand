import { TILE } from './constants.js';
import { BUILDINGS } from '../config/buildings.js';

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
    this.drawCore(ctx, state);
    this.drawEnemies(ctx, state);
    this.drawProjectiles(ctx, state);
    this.drawParticles(ctx, state);
    this.drawMsg(ctx, state, w);

    if (state.mode === 'playing') this.drawGhost(ctx, state, canBuildFn);
    if (state.mode === 'gameover') this.drawOverlay(ctx, w, h, 'CORE DESTROYED', C.red, state);
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
    for (const b of state.buildings) {
      const spec = BUILDINGS[b.type]; if (!spec) continue;
      const range = spec.range * state.upgRange;
      ctx.save(); ctx.shadowColor = spec.color; ctx.shadowBlur = 16; ctx.fillStyle = spec.color;

      if (b.type === 'generator') {
        ctx.beginPath(); ctx.moveTo(b.x, b.y - 17); ctx.lineTo(b.x + 15, b.y); ctx.lineTo(b.x, b.y + 17); ctx.lineTo(b.x - 15, b.y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,255,157,.25)'; const p = 1 + Math.sin(Date.now() * .004 + b.x) * .4;
        ctx.beginPath(); ctx.arc(b.x, b.y, 7 * p, 0, 7); ctx.fill();
      } else if (b.type === 'shield') {
        ctx.globalAlpha = .2; ctx.beginPath(); ctx.arc(b.x, b.y, TILE * .75, 0, 7); ctx.fill();
        ctx.globalAlpha = .7; ctx.strokeStyle = spec.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, TILE * .75, 0, 7); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = C.white; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('S', b.x, b.y + 5); ctx.textAlign = 'left';
      } else if (b.type === 'sniper') {
        ctx.beginPath(); ctx.moveTo(b.x, b.y - 17); ctx.lineTo(b.x + 15, b.y + 11); ctx.lineTo(b.x - 15, b.y + 11); ctx.closePath(); ctx.fill();
      } else if (b.type === 'missile') {
        ctx.fillRect(b.x - 10, b.y - 10, 20, 20); ctx.strokeStyle = spec.color; ctx.lineWidth = 2; ctx.strokeRect(b.x - 10, b.y - 10, 20, 20);
      } else {
        ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, 7); ctx.fill();
      }
      ctx.restore();

      if (spec.range > 0) { ctx.save(); ctx.strokeStyle = spec.color; ctx.globalAlpha = .05; ctx.beginPath(); ctx.arc(b.x, b.y, range, 0, 7); ctx.stroke(); ctx.restore(); }
      const maxHp = b.type === 'shield' ? 220 : b.type === 'generator' ? 80 : 100;
      if (b.hp < maxHp) this.drawBar(ctx, b.x - 18, b.y - 24, 36, 4, b.hp / maxHp, spec.color);
    }
  }

  drawEnemies(ctx, state) {
    for (const e of state.enemies) {
      ctx.save(); ctx.shadowColor = e.color; ctx.shadowBlur = e.isBoss ? 28 : 14; ctx.fillStyle = e.color;
      if (e.isBoss) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * 7.28 - .4; const r = e.size + Math.sin(Date.now() * .005) * 4; ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 - .5; ctx.lineTo(e.x + Math.cos(a) * e.size, e.y + Math.sin(a) * e.size); }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      if (e.hp < e.maxHp) this.drawBar(ctx, e.x - (e.isBoss ? 26 : 16), e.y - e.size - 10, e.isBoss ? 52 : 32, e.isBoss ? 6 : 4, e.hp / e.maxHp, e.hp > e.maxHp * .3 ? C.white : C.red);
    }
  }

  drawProjectiles(ctx, state) {
    for (const p of state.projectiles) {
      if (p.trail.length > 1) { ctx.save(); ctx.strokeStyle = p.color; ctx.globalAlpha = .3; ctx.lineWidth = 2; ctx.beginPath(); p.trail.forEach((t, i) => i ? ctx.lineTo(t.x, t.y) : ctx.moveTo(t.x, t.y)); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = p.type === 'sniper' ? 20 : 12; ctx.fillStyle = p.color;
      if (p.type === 'sniper') { ctx.strokeStyle = p.color; ctx.lineWidth = 2.5; const a = Math.atan2(p.vy, p.vx); ctx.beginPath(); ctx.moveTo(p.x - Math.cos(a) * 20, p.y - Math.sin(a) * 20); ctx.lineTo(p.x + Math.cos(a) * 10, p.y + Math.sin(a) * 10); ctx.stroke(); }
      else { const sz = p.type === 'missile' ? 5 : 3; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, 7); ctx.fill(); }
      ctx.restore();
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
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(w / 2 - 250, 78, 500, 52);
    ctx.strokeStyle = state.isBossWave ? C.pink : C.cyan; ctx.lineWidth = 1.5; ctx.strokeRect(w / 2 - 250, 78, 500, 52);
    ctx.fillStyle = C.white; ctx.font = '900 22px Arial'; ctx.fillText(state.message, w / 2, 112);
    ctx.textAlign = 'left'; ctx.restore();
  }

  drawMenu(ctx, state, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cyan; ctx.font = '900 80px Arial'; ctx.fillText('NEON', w / 2, h / 2 - 110);
    ctx.fillStyle = C.pink; ctx.font = '900 60px Arial'; ctx.fillText('COMMAND', w / 2, h / 2 - 40);
    ctx.fillStyle = C.green; ctx.font = '17px Arial'; ctx.fillText('Tower Defense – Mehr Spaß Edition', w / 2, h / 2 + 5);
    ctx.fillStyle = C.white; ctx.font = '14px Arial';
    ctx.fillText('Klick = Bauen · 1-5 = Gebäudetyp · Q = Orbital Strike', w / 2, h / 2 + 40);
    ctx.fillText('U = Upgrades · Leertaste = Pause · R = Neustart', w / 2, h / 2 + 65);
    ctx.fillStyle = C.yellow; ctx.font = '13px Arial';
    ctx.fillText('Tipp: Baue erst Generatoren, dann Laser!', w / 2, h / 2 + 95);
    ctx.fillStyle = C.cyan; ctx.font = '900 22px Arial'; ctx.fillText('Enter = Start', w / 2, h / 2 + 135);
    ctx.textAlign = 'left';
  }

  drawOverlay(ctx, w, h, text, color, state) {
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = '900 52px Arial'; ctx.fillText(text, w / 2, h / 2 - 35);
    ctx.fillStyle = C.white; ctx.font = '20px Arial';
    ctx.fillText(`Welle ${state.wave} · Kills ${state.kills} · Score ${state.score}`, w / 2, h / 2 + 15);
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
