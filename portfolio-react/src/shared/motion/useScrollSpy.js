import { useEffect, useState } from 'react';

/** Sección activa según viewport (para nav con scrollspy). */
export function useScrollSpy(ids, { rootMargin = '-40% 0px -55% 0px' } = {}) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [ids, rootMargin]);

  return active;
}
