import { memo, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { SectionHead, TechTag } from '@/shared/components/ui/Ink.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import { prefersReducedMotion } from '@/shared/motion/useInView.js';

function ExperienceSection({ experience, technologies }) {
  const { lang, t } = useLanguage();
  const trackRef = useRef(null);
  const lineRef = useRef(null);

  // Línea de progreso que se dibuja con el scroll (scaleY, transform-only)
  useEffect(() => {
    const track = trackRef.current;
    const line = lineRef.current;
    if (!track || !line || prefersReducedMotion()) return undefined;
    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh * 0.4;
      const done = vh * 0.7 - r.top;
      line.style.transform = `scaleY(${Math.min(1, Math.max(0, done / total)).toFixed(3)})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section id="experience" className="flex flex-col gap-5" aria-label={t('experience.title')}>
      <Reveal><SectionHead kicker="// cola de trabajos" title={t('experience.title')} icon="history_edu" /></Reveal>

      <Reveal delay={120}>
        <div className="blueprint rounded-[4px] border-[3px] border-ink p-6 shadow-[4px_5px_0_#1e1630]">
          <div ref={trackRef} className="relative grid grid-cols-[40px_1fr] gap-x-2">
            {/* rail base + progreso verde */}
            <div className="absolute bottom-2 left-[19px] top-2 w-[2px] bg-chalk/15" aria-hidden />
            <div
              ref={lineRef}
              className="absolute bottom-2 left-[19px] top-2 w-[2px] origin-top bg-pgreen"
              style={{ transform: 'scaleY(0)' }}
              aria-hidden
            />
            {experience.map((exp, index) => (
              <ExperienceItem key={exp.id} exp={exp} lang={lang} isFirst={index === 0} isLast={index === experience.length - 1} />
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="ink-card-flat p-5">
          <h3 className="hand-title mb-3 text-2xl">{t('tech.title')}</h3>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <TechTag key={tech} label={tech} />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const ExperienceItem = memo(function ExperienceItem({ exp, lang, isFirst, isLast }) {
  return (
    <>
      <div className={`relative z-10 flex flex-col items-center gap-1 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
        <div className={`grid size-9 place-items-center rounded-full border-2 transition-all duration-300 ${
          exp.isCurrent ? 'border-pgreen bg-pgreen/15 text-pgreen shadow-[0_0_16px_rgba(92,255,92,.35)]' : 'border-chalk/40 bg-night text-chalk/70'
        }`}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden>{exp.icon}</span>
        </div>
      </div>
      <div className={`flex flex-1 flex-col ${!isLast ? 'pb-7' : ''} pl-2 pt-1`}>
        <p className="font-bold text-chalk">{exp.title[lang]}</p>
        <p className={`mb-1 font-mono text-xs ${exp.isCurrent ? 'text-pgreen' : 'text-chalk/60'}`}>{exp.date}</p>
        <p className="text-sm leading-relaxed text-chalk/75">{exp.description[lang]}</p>
      </div>
    </>
  );
});

export default memo(ExperienceSection);
