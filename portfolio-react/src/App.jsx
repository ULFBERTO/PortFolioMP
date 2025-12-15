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

function Portfolio() {
  const { data, isAdmin, setIsAdmin, loading } = useData()

  if (loading || !data) {
    return (
      <div className="bg-background-dark text-white h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAdmin && <AdminPanel onClose={() => setIsAdmin(false)} />}
      
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
    </>
  )
}

export default function App() {
  return (
    <DataProvider>
      <LanguageProvider>
        <Portfolio />
      </LanguageProvider>
    </DataProvider>
  )
}
