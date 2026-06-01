export function burst(state, x, y, color, count = 12, power = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (40 + Math.random() * 240) * power;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.6,
      max: 1,
      color,
      size: (2 + Math.random() * 3) * power,
    });
  }
}

export function floatText(state, x, y, text, color = '#fff') {
  state.texts.push({ x, y, text, color, life: 1.2, max: 1.2 });
}

export function updateParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.texts.length - 1; i >= 0; i--) {
    const t = state.texts[i];
    t.y -= 40 * dt;
    t.life -= dt;
    if (t.life <= 0) state.texts.splice(i, 1);
  }
}
