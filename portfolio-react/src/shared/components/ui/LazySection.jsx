import { memo } from 'react';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver.js';
import { SectionFallback } from './SectionFallback.jsx';

/**
 * Monta `children` solo cuando está cerca del viewport.
 * Ideal para secciones below-the-fold (Proyectos, Experiencia, Contacto).
 */
export const LazySection = memo(function LazySection({ children, minHeight = 280, fallbackLabel }) {
  const { ref, isVisible } = useIntersectionObserver({ rootMargin: '300px' });

  return (
    <div ref={ref} style={isVisible ? undefined : { minHeight }}>
      {isVisible ? children : <SectionFallback minHeight={minHeight} label={fallbackLabel} />}
    </div>
  );
});
