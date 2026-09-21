import { memo, useEffect, useRef, useState } from 'react';
import { useInView, prefersReducedMotion } from './useInView.js';

/** Extrae el número líder de un string ("15+", "3.5") para animarlo. */
function splitValue(raw) {
  const m = String(raw ?? '').match(/(\d+(?:[.,]\d+)?)(.*)/);
  if (!m) return { num: null, suffix: String(raw ?? '') };
  return { num: parseFloat(m[1].replace(',', '.')), suffix: m[2] || '' };
}

/** Número que cuenta al entrar en vista (easeOutExpo, rAF). */
const CountUp = memo(function CountUp({ value, duration = 1200, className = '' }) {
  const { ref, inView } = useInView();
  const { num, suffix } = splitValue(value);
  const [display, setDisplay] = useState(value);
  const done = useRef(false);

  useEffect(() => {
    if (!inView || done.current || num == null) return undefined;
    if (prefersReducedMotion()) {
      setDisplay(value);
      done.current = true;
      return undefined;
    }
    done.current = true;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const current = num * eased;
      setDisplay(`${Number.isInteger(num) ? Math.round(current) : current.toFixed(1)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num, suffix, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
});

export default CountUp;
