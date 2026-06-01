import './style.css';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

const TILE = 48;
const BUILDINGS = {
  laser: { label: 'Laser Turret', key: '1', cost: 35, range: 230, fireRate: 0.33, damage: 18, color: '#ff2bd6', radius: 0 },
  missile: { label: 'Missile Turret', key: '2', cost: 75, range: 300, fireRate: 0.11, damage: 52, color: '#ffb000', radius: 86 },
  generator: { label: 'Generator', key: '3', cost: 55, range: 0, fireRate: 0, damage: 0, color: '#00ff9d', radius: 0 },
  railgun: { label: 'Railgun', key: '4', cost: 120, range: 390, fireRate: 0.06, damage: 130, color: '#7d5cff', radius: 0 },
};

let width = 0;
let height = 0;
let state;
let lastTime = 0;

function snap(value) {
  return Math.floor(value / TILE) * TILE + TILE / 2;
}

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  if (state) {
    state.core.x = snap(width * 0.26);
    state.core.y = snap(height * 0.5);
    state.path = createPath();
  }
}

function createPath() {
  return [
    { x: width + 80, y: snap(height * 0.22) },
    { x: snap(width * 0.78), y: snap(height * 0.22) },
    { x: snap(width * 0.78), y: snap(height * 0.76) },
    { x: snap(width * 0.54), y: snap(height * 0.76) },
    { x: snap(width * 0.54), y: snap(height * 0.38) },
    { x: snap(width * 0.36), y: snap(height * 0.38) },
    { x: snap(width * 0.26), y: snap(height * 0.5) },
  ];
}

function createState() {
  return {
    mode: 'menu',
    selected: 'laser',
    energy: 210,
    income: 9,
    data: 0,
    score: 0,
    combo: 1,
    comboTimer: 0,
    screenShake: 0,
    core: { x: snap(window.innerWidth * 0.26), y: snap(window.innerHeight * 0.5), hp: 100, maxHp: 100 },
    buildings: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    path: createPath(),
    wave: 0,
    waveTimer: 2,
    waveBudget: 0,
    kills: 0,
    paused: false,
    mouse: { x: 0, y: 0, gridX: 0, gridY: 0 },
    message: 'Press Enter to start command uplink',
    messageTimer: 0,
  };
}

function startGame() {
  state = createState();
  state.mode = 'playing';
  state.message = 'Build fast. The first assault is already moving.';
  state.messageTimer = 3;
  spawnWave();
}

function canBuild(type, x, y) {
  const spec = BUILDINGS[type];
  if (!spec || state.energy < spec.cost) return false;
  if (Math.hypot(x - state.core.x, y - state.core.y) < TILE * 1.45) return false;
  if (state.buildings.some((building) => building.x === x && building.y === y)) return false;
  for (let i = 1; i < state.path.length; i++) {
    const a = state.path[i - 1];
    const b = state.path[i];
    if (distanceToSegment(x, y, a.x, a.y, b.x, b.y) < 34) return false;
  }
  return true;
}

