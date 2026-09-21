import { memo, useEffect, useRef } from 'react';
import { prefersReducedMotion } from './useInView.js';

/** Botón magnético: atrae hacia el cursor (máx 10px), vuelve con lerp. Solo puntero fino. */
const Magnetic = memo(function Magnetic({ children, strength = 10, className = '' }) {
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined;
    let raf = 0;
    let hovering = false;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      target.current = {
        x: (dx / r.width) * strength * 2,
        y: (dy / r.height) * strength * 2,
      };
      if (!hovering) {
        hovering = true;
        loop();
      }
    };
    const onLeave = () => {
      target.current = { x: 0, y: 0 };
      hovering = true;
      loop();
      setTimeout(() => {
        if (Math.hypot(pos.current.x, pos.current.y) < 0.4) hovering = false;
      }, 350);
    };
    const loop = () => {
      if (!hovering) return;
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      el.style.transform = `translate3d(${pos.current.x.toFixed(2)}px, ${pos.current.y.toFixed(2)}px, 0)`;
      if (hovering) raf = requestAnimationFrame(loop);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      hovering = false;
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  );
});

export default Magnetic;
