import { memo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import CountUp from '@/shared/motion/CountUp.jsx';

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
      {statsConfig.map(({ key, icon, tape }, i) => (
        <Reveal key={key} delay={(i % 4) * 90} rotate={i % 2 ? 1 : -1}>
          <div className="sticky group relative p-5 pt-7 transition-transform duration-300 hover:-translate-y-1 hover:rotate-0">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-[-3deg] border border-ink/30 bg-paperdeep px-2 font-mono text-[10px] font-bold uppercase tracking-widest">
              {tape}
            </span>
            <div className="mb-1 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{stats[key].label[lang]}</p>
              <span className="material-symbols-outlined text-ink/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-ink" aria-hidden>{icon}</span>
            </div>
            <p className="hand-title text-5xl leading-none">
              <CountUp value={stats[key].value} />
            </p>
            <p className="mt-1 text-xs text-ink/60">{stats[key].sublabel[lang]}</p>
          </div>
        </Reveal>
      ))}
    </section>
  );
}

export default memo(StatsSection);
