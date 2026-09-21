import { memo } from 'react';

export const Spinner = memo(function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
      {label && <p className="text-gray-400">{label}</p>}
    </div>
  );
});
