import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { SectionHead } from '@/shared/components/ui/Ink.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import {
  PAPER_PAL,
  ELEC,
  TAU,
  clamp,
  rng,
  wob,
  grain,
  seedDot,
  hexCorners,
  pointInHex,
  hexLattice,
  hexPath,
  aster,
  dashedRing,
  handText,
  hatch,
  setupCanvas,
  prefersReducedMotion,
} from '@/shared/canvas/handEngine.js';

const ProjectModal = lazy(() => import('./ProjectModal.jsx'));

const EXTRUDE_DEPTH = 0.5; // fracción de s

/**
 * Proyectos Destacados como panal hexagonal (test.html: hexLattice + aster).
 * Cada hexágono es un proyecto: hover con cursor custom, click = extrusión
 * de la cara (prisma animado) y luego abre el detalle.
 */
function HexProjects({ projects }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const openedFor = useRef(-1); // índice cuya extrusión ya abrió el modal
  const [modalProject, setModalProject] = useState(null);
  const anim = useRef({
    mouse: { x: -9999, y: -9999, inside: false },
    hover: -1,
    hoverK: 0,
    cells: [],
    s: 70,
    expanding: -1, // índice en extrusión
    ext: 0, // 0..1 progreso extrusión
    extTarget: 0,
    twinkles: [],
    visible: true,
  });

  const fills = useMemo(
    () => [PAPER_PAL.fills[0], ELEC, PAPER_PAL.fills[1], PAPER_PAL.accents[2], PAPER_PAL.fills[2], PAPER_PAL.accents[0]],
    [],
  );

  const layout = useCallback((w, h, n) => {
    const st = anim.current;
    const cols = n <= 3 ? n : Math.ceil(n / 2);
    const rows = n <= 3 ? 1 : 2;
    const s = clamp(Math.min((w * 0.86) / (cols * 1.78), (h * 0.72) / (rows * 2.05)), 44, 104);
    st.s = s;
    const cells = [];
    let idx = 0;
    for (let row = 0; row < rows && idx < n; row++) {
      const inRow = row === 0 ? Math.min(cols, n) : n - Math.min(cols, n);
      const rowW = inRow * Math.sqrt(3) * s;
      const x0 = w / 2 - rowW / 2 + (Math.sqrt(3) * s) / 2 + (row % 2 ? (Math.sqrt(3) * s) / 2 : 0);
      const y0 = h / 2 - ((rows - 1) * 1.5 * s) / 2;
      for (let k = 0; k < inRow && idx < n; k++, idx++) {
        cells.push({ x: x0 + k * Math.sqrt(3) * s, y: y0 + row * 1.5 * s });
      }
    }
    st.cells = cells;
    const r = rng(77);
    st.twinkles = Array.from({ length: 10 }, () => ({
      x: r() * w,
      y: r() * h,
      seed: 300 + Math.floor(r() * 900),
      ph: r() * TAU,
    }));
  }, []);

  const openProject = useCallback(
    (index) => {
      const st = anim.current;
      if (st.expanding !== -1 || index < 0 || index >= projects.length) return;
      if (prefersReducedMotion()) {
        setModalProject(projects[index]);
        return;
      }
      st.expanding = index;
      st.extTarget = 1;
    },
    [projects],
  );

  const closeModal = useCallback(() => {
    setModalProject(null);
    anim.current.extTarget = 0; // la cara baja de vuelta
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const st = anim.current;
    let raf = 0;
    let running = true;

    const toLocal = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e) => {
      const p = toLocal(e);
      st.mouse.x = p.x;
      st.mouse.y = p.y;
      st.mouse.inside = true;
      let h = -1;
      for (let i = 0; i < st.cells.length; i++) {
        if (pointInHex(p.x, p.y, st.cells[i].x, st.cells[i].y, st.s)) {
          h = i;
          break;
        }
      }
      st.hover = h;
    };
    const onLeave = () => {
      st.mouse.inside = false;
      st.mouse.x = -9999;
      st.hover = -1;
    };
    const onTap = (e) => {
      onMove(e);
      if (st.hover !== -1) openProject(st.hover);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onTap);

    const io = new IntersectionObserver(([entry]) => {
      st.visible = entry.isIntersecting;
    });
    if (wrapRef.current) io.observe(wrapRef.current);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      layout(rect.width, rect.height, projects.length);
      if (prefersReducedMotion()) {
        const { ctx, w, h } = setupCanvas(canvas);
        paint(ctx, w, h, 0, st, projects, fills);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    if (prefersReducedMotion()) {
      return () => {
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('pointerdown', onTap);
        io.disconnect();
      };
    }

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (!st.visible) return;
      // extrusión: easing hacia el target
      const speed = st.extTarget === 1 ? 0.075 : 0.1;
      st.ext += (st.extTarget - st.ext) * speed;
      if (Math.abs(st.extTarget - st.ext) < 0.005) {
        st.ext = st.extTarget;
        if (st.ext === 1 && st.expanding !== -1 && openedFor.current !== st.expanding) {
          openedFor.current = st.expanding;
          setModalProject(projects[st.expanding]);
        }
        if (st.ext === 0) {
          st.expanding = -1;
          openedFor.current = -1;
        }
      }
      st.hoverK += ((st.hover !== -1 ? 1 : 0) - st.hoverK) * 0.15;
      const { ctx, w, h } = setupCanvas(canvas);
      paint(ctx, w, h, performance.now() / 1000, st, projects, fills);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onTap);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length, layout, fills, openProject]);

  return (
    <section id="projects" className="flex flex-col gap-5" aria-label={t('projects.title')}>
      <Reveal>
        <SectionHead kicker="// panal x2 x4 x8" title={t('projects.title')} icon="hexagon" />
      </Reveal>
      <Reveal delay={100}>
        <div ref={wrapRef} className="ink-card relative overflow-hidden p-2">
          <canvas
            ref={canvasRef}
            className="block h-[380px] w-full md:h-[440px]"
            style={{ cursor: 'none', touchAction: 'manipulation' }}
            role="img"
            aria-label={t('projects.title')}
          />
          <p className="pointer-events-none absolute bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border-2 border-ink bg-paper px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
            hover = cursor hex · click = extruir cara
          </p>
        </div>
      </Reveal>
      {/* Fallback accesible: lista de proyectos (teclado / lector) */}
      <div className="flex flex-wrap gap-2" role="list" aria-label={t('projects.title')}>
        {projects.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            onClick={() => openProject(i)}
            className="btn-ink bg-paper px-4 py-1.5 font-mono text-xs font-bold text-ink"
          >
            {p.title}
          </button>
        ))}
      </div>
      {modalProject && (
        <Suspense fallback={null}>
          <ProjectModal project={modalProject} onClose={closeModal} />
        </Suspense>
      )}
    </section>
  );
}

