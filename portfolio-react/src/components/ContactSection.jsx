import { memo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { SectionHead } from '@/shared/components/ui/Ink.jsx';

function ContactSection({ data }) {
  const { lang, t } = useLanguage();
  const { contact, profile } = data;
  return (
    <section id="contact" className="ink-card tape relative overflow-hidden p-6 md:p-10" aria-label={contact.title[lang]}>
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex max-w-xl flex-col gap-3">
          <SectionHead kicker="// respuesta lista" title={contact.title[lang]} icon="handshake" />
          <p className="leading-relaxed text-ink/75">{contact.description[lang]}</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50">flash + blob + el paquete sale → firma</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`mailto:${profile.email}`} className="btn-ink flex h-12 items-center gap-2 bg-ink px-6 text-sm font-bold text-paper">
            <span className="material-symbols-outlined text-[20px]" aria-hidden>mail</span>
            <span>{t('contact.sendEmail')}</span>
          </a>
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="btn-ink flex h-12 items-center gap-2 bg-paper px-6 text-sm font-bold text-ink">
            <span>GitHub</span><span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_outward</span>
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="btn-ink flex h-12 items-center gap-2 bg-paper px-6 text-sm font-bold text-ink">
            <span>LinkedIn</span><span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_outward</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default memo(ContactSection);
