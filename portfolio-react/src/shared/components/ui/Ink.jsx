import { memo } from 'react';

/** Kicker mono + título manuscrito, firma visual del look ink. */
export const SectionHead = memo(function SectionHead({ kicker, title, icon = 'draw', tone = 'ink' }) {
  const sub = tone === 'chalk' ? 'text-chalk/70' : 'text-ink/60';
  const ttl = tone === 'chalk' ? 'text-chalk' : 'text-ink';
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full border-2 border-current" aria-hidden>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${sub}`}>{kicker}</p>
        <h2 className={`hand-title text-3xl leading-none ${ttl}`}>
          <span className="hand-underline">{title}</span>
        </h2>
      </div>
    </div>
  );
});

export const TechTag = memo(function TechTag({ label, tone = 'ink' }) {
  if (tone === 'chalk') {
    return (
      <span className="rounded-full border border-chalk/40 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-chalk">
        {label}
      </span>
    );
  }
  return (
    <span className="rounded-full border-2 border-ink bg-pgreen/30 px-2.5 py-0.5 font-mono text-[11px] font-bold text-ink">
      {label}
    </span>
  );
});