function drawHexCell(ctx, cx, cy, s, fill, seed, label, sub, hovered, dimmed) {
  const pts = hexCorners(cx, cy, s);
  const body = new Path2D();
  pts.forEach((p, i) => (i ? body.lineTo(p[0], p[1]) : body.moveTo(p[0], p[1])));
  body.closePath();
  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.45;
  ctx.fillStyle = fill;
  ctx.fill(body);
  hatch(ctx, body, [cx - s, cy - s, s * 2, s * 2], { seed: seed + 2, alpha: 0.2 });
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = hovered ? 3.4 : 2.6;
  wob(ctx, pts, 2, seed + 3, true);
  // mini lattice dentro
  ctx.save();
  ctx.clip(body);
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.globalAlpha = (dimmed ? 0.1 : 0.18);
  ctx.lineWidth = 0.8;
  const w = Math.sqrt(3) * 11;
  for (let y = cy - s; y < cy + s; y += 16) {
    for (let x = cx - s; x < cx + s; x += w) {
      hexPath(ctx, x, y, 10);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (hovered) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = ELEC;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 1.02, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  handText(ctx, label, cx, cy - s * 0.12, { size: Math.max(26, s * 0.52), ink: PAPER_PAL.ink });
  ctx.save();
  ctx.fillStyle = PAPER_PAL.ink;
  ctx.globalAlpha = 0.7;
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(sub, cx, cy + s * 0.42);
  ctx.restore();
  ctx.restore();
}

/** Extrusión de la cara: prisma del hex base a la cara desplazada. */
function drawExtrusion(ctx, cx, cy, s, ext, fill, seed, title) {
  if (ext <= 0.01) return;
  const d = s * EXTRUDE_DEPTH * ext;
  const ox = -d;
  const oy = -d;
  const base = hexCorners(cx, cy, s);
  const top = base.map(([x, y]) => [x + ox, y + oy]);
  // caras laterales
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = i % 2 ? PAPER_PAL.shade : '#5a3d28';
    ctx.beginPath();
    ctx.moveTo(base[i][0], base[i][1]);
    ctx.lineTo(base[j][0], base[j][1]);
    ctx.lineTo(top[j][0], top[j][1]);
    ctx.lineTo(top[i][0], top[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = PAPER_PAL.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }
  // cara superior
  const face = new Path2D();
  top.forEach((p, i) => (i ? face.lineTo(p[0], p[1]) : face.moveTo(p[0], p[1])));
  face.closePath();
  ctx.save();
  ctx.fillStyle = PAPER_PAL.light;
  ctx.fill(face);
  hatch(ctx, face, [cx - s, cy - s, s * 2, s * 2], { seed: seed + 9, alpha: 0.18 });
  ctx.strokeStyle = PAPER_PAL.ink;
  ctx.lineWidth = 3;
  wob(ctx, top, 1.6, seed + 11, true);
  ctx.restore();
  // título sobre la cara (aparece con la extrusión)
  ctx.save();
  ctx.globalAlpha = clamp((ext - 0.35) / 0.65, 0, 1);
  const short = title.length > 16 ? `${title.slice(0, 15)}…` : title;
  handText(ctx, short, cx + ox, cy + oy, { size: Math.max(20, s * 0.3), ink: PAPER_PAL.ink });
  ctx.restore();
  // chispa en el pico
  if (ext > 0.5) aster(ctx, cx + ox, cy + oy - s * 0.9, 7, 8, ELEC, seed + 13, (ext - 0.5) * 2);
}

function paint(ctx, w, h, t, st, projects, fills) {
  ctx.fillStyle = PAPER_PAL.paper;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 120, '#8a6f4d', 0.07, 7);
  hexLattice(ctx, [0, 0, w, h], 26, PAPER_PAL.ink, 0.12, 1, 5);

  // asters centelleantes de fondo
  for (const tw of st.twinkles) {
    const g = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.7 + tw.ph));
    aster(ctx, tw.x, tw.y, 6, 8, g > 0.5 ? ELEC : PAPER_PAL.shade, tw.seed, g * 0.7);
  }

  const s = st.s;
  const anyExpanding = st.expanding !== -1;

  projects.forEach((p, i) => {
    const cell = st.cells[i];
    if (!cell) return;
    const isExp = i === st.expanding;
    const isHover = i === st.hover;
    const k = 1 + (isHover && !anyExpanding ? 0.06 * st.hoverK : 0);
    const label = (p.title || '?').trim().charAt(0).toUpperCase() || '?';
    drawHexCell(ctx, cell.x, cell.y, s * k, fills[i % fills.length], 120 + i * 17, label, p.year || '', isHover, anyExpanding && !isExp);
    if (isExp) {
      drawExtrusion(ctx, cell.x, cell.y, s, st.ext, fills[i % fills.length], 120 + i * 17, p.title || '');
    }
  });

  // cursor custom hexagonal
  if (st.mouse.inside) {
    const { x, y } = st.mouse;
    if (st.hover !== -1 && st.cells[st.hover]) {
      const cell = st.cells[st.hover];
      dashedRing(ctx, cell.x, cell.y, s * 1.18, PAPER_PAL.ink, 77, [10, 8], 2, t * 30);
      seedDot(ctx, x, y, 6, PAPER_PAL.ink, ELEC);
    } else {
      ctx.save();
      ctx.strokeStyle = PAPER_PAL.ink;
      ctx.lineWidth = 1.6;
      hexPath(ctx, x, y, 11 + Math.sin(t * 4) * 1.5);
      ctx.stroke();
      ctx.fillStyle = ELEC;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  seedDot(ctx, 24, h - 24, 8, PAPER_PAL.ink, ELEC);
}

export default memo(HexProjects);
