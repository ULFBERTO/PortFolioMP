import { memo } from 'react';

/** Skeleton ligero para Suspense de secciones (evita CLS). */
export const SectionFallback = memo(function SectionFallback({ minHeight = 220, label = 'Cargando sección…' }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="rounded-3xl bg-surface-dark border border-white/5 p-6 animate-pulse"
      style={{ minHeight }}
    >
      <div className="h-4 w-1/3 rounded bg-white/10 mb-4" />
      <div className="h-8 w-2/3 rounded bg-white/10 mb-3" />
      <div className="h-4 w-full rounded bg-white/5" />
    </div>
  );
});
