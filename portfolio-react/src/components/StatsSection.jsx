import { useLanguage } from '../context/LanguageContext'

const statsConfig = [
  { key: 'yearsActive', icon: 'calendar_month' },
  { key: 'projects', icon: 'rocket_launch' },
  { key: 'techStack', icon: 'code' },
  { key: 'experience', icon: 'work' }
]

export default function StatsSection({ stats }) {
  const { lang } = useLanguage()

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map(({ key, icon }) => (
        <div
          key={key}
          className="flex flex-col gap-1 p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm font-medium">{stats[key].label[lang]}</p>
            <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">{icon}</span>
          </div>
          <p className="text-white text-3xl font-bold">{stats[key].value}</p>
          <p className="text-gray-500 text-xs">{stats[key].sublabel[lang]}</p>
        </div>
      ))}
    </section>
  )
}
