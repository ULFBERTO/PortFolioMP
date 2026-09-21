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

/* ================= cpu.html / test.html: lattice, aster, plant, thread, electron ================= */

export const ELEC = '#28f0e0'; // cyan del electrón (accents[1] de cpu.html)

/** Esquinas de hexágono plano (flat-top), para extrusión y hit-test. */
export function hexCorners(cx, cy, s) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    pts.push([cx + s * Math.cos(a), cy + s * Math.sin(a)]);
  }
  return pts;
}

/** Punto dentro de hexágono (test rápido por distancia + bordes). */
export function pointInHex(px, py, cx, cy, s) {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  if (dx > s || dy > s * 0.88) return false;
  return s * 0.88 - dx * 0.5 >= dy * 0.5;
}

/** hexLattice: rejilla hexagonal de fondo (receta del core). */
export function hexLattice(c, box, s, color, alpha = 0.3, width = 0.9, seed = 1) {
  const r = rng(seed);
  const [bx, by, bw, bh] = box;
  const w = Math.sqrt(3) * s;
  const h = 1.5 * s;
  c.save();
  c.strokeStyle = color;
  c.globalAlpha = alpha;
  c.lineWidth = width;
  let row = 0;
  for (let y = by - s; y < by + bh + s; y += h, row++) {
    const off = row % 2 ? w / 2 : 0;
    for (let x = bx - w + off; x < bx + bw + w; x += w) {
      if (r() < 0.06) continue; // celdas perdidas: textura orgánica
      hexPath(c, x, y, s * (0.92 + r() * 0.1));
      c.stroke();
    }
  }
  c.restore();
}

/** aster: núcleo con rayos (chispa de nacimiento, receta del core). */
export function aster(c, x, y, r, n, color, seed, g = 1) {
  if (g <= 0) return;
  const rr = rng(seed);
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1.4;
  c.globalAlpha = 0.9 * Math.min(1, g);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (rr() - 0.5) * 0.3;
    const r0 = r * 1.6;
    const r1 = r * (2.6 + rr() * 1.6) * g;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    c.stroke();
  }
  c.globalAlpha = 1;
  c.fillStyle = PAPER_PAL.paper;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 1.6;
  c.stroke();
  c.restore();
}

export function dottedArc(c, cx, cy, r, color, seed, step = 9, size = 1.1) {
  const rr = rng(seed);
  c.save();
  c.fillStyle = color;
  const n = Math.round((TAU * r) / step);
  for (let k = 0; k < n; k++) {
    if (rr() < 0.12) continue;
    const a = (k / n) * TAU;
    c.beginPath();
    c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, 0, TAU);
    c.fill();
  }
  c.restore();
}

export function dashedRing(c, cx, cy, r, color, seed, dash = [14, 10], width = 1.5, rot = 0) {
  c.save();
  c.setLineDash(dash);
  c.lineDashOffset = -rot;
  c.strokeStyle = color;
  c.lineWidth = width;
  wob(c, ellPts(cx, cy, r, r, 90), 1.5, seed, true);
  c.restore();
}

export function cross(c, x, y, s) {
  c.beginPath();
  c.moveTo(x - s, y);
  c.lineTo(x + s, y);
  c.moveTo(x, y - s);
  c.lineTo(x, y + s);
  c.stroke();
}

/** Texto manuscrito real (firmas, etiquetas de hexágono). */
export function handText(c, text, x, y, o = {}) {
  const { size = 64, ink = PAPER_PAL.ink, align = 'center' } = o;
  c.save();
  c.font = `${size}px Caveat, "Bradley Hand", "Segoe Script", cursive`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = ink;
  c.fillText(text, x, y);
  c.restore();
}

/**
 * plant: árbol prensado recursivo (receta del core, test.html).
 * Ramas que se bifurcan + hojas/nudos en las puntas.
 */
