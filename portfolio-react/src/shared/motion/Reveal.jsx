import { memo } from 'react';
import { useInView } from './useInView.js';

/**
 * Reveal on scroll estilo Motion.whileInView, solo transform+opacity.
 * @param {number} delay ms de stagger · @param {number} y px de subida
 * @param {number} rotate deg de garabato · @param {'up'|'left'|'right'|'none'} from
 */
const Reveal = memo(function Reveal({
  children,
  delay = 0,
  y = 26,
  rotate = 0,
  from = 'up',
  className = '',
  as: Tag = 'div',
}) {
  const { ref, inView } = useInView();

  const offset =
    from === 'none'
      ? 'translate3d(0,0,0)'
      : from === 'left'
        ? `translate3d(-${y}px,0,0)`
        : from === 'right'
          ? `translate3d(${y}px,0,0)`
          : `translate3d(0,${y}px,0)`;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate3d(0,0,0) rotate(0deg)' : `${offset} rotate(${rotate}deg)`,
        transitionProperty: 'opacity, transform',
        transitionDuration: '650ms',
        transitionTimingFunction: 'cubic-bezier(.22,.9,.28,1)',
        transitionDelay: `${delay}ms`,
        willChange: inView ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
});

export default Reveal;
