import { memo, useEffect, useMemo, useRef } from 'react';
import {
  PAPER_PAL,
  rng,
  grain,
  seedDot,
  plant,
  thread,
  aster,
  setupCanvas,
} from '@/shared/canvas/handEngine.js';

/**
 * Bosque procedural (test.html: plant + thread).
 * Cada recarga genera árboles distintos: seed aleatoria por montaje.
 * Render estático (sin loop): barato y siempre nítido.
 */
const PlantGrove = memo(function PlantGrove({ className = '' }) {
  const canvasRef = useRef(null);
  // Nueva seed en cada recarga de página → bosque único por visita
  const groveSeed = useMemo(() => Math.floor(Math.random() * 100000), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const paintAll = () => {
      const { ctx, w, h } = setupCanvas(canvas);
      paint(ctx, w, h, groveSeed);
    };
    paintAll();
    window.addEventListener('resize', paintAll);
    return () => window.removeEventListener('resize', paintAll);
  }, [groveSeed]);

  return (
    <div className={`ink-card-flat relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block h-[260px] w-full md:h-[300px]" role="img" aria-label="Bosque procedural único por visita" />
      <p className="pointer-events-none absolute bottom-3 right-4 rounded-full border border-ink/30 bg-paper px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
        bosque seed #{groveSeed} · recarga = otro bosque
      </p>
    </div>
  );
});

function paint(ctx, w, h, seed) {
  const r = rng(seed);
  ctx.fillStyle = PAPER_PAL.paper;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 140, '#8a6f4d', 0.07, seed % 97);

  // suelo
  ctx.save();
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 18) {
    const y = h - 26 + Math.sin(x * 0.02 + seed) * 5 + (r() - 0.5) * 3;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // hilos errantes (2-3)
  const nThreads = 2 + Math.floor(r() * 2);
  for (let k = 0; k < nThreads; k++) {
    const colors = [PAPER_PAL.accents[0], PAPER_PAL.accents[1], PAPER_PAL.blush];
    thread(ctx, w * (0.12 + (0.76 * k) / Math.max(1, nThreads - 1)) + (r() - 0.5) * 40, seed + 50 + k, colors[k % 3], 1.2, h);
  }

  // árboles aleatorios
  const fills = PAPER_PAL.fills;
  const accents = PAPER_PAL.accents;
  const nTrees = 4 + Math.floor(r() * 3);
  const order = Array.from({ length: nTrees }, (_, i) => i).sort(() => r() - 0.5);
  for (const k of order) {
    const x = w * (0.08 + (0.84 * k) / Math.max(1, nTrees - 1)) + (r() - 0.5) * 30;
    const base = h - 24 - r() * 14;
    const len = h * (0.09 + r() * 0.08);
    const depth = 3 + Math.floor(r() * 2);
    plant(ctx, x, base, len, depth, seed + 100 + k * 31, {
      stem: PAPER_PAL.ink,
      leaf: r() < 0.3 ? fills[Math.floor(r() * fills.length)] : accents[Math.floor(r() * accents.length)],
      flower: accents[Math.floor(r() * accents.length)],
      angle: -Math.PI / 2 + (r() - 0.5) * 0.5,
      width: 1.8,
    });
    if (r() < 0.5) aster(ctx, x + (r() - 0.5) * 60, base - len * 2.4, 6, 8, PAPER_PAL.shade, seed + 200 + k, 0.7);
  }

  // anchor
  seedDot(ctx, 24, 24, 8);
  ctx.save();
  ctx.fillStyle = PAPER_PAL.ink;
  ctx.globalAlpha = 0.65;
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.fillText('plant · thread · rng(seed)', 40, 28);
  ctx.restore();
}

export default PlantGrove;
