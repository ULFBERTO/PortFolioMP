import { memo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { NAVIGATION } from '@/config/app.js';
import { printAtsPdf } from '@/features/cvs/atsResume.js';

function Sidebar({ data, activeSection, atsCv }) {
  const { lang, setLang, t } = useLanguage();
  const { profile, sidebar } = data;

  return (
    <aside className="hidden h-full w-80 shrink-0 flex-col justify-between gap-6 overflow-y-auto border-r-[3px] border-ink bg-paper p-6 lg:flex">
      <div className="flex flex-col gap-7">
        <div className="ink-card-flat flex items-center gap-3 p-3">
          <div className="grid size-12 place-items-center rounded-full border-2 border-ink bg-pgreen font-hand text-2xl font-bold">
            {profile.initials}
          </div>
          <div>
            <h1 className="hand-title text-2xl leading-none">{profile.shortName}</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">{profile.role[lang]}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Principal">
          {NAVIGATION.map((item) => (
            <NavLink
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={t(item.i18nKey)}
              active={activeSection ? activeSection === item.id : item.id === 'dashboard'}
            />
          ))}
        </nav>

        <div className="sticky -rotate-1 border-2 border-ink bg-[#fff6d9] p-3 shadow-[3px_4px_0_#1e1630]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">{sidebar.availability[lang]}</p>
          <p className="hand-title text-xl leading-tight">● {sidebar.openToWork[lang]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-full border-2 border-ink bg-white/60 p-1" role="group" aria-label="Idioma">
          {['es', 'en'].map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => setLang(lng)}
              aria-pressed={lang === lng}
              className={`flex-1 rounded-full px-4 py-2 font-mono text-sm font-bold transition-all ${
                lang === lng ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
        <a
          href={profile.cvUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ink flex h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-sm font-bold text-paper"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span className="truncate">{sidebar.downloadCV[lang]}</span>
        </a>
        {atsCv && (
          <button
            type="button"
            onClick={() => printAtsPdf(atsCv, { lang, siteUrl: window.location.origin })}
            className="btn-ink flex h-12 w-full items-center justify-center gap-2 bg-paper px-4 text-sm font-bold text-ink"
            title="Descarga la hoja ATS en PDF (diálogo de impresión)"
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            <span className="truncate">PDF ATS</span>
          </button>
        )}
      </div>
    </aside>
  );
}

const NavLink = memo(function NavLink({ href, icon, label, active }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 border-2 px-4 py-2.5 font-mono text-sm transition-all ${
        active
          ? 'rotate-[-0.5deg] border-ink bg-pgreen/40 font-bold shadow-[3px_3px_0_#1e1630]'
          : 'border-transparent text-ink/60 hover:rotate-[0.4deg] hover:border-ink hover:bg-white/60 hover:text-ink'
      }`}
      style={{ borderRadius: '225px 15px 255px 15px / 15px 255px 15px 225px' }}
    >
      <span className="material-symbols-outlined" aria-hidden>{icon}</span>
      <span>{label}</span>
    </a>
  );
});

export default memo(Sidebar);
