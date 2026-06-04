import { BUILDINGS } from '../config/buildings.js';
import { BOSS_TYPES } from '../systems/BossSystem.js';
import { getActiveSynergies } from '../systems/SynergySystem.js';

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

    // Boss info
    let bossInfo = '';
    if (state.isBossWave && state.currentBossType) {
      const bossSpec = BOSS_TYPES[state.currentBossType];
      bossInfo = `<div style="color:${bossSpec.color};font-weight:900;font-size:13px">⚡ ${bossSpec.name} – ${bossSpec.description}</div>`;
    }

    // EMP warning
    const empBuildings = state.buildings.filter(b => b.empUntil && b.empUntil > (state.gameTime || 0));
    let empWarning = '';
    if (empBuildings.length > 0) {
      empWarning = `<div style="color:#ffb000;font-weight:bold;font-size:12px">⚡ ${empBuildings.length} Turm EMP-deaktiviert!</div>`;
    }

    // Synergy info
    const activeSyns = getActiveSynergies(state);
    let synInfo = '';
    if (activeSyns.length > 0) {
      const synTags = activeSyns.map(s =>
        `<span style="color:${s.color};font-size:11px;font-weight:bold">${s.name}</span>`
      ).join(' · ');
      synInfo = `<div style="margin-top:2px">${synTags}</div>`;
    }

    // Overcharge indicator
    let overchargeInfo = '';
    if (state.overchargeActive) {
      overchargeInfo = '<div style="color:#44ffaa;font-weight:900;font-size:12px">⚡ ÜBERLADUNG AKTIV – 2x Einkommen!</div>';
    } else if (state.overchargeAvailable) {
      overchargeInfo = '<div style="color:#2a7a5a;font-size:10px">Überladung bereit (3x Gen)</div>';
    }

    this.el.innerHTML = `
      <div style="font-size:14px;font-weight:900;color:#00d9ff;margin-bottom:4px">NEON COMMAND</div>
      <div>Welle <b>${state.wave}</b> · Kills <b>${state.kills}</b> · Score <b style="color:#ffb000">${state.score}</b></div>
      <div>Energy <b style="color:#ffb000">${energy}</b> <span style="color:#888">(+${Math.floor(state.income * state.upgIncome * (state.overchargeActive ? 2 : 1))}/s)</span></div>
      <div>Data <b style="color:#7d5cff">${Math.floor(state.data)}</b> <span style="color:#888">[U] Upgrades</span></div>
      <div>Core <b style="color:${coreHp > state.core.maxHp * .3 ? '#00ff9d' : '#ff345d'}">${coreHp}/${state.core.maxHp}</b></div>
      <div>Orbital <b style="color:#7d5cff">${orb > 0 ? orb + 's' : 'BEREIT [Q]'}</b></div>
      ${streak}
      ${bossInfo}
      ${empWarning}
      ${overchargeInfo}
      ${synInfo}
    `;
  }
}
