import { memo, useEffect, useRef } from 'react';
import { prefersReducedMotion } from './useInView.js';

/** Tilt 3D sutil en cards (rotateX/Y máx 7°, solo transform). */
const Tilt = memo(function Tilt({ children, max = 7, className = '', style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined;
    let raf = 0;
    let target = { x: 0, y: 0 };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      target = { x: (-py * max).toFixed(2), y: (px * max).toFixed(2) };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(800px) rotateX(${target.x}deg) rotateY(${target.y}deg) translateY(-4px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={className} style={{ transition: 'transform .25s ease', ...style }}>
      {children}
    </div>
  );
});

export default Tilt;
