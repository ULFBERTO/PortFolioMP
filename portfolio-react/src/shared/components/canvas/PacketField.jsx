import { memo, useEffect, useRef } from 'react';
import {
  PAPER_PAL,
  TAU,
  clamp,
  lerp,
  rng,
  wob,
  grain,
  seedDot,
  drawPacket,
  drawServerMini,
  speedLines,
  setupCanvas,
  prefersReducedMotion,
} from '@/shared/canvas/handEngine.js';

/**
 * Hero procedural interactivo (look ink de peticion.html).
 * - Paquetes verdes fluyen por lanes PCIe, reaccionan al mouse (repel/attract).
 * - Click/tap = burst estilo escena "respuesta" (blob + ripples).
 * - Servidor doodle al fondo + anchor verde fijo.
 * - Respeta prefers-reduced-motion (dibuja 1 frame estático).
 */
const PacketField = memo(function PacketField({ density = 7, className = '' }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ mouse: { x: -9999, y: -9999, active: false }, bursts: [], packets: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const st = stateRef.current;
    let raf = 0;
    let running = true;

    const seedPackets = (w, h) => {
      const r = rng(20260);
      const n = clamp(Math.round(density), 3, 14);
      st.packets = Array.from({ length: n }, (_, i) => ({
        u: r(),
        lane: Math.floor(r() * 3),
        speed: 0.05 + r() * 0.09,
        s: 0.42 + r() * 0.5,
        seed: 100 + i * 17,
        wob: r() * TAU,
      }));
    };

    const drawStatic = () => {
      const { ctx, w, h } = setupCanvas(canvas);
      paint(ctx, w, h, 0, st, true);
    };

    if (prefersReducedMotion()) {
      const { w, h } = canvas.getBoundingClientRect();
      seedPackets(w || 800, h || 400);
      drawStatic();
      const onResize = () => drawStatic();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches?.[0] ?? e;
      st.mouse.x = (p.clientX ?? 0) - rect.left;
      st.mouse.y = (p.clientY ?? 0) - rect.top;
      st.mouse.active = true;
    };
    const onLeave = () => {
      st.mouse.active = false;
      st.mouse.x = -9999;
    };
    const onTap = (e) => {
      onMove(e);
      st.bursts.push({ x: st.mouse.x, y: st.mouse.y, t: 0, seed: 500 + Math.floor(Math.random() * 999) });
      if (st.bursts.length > 6) st.bursts.shift();
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onTap);

    const resize = () => {
      const { w, h } = canvas.getBoundingClientRect();
      seedPackets(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const t0 = performance.now();
    const loop = (now) => {
      if (!running) return;
      const t = (now - t0) / 1000;
      const { ctx, w, h } = setupCanvas(canvas);
      // Avanzar paquetes
      for (const p of st.packets) {
        p.u += p.speed * 0.016;
        if (p.u > 1.15) {
          p.u = -0.15;
          p.lane = Math.floor(Math.random() * 3);
        }
      }
      for (const b of st.bursts) b.t += 0.016;
      st.bursts = st.bursts.filter((b) => b.t < 1.2);
      paint(ctx, w, h, t, st, false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onTap);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
});

function paint(ctx, w, h, t, st, staticFrame) {
  // Papel cálido + bandas + grain (como paper(c) del core)
  ctx.fillStyle = PAPER_PAL.paper;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = 'rgba(255,238,200,.55)';
  for (let i = -6; i <= 6; i++) ctx.fillRect(-w, i * 90 - 22, w * 2, 44);
  ctx.restore();
  grain(ctx, w, h, 160, '#8a6f4d', 0.08, 7);

  const cy = h * 0.56;
  const lanes = [-h * 0.16, 0, h * 0.16];

  // Servidor doodle al fondo derecha
  drawServerMini(ctx, w * 0.82, cy - h * 0.08, Math.min(300, w * 0.3), 190, 26, staticFrame ? 0.6 : t);

  // Lanes PCIe
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = 2;
  for (const off of lanes) {
    wob(ctx, [[10, cy + off], [w - 10, cy + off]], 2, 80 + Math.round(off), false);
  }

  // Paquetes
  for (const p of st.packets) {
    const px = lerp(-60, w * 0.68, p.u);
    const laneY = cy + lanes[p.lane];
    // Reacción al mouse: repulsión suave
    let py = laneY + Math.sin(p.u * 12 + p.wob + t * 2) * 10;
    let glow = 0.25;
    if (st.mouse.active) {
      const dx = px - st.mouse.x;
      const dy = py - st.mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < 160) {
        const f = 1 - d / 160;
        py -= f * 46;
        glow = 0.25 + f * 0.9;
        if (d < 90) speedLines(ctx, px, py, p.seed + 5, 6, PAPER_PAL.ink);
      }
    }
    if (!staticFrame && p.u > 0 && p.u < 1) speedLines(ctx, px, py, p.seed, 5, PAPER_PAL.ink);
    drawPacket(ctx, px, py, p.s, p.seed, glow);
  }

  // Bursts por click (blob + ripples + gotas, escena J)
  for (const b of st.bursts) {
    const k = 1 - b.t / 1.2;
    const R = 20 + b.t * 130;
    ctx.save();
    ctx.globalAlpha = 0.9 * k;
    ctx.fillStyle = PAPER_PAL.GREEN;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 26 * k + 8, 0, TAU);
    ctx.fill();
    ctx.restore();
    const r = rng(b.seed);
    for (let i = 0; i < 10; i++) {
      const a = r() * TAU;
      const d = (30 + r() * 90) * (1 - k * 0.4);
      ctx.fillStyle = i % 3 ? PAPER_PAL.GREEN : PAPER_PAL.blush;
      ctx.globalAlpha = k;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 2 + r() * 3.5, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const rr of [R, R * 0.7]) {
      ctx.save();
      ctx.strokeStyle = PAPER_PAL.GREEN;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7 * k;
      ctx.beginPath();
      ctx.arc(b.x, b.y, rr, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Anchor verde fijo (el punto que nunca se va)
  seedDot(ctx, 26, 26, 9);
  ctx.save();
  ctx.fillStyle = PAPER_PAL.ink;
  ctx.globalAlpha = 0.65;
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.fillText('packets: sigue el cursor · click = burst', 44, 30);
  ctx.restore();
}

export default PacketField;
