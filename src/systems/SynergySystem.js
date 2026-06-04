// ====== TOWER SYNERGY SYSTEM ======
// Buildings near each other get bonus effects

import { TILE } from '../core/constants.js';
import { burst, floatText } from './ParticleSystem.js';

// Synergy range: 2 tiles = 96px
const SYNERGY_RANGE = TILE * 2;

// All synergy definitions
export const SYNERGIES = {
  // Laser + Sniper = Precision Link: +25% damage to both
  laser_sniper: {
    id: 'laser_sniper',
    name: 'Präzisions-Link',
    types: ['laser', 'sniper'],
    color: '#ff88ff',
    description: '+25% Schaden',
    apply: (building, state) => {
      building.synDmg = (building.synDmg || 1) * 1.25;
    },
  },
  // Missile + Shield = EMP Charge: missile hits cause mini-EMP (slow enemies 30% for 2s)
  missile_shield: {
    id: 'missile_shield',
    name: 'EMP-Ladung',
    types: ['missile', 'shield'],
    color: '#ff9944',
    description: 'Raketen verlangsamen Enemies',
    apply: (building, state) => {
      building.synEmpSlow = true;
    },
  },
  // 3x Generator = Overcharge: 2x income for 10s every 30s
  gen_triple: {
    id: 'gen_triple',
    name: 'Überladung',
    types: ['generator', 'generator', 'generator'],
    color: '#44ffaa',
    description: '3x Gen = 2x Einkommen (10s/30s)',
    apply: (building, state) => {
      building.synOvercharge = true;
    },
  },
  // Laser + Laser = Focused Beam: +40% fire rate
  laser_laser: {
    id: 'laser_laser',
    name: 'Fokussierter Strahl',
    types: ['laser', 'laser'],
    color: '#ff44dd',
    description: '+40% Feuerrate',
    apply: (building, state) => {
      building.synRate = (building.synRate || 1) * 1.4;
    },
  },
  // Sniper + Shield = Hardened: shield heals core +50% faster
  sniper_shield: {
    id: 'sniper_shield',
    name: 'Gehärtet',
    types: ['sniper', 'shield'],
    color: '#6699ff',
    description: 'Schild heilt Kern 50% schneller',
    apply: (building, state) => {
      building.synHealBoost = true;
    },
  },
  // Missile + Missile = Cluster Warheads: +50% splash radius
  missile_missile: {
    id: 'missile_missile',
    name: 'Streugranaten',
    types: ['missile', 'missile'],
    color: '#ffcc00',
    description: '+50% Explosionsradius',
    apply: (building, state) => {
      building.synSplash = (building.synSplash || 1) * 1.5;
    },
  },
  // Generator + Shield = Fortress: shield gets +100 max HP
  generator_shield: {
    id: 'generator_shield',
    name: 'Festung',
    types: ['generator', 'shield'],
    color: '#66ffcc',
    description: 'Schild +100 HP',
    apply: (building, state) => {
      if (building.type === 'shield' && !building.synFortress) {
        building.synFortress = true;
        building.maxHp += 100;
        building.hp = Math.min(building.hp + 100, building.maxHp);
      }
    },
  },
};

// Recalculate all synergies (call when buildings change)
export function recalcSynergies(state) {
  const { buildings } = state;

  // Reset all synergy data on buildings
  for (const b of buildings) {
    b.synergies = [];
    b.synDmg = 1;
    b.synRate = 1;
    b.synSplash = 1;
    b.synEmpSlow = false;
    b.synOvercharge = false;
    b.synHealBoost = false;
  }

  // Build synergy links for rendering
  state.synergyLinks = [];

  // Check each synergy definition
  for (const [key, syn] of Object.entries(SYNERGIES)) {
    // Find groups of buildings that satisfy this synergy
    const neededTypes = [...syn.types];
    const groups = findSynergyGroups(buildings, neededTypes, SYNERGY_RANGE);

    for (const group of groups) {
      // Apply synergy to all buildings in group
      for (const b of group) {
        syn.apply(b, state);
        if (!b.synergies.includes(key)) {
          b.synergies.push(key);
        }
      }

      // Add visual links between buildings in group
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          state.synergyLinks.push({
            x1: group[i].x, y1: group[i].y,
            x2: group[j].x, y2: group[j].y,
            color: syn.color,
            synergyId: key,
          });
        }
      }
    }
  }

  // Overcharge cycle
  updateOvercharge(state);
}

