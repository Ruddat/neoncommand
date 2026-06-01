import './style.css';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

const TILE = 48;
const BUILDINGS = {
  laser: { label: 'Laser Turret', key: '1', cost: 35, range: 210, fireRate: 0.22, damage: 14, color: '#ff2bd6' },
  missile: { label: 'Missile Turret', key: '2', cost: 70, range: 280, fireRate: 0.08, damage: 42, color: '#ffb000' },
  generator: { label: 'Generator', key: '3', cost: 55, range: 0, fireRate: 0, damage: 0, color: '#00ff9d' },
};

let width = 0;
let height = 0;
let state;
let lastTime = 0;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  if (state) {
    state.core.x = snap(width * 0.32);
    state.core.y = snap(height * 0.5);
  }
}

function snap(value) {
  return Math.floor(value / TILE) * TILE + TILE / 2;
}

function createState() {
  return {
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

function startGame() {
  state = createState();
  state.mode = 'playing';
  state.message = 'Build generators and turrets. Hold the line.';
  spawnWave();
}

function resetGame() {
  startGame();
}

function canBuild(type, x, y) {
  const spec = BUILDINGS[type];
  if (!spec || state.energy < spec.cost) return false;
  if (Math.hypot(x - state.core.x, y - state.core.y) < TILE * 1.4) return false;
  if (state.buildings.some((building) => building.x === x && building.y === y)) return false;
  return true;
}

function build(type, x, y) {
  if (!canBuild(type, x, y)) return;
  const spec = BUILDINGS[type];
  state.energy -= spec.cost;
  state.buildings.push({ type, x, y, cooldown: 0, hp: type === 'generator' ? 65 : 90 });
  burst(x, y, spec.color, 20);
}

function spawnWave() {
  state.wave += 1;
  state.waveBudget = 6 + state.wave * 3;
  state.waveTimer = 0;
  state.message = `Wave ${state.wave} incoming`;
}

function spawnEnemy() {
  const lane = Math.floor(Math.random() * 5);
  const y = height * (0.18 + lane * 0.16) + (Math.random() - 0.5) * 35;
  const heavy = state.wave > 3 && Math.random() < 0.18;
  state.enemies.push({
    x: width + 80,
    y,
    hp: heavy ? 140 + state.wave * 8 : 52 + state.wave * 5,
    maxHp: heavy ? 140 + state.wave * 8 : 52 + state.wave * 5,
    speed: heavy ? 32 + state.wave * 1.2 : 48 + state.wave * 1.8,
    size: heavy ? 18 : 12,
    reward: heavy ? 14 : 7,
  });
}

function fire(building, target) {
  const spec = BUILDINGS[building.type];
  state.projectiles.push({
    x: building.x,
    y: building.y,
    target,
    speed: building.type === 'missile' ? 360 : 620,
    damage: spec.damage,
    color: spec.color,
    radius: building.type === 'missile' ? 74 : 0,
  });
}

function burst(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 150;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.5,
      maxLife: 0.85,
      color,
    });
  }
}

