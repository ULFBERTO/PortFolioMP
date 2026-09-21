import { Suspense, lazy, memo } from 'react';
import { AppProviders } from '@/app/providers.jsx';
import { useData } from '@/context/DataContext.jsx';
import { useLanguage } from '@/context/LanguageContext.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import MobileHeader from '@/components/MobileHeader.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import StatsSection from '@/components/StatsSection.jsx';
import { Spinner, ErrorState, SectionFallback, LazySection } from '@/shared/components/ui/index.js';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary.jsx';

// ---- Code splitting: below-the-fold y uso esporádico van a chunks separados ----
const ExperienceSection = lazy(() => import('@/components/ExperienceSection.jsx'));
const ProjectsSection = lazy(() => import('@/components/ProjectsSection.jsx'));
const ContactSection = lazy(() => import('@/components/ContactSection.jsx'));
const Footer = lazy(() => import('@/components/Footer.jsx'));
const AdminPanel = lazy(() => import('@/components/AdminPanel.jsx'));
const CookieConsent = lazy(() => import('@/components/CookieConsent.jsx'));

const PortfolioShell = memo(function PortfolioShell({ children }) {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden h-screen flex">
      {children}
    </div>
  );
});

function Portfolio() {
  const { data, isAdmin, logout, loading, error, refetch } = useData();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="bg-background-dark text-white h-screen flex items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title={t('common.errorTitle')}
        description={t('common.errorConnectionDesc')}
        detail={error}
        onRetry={refetch}
        retryLabel={t('common.retry')}
      />
    );
  }

  return (
    <>
      {isAdmin && (
        <Suspense fallback={null}>
          <AdminPanel onClose={logout} />
        </Suspense>
      )}

      <PortfolioShell>
        <Sidebar data={data} />

        <main className="flex-1 h-full overflow-y-auto relative">
          <MobileHeader data={data} />

          <div className="layout-container flex flex-col max-w-[1400px] mx-auto p-4 lg:p-10 gap-8">
            <ErrorBoundary>
              <HeroSection data={data} />
            </ErrorBoundary>

            <ErrorBoundary>
              <StatsSection stats={data.stats} />
            </ErrorBoundary>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <ErrorBoundary>
                <LazySection minHeight={420}>
                  <Suspense fallback={<SectionFallback minHeight={420} />}>
                    <ExperienceSection
                      experience={data.experience}
                      technologies={data.technologies}
                    />
                  </Suspense>
                </LazySection>
              </ErrorBoundary>

              <ErrorBoundary>
                <LazySection minHeight={420}>
                  <Suspense fallback={<SectionFallback minHeight={420} />}>
                    <ProjectsSection projects={data.projects} />
                  </Suspense>
                </LazySection>
              </ErrorBoundary>
            </div>

            <ErrorBoundary>
              <LazySection minHeight={200}>
                <Suspense fallback={<SectionFallback minHeight={200} />}>
                  <ContactSection data={data} />
                </Suspense>
              </LazySection>
            </ErrorBoundary>

            <Suspense fallback={null}>
              <Footer data={data} />
            </Suspense>
          </div>
        </main>
      </PortfolioShell>

      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <Portfolio />
    </AppProviders>
  );
}
