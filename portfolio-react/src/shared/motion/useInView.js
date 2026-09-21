import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * IntersectionObserver de un disparo: revela al entrar al viewport.
 * Respeta prefers-reduced-motion (visible de inmediato).
 */
export function useInView({ rootMargin = '0px 0px -12% 0px', threshold = 0.15 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setInView(true);
      return undefined;
    }
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
  }, [rootMargin, threshold]);

  return { ref, inView };
}
