import { memo } from 'react';

export const ErrorState = memo(function ErrorState({ title, description, detail, onRetry, retryLabel = 'Reintentar' }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-paper p-6 text-ink">
      <div className="ink-card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="grid size-14 place-items-center rounded-full border-2 border-ink bg-blush/15">
          <span className="material-symbols-outlined text-3xl" aria-hidden>cloud_off</span>
        </div>
        <h2 className="hand-title text-4xl">{title}</h2>
        {description && <p className="text-sm leading-relaxed text-ink/70">{description}</p>}
        {detail && <p className="max-w-full truncate rounded-lg border border-blush/40 bg-blush/10 px-3 py-1.5 font-mono text-xs text-blush">{detail}</p>}
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-ink mt-2 flex items-center gap-2 bg-ink px-6 py-2.5 text-sm font-bold text-paper">
            <span className="material-symbols-outlined text-[18px]" aria-hidden>refresh</span>
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
});
