import { memo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { SectionHead, TechTag } from '@/shared/components/ui/Ink.jsx';

function ExperienceSection({ experience, technologies }) {
  const { lang, t } = useLanguage();
  return (
    <section id="experience" className="flex flex-col gap-5" aria-label={t('experience.title')}>
      <SectionHead kicker="// cola de trabajos" title={t('experience.title')} icon="history_edu" />

      {/* Blueprint nocturno: la inferencia ocurre de noche (escena I) */}
      <div className="blueprint rounded-[4px] border-[3px] border-ink p-6 shadow-[4px_5px_0_#1e1630]">
        <div className="grid grid-cols-[40px_1fr] gap-x-2">
          {experience.map((exp, index) => (
            <ExperienceItem key={exp.id} exp={exp} lang={lang} isFirst={index === 0} isLast={index === experience.length - 1} />
          ))}
        </div>
      </div>

      <div className="ink-card-flat p-5">
        <h3 className="hand-title mb-3 text-2xl">{t('tech.title')}</h3>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <TechTag key={tech} label={tech} />
          ))}
        </div>
      </div>
    </section>
  );
}

const ExperienceItem = memo(function ExperienceItem({ exp, lang, isFirst, isLast }) {
  return (
    <>
      <div className={`flex flex-col items-center gap-1 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
        {!isFirst && <div className="h-2 w-[2px] bg-chalk/20" aria-hidden />}
        <div className={`grid size-9 place-items-center rounded-full border-2 ${exp.isCurrent ? 'border-pgreen bg-pgreen/15 text-pgreen' : 'border-chalk/40 bg-white/5 text-chalk/70'}`}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden>{exp.icon}</span>
        </div>
        {!isLast && <div className="my-2 h-full w-[2px] grow bg-chalk/20" aria-hidden />}
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
