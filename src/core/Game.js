import { BUILDINGS, UPGRADES } from '../config/buildings.js';
import { TILE, snap, VERSION } from './constants.js';
import { Renderer } from './Renderer.js';
import { Hud } from '../ui/Hud.js';
import { updateResources } from '../systems/ResourceSystem.js';
import { updateWaves, spawnWave } from '../systems/WaveSystem.js';
import { updateCombat, orbitalStrike } from '../systems/CombatSystem.js';
import { updateBossAbilities, updateBossEffects } from '../systems/BossSystem.js';
import { updateParticles, burst } from '../systems/ParticleSystem.js';
import { playBuild, playOrbital, playUpgrade, playVictory, playGameOver } from '../systems/AudioSystem.js';

export class Game {
  constructor(canvas, hudElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = new Hud(hudElement);
    this.renderer = new Renderer(this.ctx);
    this.width = 0;
    this.height = 0;
    this.lastTime = 0;
    this.state = this.createState();

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
    canvas.addEventListener('click', () => this.onClick());

    this.resize();
  }

  createState() {
    return {
      version: VERSION,
      mode: 'menu',
      selected: 'laser',
      energy: 250,
      income: 8,
      data: 0,
      score: 0,
      core: { x: snap(window.innerWidth * 0.32), y: snap(window.innerHeight * 0.5), hp: 200, maxHp: 200 },
      buildings: [],
      enemies: [],
      projectiles: [],
      particles: [],
      texts: [],
      wave: 0,
      waveTimer: 2,
      waveBudget: 0,
      isBossWave: false,
      kills: 0,
      paused: false,
      mouse: { x: 0, y: 0, gridX: 0, gridY: 0 },
      message: '',
      msgTimer: 0,
      // Upgrades
      upgDmg: 1,
      upgRate: 1,
      upgRange: 1,
      upgIncome: 1,
      upgGen: 0,
      // Combat
      killStreak: 0,
      killTimer: 0,
      bestStreak: 0,
      // Orbital
      orbitalCd: 0,
      // Upgrade screen
      upgChoices: [],
      // Effects
      shake: 0,
      // Win condition
      winWave: 30,
      // Boss system
      gameTime: 0,
      currentBossType: null,
      currentBossName: null,
      empRings: [],
      healPulses: [],
    };
  }

  boot() {
    requestAnimationFrame(this.frame);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.state.core.x = snap(this.width * 0.32);
    this.state.core.y = snap(this.height * 0.5);
  }

  startGame() {
    this.state = this.createState();
    this.state.mode = 'playing';
    this.state.message = 'Baue Generatoren für Einkommen, dann Laser!';
    this.state.msgTimer = 5;
    spawnWave(this.state);
  }

  canBuild(type, x, y) {
    const spec = BUILDINGS[type];
    if (!spec || this.state.energy < spec.cost) return false;
    if (Math.hypot(x - this.state.core.x, y - this.state.core.y) < TILE * 1.5) return false;
    return !this.state.buildings.some((b) => b.x === x && b.y === y);
  }

  build(type, x, y) {
    if (!this.canBuild(type, x, y)) return;
    const spec = BUILDINGS[type];
    this.state.energy -= spec.cost;
    const hp = spec.hp || (type === 'generator' ? 80 : type === 'shield' ? 220 : 100);
    this.state.buildings.push({ type, x, y, cooldown: 0, hp, maxHp: hp });
    burst(this.state, x, y, spec.color, 22);
    playBuild();
  }

  openUpgrades() {
    if (this.state.data < 20) return;
    this.state.mode = 'upgrading';
    this.state.upgChoices = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 4);
  }

  buyUpgrade(i) {
    const u = this.state.upgChoices[i];
    if (!u || this.state.data < u.cost) return;
    this.state.data -= u.cost;
    u.apply(this.state);
    this.state.mode = 'playing';
    this.state.upgChoices = [];
    playUpgrade();
  }

  onMouseMove(event) {
    this.state.mouse.x = event.clientX;
    this.state.mouse.y = event.clientY;
    this.state.mouse.gridX = snap(event.clientX);
    this.state.mouse.gridY = snap(event.clientY);
  }

  onClick() {
    if (this.state.mode === 'menu') {
      this.startGame();
      return;
    }
    if (this.state.mode === 'playing') {
      this.build(this.state.selected, this.state.mouse.gridX, this.state.mouse.gridY);
    }
  }

  onKeyDown(event) {
    const s = this.state;

    if (event.key === 'Enter' && s.mode === 'menu') this.startGame();
    if (event.key === 'r' || event.key === 'R') this.startGame();

    if (event.code === 'Space') {
      event.preventDefault();
      if (s.mode === 'playing') s.paused = !s.paused;
      else if (s.mode === 'upgrading') { s.mode = 'playing'; s.upgChoices = []; }
    }

    if (event.key === 'Escape' && s.mode === 'upgrading') {
      s.mode = 'playing'; s.upgChoices = [];
    }

    // Upgrade screen
    if (s.mode === 'upgrading') {
      if (event.key >= '1' && event.key <= '6') this.buyUpgrade(+event.key - 1);
      return;
    }

    // Building selection
    if (event.key === '1') s.selected = 'laser';
    if (event.key === '2') s.selected = 'missile';
    if (event.key === '3') s.selected = 'generator';
    if (event.key === '4') s.selected = 'shield';
    if (event.key === '5') s.selected = 'sniper';

    // Orbital strike
    if (event.key === 'q' || event.key === 'Q') {
      orbitalStrike(s);
      playOrbital();
    }

    // Upgrades
    if (event.key === 'u' || event.key === 'U') this.openUpgrades();
  }

  update(dt) {
    if (this.state.msgTimer > 0) this.state.msgTimer -= dt;
    if (this.state.orbitalCd > 0) this.state.orbitalCd -= dt;
    this.state.shake = Math.max(0, this.state.shake - 30 * dt);

    if (this.state.mode !== 'playing' || this.state.paused) return;

    updateResources(this.state, dt);
    updateWaves(this.state, this.width, this.height, dt);
    updateCombat(this.state, dt);
    updateBossAbilities(this.state, dt);
    updateBossEffects(this.state, dt);
    updateParticles(this.state, dt);

    if (this.state.killStreak > (this.state.bestStreak || 0)) this.state.bestStreak = this.state.killStreak;

    if (this.state.core.hp <= 0) {
      this.state.core.hp = 0;
      this.state.mode = 'gameover';
      burst(this.state, this.state.core.x, this.state.core.y, '#ff345d', 80, 2);
      this.state.shake = 25;
      playGameOver();
    }

    // WIN condition: survive winWave waves
    if (this.state.wave >= this.state.winWave && this.state.enemies.length === 0 && this.state.waveBudget === 0) {
      this.state.mode = 'victory';
      burst(this.state, this.state.core.x, this.state.core.y, '#00ff9d', 60, 2);
      this.state.shake = 10;
      playVictory();
    }
  }

  draw() {
    const s = this.state;
    this.ctx.save();
    if (s.shake > 0) this.ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    this.renderer.draw(s, this.width, this.height, (type, x, y) => this.canBuild(type, x, y));
    this.ctx.restore();
    this.hud.render(s, BUILDINGS);
  }

  frame(time = 0) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.frame);
  }
}