function build(type, x, y) {
  if (!canBuild(type, x, y)) {
    state.screenShake = Math.max(state.screenShake, 5);
    addText(x, y, 'BLOCKED', '#ff345d');
    return;
  }
  const spec = BUILDINGS[type];
  state.energy -= spec.cost;
  state.buildings.push({ type, x, y, cooldown: 0, hp: type === 'generator' ? 65 : 90, pulse: 0 });
  burst(x, y, spec.color, 26);
  addText(x, y - 20, spec.label, spec.color);
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function spawnWave() {
  state.wave += 1;
  state.waveBudget = 7 + state.wave * 4;
  state.waveTimer = 0;
  state.message = `WAVE ${state.wave} - INCOMING`;
  state.messageTimer = 2.5;
  state.energy += 28 + state.wave * 4;
  burst(width * 0.86, height * 0.22, '#ff345d', 50);
}

function spawnEnemy() {
  const roll = Math.random();
  const heavy = state.wave >= 3 && roll > 0.82;
  const runner = state.wave >= 2 && roll < 0.28;
  const boss = state.wave % 5 === 0 && state.waveBudget === 1;
  const template = boss
    ? { hp: 520 + state.wave * 38, speed: 34, size: 26, reward: 70, color: '#ffffff', name: 'COREBREAKER' }
    : heavy
      ? { hp: 160 + state.wave * 15, speed: 37 + state.wave, size: 18, reward: 18, color: '#ff8a00', name: 'TANK' }
      : runner
        ? { hp: 44 + state.wave * 4, speed: 92 + state.wave * 3, size: 10, reward: 9, color: '#00ff9d', name: 'RUNNER' }
        : { hp: 72 + state.wave * 7, speed: 58 + state.wave * 2, size: 13, reward: 11, color: '#ff345d', name: 'DRONE' };

  state.enemies.push({
    x: state.path[0].x,
    y: state.path[0].y + (Math.random() - 0.5) * 18,
    targetNode: 1,
    hp: template.hp,
    maxHp: template.hp,
    speed: template.speed,
    size: template.size,
    reward: template.reward,
    color: template.color,
    name: template.name,
    wobble: Math.random() * Math.PI * 2,
  });
}

function fire(building, target) {
  const spec = BUILDINGS[building.type];
  state.projectiles.push({
    x: building.x,
    y: building.y,
    target,
    speed: building.type === 'missile' ? 390 : building.type === 'railgun' ? 900 : 680,
    damage: spec.damage,
    color: spec.color,
    radius: spec.radius,
    trail: [],
    type: building.type,
  });
  building.pulse = 0.22;
}

function burst(x, y, color, count = 12, power = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (50 + Math.random() * 210) * power;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.65,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function addText(x, y, text, color = '#ffffff') {
  state.floatingTexts.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
}

function update(dt) {
  if (state.mode !== 'playing' || state.paused) return;

  state.screenShake = Math.max(0, state.screenShake - 30 * dt);
  state.comboTimer -= dt;
  if (state.comboTimer <= 0) state.combo = 1;
  state.messageTimer -= dt;

  const generatorCount = state.buildings.filter((building) => building.type === 'generator').length;
  state.income = 9 + generatorCount * 5;
  state.energy += state.income * dt;
  state.data += (1 + generatorCount * 0.55) * dt;

  state.waveTimer += dt;
  const spawnRate = Math.max(0.13, 0.58 - state.wave * 0.018);
  if (state.waveBudget > 0 && state.waveTimer > spawnRate) {
    spawnEnemy();
    state.waveBudget -= 1;
    state.waveTimer = 0;
  }
  if (state.waveBudget === 0 && state.enemies.length === 0) {
    state.waveTimer += dt;
    if (state.waveTimer > 3.2) spawnWave();
  }

  updateBuildings(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateFloatingTexts(dt);

  if (state.core.hp <= 0) {
    state.core.hp = 0;
    state.mode = 'gameover';
    state.message = 'Command core destroyed';
    state.screenShake = 18;
  }
}

function updateBuildings(dt) {
  for (const building of state.buildings) {
    building.cooldown -= dt;
    building.pulse = Math.max(0, building.pulse - dt);
    if (building.type === 'generator') continue;
    const spec = BUILDINGS[building.type];
    const target = state.enemies
      .filter((enemy) => Math.hypot(enemy.x - building.x, enemy.y - building.y) <= spec.range)
      .sort((a, b) => b.targetNode - a.targetNode || Math.hypot(a.x - state.core.x, a.y - state.core.y) - Math.hypot(b.x - state.core.x, b.y - state.core.y))[0];
    if (target && building.cooldown <= 0) {
      fire(building, target);
      building.cooldown = 1 / spec.fireRate;
    }
  }
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    enemy.wobble += dt * 7;
    const target = state.path[enemy.targetNode];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / distance) * enemy.speed * dt;
    enemy.y += (dy / distance) * enemy.speed * dt + Math.sin(enemy.wobble) * 0.18;

    if (distance < 12) {
      enemy.targetNode += 1;
      if (enemy.targetNode >= state.path.length) {
        const damage = enemy.name === 'COREBREAKER' ? 38 : enemy.size > 17 ? 16 : 8;
        state.core.hp -= damage;
        state.screenShake = Math.max(state.screenShake, enemy.name === 'COREBREAKER' ? 26 : 12);
        burst(enemy.x, enemy.y, enemy.color, 36, 1.35);
        addText(state.core.x, state.core.y - 54, `-${damage} CORE`, '#ff345d');
        state.enemies.splice(i, 1);
        continue;
      }
    }

    if (enemy.hp <= 0) {
      const gained = Math.floor(enemy.reward * state.combo);
      state.energy += gained;
      state.score += Math.floor(100 * state.combo + enemy.reward * 8);
      state.combo = Math.min(8, state.combo + 0.15);
      state.comboTimer = 2.8;
      state.kills += 1;
      state.screenShake = Math.max(state.screenShake, enemy.name === 'COREBREAKER' ? 22 : 4);
      burst(enemy.x, enemy.y, enemy.color, enemy.name === 'COREBREAKER' ? 90 : 24, enemy.name === 'COREBREAKER' ? 1.8 : 1);
      addText(enemy.x, enemy.y - 22, `+${gained}`, '#00ff9d');
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

    projectile.trail.push({ x: projectile.x, y: projectile.y });
    if (projectile.trail.length > 8) projectile.trail.shift();

    const dx = projectile.target.x - projectile.x;
    const dy = projectile.target.y - projectile.y;
    const distance = Math.hypot(dx, dy) || 1;
    projectile.x += (dx / distance) * projectile.speed * dt;
    projectile.y += (dy / distance) * projectile.speed * dt;

    if (distance < 18) {
      if (projectile.type === 'railgun') {
        const angle = Math.atan2(dy, dx);
        for (const enemy of state.enemies) {
          const lineDistance = distanceToSegment(enemy.x, enemy.y, projectile.x - Math.cos(angle) * 500, projectile.y - Math.sin(angle) * 500, projectile.x + Math.cos(angle) * 500, projectile.y + Math.sin(angle) * 500);
          if (lineDistance < 20) enemy.hp -= projectile.damage;
        }
        state.screenShake = Math.max(state.screenShake, 8);
        burst(projectile.x, projectile.y, projectile.color, 24, 1.2);
      } else if (projectile.radius > 0) {
        for (const enemy of state.enemies) {
          const splash = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
          if (splash <= projectile.radius) enemy.hp -= projectile.damage * (1 - splash / projectile.radius * 0.4);
        }
        state.screenShake = Math.max(state.screenShake, 7);
        burst(projectile.x, projectile.y, projectile.color, 36, 1.15);
      } else {
        projectile.target.hp -= projectile.damage;
        burst(projectile.x, projectile.y, projectile.color, 8);
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
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= dt;
    if (particle.life <= 0) state.particles.splice(i, 1);
  }
}

function updateFloatingTexts(dt) {
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const text = state.floatingTexts[i];
    text.y -= 36 * dt;
    text.life -= dt;
    if (text.life <= 0) state.floatingTexts.splice(i, 1);
  }
}

function draw() {
  ctx.save();
  if (state.screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
  }
  drawBackground();
  if (state.mode !== 'menu') {
    drawPath();
    drawPreview();
    drawCore();
    drawBuildings();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawFloatingTexts();
  }
  if (state.mode === 'menu') drawMenu();
  if (state.mode === 'gameover') drawGameOver();
  ctx.restore();
  drawWaveBanner();
  drawHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#040714');
  gradient.addColorStop(0.55, '#071329');
  gradient.addColorStop(1, '#03040a');
  ctx.fillStyle = gradient;
  ctx.fillRect(-20, -20, width + 40, height + 40);

  ctx.strokeStyle = 'rgba(0,217,255,.09)';
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
  for (let i = 0; i < 22; i++) {
    const x = (i * 157) % width;
    const buildingHeight = 80 + ((i * 71) % 210);
    ctx.fillRect(x, height - buildingHeight, 34 + (i % 4) * 18, buildingHeight);
  }
}

function drawPath() {
  ctx.save();
  ctx.lineWidth = 34;
  ctx.strokeStyle = 'rgba(255,52,93,.16)';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(state.path[0].x, state.path[0].y);
  for (const node of state.path.slice(1)) ctx.lineTo(node.x, node.y);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,52,93,.75)';
  ctx.setLineDash([18, 16]);
  ctx.beginPath();
  ctx.moveTo(state.path[0].x, state.path[0].y);
  for (const node of state.path.slice(1)) ctx.lineTo(node.x, node.y);
  ctx.stroke();
  ctx.restore();
}

function drawPreview() {
  if (state.mode !== 'playing') return;
  const spec = BUILDINGS[state.selected];
  const valid = canBuild(state.selected, state.mouse.gridX, state.mouse.gridY);
  ctx.globalAlpha = valid ? 0.72 : 0.25;
  ctx.fillStyle = valid ? spec.color : '#ff345d';
  ctx.fillRect(state.mouse.gridX - 19, state.mouse.gridY - 19, 38, 38);
  if (spec.range) {
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.mouse.gridX, state.mouse.gridY, spec.range, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCore() {
  ctx.save();
  ctx.shadowColor = '#00d9ff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#00d9ff';
  ctx.beginPath();
  ctx.arc(state.core.x, state.core.y, 39, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,.72)';
  ctx.fillRect(state.core.x - 50, state.core.y + 52, 100, 9);
  ctx.fillStyle = state.core.hp > 40 ? '#00ff9d' : '#ff345d';
  ctx.fillRect(state.core.x - 50, state.core.y + 52, 100 * (state.core.hp / state.core.maxHp), 9);
}

function drawBuildings() {
  for (const building of state.buildings) {
    const spec = BUILDINGS[building.type];
    ctx.save();
    ctx.shadowColor = spec.color;
    ctx.shadowBlur = 18 + building.pulse * 60;
    ctx.fillStyle = spec.color;
    if (building.type === 'generator') {
      ctx.beginPath();
      ctx.moveTo(building.x, building.y - 22);
      ctx.lineTo(building.x + 22, building.y + 17);
      ctx.lineTo(building.x - 22, building.y + 17);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.stroke();
    } else if (building.type === 'railgun') {
      ctx.rotate(0.785);
      ctx.fillRect(building.x - 6, building.y - 28, 12, 56);
      ctx.fillRect(building.x - 24, building.y - 6, 48, 12);
    } else {
      ctx.fillRect(building.x - 19, building.y - 19, 38, 38);
      ctx.fillStyle = '#050816';
      ctx.fillRect(building.x - 8, building.y - 8, 16, 16);
    }
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    ctx.save();
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 17;
    ctx.fillStyle = enemy.color;
    if (enemy.name === 'COREBREAKER') {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff345d';
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,.75)';
    ctx.fillRect(enemy.x - 24, enemy.y - enemy.size - 14, 48, 5);
    ctx.fillStyle = enemy.hp > enemy.maxHp * 0.35 ? '#ffffff' : '#ff345d';
    ctx.fillRect(enemy.x - 24, enemy.y - enemy.size - 14, 48 * Math.max(0, enemy.hp / enemy.maxHp), 5);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = projectile.type === 'railgun' ? 5 : 2;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    projectile.trail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.type === 'missile' ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
  }
}

function drawFloatingTexts() {
  ctx.textAlign = 'center';
  ctx.font = '700 16px Arial';
  for (const item of state.floatingTexts) {
    ctx.globalAlpha = Math.max(0, item.life / item.maxLife);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

function drawMenu() {
  ctx.fillStyle = 'rgba(0,0,0,.46)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00d9ff';
  ctx.font = '800 86px Arial';
  ctx.fillText('NEON', width / 2, height / 2 - 84);
  ctx.fillStyle = '#ff2bd6';
  ctx.font = '800 66px Arial';
  ctx.fillText('COMMAND', width / 2, height / 2 - 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Arial';
  ctx.fillText('Fast tactical neon defense prototype', width / 2, height / 2 + 28);
  ctx.font = '18px Arial';
  ctx.fillText('Enter oder Klick startet die Mission', width / 2, height / 2 + 82);
  ctx.fillText('1 Laser · 2 Missile · 3 Generator · 4 Railgun', width / 2, height / 2 + 116);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,.72)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff345d';
  ctx.font = '800 68px Arial';
  ctx.fillText('CORE DESTROYED', width / 2, height / 2 - 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Arial';
  ctx.fillText(`Score: ${state.score} · Waves: ${state.wave} · Kills: ${state.kills}`, width / 2, height / 2 + 16);
  ctx.fillText('R für Neustart', width / 2, height / 2 + 62);
  ctx.textAlign = 'left';
}

function drawWaveBanner() {
  if (state.mode !== 'playing' || state.messageTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.messageTimer / 0.5);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,.62)';
  ctx.fillRect(width / 2 - 260, 92, 520, 58);
  ctx.strokeStyle = '#ff345d';
  ctx.strokeRect(width / 2 - 260, 92, 520, 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px Arial';
  ctx.fillText(state.message, width / 2, 130);
  ctx.restore();
}

function drawHud() {
  if (state.mode === 'menu') {
    hud.innerHTML = '<strong>NEON COMMAND</strong><br>Press Enter';
    return;
  }
  const selected = BUILDINGS[state.selected];
  hud.innerHTML = `
    <div class="hud-title">NEON COMMAND</div>
    <div>Score: <b>${state.score}</b> · Combo: <b>x${state.combo.toFixed(1)}</b></div>
    <div>Wave: <b>${state.wave}</b> · Enemies: <b>${state.enemies.length + state.waveBudget}</b> · Kills: <b>${state.kills}</b></div>
    <div>Energy: <b>${Math.floor(state.energy)}</b> · Income: <b>${state.income.toFixed(1)}/s</b> · Data: <b>${Math.floor(state.data)}</b></div>
    <div>Core: <b>${Math.floor(state.core.hp)}%</b></div>
    <hr>
    <div class="build ${state.selected === 'laser' ? 'active' : ''}">[1] Laser - ${BUILDINGS.laser.cost}</div>
    <div class="build ${state.selected === 'missile' ? 'active' : ''}">[2] Missile - ${BUILDINGS.missile.cost}</div>
    <div class="build ${state.selected === 'generator' ? 'active' : ''}">[3] Generator - ${BUILDINGS.generator.cost}</div>
    <div class="build ${state.selected === 'railgun' ? 'active' : ''}">[4] Railgun - ${BUILDINGS.railgun.cost}</div>
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
  if (event.key === 'r' || event.key === 'R') startGame();
  if (event.code === 'Space') state.paused = !state.paused;
  if (event.key === '1') state.selected = 'laser';
  if (event.key === '2') state.selected = 'missile';
  if (event.key === '3') state.selected = 'generator';
  if (event.key === '4') state.selected = 'railgun';
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
