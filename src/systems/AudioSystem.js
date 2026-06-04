// ====== TOWER DEFENSE AUDIO SYSTEM ======
// Synthesized sound effects using Web Audio API

let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Laser fire: quick high-pitched zap
export function playLaser() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.08);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.1);
}

// Missile launch: deep thud
export function playMissileLaunch() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.35);
}

// Explosion: boom + noise
export function playExplosion(v = 0.15) {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(20, t + 0.3);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.4);
  // Noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 4);
  const n = ctx.createBufferSource(), ng = ctx.createGain();
  n.buffer = buf;
  ng.gain.setValueAtTime(v * 0.6, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(ng); ng.connect(ctx.destination);
  n.start();
}

// Sniper fire: sharp crack
export function playSniper() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(2000, t);
  o.frequency.exponentialRampToValueAtTime(100, t + 0.05);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.08);
}

// Enemy destroyed: satisfying pop
export function playEnemyKill() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, t);
  o.frequency.exponentialRampToValueAtTime(100, t + 0.1);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.12);
}

// Boss warning: deep alarm
export function playBossWarning() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(200, t + i * 0.2);
    g.gain.setValueAtTime(0.12, t + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.15);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.2); o.stop(t + i * 0.2 + 0.15);
  }
}

// Building placed: positive click
export function playBuild() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(400, t);
  o.frequency.linearRampToValueAtTime(800, t + 0.06);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.1);
}

// Orbital strike: massive bass drop
export function playOrbital() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  // Bass
  const o1 = ctx.createOscillator(), g1 = ctx.createGain();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(80, t);
  o1.frequency.exponentialRampToValueAtTime(15, t + 1);
  g1.gain.setValueAtTime(0.2, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  o1.connect(g1); g1.connect(ctx.destination);
  o1.start(); o1.stop(t + 1.2);
  // Noise sweep
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 3);
  const n = ctx.createBufferSource(), ng = ctx.createGain();
  n.buffer = buf;
  ng.gain.setValueAtTime(0.15, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  n.connect(ng); ng.connect(ctx.destination);
  n.start();
}

// Core damage: alert beep
export function playCoreDamage() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(440, t);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.1);
}

// Building destroyed: crunch
export function playBuildingDestroyed() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(300, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.2);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.25);
  // Noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 5);
  const n = ctx.createBufferSource(), ng = ctx.createGain();
  n.buffer = buf;
  ng.gain.setValueAtTime(0.1, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  n.connect(ng); ng.connect(ctx.destination);
  n.start();
}

// Upgrade purchased: chime
export function playUpgrade() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const notes = [800, 1000, 1200];
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t + i * 0.06);
    g.gain.setValueAtTime(0.08, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.15);
  });
}

// Wave start: short fanfare
export function playWaveStart() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const notes = [400, 500, 600];
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t + i * 0.1);
    g.gain.setValueAtTime(0.1, t + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.2);
  });
}

// Victory: ascending arpeggio
export function playVictory() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t + i * 0.15);
    g.gain.setValueAtTime(0.15, t + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.5);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.5);
  });
}

// ====== BOSS ABILITY SOUNDS ======

// EMP blast: electric zap
export function playBossEMP() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  // Electric buzz
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(3000, t);
  o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.35);
  // Static noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 3);
  const n = ctx.createBufferSource(), ng = ctx.createGain();
  n.buffer = buf;
  ng.gain.setValueAtTime(0.1, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  n.connect(ng); ng.connect(ctx.destination);
  n.start();
}

// Heal pulse: warm ascending tone
export function playBossHeal() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const notes = [400, 600, 800];
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t + i * 0.08);
    g.gain.setValueAtTime(0.06, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.2);
  });
}

// Shield reflect hit: metallic ping
export function playBossShieldHit() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(1800, t);
  o.frequency.exponentialRampToValueAtTime(600, t + 0.15);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(t + 0.2);
}

// Swarm spawn: bubbling burst
export function playBossSwarmSpawn() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(200 + i * 150, t + i * 0.05);
    o.frequency.exponentialRampToValueAtTime(100, t + i * 0.05 + 0.15);
    g.gain.setValueAtTime(0.08, t + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.18);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.18);
  }
}

// Game over: descending tones
export function playGameOver() {
  const ctx = initAudio();
  const t = ctx.currentTime;
  const notes = [400, 300, 200];
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, t + i * 0.2);
    g.gain.setValueAtTime(0.12, t + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.4);
    o.connect(g); g.connect(ctx.destination);
    o.start(t + i * 0.2); o.stop(t + i * 0.2 + 0.4);
  });
}
