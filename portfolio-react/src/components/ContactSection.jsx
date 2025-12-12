import { useLanguage } from '../context/LanguageContext'

export default function ContactSection({ data }) {
  const { lang, t } = useLanguage()
  const { contact, profile } = data

  return (
    <section id="contact" className="flex flex-col gap-6 rounded-3xl bg-surface-dark p-6 md:p-10 border border-white/5 relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
        <div className="flex flex-col gap-4 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">handshake</span>
            <h2 className="text-white text-xl font-bold">{contact.title[lang]}</h2>
          </div>
          <p className="text-gray-400 text-base leading-relaxed">{contact.description[lang]}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-background-dark font-bold text-sm hover:bg-[#1fd665] transition-all glow-effect"
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            <span>{t('contact.sendEmail')}</span>
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 h-12 px-6 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <span>GitHub</span>
            <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 h-12 px-6 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <span>LinkedIn</span>
            <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
          </a>
        </div>
      </div>
    </section>
  )
}
