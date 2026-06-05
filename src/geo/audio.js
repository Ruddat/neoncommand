// ====== AUDIO SYSTEM (Web Audio API + MP3 Background Music) ======
let audioCtx;

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// ====== MP3 BACKGROUND MUSIC SYSTEM ======
// Track mapping by DEFCON level:
//   DEFCON 5 (Frieden) → Defcon Ice Room.mp3   — atmospheric, cold
//   DEFCON 3-4 (Wachsam/Erhöht) → Red Alert At Dawn.mp3 — tension building
//   DEFCON 1-2 (Kritisch/Atomkrieg) → Fallout Protocol.mp3 — full dread

const TRACKS = {
  peace: { src: '/audio/Defcon Ice Room.mp3', defconRange: [4, 5] },
  tension: { src: '/audio/Red Alert At Dawn.mp3', defconRange: [3, 3] },
  war: { src: '/audio/Fallout Protocol.mp3', defconRange: [1, 2] },
};

let currentTrack = null; // 'peace' | 'tension' | 'war'
let audioElement = null;
let musicVolume = 0.35;
let fadeInterval = null;

export function startMusic(G) {
  if (G.musicPlaying) return;
  G.musicPlaying = true;

  // Create audio element
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.loop = true;
    audioElement.volume = 0; // start silent, fade in
  }

  // Start with the right track for current DEFCON
  const track = getTrackForDefcon(G.defcon || 5);
  switchTrack(track, true);
}

export function stopMusic(G) {
  if (!G.musicPlaying) return;
  G.musicPlaying = false;

  if (audioElement) {
    // Fade out
    fadeAudio(audioElement, audioElement.volume, 0, 1.5, () => {
      audioElement.pause();
    });
  }
  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; }
}

function getTrackForDefcon(defcon) {
  if (defcon <= 2) return 'war';
  if (defcon <= 3) return 'tension';
  return 'peace';
}

function switchTrack(trackKey, initial = false) {
  if (trackKey === currentTrack && !initial) return;
  if (!audioElement) return;

  const track = TRACKS[trackKey];
  if (!track) return;

  const wasPlaying = !audioElement.paused;
  const oldVolume = audioElement.volume;

  if (wasPlaying && !initial) {
    // Crossfade: fade out old, then start new
    fadeAudio(audioElement, oldVolume, 0, 1.5, () => {
      audioElement.src = track.src;
      audioElement.volume = 0;
      audioElement.play().catch(() => {});
      fadeAudio(audioElement, 0, musicVolume, 2);
    });
  } else {
    // Start fresh
    audioElement.src = track.src;
    audioElement.volume = initial ? 0 : musicVolume;
    audioElement.play().catch(() => {});
    if (initial) {
      fadeAudio(audioElement, 0, musicVolume, 2);
    }
  }

  currentTrack = trackKey;
}

function fadeAudio(el, from, to, duration, callback) {
  if (fadeInterval) clearInterval(fadeInterval);
  const steps = 30;
  const stepTime = (duration * 1000) / steps;
  let step = 0;
  el.volume = from;

  fadeInterval = setInterval(() => {
    step++;
    const progress = step / steps;
    el.volume = from + (to - from) * progress;
    if (step >= steps) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      el.volume = to;
      if (callback) callback();
    }
  }, stepTime);
}

export function updateMusic(G) {
  if (!G.musicPlaying) return;

  // Ensure audio element is playing
  if (audioElement && audioElement.paused) {
    audioElement.play().catch(() => {});
  }

  // Switch track based on DEFCON
  const targetTrack = getTrackForDefcon(G.defcon || 5);
  if (targetTrack !== currentTrack) {
    switchTrack(targetTrack);
  }

  // Adjust volume based on DEFCON (louder when more intense)
  const targetVolume = G.defcon <= 2 ? 0.45 : G.defcon <= 3 ? 0.38 : 0.3;
  if (audioElement && Math.abs(audioElement.volume - targetVolume) > 0.05) {
    // Smoothly adjust
    audioElement.volume += (targetVolume - audioElement.volume) * 0.1;
  }
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (audioElement) audioElement.volume = musicVolume;
}

// ====== SYNTHESIZED SOUND EFFECTS ======

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

export function playNuclearWinter() {
  initAudio();
  const t = audioCtx.currentTime;
  const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(40, t);
  o1.frequency.linearRampToValueAtTime(80, t + 1);
  o1.frequency.linearRampToValueAtTime(30, t + 3);
  g1.gain.setValueAtTime(0.15, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 3);
  o1.connect(g1); g1.connect(audioCtx.destination);
  o1.start(); o1.stop(t + 3);
  const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(1200, t);
  o2.frequency.exponentialRampToValueAtTime(600, t + 2);
  g2.gain.setValueAtTime(0.08, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
  o2.connect(g2); g2.connect(audioCtx.destination);
  o2.start(); o2.stop(t + 2.5);
}

export function playSpy() {
  initAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(800, t);
  o.frequency.linearRampToValueAtTime(1200, t + 0.05);
  o.frequency.linearRampToValueAtTime(600, t + 0.1);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(t + 0.15);
}
