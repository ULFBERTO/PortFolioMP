import { useLanguage } from '../context/LanguageContext'

export default function HeroSection({ data }) {
  const { lang } = useLanguage()
  const { profile, hero } = data
  const firstName = profile.name.split(' ').slice(0, 2).join(' ')

  return (
    <section id="dashboard" className="flex flex-col gap-6 rounded-3xl bg-surface-dark p-6 md:p-10 border border-white/5 relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none float-animation"></div>
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-primary/3 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2 className="text-primary font-medium tracking-wide text-sm uppercase">Portfolio Dashboard v2.0</h2>
          <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight tracking-tight">
            {hero.greeting[lang]}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {firstName}.
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
            {hero.description[lang]}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SocialLink href={profile.github} label="GitHub" />
          <SocialLink href={profile.linkedin} label="LinkedIn" />
        </div>
      </div>
    </section>
  )
}

function SocialLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 h-12 px-6 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all group"
    >
      <span className="truncate">{label}</span>
      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_outward</span>
    </a>
  )
}
