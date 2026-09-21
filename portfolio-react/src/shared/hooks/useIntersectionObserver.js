import { useEffect, useRef, useState } from 'react';

/**
 * Observa visibilidad para lazy-mount de secciones pesadas.
 * @param {{rootMargin?: string, threshold?: number, once?: boolean}} opts
 */
export function useIntersectionObserver({ rootMargin = '200px', threshold = 0, once = true } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, isVisible };
}
