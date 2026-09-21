import { memo } from 'react';

export const ErrorState = memo(function ErrorState({ title, description, detail, onRetry, retryLabel = 'Reintentar' }) {
  return (
    <div className="bg-background-dark text-white min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-dark border border-red-500/20 rounded-3xl p-8 flex flex-col items-center text-center gap-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <span className="material-symbols-outlined text-3xl" aria-hidden>cloud_off</span>
        </div>
        <h2 className="text-white text-xl font-bold">{title}</h2>
        {description && <p className="text-gray-400 text-sm leading-relaxed">{description}</p>}
        {detail && (
          <p className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 max-w-full truncate">
            {detail}
          </p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 px-6 py-2.5 rounded-full bg-primary hover:bg-[#1fd665] text-background-dark font-bold text-sm transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>refresh</span>
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
});
