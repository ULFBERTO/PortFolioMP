import { memo, useEffect, useRef } from 'react';
import { useMotionMode } from './motionPref.js';

/** Barra de progreso de lectura (scaleX, rAF throttle). */
const ScrollProgress = memo(function ScrollProgress() {
  const ref = useRef(null);
  const mode = useMotionMode();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (mode !== 'full') {
      el.style.display = 'none';
      return undefined;
    }
    el.style.display = '';
    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? doc.scrollTop / max : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mode]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-1.5 bg-ink/10" aria-hidden>
      <div ref={ref} className="h-full w-full origin-left bg-pgreen" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
});

export default ScrollProgress;