function update(dt) {
  if (state.mode !== 'playing' || state.paused) return;

  const generatorCount = state.buildings.filter((building) => building.type === 'generator').length;
  state.income = 7 + generatorCount * 4;
  state.energy += state.income * dt;
  state.data += (1 + generatorCount * 0.4) * dt;

  state.waveTimer += dt;
  if (state.waveBudget > 0 && state.waveTimer > Math.max(0.18, 0.75 - state.wave * 0.025)) {
    spawnEnemy();
    state.waveBudget -= 1;
    state.waveTimer = 0;
  }
  if (state.waveBudget === 0 && state.enemies.length === 0) {
    state.waveTimer += dt;
    if (state.waveTimer > 4) spawnWave();
  }

  updateBuildings(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateParticles(dt);

  if (state.core.hp <= 0) {
    state.core.hp = 0;
    state.mode = 'gameover';
    state.message = 'Command core destroyed';
  }
}

function updateBuildings(dt) {
  for (const building of state.buildings) {
    if (building.type === 'generator') continue;
    const spec = BUILDINGS[building.type];
    building.cooldown -= dt;
    const target = state.enemies
      .filter((enemy) => Math.hypot(enemy.x - building.x, enemy.y - building.y) <= spec.range)
      .sort((a, b) => Math.hypot(a.x - state.core.x, a.y - state.core.y) - Math.hypot(b.x - state.core.x, b.y - state.core.y))[0];
    if (target && building.cooldown <= 0) {
      fire(building, target);
      building.cooldown = 1 / spec.fireRate;
    }
  }
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    const dx = state.core.x - enemy.x;
    const dy = state.core.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / distance) * enemy.speed * dt;
    enemy.y += (dy / distance) * enemy.speed * dt;

    if (distance < 38) {
      state.core.hp -= enemy.size > 14 ? 14 : 7;
      burst(enemy.x, enemy.y, '#ff345d', 24);
      state.enemies.splice(i, 1);
      continue;
    }

    if (enemy.hp <= 0) {
      state.energy += enemy.reward;
      state.kills += 1;
      burst(enemy.x, enemy.y, '#00d9ff', 18);
      state.enemies.splice(i, 1);
    }
  }
}

function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const projectile = state.projectiles[i];
    if (!state.enemies.includes(projectile.target)) {
      state.projectiles.splice(i, 1);
      continue;
    }
    const dx = projectile.target.x - projectile.x;
    const dy = projectile.target.y - projectile.y;
    const distance = Math.hypot(dx, dy) || 1;
    projectile.x += (dx / distance) * projectile.speed * dt;
    projectile.y += (dy / distance) * projectile.speed * dt;

    if (distance < 16) {
      if (projectile.radius > 0) {
        for (const enemy of state.enemies) {
          const splash = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
          if (splash <= projectile.radius) enemy.hp -= projectile.damage * (1 - splash / projectile.radius * 0.45);
        }
        burst(projectile.x, projectile.y, projectile.color, 28);
      } else {
        projectile.target.hp -= projectile.damage;
        burst(projectile.x, projectile.y, projectile.color, 6);
      }
      state.projectiles.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const particle = state.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    if (particle.life <= 0) state.particles.splice(i, 1);
  }
}

