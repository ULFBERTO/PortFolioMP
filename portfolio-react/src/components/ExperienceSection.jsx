import { useLanguage } from '../context/LanguageContext'

export default function ExperienceSection({ experience, technologies }) {
  const { lang, t } = useLanguage()

  return (
    <section id="experience" className="xl:col-span-1 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">history_edu</span>
        <h2 className="text-white text-xl font-bold">{t('experience.title')}</h2>
      </div>

      <div className="bg-surface-dark rounded-3xl p-6 border border-white/5">
        <div className="grid grid-cols-[40px_1fr] gap-x-2">
          {experience.map((exp, index) => (
            <ExperienceItem
              key={exp.id}
              exp={exp}
              lang={lang}
              isFirst={index === 0}
              isLast={index === experience.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Core Technologies */}
      <div className="bg-gradient-to-br from-surface-dark to-primary/10 rounded-3xl p-6 border border-white/5">
        <h3 className="text-white font-bold mb-4">{t('tech.title')}</h3>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <span key={tech} className="px-3 py-1.5 rounded-lg bg-background-dark text-white text-xs font-medium border border-white/10">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExperienceItem({ exp, lang, isFirst, isLast }) {
  return (
    <>
      <div className={`flex flex-col items-center gap-1 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
        {!isFirst && <div className="w-[1px] bg-white/10 h-2"></div>}
        <div className={`w-8 h-8 rounded-full ${exp.isCurrent ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[18px]">{exp.icon}</span>
        </div>
        {!isLast && <div className="w-[1px] bg-white/10 h-full grow my-2"></div>}
      </div>
      <div className={`flex flex-1 flex-col ${!isLast ? 'pb-8' : ''} pt-1 pl-2`}>
        <p className="text-white text-base font-bold">{exp.title[lang]}</p>
        <p className={`${exp.isCurrent ? 'text-primary' : 'text-gray-400'} text-sm mb-1`}>{exp.date}</p>
        <p className="text-gray-400 text-sm leading-relaxed">{exp.description[lang]}</p>
      </div>
    </>
  )
}
