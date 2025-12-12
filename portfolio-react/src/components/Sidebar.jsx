import { useLanguage } from '../context/LanguageContext'

export default function Sidebar({ data }) {
  const { lang, setLang, t } = useLanguage()
  const { profile, sidebar } = data

  return (
    <aside className="w-80 h-full bg-surface-dark/50 border-r border-white/5 flex flex-col justify-between p-6 shrink-0 hidden lg:flex overflow-y-auto">
      <div className="flex flex-col gap-8">
        {/* User Profile */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-full size-12 ring-2 ring-primary/30 flex items-center justify-center text-background-dark font-bold text-lg">
              {profile.initials}
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-bold leading-normal">{profile.shortName}</h1>
              <p className="text-primary/80 text-xs font-medium uppercase tracking-wider">{profile.role[lang]}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          <NavLink href="#dashboard" icon="dashboard" label={t('nav.dashboard')} active />
          <NavLink href="#projects" icon="folder_open" label={t('nav.projects')} />
          <NavLink href="#experience" icon="history" label={t('nav.experience')} />
          <NavLink href="#contact" icon="mail" label={t('nav.contact')} />
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4">
        {/* Language Toggle */}
        <div className="flex items-center justify-between bg-white/5 rounded-full p-1">
          <button
            onClick={() => setLang('es')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${lang === 'es' ? 'bg-primary text-background-dark' : 'text-gray-400 hover:text-white'}`}
          >
            ES
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${lang === 'en' ? 'bg-primary text-background-dark' : 'text-gray-400 hover:text-white'}`}
          >
            EN
          </button>
        </div>

        {/* Availability Status */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-gray-400 text-xs mb-2">{sidebar.availability[lang]}</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="text-white text-sm font-medium">{sidebar.openToWork[lang]}</span>
          </div>
        </div>

        {/* Download CV Button */}
        <a
          href={profile.cvUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-12 px-4 bg-primary text-background-dark text-sm font-bold leading-normal tracking-wide hover:bg-[#1fd665] transition-colors glow-effect"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span className="truncate">{sidebar.downloadCV[lang]}</span>
        </a>
      </div>
    </aside>
  )
}

function NavLink({ href, icon, label, active }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <p className={`text-sm ${active ? 'font-bold' : 'font-medium'} leading-normal`}>{label}</p>
    </a>
  )
}
