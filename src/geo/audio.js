// ====== AUDIO SYSTEM (Web Audio API - Synthesized) ======
let audioCtx;

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

export function playBoom(v = 0.3) {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.5);
  // Noise burst
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 5);
  const n = audioCtx.createBufferSource();
  const ng = audioCtx.createGain();
  n.buffer = buf;
  ng.gain.setValueAtTime(v * 0.8, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  n.connect(ng); ng.connect(audioCtx.destination);
  n.start();
}

export function playNuke(v = 0.5) {
  initAudio();
  const t = audioCtx.currentTime;
  // Deep rumble
  const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(60, t);
  o1.frequency.exponentialRampToValueAtTime(15, t + 1.5);
  g1.gain.setValueAtTime(v, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 2);
  o1.connect(g1); g1.connect(audioCtx.destination);
  o1.start(); o1.stop(t + 2);
  // Crunch
  const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
  o2.type = 'square';
  o2.frequency.setValueAtTime(200, t);
  o2.frequency.exponentialRampToValueAtTime(40, t + 0.6);
  g2.gain.setValueAtTime(v * 0.6, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  o2.connect(g2); g2.connect(audioCtx.destination);
  o2.start(); o2.stop(t + 0.8);
  // Long noise tail
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.5, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / d.length * 2);
  const ns = audioCtx.createBufferSource(), ng = audioCtx.createGain();
  ns.buffer = buf;
  ng.gain.setValueAtTime(v * 0.7, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  ns.connect(ng); ng.connect(audioCtx.destination);
  ns.start();
}

export function playSiren() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(400, t);
  o.frequency.linearRampToValueAtTime(900, t + 0.3);
  o.frequency.linearRampToValueAtTime(400, t + 0.6);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.8);
}

export function playAlert() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(880, t);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.15);
}

export function playBuild() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(300, t);
  o.frequency.linearRampToValueAtTime(600, t + 0.1);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.15);
}

export function playBuildAI() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(250, t);
  o.frequency.linearRampToValueAtTime(500, t + 0.08);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.1);
}

export function playEMP() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(2000, t);
  o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.5);
}

export function playDramatic() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(440, t);
  o.frequency.setValueAtTime(554, t + 0.15);
  o.frequency.setValueAtTime(659, t + 0.3);
  o.frequency.setValueAtTime(880, t + 0.45);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.8);
}

export function playVictory() {
  initAudio();
  const t = audioCtx.currentTime;
  // Ascending arpeggio
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t + i * 0.15);
    g.gain.setValueAtTime(0.15, t + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.4);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.4);
  });
}
