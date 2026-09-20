import { useLanguage } from '../context/LanguageContext'

export default function Footer({ data }) {
  const { lang } = useLanguage()
  const { profile, footer } = data

  return (
    <footer className="flex flex-col items-center justify-center py-10 mt-4 border-t border-white/5">
      <p className="text-gray-500 text-sm">
        © 2024 {profile.name}. {footer.builtWith[lang]}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors text-sm">
          GitHub
        </a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors text-sm">
          LinkedIn
        </a>
        <span className="text-gray-600 text-xs">•</span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
          className="text-gray-400 hover:text-primary transition-colors text-sm underline underline-offset-4 focus:outline-none"
        >
          {lang === 'es' ? 'Preferencias de Cookies' : 'Cookie Preferences'}
        </button>
      </div>
    </footer>
  )
}
