/**
 * Motor procedural ligero inspirado en `peticion.html` / core.js (look ink, paperInk).
 * Sin dependencias: rng con seed, trazo wobble, hatch, grain, packets y servidor.
 * Diseñado para loops rAF con DPR, resize y `prefers-reduced-motion`.
 * @module shared/canvas/handEngine
 */

export const TAU = Math.PI * 2;

export const PAPER_PAL = Object.freeze({
  paper: '#f3e6cf',
  paperDeep: '#e9d5b3',
  ink: '#1e1630',
  night: '#0b0d1f',
  chalk: '#e8ecff',
  chalkDim: '#8d97c9',
  guide: 'rgba(70,100,255,.55)',
  fills: ['#e79256', '#c99a5a', '#b8864e', '#d9b078'],
  shade: '#3a2214',
  light: '#fff1d6',
  blush: '#c8473f',
  accents: ['#ff2bd6', '#28f0e0', '#ffe22b', '#5cff5c'],
  GREEN: '#5cff5c',
});

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const sm = (a, b, t) => {
  const u = clamp((t - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};

/** RNG determinista (mulberry32). Sin Math.random: evita "boil" entre frames. */
export function rng(seed) {
  let a = (seed * 1000003) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Trazo con jitter: el outline nunca coincide con el fill (regla del core). */
export function wob(c, pts, amp, seed, close = false) {
  const r = rng(seed);
  c.beginPath();
  pts.forEach((p, i) => {
    const x = p[0] + (r() - 0.5) * amp;
    const y = p[1] + (r() - 0.5) * amp;
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  });
  if (close) c.closePath();
  c.stroke();
}

export function ellPts(cx, cy, rx, ry, n = 44) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return p;
}

/** Hatch: sombreado de líneas paralelas clippeadas a un path. */
export function hatch(c, path, box, o = {}) {
  const { angle = 0.9, gap = 7, len = 14, color = PAPER_PAL.ink, alpha = 0.28, width = 1.1, seed = 1 } = o;
  const r = rng(seed);
  c.save();
  c.clip(path);
  c.strokeStyle = color;
  c.globalAlpha = alpha;
  c.lineWidth = width;
  c.lineCap = 'round';
  const [bx, by, bw, bh] = box;
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const R = Math.hypot(bw, bh) / 2;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  c.beginPath();
  for (let v = -R; v <= R; v += gap) {
    for (let u = -R; u <= R; u += len * 1.7) {
      const L = len * (0.6 + r() * 0.8);
      const x0 = cx + ca * u - sa * v;
      const y0 = cy + sa * u + ca * v;
      c.moveTo(x0, y0);
      c.lineTo(x0 + ca * L, y0 + sa * L);
    }
  }
  c.stroke();
  c.restore();
}

/** Grain: motas de papel. Pocas por frame en animación (perf). */
export function grain(c, w, h, n, color, alpha, seed) {
  const r = rng(seed);
  c.save();
  c.fillStyle = color;
  c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    c.fillRect(r() * w, r() * h, 1.4, 1.4);
  }
  c.restore();
}

/** Anchor: el punto verde que nunca se va (como en peticion.html). */
export function seedDot(c, x, y, r = 8, ink = PAPER_PAL.ink, green = PAPER_PAL.GREEN) {
  c.save();
  c.fillStyle = green;
  c.globalAlpha = 0.85;
  c.beginPath();
  c.arc(x + r * 0.3, y + r * 0.2, r, 0, TAU);
  c.fill();
  c.fillStyle = ink;
  c.globalAlpha = 1;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
  c.restore();
}

export function hexPath(c, x, y, s) {
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = x + s * Math.cos(a);
    const py = y + s * Math.sin(a);
    if (i) c.lineTo(px, py);
    else c.moveTo(px, py);
  }
  c.closePath();
}

