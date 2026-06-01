import { BUILDINGS } from '../config/buildings.js';

export class Hud {
  constructor(element) { this.el = element; }

  render(state, buildingsConfig) {
    if (state.mode === 'menu') {
      this.el.innerHTML = '<strong style="color:#00d9ff">NEON COMMAND</strong><br>Enter starten';
      return;
    }

    const coreHp = Math.max(0, Math.floor(state.core.hp));
    const energy = Math.floor(state.energy);
    const orb = Math.max(0, Math.ceil(state.orbitalCd));
    const streak = state.killStreak >= 3
      ? `<span style="color:#ffb000">🔥 ${state.killStreak}x Combo!</span>`
      : '';

    this.el.innerHTML = `
      <div style="font-size:14px;font-weight:900;color:#00d9ff;margin-bottom:4px">NEON COMMAND</div>
      <div>Welle <b>${state.wave}</b> · Kills <b>${state.kills}</b> · Score <b style="color:#ffb000">${state.score}</b></div>
      <div>Energy <b style="color:#ffb000">${energy}</b> <span style="color:#888">(+${Math.floor(state.income * state.upgIncome)}/s)</span></div>
      <div>Data <b style="color:#7d5cff">${Math.floor(state.data)}</b> <span style="color:#888">[U] Upgrades</span></div>
      <div>Core <b style="color:${coreHp > state.core.maxHp * .3 ? '#00ff9d' : '#ff345d'}">${coreHp}/${state.core.maxHp}</b></div>
      <div>Orbital <b style="color:#7d5cff">${orb > 0 ? orb + 's' : 'BEREIT [Q]'}</b></div>
      ${streak}
    `;
  }
}