function draw() {
  drawBackground();
  if (state.mode !== 'menu') {
    drawPreview();
    drawCore();
    drawBuildings();
    drawEnemies();
    drawProjectiles();
    drawParticles();
  }
  if (state.mode === 'menu') drawMenu();
  if (state.mode === 'gameover') drawGameOver();
  drawHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#040714');
  gradient.addColorStop(0.55, '#071329');
  gradient.addColorStop(1, '#03040a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(0,217,255,.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,43,214,.08)';
  for (let i = 0; i < 18; i++) {
    const x = (i * 157) % width;
    const buildingHeight = 80 + ((i * 71) % 190);
    ctx.fillRect(x, height - buildingHeight, 34 + (i % 4) * 18, buildingHeight);
  }
}

function drawPreview() {
  const spec = BUILDINGS[state.selected];
  const valid = canBuild(state.selected, state.mouse.gridX, state.mouse.gridY);
  ctx.globalAlpha = valid ? 0.7 : 0.28;
  ctx.fillStyle = valid ? spec.color : '#ff345d';
  ctx.fillRect(state.mouse.gridX - 18, state.mouse.gridY - 18, 36, 36);
  if (spec.range) {
    ctx.strokeStyle = spec.color;
    ctx.beginPath();
    ctx.arc(state.mouse.gridX, state.mouse.gridY, spec.range, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCore() {
  ctx.save();
  ctx.shadowColor = '#00d9ff';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#00d9ff';
  ctx.beginPath();
  ctx.arc(state.core.x, state.core.y, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,.65)';
  ctx.fillRect(state.core.x - 44, state.core.y + 48, 88, 8);
  ctx.fillStyle = '#00ff9d';
  ctx.fillRect(state.core.x - 44, state.core.y + 48, 88 * (state.core.hp / state.core.maxHp), 8);
}

function drawBuildings() {
  for (const building of state.buildings) {
    const spec = BUILDINGS[building.type];
    ctx.save();
    ctx.shadowColor = spec.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = spec.color;
    if (building.type === 'generator') {
      ctx.beginPath();
      ctx.moveTo(building.x, building.y - 20);
      ctx.lineTo(building.x + 20, building.y + 16);
      ctx.lineTo(building.x - 20, building.y + 16);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(building.x - 18, building.y - 18, 36, 36);
      ctx.fillStyle = '#050816';
      ctx.fillRect(building.x - 8, building.y - 8, 16, 16);
    }
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    ctx.save();
    ctx.shadowColor = '#ff345d';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff345d';
    ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,.7)';
    ctx.fillRect(enemy.x - 18, enemy.y - enemy.size - 12, 36, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(enemy.x - 18, enemy.y - enemy.size - 12, 36 * Math.max(0, enemy.hp / enemy.maxHp), 4);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius > 0 ? 6 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 3, 3);
    ctx.globalAlpha = 1;
  }
}

function drawMenu() {
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00d9ff';
  ctx.font = '800 86px Arial';
  ctx.fillText('NEON', width / 2, height / 2 - 70);
  ctx.fillStyle = '#ff2bd6';
  ctx.font = '800 64px Arial';
  ctx.fillText('COMMAND', width / 2, height / 2 - 10);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Arial';
  ctx.fillText('Strategize. Build. Defend. Conquer.', width / 2, height / 2 + 38);
  ctx.font = '18px Arial';
  ctx.fillText('Enter startet die Mission', width / 2, height / 2 + 92);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,.65)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff345d';
  ctx.font = '800 70px Arial';
  ctx.fillText('CORE DESTROYED', width / 2, height / 2 - 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Arial';
  ctx.fillText(`Waves survived: ${state.wave} · Kills: ${state.kills}`, width / 2, height / 2 + 18);
  ctx.fillText('R für Neustart', width / 2, height / 2 + 64);
  ctx.textAlign = 'left';
}

function drawHud() {
  if (state.mode === 'menu') {
    hud.innerHTML = '<strong>NEON COMMAND</strong><br>Press Enter';
    return;
  }
  const selected = BUILDINGS[state.selected];
  hud.innerHTML = `
    <div class="hud-title">NEON COMMAND</div>
    <div>Wave: <b>${state.wave}</b> · Kills: <b>${state.kills}</b></div>
    <div>Energy: <b>${Math.floor(state.energy)}</b> · Income: <b>${state.income.toFixed(1)}/s</b> · Data: <b>${Math.floor(state.data)}</b></div>
    <div>Core: <b>${Math.floor(state.core.hp)}%</b></div>
    <hr>
    <div class="build ${state.selected === 'laser' ? 'active' : ''}">[1] Laser Turret - ${BUILDINGS.laser.cost}</div>
    <div class="build ${state.selected === 'missile' ? 'active' : ''}">[2] Missile Turret - ${BUILDINGS.missile.cost}</div>
    <div class="build ${state.selected === 'generator' ? 'active' : ''}">[3] Generator - ${BUILDINGS.generator.cost}</div>
    <div class="small">Selected: ${selected.label}</div>
  `;
}

canvas.addEventListener('mousemove', (event) => {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  state.mouse.gridX = snap(event.clientX);
  state.mouse.gridY = snap(event.clientY);
});

canvas.addEventListener('click', () => {
  if (state.mode === 'menu') {
    startGame();
    return;
  }
  if (state.mode === 'playing') build(state.selected, state.mouse.gridX, state.mouse.gridY);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && state.mode === 'menu') startGame();
  if (event.key === 'r' || event.key === 'R') resetGame();
  if (event.code === 'Space') state.paused = !state.paused;
  if (event.key === '1') state.selected = 'laser';
  if (event.key === '2') state.selected = 'missile';
  if (event.key === '3') state.selected = 'generator';
});

function frame(time = 0) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

state = createState();
window.addEventListener('resize', resize);
resize();
frame();