export function plant(c, x, y, len, depth, seed, o = {}) {
  const { stem = PAPER_PAL.ink, leaf = PAPER_PAL.accents[0], flower = PAPER_PAL.accents[2], angle = -Math.PI / 2, width = 1.6 } = o;
  const r = rng(seed);
  c.save();
  c.lineCap = 'round';
  (function branch(px, py, l, a, d, w) {
    const x2 = px + Math.cos(a) * l;
    const y2 = py + Math.sin(a) * l;
    c.strokeStyle = stem;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(px, py);
    c.quadraticCurveTo((px + x2) / 2 + (r() - 0.5) * l * 0.25, (py + y2) / 2, x2, y2);
    c.stroke();
    if (d <= 0) {
      c.fillStyle = leaf;
      c.globalAlpha = 0.75;
      for (let k = 0; k < 5; k++) {
        const la = a + (r() - 0.5) * 2.4;
        c.beginPath();
        c.ellipse(x2 + Math.cos(la) * 7, y2 + Math.sin(la) * 7, 8, 3.4, la, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
      if (r() < 0.45) {
        c.strokeStyle = flower;
        c.lineWidth = 1;
        for (let k = 0; k < 6; k++) {
          const fa = (k / 6) * TAU;
          c.beginPath();
          c.moveTo(x2, y2);
          c.lineTo(x2 + Math.cos(fa) * 9, y2 + Math.sin(fa) * 9);
          c.stroke();
        }
      }
      return;
    }
    const n = 2 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      branch(x2, y2, l * (0.55 + r() * 0.25), a + (r() - 0.5) * 1.5, d - 1, w * 0.72);
    }
  })(x, y, len, angle, depth, width);
  c.restore();
}

/** thread: hilo que baja errante por el frame (receta del core). */
export function thread(c, x, seed, color = PAPER_PAL.accents[0], width = 1.2, h = 0, w = 0) {
  const r = rng(seed);
  const H = h || 600;
  const pts = [];
  let px = x;
  for (let y = -10; y <= H + 10; y += 24) {
    px += (r() - 0.5) * 26;
    pts.push([px, y]);
  }
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.globalAlpha = 0.8;
  void w;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.stroke();
  // nudo inicial
  seedDot(c, pts[0][0], pts[0][1], 5);
  c.restore();
}

/** Electrón cyan: punto + brillo (puppet de cpu.html). */
export function drawElectron(c, x, y, s = 1, seed = 1, glow = 0.6) {
  if (glow > 0) aster(c, x, y, 8 * s, 9, ELEC, seed + 1, glow, PAPER_PAL.paper, ELEC);
  c.fillStyle = ELEC;
  c.beginPath();
  c.arc(x, y, 9 * s, 0, TAU);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(x + 3 * s, y - 3 * s, 2.6 * s, 0, TAU);
  c.fill();
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 2;
  wob(c, ellPts(x, y, 9 * s, 9 * s, 24), 1.2, seed + 2, true);
}

/** CPU doodle: encapsulado + pins + die con lattice (cpu.html). */
export function drawCPU(c, x, y, w, seed) {
  const body = new Path2D();
  body.rect(x - w / 2, y - w / 2, w, w);
  c.fillStyle = PAPER_PAL.fills[3];
  c.fill(body);
  hatch(c, body, [x - w / 2, y - w / 2, w, w], { seed: seed + 1, alpha: 0.25 });
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 3;
  wob(c, [[x - w / 2, y - w / 2], [x + w / 2, y - w / 2], [x + w / 2, y + w / 2], [x - w / 2, y + w / 2]], 2.2, seed + 2, true);
  // pins
  for (let k = 0; k < 6; k++) {
    const t = -w / 2 + ((k + 0.5) * w) / 6;
    for (const [px, py, dx, dy] of [[x + t, y - w / 2, 0, -1], [x + t, y + w / 2, 0, 1], [x - w / 2, y + t, -1, 0], [x + w / 2, y + t, 1, 0]]) {
      c.strokeStyle = PAPER_PAL.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + dx * 26, py + dy * 26);
      c.stroke();
      c.fillStyle = PAPER_PAL.shade;
      c.beginPath();
      c.arc(px + dx * 29, py + dy * 29, 4, 0, TAU);
      c.fill();
    }
  }
  // die
  const dw = w * 0.52;
  const die = new Path2D();
  die.rect(x - dw / 2, y - dw / 2, dw, dw);
  c.fillStyle = PAPER_PAL.fills[0];
  c.fill(die);
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 2;
  wob(c, [[x - dw / 2, y - dw / 2], [x + dw / 2, y - dw / 2], [x + dw / 2, y + dw / 2], [x - dw / 2, y + dw / 2]], 1.6, seed + 6, true);
  hexLattice(c, [x - dw / 2, y - dw / 2, dw, dw], 13, PAPER_PAL.shade, 0.3, 0.9, seed + 7);
  // electrón en el die
  drawElectron(c, x, y, 0.8, seed + 9, 0.5);
}

/**
 * FET simplificado: source/drain + canal que se ilumina con openK + gate.
 * openK 0..1 = cuánto abre la compuerta (cpu.html escena fet).
 */
export function drawFET(c, x, y, s, seed, openK) {
  const W_ = 300 * s;
  const H_ = 200 * s;
  const body = new Path2D();
  if (body.roundRect) body.roundRect(x - W_ / 2, y - H_ / 2, W_, H_, 18 * s);
  else body.rect(x - W_ / 2, y - H_ / 2, W_, H_);
  c.fillStyle = PAPER_PAL.paper;
  c.fill(body);
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 2.6;
  wob(c, [[x - W_ / 2, y - H_ / 2], [x + W_ / 2, y - H_ / 2], [x + W_ / 2, y + H_ / 2], [x - W_ / 2, y + H_ / 2]], 2, seed + 2, true);
  for (const sx of [-1, 1]) {
    const bx = x + sx * W_ * 0.3;
    const bw = W_ * 0.22;
    const bh = H_ * 0.6;
    const bp = new Path2D();
    bp.rect(bx - bw / 2, y - bh / 2, bw, bh);
    c.fillStyle = sx < 0 ? PAPER_PAL.fills[1] : PAPER_PAL.fills[2];
    c.fill(bp);
    hatch(c, bp, [bx - bw / 2, y - bh / 2, bw, bh], { seed: seed + 10 + sx, alpha: 0.35 });
    c.strokeStyle = PAPER_PAL.ink;
    c.lineWidth = 2;
    wob(c, [[bx - bw / 2, y - bh / 2], [bx + bw / 2, y - bh / 2], [bx + bw / 2, y + bh / 2], [bx - bw / 2, y + bh / 2]], 1.4, seed + 12 + sx, true);
  }
  // canal
  const cw = W_ * 0.2;
  const ch = H_ * 0.6;
  c.save();
  c.globalAlpha = 0.25 + 0.75 * openK;
  c.fillStyle = ELEC;
  c.fillRect(x - cw / 2, y - ch / 2, cw, ch);
  c.restore();
  // gate
  const gy = y - H_ / 2 - 24 * s;
  c.strokeStyle = PAPER_PAL.ink;
  c.lineWidth = 3;
  wob(c, [[x - W_ * 0.32, gy], [x + W_ * 0.32, gy]], 1.6, seed + 16, false);
  c.beginPath();
  c.moveTo(x, gy);
  c.lineTo(x, y - ch / 2);
  c.stroke();
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
