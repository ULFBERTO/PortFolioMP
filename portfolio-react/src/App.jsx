import { LanguageProvider } from './context/LanguageContext'
import { DataProvider, useData } from './context/DataContext'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'
import HeroSection from './components/HeroSection'
import StatsSection from './components/StatsSection'
import ExperienceSection from './components/ExperienceSection'
import ProjectsSection from './components/ProjectsSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import AdminPanel from './components/AdminPanel'
import CookieConsent from './components/CookieConsent'

import { useLanguage } from './context/LanguageContext'

function Portfolio() {
  const { data, isAdmin, logout, loading, error, refetch } = useData()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="bg-background-dark text-white h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-background-dark text-white h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-dark border border-red-500/20 rounded-3xl p-8 flex flex-col items-center text-center gap-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined text-3xl">cloud_off</span>
          </div>
          <h2 className="text-white text-xl font-bold">{t('common.errorTitle')}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t('common.errorConnectionDesc')}
          </p>
          {error && (
            <p className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 max-w-full truncate">
              {error}
            </p>
          )}
          <button
            onClick={refetch}
            className="mt-2 px-6 py-2.5 rounded-full bg-primary hover:bg-[#1fd665] text-background-dark font-bold text-sm transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>{t('common.retry')}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAdmin && <AdminPanel onClose={logout} />}
      
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden h-screen flex">
        <Sidebar data={data} />

        <main className="flex-1 h-full overflow-y-auto relative">
          <MobileHeader data={data} />

          <div className="layout-container flex flex-col max-w-[1400px] mx-auto p-4 lg:p-10 gap-8">
            <HeroSection data={data} />
            <StatsSection stats={data.stats} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <ExperienceSection
                experience={data.experience}
                technologies={data.technologies}
              />
              <ProjectsSection projects={data.projects} />
            </div>

            <ContactSection data={data} />
            <Footer data={data} />
          </div>
        </main>
      </div>

      <CookieConsent />
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <Portfolio />
      </DataProvider>
    </LanguageProvider>
  )
}
