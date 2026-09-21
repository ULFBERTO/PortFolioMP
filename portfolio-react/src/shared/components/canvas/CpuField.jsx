import { memo, useEffect, useRef } from 'react';
import {
  PAPER_PAL,
  ELEC,
  TAU,
  clamp,
  lerp,
  rng,
  wob,
  grain,
  seedDot,
  aster,
  dottedArc,
  dashedRing,
  cross,
  drawElectron,
  drawCPU,
  drawFET,
  setupCanvas,
} from '@/shared/canvas/handEngine.js';
/**
 * Banner hero estilo cpu.html: el electrón cyan viaja por pistas de cobre
 * con codos a 45°, la compuerta FET abre cerca del cursor, chip CPU + reloj.
 * Click = chispa de nacimiento (aster). Escucha 'packet-burst' remoto.
 * SIEMPRE en bucle como la película de referencia: no respeta el modo
 * global ni el SO (es el momento firma de la página).
 * Loop blindado: rAF primero + try/catch + pausa fuera de viewport.
 */
const CpuField = memo(function CpuField({ density = 5, className = '' }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    mouse: { x: -9999, y: -9999, active: false },
    sparks: [],
    electrons: [],
    openK: 0,
    visible: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const st = stateRef.current;
    let raf = 0;
    let running = true;

    const seedElectrons = () => {
      const r = rng(307);
      const n = clamp(Math.round(density), 2, 9);
      st.electrons = Array.from({ length: n }, (_, i) => ({
        u: r(),
        speed: 0.17 + r() * 0.2,
        s: 0.55 + r() * 0.5,
        seed: 200 + i * 23,
        lane: i % 2,
      }));
    };

    const toLocal = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches?.[0] ?? e;
      return { x: (p.clientX ?? 0) - rect.left, y: (p.clientY ?? 0) - rect.top };
    };
    const onMove = (e) => {
      const p = toLocal(e);
      st.mouse.x = p.x;
      st.mouse.y = p.y;
      st.mouse.active = true;
    };
    const onLeave = () => {
      st.mouse.active = false;
      st.mouse.x = -9999;
    };
    const onTap = (e) => {
      const p = toLocal(e);
      st.mouse.x = p.x;
      st.mouse.y = p.y;
      st.mouse.active = true;
      st.sparks.push({ x: p.x, y: p.y, t: 0, seed: 900 + Math.floor(Math.random() * 999) });
      if (st.sparks.length > 6) st.sparks.shift();
    };
    const onRemoteBurst = (e) => {
      const rect = canvas.getBoundingClientRect();
      const n = Math.min(5, Math.max(1, e.detail?.n ?? 2));
      for (let k = 0; k < n; k++) {
        st.sparks.push({
          x: rect.width * (0.2 + Math.random() * 0.6),
          y: rect.height * (0.25 + Math.random() * 0.5),
          t: -k * 0.1,
          seed: 900 + Math.floor(Math.random() * 999),
        });
      }
    };
    window.addEventListener('packet-burst', onRemoteBurst);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onTap);

    const io = new IntersectionObserver(([entry]) => {
      st.visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const onResize = () => seedElectrons();
    window.addEventListener('resize', onResize);
    seedElectrons();

    const t0 = performance.now();
    const loop = (now) => {
      // rAF primero: un error de pintado jamás mata el bucle
      if (running) raf = requestAnimationFrame(loop);
      else return;
      if (!st.visible) return;
      try {
        const t = (now - t0) / 1000;
        const { ctx, w, h } = setupCanvas(canvas);
        for (const e of st.electrons) {
          e.u += e.speed * 0.016;
          if (e.u > 1.1) e.u = -0.1;
        }
        for (const s of st.sparks) s.t += 0.016;
        st.sparks = st.sparks.filter((s) => s.t < 1.1);
        paint(ctx, w, h, t, st, false);
      } catch (err) {
        console.warn('[CpuField] frame:', err);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('packet-burst', onRemoteBurst);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onTap);
    };
  }, [density]);

  return <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full ${className}`} />;
});

/** Punto sobre pista con codos a 45° (cpu.html escena pista). */
function tracePath(w, h) {
  const cy = h * 0.58;
  return [
    [10, cy + 90],
    [w * 0.28, cy + 90],
    [w * 0.42, cy - 90],
    [w * 0.62, cy - 90],
    [w * 0.74, cy + 40],
    [w - 10, cy + 40],
  ];
}

function pointOnPath(pts, u) {
  const segs = pts.length - 1;
  const f = clamp(u, 0, 1) * segs;
  const i = Math.min(segs - 1, Math.floor(f));
  const k = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k) };
}

function paint(ctx, w, h, t, st, staticFrame) {
  ctx.fillStyle = PAPER_PAL.paper;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = 'rgba(255,238,200,.55)';
  for (let i = -6; i <= 6; i++) ctx.fillRect(-w, i * 90 - 22, w * 2, 44);
  ctx.restore();
  grain(ctx, w, h, 150, '#8a6f4d', 0.08, 7);

  const cy = h * 0.58;
  const pts = tracePath(w, h);
  const cpuX = w * 0.84;
  const cpuY = cy - 10;

  // chip CPU al fondo derecha + anillo orbital (movimiento inconfundible)
  drawCPU(ctx, cpuX, cpuY, Math.min(190, w * 0.2), 14);
  if (!staticFrame) {
    dashedRing(ctx, cpuX, cpuY, Math.min(190, w * 0.2) * 0.78, ELEC, 44, [8, 10], 2, t * 40);
    const oa = t * 1.2;
    const orad = Math.min(190, w * 0.2) * 0.78;
    drawElectron(ctx, cpuX + Math.cos(oa) * orad, cpuY + Math.sin(oa) * orad, 0.55, 445, 0.7);
  }

  // pistas de cobre (doble línea)
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = 2.6;
  wob(ctx, pts, 2, 60, false);
  wob(ctx, pts.map((p) => [p[0], p[1] + 40]), 2, 61, false);
  const r = rng(62);
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 7; k++) cross(ctx, 30 + k * ((w - 60) / 6) + (r() - 0.5) * 20, cy + (r() - 0.5) * 220, 5);

  // pulso viajero sobre la pista (bucle visible)
  if (!staticFrame) {
    const pu = (t * 0.22) % 1;
    const pp = pointOnPath(pts, pu);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = ELEC;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pp.x, pp.y + 17, 12 + Math.sin(t * 6) * 3, 0, TAU);
    ctx.stroke();
    ctx.restore();
    drawElectron(ctx, pp.x, pp.y + 17, 0.8, 777, 0.9);
  }

  // FET: la compuerta abre cerca del cursor (+ respiración propia)
  const fetX = w * 0.34;
  const fetY = cy - 6;
  let openTarget = 0.3 + 0.25 * Math.sin(t * 1.6);
  if (st.mouse.active) {
    const d = Math.hypot(fetX - st.mouse.x, fetY - st.mouse.y);
    if (d < 220) openTarget = Math.max(openTarget, 1 - d / 220);
  }
  st.openK += ((staticFrame ? 0.7 : openTarget) - st.openK) * 0.08;
  const fs = clamp(Math.min(w, h) / 420, 0.55, 1.1);
  drawFET(ctx, fetX, fetY, fs, 83, clamp(st.openK, 0, 1));
  if (!staticFrame) dashedRing(ctx, fetX, fetY, 150 * fs, PAPER_PAL.ink, 55, [14, 10], 1.6, -t * 26);

  // reloj doubling: 1,2,4,8,16 electrones según fase (más rápido)
  const phase = Math.floor(t / 1.1) % 5;
  const nD = Math.pow(2, phase);
  const rr = rng(32 + phase);
  for (let j = 0; j < Math.min(nD, 16); j++) {
    const ex = w * 0.08 + rr() * w * 0.2;
    const ey = h * 0.14 + rr() * h * 0.16;
    drawElectron(ctx, ex, ey, 0.5, 330 + j, 0.35);
  }

  // asters centelleantes de fondo
  if (!staticFrame) {
    for (let k = 0; k < 3; k++) {
      const ax = w * (0.15 + k * 0.3);
      const ay = h * (0.2 + (k % 2) * 0.12);
      const g = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.2 + k * 2.1));
      aster(ctx, ax, ay, 7, 9, k === 1 ? ELEC : PAPER_PAL.shade, 500 + k * 37, g * 0.8);
    }
  }

  // electrones viajando por la pista
  for (const e of st.electrons) {
    const p = pointOnPath(pts, e.u);
    const py = p.y + (e.lane ? 20 : -6) + Math.sin(e.u * 14 + t * 3) * 4;
    let glow = 0.45;
    if (st.mouse.active) {
      const d = Math.hypot(p.x - st.mouse.x, py - st.mouse.y);
      if (d < 130) glow = 0.45 + (1 - d / 130) * 0.8;
    }
    drawElectron(ctx, p.x, py, e.s, e.seed, staticFrame ? 0.5 : glow);
  }

  // zigzag del reloj abajo (ondula en bucle)
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let x = 20; x <= w - 20; x += 26) {
    const wave = staticFrame ? 0 : Math.sin(x * 0.03 + t * 5) * 5;
    const sq = (Math.floor(x / 26) % 2 ? -16 : 16) + wave;
    if (x === 20) ctx.moveTo(x, h - 34 + sq);
    else ctx.lineTo(x, h - 34 + sq);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  dottedArc(ctx, w * 0.5, h - 34, 60, PAPER_PAL.shade, 103, 8, 1.2);

  // chispas de nacimiento (click)
  for (const s of st.sparks) {
    if (s.t < 0) continue;
    const g = 1 - s.t / 1.1;
    aster(ctx, s.x, s.y, 10, 12, ELEC, s.seed, g);
    drawElectron(ctx, s.x, s.y, 0.9 + (1 - g) * 0.5, s.seed + 5, g * 0.8);
  }

  // cursor: anillo dashed + seedDot cyan
  if (st.mouse.active) {
    dashedRing(ctx, st.mouse.x, st.mouse.y, 30 + Math.sin(t * 5) * 3, PAPER_PAL.ink, 77, [10, 8], 1.6, t * 26);
    seedDot(ctx, st.mouse.x, st.mouse.y, 7, PAPER_PAL.ink, ELEC);
  }

  // anchor cyan fijo + hint arriba del zigzag (sin solape con badge ni reloj)
  seedDot(ctx, 26, h - 64, 9, PAPER_PAL.ink, ELEC);
  ctx.save();
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 4;
  ctx.strokeStyle = PAPER_PAL.paper;
  ctx.strokeText('cpu: el fet abre cerca del cursor · click = chispa', 44, h - 60);
  ctx.fillStyle = PAPER_PAL.ink;
  ctx.fillText('cpu: el fet abre cerca del cursor · click = chispa', 44, h - 60);
  ctx.restore();
}

export default CpuField;
