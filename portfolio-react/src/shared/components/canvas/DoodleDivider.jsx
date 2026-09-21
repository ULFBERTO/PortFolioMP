import { memo, useEffect, useRef } from 'react';
import { PAPER_PAL, TAU, rng, setupCanvas, prefersReducedMotion } from '@/shared/canvas/handEngine.js';

/**
 * Divider procedural: anillos dashed + dottedArc + paquete viajero.
 * Liviano (1 canvas ~64px alto, ~30fps throttle por IntersectionObserver).
 */
const DoodleDivider = memo(function DoodleDivider({ seed = 11, label = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let raf = 0;
    let visible = true;
    let running = true;

    const draw = (t) => {
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const r = rng(seed);
      // línea central wobble
      ctx.strokeStyle = PAPER_PAL.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 8; x <= w - 8; x += 14) {
        const y = cy + Math.sin(x * 0.02 + t * 1.6 + seed) * 4 + (r() - 0.5) * 2;
        if (x === 8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // anillos
      for (const [rr, dash] of [[26, [10, 8]], [40, [4, 7]]]) {
        ctx.save();
        ctx.strokeStyle = PAPER_PAL.ink;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(dash);
        ctx.lineDashOffset = -t * 22;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      // dots
      ctx.fillStyle = PAPER_PAL.GREEN;
      const n = 18;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + t * 0.7;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 33, cy + Math.sin(a) * 33, 2.2, 0, TAU);
        ctx.fill();
      }
      // paquete viajero
      const u = (t * 0.14 + seed * 0.01) % 1;
      const px = 20 + u * (w - 40);
      const py = cy + Math.sin(u * 9 + seed) * 9;
      ctx.fillStyle = PAPER_PAL.GREEN;
      ctx.strokeStyle = PAPER_PAL.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(px - 13, py - 9, 26, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PAPER_PAL.ink;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, TAU);
      ctx.fill();
    };

    if (prefersReducedMotion()) {
      draw(0.4);
      return undefined;
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    const t0 = performance.now();
    let last = 0;
    const loop = (now) => {
      if (!running) return;
      if (visible && now - last > 33) {
        last = now;
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [seed]);

  return (
    <div className="relative flex items-center gap-3" aria-hidden>
      <canvas ref={ref} className="h-16 w-full" />
      {label ? (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-3 font-hand text-xl text-ink">
          {label}
        </span>
      ) : null}
    </div>
  );
});

export default DoodleDivider;
