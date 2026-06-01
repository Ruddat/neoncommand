import { BUILDINGS } from '../config/buildings.js';

/**
 * Hud – renders the HTML-based heads-up display with resources,
 * building selection, and controls.
 */

export class Hud {
  constructor(element) {
    this.el = element;
  }

  render(state, buildingsConfig) {
    if (state.mode === 'menu') {
      this.el.innerHTML = '<strong>NEON COMMAND</strong><br>Enter starten';
      return;
    }

    const sel = state.selected;

    // Build weapon selector
    let weapons = '';
    for (const [key, spec] of Object.entries(buildingsConfig)) {
      const isActive = key === sel;
      const affordable = state.energy >= spec.cost;
      const style = isActive
        ? `color:${spec.color};font-weight:bold;text-decoration:underline`
        : affordable
          ? `color:#aaa`
          : `color:#555`;
      weapons += `<span style="${style}">[${spec.key}] ${spec.label} (${spec.cost}E)</span> · `;
    }

    const coreHp = Math.max(0, Math.floor(state.core.hp));
    const energy = Math.floor(state.energy);

    this.el.innerHTML = `
      <div style="font-size:15px;font-weight:900;color:#00d9ff;margin-bottom:6px">NEON COMMAND</div>
      <div>Welle <b>${state.wave}</b> · Kills <b>${state.kills}</b> · Score <b style="color:#ffb000">${state.score || 0}</b></div>
      <div>Energy <b style="color:#ffb000">${energy}</b> (+${state.income}/s)</div>
      <div>Data <b style="color:#7d5cff">${Math.floor(state.data)}</b></div>
      <div>Core HP <b style="color:${coreHp > 40 ? '#00ff9d' : '#ff345d'}">${coreHp}/${state.core.maxHp}</b></div>
      <hr style="border-color:#00d9ff33;margin:6px 0">
      <div style="font-size:11px;line-height:1.6">${weapons}</div>
      <div style="font-size:10px;color:#666;margin-top:4px">Klick: Bauen · 1-5: Wählen · Space: Pause · R: Neustart</div>
    `;
  }
}