// Find groups of nearby buildings matching the needed types
function findSynergyGroups(buildings, neededTypes, range) {
  const groups = [];
  const used = new Set();

  // For simple 2-type synergies
  if (neededTypes.length === 2 && neededTypes[0] !== neededTypes[1]) {
    for (let i = 0; i < buildings.length; i++) {
      if (used.has(i)) continue;
      const a = buildings[i];
      if (a.type !== neededTypes[0]) continue;

      for (let j = 0; j < buildings.length; j++) {
        if (used.has(j) || i === j) continue;
        const b = buildings[j];
        if (b.type !== neededTypes[1]) continue;

        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d <= range) {
          groups.push([a, b]);
          // Don't mark as used — allow one building to participate in multiple synergies
          break;
        }
      }
    }
  }
  // Same-type synergies (laser+laser, missile+missile)
  else if (neededTypes.length === 2 && neededTypes[0] === neededTypes[1]) {
    const type = neededTypes[0];
    const ofType = buildings.filter(b => b.type === type);

    for (let i = 0; i < ofType.length; i++) {
      for (let j = i + 1; j < ofType.length; j++) {
        const d = Math.hypot(ofType[i].x - ofType[j].x, ofType[i].y - ofType[j].y);
        if (d <= range) {
          groups.push([ofType[i], ofType[j]]);
          break; // One pair per building
        }
      }
    }
  }
  // Triple-type (3x generator)
  else if (neededTypes.length === 3 && neededTypes[0] === neededTypes[1] && neededTypes[1] === neededTypes[2]) {
    const type = neededTypes[0];
    const ofType = buildings.filter(b => b.type === type);

    if (ofType.length >= 3) {
      // Find clusters of 3 nearby generators
      for (let i = 0; i < ofType.length - 2; i++) {
        let cluster = [ofType[i]];
        for (let j = i + 1; j < ofType.length; j++) {
          const d = Math.hypot(ofType[i].x - ofType[j].x, ofType[i].y - ofType[j].y);
          if (d <= range) {
            cluster.push(ofType[j]);
            if (cluster.length >= 3) break;
          }
        }
        if (cluster.length >= 3) {
          groups.push(cluster.slice(0, 3));
          break;
        }
      }
    }
  }

  return groups;
}

// Overcharge: 3 generators nearby = 2x income pulse every 30s for 10s
let overchargeTimer = 0;
let overchargeActive = false;
let overchargeActiveTimer = 0;

function updateOvercharge(state) {
  // Check if any generators have overcharge
  const hasOvercharge = state.buildings.some(b => b.synOvercharge);
  state.overchargeAvailable = hasOvercharge;
}

export function updateSynergyEffects(state, dt) {
  // Overcharge cycle
  if (state.overchargeAvailable) {
    overchargeTimer = (overchargeTimer || 0) + dt;

    if (!overchargeActive && overchargeTimer >= 30) {
      overchargeActive = true;
      overchargeActiveTimer = 10;
      overchargeTimer = 0;

      // Visual feedback
      const gens = state.buildings.filter(b => b.synOvercharge);
      for (const g of gens) {
        burst(state, g.x, g.y, '#44ffaa', 12, 0.8);
      }
      floatText(state, state.core.x, state.core.y - 50, 'ÜBERLADUNG!', '#44ffaa');
    }

    if (overchargeActive) {
      overchargeActiveTimer -= dt;
      state.overchargeActive = true;
      if (overchargeActiveTimer <= 0) {
        overchargeActive = false;
        state.overchargeActive = false;
      }
    }
  } else {
    overchargeTimer = 0;
    overchargeActive = false;
    state.overchargeActive = false;
  }
}

// Get synergy bonus for a building's damage
export function getSynDmg(building) {
  return building.synDmg || 1;
}

// Get synergy bonus for a building's fire rate
export function getSynRate(building) {
  return building.synRate || 1;
}

// Get synergy bonus for a building's splash radius
export function getSynSplash(building) {
  return building.synSplash || 1;
}

// Check if building has EMP slow on hit
export function hasSynEmpSlow(building) {
  return building.synEmpSlow || false;
}

// Check if shield has heal boost
export function hasSynHealBoost(building) {
  return building.synHealBoost || false;
}

// Get active synergies summary for HUD
export function getActiveSynergies(state) {
  const active = new Set();
  for (const b of state.buildings) {
    for (const syn of (b.synergies || [])) {
      active.add(syn);
    }
  }
  return [...active].map(id => SYNERGIES[id]).filter(Boolean);
}
