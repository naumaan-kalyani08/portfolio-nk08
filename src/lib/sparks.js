// Tiny pooled particle system for glowing "embers" drawn on a 2D canvas.
// - Fixed-size pool + swap-remove → zero allocations per frame.
// - Dirty-rect clearing: only the area painted last frame is cleared.
// - Particles live in the caller's coordinate space (e.g. a scrolling stage)
//   and are projected to the viewport with an (ox, oy) offset when drawn.
// - Additive blending ("lighter") makes overlapping sparks bloom naturally.

import { getTheme, onThemeChange } from "./theme";

const TAU = Math.PI * 2;

// White-hot cores vanish on the light theme, so there each ember's core
// takes its own colour instead.
let lightCores = getTheme() === "light";
onThemeChange((theme) => {
  lightCores = theme === "light";
});

export function createSparks(canvas, { max = 120, maxDpr = 1 } = {}) {
  const ctx = canvas.getContext("2d");
  const pool = Array.from({ length: max }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    size: 1,
    color: "#fff",
  }));
  let count = 0;
  let dpr = 1;
  // bounding box painted on the previous frame
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  const resetBox = () => {
    x0 = Infinity;
    y0 = Infinity;
    x1 = -Infinity;
    y1 = -Infinity;
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    resetBox();
  };

  const spawn = (x, y, vx, vy, life, size, rgb) => {
    if (count >= max) return;
    const p = pool[count];
    count += 1;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.max = life;
    p.size = size;
    p.color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  };

  const burst = (x, y, amount, rgb, power = 1) => {
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * TAU;
      const speed = (50 + Math.random() * 230) * power;
      spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.6 + Math.random() * 0.9, 0.8 + Math.random() * 2, rgb);
    }
  };

  // Advances and draws all particles. Returns how many are still alive.
  const step = (dt, ox, oy) => {
    if (x1 >= x0) ctx.clearRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
    resetBox();
    if (!count) return 0;

    const drag = Math.pow(0.12, dt);
    const w = canvas.width + 24;
    const h = canvas.height + 24;
    ctx.globalCompositeOperation = "lighter";

    for (let i = count - 1; i >= 0; i -= 1) {
      const p = pool[i];
      p.life -= dt;
      if (p.life <= 0) {
        // swap-remove: the last alive particle was already processed this frame
        count -= 1;
        pool[i] = pool[count];
        pool[count] = p;
        continue;
      }

      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const sx = (p.x + ox) * dpr;
      const sy = (p.y + oy) * dpr;
      if (sx < -24 || sy < -24 || sx > w || sy > h) continue;

      const k = p.life / p.max;
      const r = p.size * dpr * (0.35 + 0.65 * k);
      const glow = r * 3.2;

      ctx.globalAlpha = 0.22 * k;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, glow, 0, TAU);
      ctx.fill();

      ctx.globalAlpha = 0.9 * k;
      ctx.fillStyle = lightCores ? p.color : "#fff";
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.fill();

      if (sx - glow < x0) x0 = sx - glow;
      if (sy - glow < y0) y0 = sy - glow;
      if (sx + glow > x1) x1 = sx + glow;
      if (sy + glow > y1) y1 = sy + glow;
    }

    ctx.globalAlpha = 1;
    return count;
  };

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    count = 0;
    resetBox();
  };

  resize();
  return { spawn, burst, step, resize, clear };
}
