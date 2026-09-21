import { memo } from 'react';

/**
 * Cinta infinita CSS (0 JS en loop): duplica la lista y anima translateX.
 * Pausa en hover; estática con prefers-reduced-motion.
 */
const Marquee = memo(function Marquee({ items, className = '', separator = '✳' }) {
  const row = [...items, ...items];
  return (
    <div className={`marquee overflow-hidden border-y-[2.5px] border-ink bg-ink py-2.5 text-paper ${className}`} aria-hidden={false}>
      <div className="marquee-track flex w-max items-center gap-6 pr-6">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-6 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.2em]">
            {item}
            <span className="text-pgreen" aria-hidden>{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
});

export default Marquee;
