// ====== GAME STATE ======
import { NATIONS, ALLY_MAP, WIN_ROUNDS } from './data.js';

export function createState() {
  return {
    mode: 'menu',
    nation: null,
    lastT: 0,
    selected: 'factory',
    mouseX: 0,
    mouseY: 0,
    shake: 0,
    flash: 0,
    flashColor: '',
    money: 0,
    income: 0,
    mil: 0,
    tech: 0,
    defense: 0,
    offense: 0,
    buildings: [],
    ai: {},
    hostility: {},
    allies: [],
    enemyNations: [],
    attackMode: false,
    diplomacyMode: false,
    turn: 0,
    turnTimer: 0,
    turnLength: 12,
    particles: [],
    texts: [],
    threats: [],
    attackScene: null,
    sceneTimer: 0,
    log: [],
    aiBuildAnims: [],
    aiMissiles: [],
    aiExplosions: [],
    // WOW EFFECTS
    shockwaves: [],
    mushroomClouds: [],
    banner: null,
    bannerTimer: 0,
    defcon: 5,
    slowMo: 0,
    slowMoFactor: 1,
    empFlashes: [],
    smokeTrails: [],
    screenCrack: null,
    scanlineOffset: 0,
    attackCooldown: 0,
    // Scheduled events (replaces setTimeout)
    scheduledEvents: [],
    // Win tracking
    won: false,
  };
}

export function selectNation(G, key) {
  const n = NATIONS[key];
  G.nation = key;
  G.money = n.money;
  G.mil = n.mil * 2;
  G.income = 10 + n.eco * 2;
  G.defense = n.mil;
  G.offense = 0;
  G.tech = 0;
  G.buildings = [];
  G.mode = 'playing';
  G.turn = 0;
  G.turnTimer = 0;
  G.ai = {};
  G.hostility = {};
  G.aiBuildAnims = [];
  G.aiMissiles = [];
  G.aiExplosions = [];
  G.shockwaves = [];
  G.mushroomClouds = [];
  G.empFlashes = [];
  G.smokeTrails = [];
  G.banner = null;
  G.bannerTimer = 0;
  G.defcon = 5;
  G.slowMo = 0;
  G.slowMoFactor = 1;
  G.attackCooldown = 0;
  G.screenCrack = null;
  G.scheduledEvents = [];
  G.won = false;

  for (const k of Object.keys(NATIONS)) {
    if (k !== key) G.ai[k] = createAIState(k);
    G.hostility[k] = k === key ? 0 : 10 + (Math.random() * 20);
  }
  G.allies = ALLY_MAP[key] || [];
  G.enemyNations = Object.keys(NATIONS).filter(k => k !== key);
  G.allies.forEach(a => G.hostility[a] = Math.max(0, G.hostility[a] - 15));
}

function createAIState(key) {
  const n = NATIONS[key];
  return {
    money: n.money,
    income: 10 + n.eco * 2,
    mil: n.mil * 2,
    tech: 0,
    defense: n.mil,
    offense: 0,
    buildings: [],
    buildTimer: 0,
    buildRate: n.buildRate,
    personality: n.personality,
    upgradeTimer: 0,
    upgradeCooldown: 20,
    lastBuildType: null,
    totalBuilt: 0,
  };
}

export { createAIState };
