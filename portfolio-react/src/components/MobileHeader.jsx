import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function MobileHeader({ data }) {
  const { lang, setLang, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile } = data

  const toggleLang = () => setLang(lang === 'es' ? 'en' : 'es')

  return (
    <>
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-background-dark sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-full size-10 flex items-center justify-center text-background-dark font-bold">
            {profile.initials}
          </div>
          <span className="text-white font-bold">{profile.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="text-primary p-2 bg-white/5 rounded-full">
            <span className="text-sm font-bold">{lang.toUpperCase()}</span>
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background-dark z-40 p-6 pt-20">
          <nav className="flex flex-col gap-4">
            <MobileNavLink href="#dashboard" icon="dashboard" label={t('nav.dashboard')} onClick={() => setMenuOpen(false)} active />
            <MobileNavLink href="#projects" icon="folder_open" label={t('nav.projects')} onClick={() => setMenuOpen(false)} />
            <MobileNavLink href="#experience" icon="history" label={t('nav.experience')} onClick={() => setMenuOpen(false)} />
            <MobileNavLink href="#contact" icon="mail" label={t('nav.contact')} onClick={() => setMenuOpen(false)} />
          </nav>
        </div>
      )}
    </>
  )
}

function MobileNavLink({ href, icon, label, onClick, active }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-full ${active ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </a>
  )
}
