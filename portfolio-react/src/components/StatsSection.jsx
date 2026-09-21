import { memo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';

const statsConfig = [
  { key: 'yearsActive', icon: 'calendar_month', tape: 'VRAM' },
  { key: 'projects', icon: 'rocket_launch', tape: 'x2 x4 x8' },
  { key: 'techStack', icon: 'code', tape: '12 fps' },
  { key: 'experience', icon: 'work', tape: 'seed 7' },
];

function StatsSection({ stats }) {
  const { lang } = useLanguage();
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Stats">
      {statsConfig.map(({ key, icon, tape }) => (
        <div key={key} className="sticky group relative p-5 pt-7">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-[-3deg] border border-ink/30 bg-paperdeep px-2 font-mono text-[10px] font-bold uppercase tracking-widest">
            {tape}
          </span>
          <div className="mb-1 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{stats[key].label[lang]}</p>
            <span className="material-symbols-outlined text-ink/50 transition-colors group-hover:text-ink" aria-hidden>{icon}</span>
          </div>
          <p className="hand-title text-5xl leading-none">{stats[key].value}</p>
          <p className="mt-1 text-xs text-ink/60">{stats[key].sublabel[lang]}</p>
        </div>
      ))}
    </section>
  );
}

export default memo(StatsSection);
