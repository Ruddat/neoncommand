import { BUILDINGS } from '../config/buildings.js';
import { TILE, snap, VERSION } from './constants.js';
import { Renderer } from './Renderer.js';
import { Hud } from '../ui/Hud.js';
import { updateResources } from '../systems/ResourceSystem.js';
import { updateWaves, spawnWave } from '../systems/WaveSystem.js';
import { updateCombat } from '../systems/CombatSystem.js';
import { updateParticles, burst } from '../systems/ParticleSystem.js';

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
      energy: 180,
      income: 7,
      data: 0,
      core: { x: snap(window.innerWidth * 0.32), y: snap(window.innerHeight * 0.5), hp: 100, maxHp: 100 },
      buildings: [],
      enemies: [],
      projectiles: [],
      particles: [],
      wave: 0,
      waveTimer: 2,
      waveBudget: 0,
      kills: 0,
      paused: false,
      mouse: { x: 0, y: 0, gridX: 0, gridY: 0 },
      message: 'Press Enter to start command uplink',
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
    this.state.message = 'Build generators and turrets. Hold the line.';
    spawnWave(this.state);
  }

  resetGame() {
    this.startGame();
  }

  canBuild(type, x, y) {
    const spec = BUILDINGS[type];
    if (!spec || this.state.energy < spec.cost) return false;
    if (Math.hypot(x - this.state.core.x, y - this.state.core.y) < TILE * 1.4) return false;
    return !this.state.buildings.some((building) => building.x === x && building.y === y);
  }

  build(type, x, y) {
    if (!this.canBuild(type, x, y)) return;
    const spec = BUILDINGS[type];
    this.state.energy -= spec.cost;
    this.state.buildings.push({ type, x, y, cooldown: 0, hp: type === 'generator' ? 65 : 90 });
    burst(this.state, x, y, spec.color, 20);
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
    if (event.key === 'Enter' && this.state.mode === 'menu') this.startGame();
    if (event.key === 'r' || event.key === 'R') this.resetGame();
    if (event.code === 'Space') this.state.paused = !this.state.paused;
    if (event.key === '1') this.state.selected = 'laser';
    if (event.key === '2') this.state.selected = 'missile';
    if (event.key === '3') this.state.selected = 'generator';
  }

  update(dt) {
    if (this.state.mode !== 'playing' || this.state.paused) return;
    updateResources(this.state, dt);
    updateWaves(this.state, this.width, this.height, dt);
    updateCombat(this.state, dt);
    updateParticles(this.state, dt);

    if (this.state.core.hp <= 0) {
      this.state.core.hp = 0;
      this.state.mode = 'gameover';
      this.state.message = 'Command core destroyed';
    }
  }

  draw() {
    this.renderer.draw(this.state, this.width, this.height, (type, x, y) => this.canBuild(type, x, y));
    this.hud.render(this.state, BUILDINGS);
  }

  frame(time = 0) {
    const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.frame);
  }
}
