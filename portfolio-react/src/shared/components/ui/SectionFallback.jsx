import { memo } from 'react';

/** Skeleton papel para Suspense (evita CLS). */
export const SectionFallback = memo(function SectionFallback({ minHeight = 220, label = 'Dibujando sección…' }) {
  return (
    <div aria-busy="true" aria-label={label} className="ink-card-flat animate-pulse p-6" style={{ minHeight }}>
      <div className="mb-4 h-4 w-1/3 rounded bg-ink/10" />
      <div className="mb-3 h-8 w-2/3 rounded bg-ink/10" />
      <div className="h-4 w-full rounded bg-ink/5" />
    </div>
  );
});
