// ====== HELPER FUNCTIONS ======

// Random number in range [a, b)
export function rnd(a, b) {
  return a + Math.random() * (b - a);
}

// FIX: Angle range was rnd(0,7) which only covered ~2 radians.
// Changed to rnd(0, Math.PI*2) for full 360-degree burst.
export function burst(G, x, y, c, n = 12, p = 1) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2);
    const s = rnd(50, 280) * p;
    G.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rnd(0.3, 0.9),
      max: 1,
      color: c,
      size: rnd(2, 5) * p,
    });
  }
}

export function floatText(G, x, y, t, c = '#fff', sz = 15) {
  G.texts.push({ x, y, text: t, color: c, life: 1.5, max: 1.5, size: sz });
}

export function addLog(G, m, cls = 'c') {
  G.log.push({ msg: m, cls });
  if (G.log.length > 40) G.log.shift();
  renderLog(G);
}

export function renderLog(G) {
  const el = document.getElementById('log');
  if (!el) return;
  el.innerHTML = G.log.slice(-10).map(l => `<span class="${l.cls}">${l.msg}</span>`).join('<br>');
  el.scrollTop = el.scrollHeight;
}

// ====== SCHEDULED EVENTS (replaces setTimeout) ======
// Instead of setTimeout(fn, delay), use scheduleEvent(G, delay, fn)
// Events are processed in updateGame() with proper dt-based timing,
// respecting slow-motion and pause states.

export function scheduleEvent(G, delay, fn) {
  G.scheduledEvents.push({ remaining: delay, fn });
}

export function processScheduledEvents(G, dt) {
  for (let i = G.scheduledEvents.length - 1; i >= 0; i--) {
    const evt = G.scheduledEvents[i];
    evt.remaining -= dt;
    if (evt.remaining <= 0) {
      evt.fn();
      G.scheduledEvents.splice(i, 1);
    }
  }
}

export function clearScheduledEvents(G) {
  G.scheduledEvents.length = 0;
}