/** Paquete verde: caja + LEDs hexagonales + cinta. */
export function drawPacket(c, x, y, s, seed, glow = 0) {
  const w = 132 * s;
  const h = 92 * s;
  if (glow > 0) {
    c.save();
    c.globalAlpha = 0.35 * glow;
    c.strokeStyle = PAPER_PAL.GREEN;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, 70 * s + glow * 14, 0, TAU);
    c.stroke();
    c.restore();
  }
  const body = new Path2D();
  if (body.roundRect) body.roundRect(x - w / 2, y - h / 2, w, h, 14 * s);
  else body.rect(x - w / 2, y - h / 2, w, h);
  c.fillStyle = PAPER_PAL.GREEN;
  c.fill(body);
  hatch(c, body, [x - w / 2, y - h / 2, w, h], { seed: seed + 2, alpha: 0.22 });
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 2.4;
  wob(c, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], 1.8, seed + 3, true);
  for (let k = -1; k <= 1; k++) {
    const lx = x + k * 30 * s;
    const ly = y - 8 * s;
    hexPath(c, lx, ly, 11 * s);
    c.fillStyle = k === 0 ? PAPER_PAL.light : '#bfffc9';
    c.fill();
    c.strokeStyle = PAPER_PAL.ink;
    c.lineWidth = 1.4;
    c.stroke();
  }
  seedDot(c, x + w / 2 - 8 * s, y - h / 2 + 8 * s, 5 * s);
}

/** Servidor doodle: caja + ventiladores + LEDs. */
export function drawServerMini(c, x, y, w, h, seed, t) {
  const body = new Path2D();
  if (body.roundRect) body.roundRect(x - w / 2, y - h / 2, w, h, 22);
  else body.rect(x - w / 2, y - h / 2, w, h);
  c.fillStyle = PAPER_PAL.fills[1];
  c.fill(body);
  hatch(c, body, [x - w / 2, y - h / 2, w, h], { seed: seed + 1, alpha: 0.25 });
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 2.6;
  wob(c, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], 2, seed + 2, true);
  for (const sx of [-1, 1]) {
    const fx = x + sx * w * 0.24;
    const fy = y - h * 0.14;
    const fr = Math.min(w, h) * 0.16;
    c.fillStyle = PAPER_PAL.light;
    c.beginPath();
    c.arc(fx, fy, fr, 0, TAU);
    c.fill();
    c.strokeStyle = PAPER_PAL.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(fx, fy, fr, 0, TAU);
    c.stroke();
    const a0 = t * 3 + (sx > 0 ? 0 : Math.PI);
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * TAU) / 3;
      c.beginPath();
      c.moveTo(fx, fy);
      c.lineTo(fx + Math.cos(a) * fr * 0.9, fy + Math.sin(a) * fr * 0.9);
      c.stroke();
    }
  }
  for (let k = 0; k < 5; k++) {
    const lx = x - w * 0.32 + k * w * 0.16;
    const ly = y + h * 0.32;
    c.fillStyle = k % 2 === 0 ? PAPER_PAL.GREEN : PAPER_PAL.blush;
    c.beginPath();
    c.arc(lx, ly, 5, 0, TAU);
    c.fill();
    c.strokeStyle = PAPER_PAL.ink;
    c.lineWidth = 1.2;
    c.stroke();
  }
}

/** Líneas de velocidad + loops de colores (estela del viaje PCIe). */
export function speedLines(c, x, y, seed, n = 7, color = PAPER_PAL.ink) {
  const r = rng(seed);
  c.save();
  c.strokeStyle = color;
  c.globalAlpha = 0.5;
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const side = (r() - 0.5) * 60;
    const back = 26 + r() * 40;
    const L = 50 + r() * 100;
    c.lineWidth = 0.8 + r() * 1.6;
    c.beginPath();
    c.moveTo(x - back, y + side);
    c.lineTo(x - back - L, y + side);
    c.stroke();
  }
  c.restore();
}

export function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
