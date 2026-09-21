import { memo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';

function Footer({ data }) {
  const { lang, t } = useLanguage();
  const { profile, footer } = data;
  return (
    <footer className="mt-2 flex flex-col items-center justify-center border-t-[2.5px] border-ink py-8">
      <p className="hand-title text-2xl">petición lista · © 2024 {profile.name}</p>
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{footer.builtWith[lang]}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="font-mono text-sm font-bold underline decoration-pgreen decoration-[3px] underline-offset-4 hover:bg-pgreen/30">GitHub</a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="font-mono text-sm font-bold underline decoration-pgreen decoration-[3px] underline-offset-4 hover:bg-pgreen/30">LinkedIn</a>
        <span className="text-ink/40" aria-hidden>•</span>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
          className="font-mono text-sm text-ink/60 underline underline-offset-4 hover:text-ink">
          {t('footer.cookiePreferences')}
        </button>
      </div>
    </footer>
  );
}

export default memo(Footer);
