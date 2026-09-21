import { useEffect, useRef, useState } from 'react';
import { MOTION_EVENT, motionAllowed, systemReduced } from './motionPref.js';

// Compat: antes se leía el SO directo; ahora manda el modo global (toggle).
export function prefersReducedMotion() {
  return !motionAllowed();
}

/**
 * IntersectionObserver de un disparo: revela al entrar al viewport.
 * En modo reduced, visible de inmediato (sin animación).
 * Reacciona al toggle de movimiento.
 */
export function useInView({ rootMargin = '0px 0px -12% 0px', threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => !motionAllowed());
  const [reduced, setReduced] = useState(() => !motionAllowed());

  useEffect(() => {
    const sync = () => {
      const r = !motionAllowed();
      setReduced(r);
      if (r) setInView(true);
    };
    sync();
    window.addEventListener(MOTION_EVENT, sync);
    let mq = null;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener?.('change', sync);
    } catch {
      /* noop */
    }
    return () => {
      window.removeEventListener(MOTION_EVENT, sync);
      try {
        mq?.removeEventListener?.('change', sync);
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, reduced]);

  return { ref, inView };
}

export { systemReduced };
