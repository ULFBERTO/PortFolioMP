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

const ExperienceSection = lazy(() => import('@/components/ExperienceSection.jsx'));
const ProjectsSection = lazy(() => import('@/components/ProjectsSection.jsx'));
const ContactSection = lazy(() => import('@/components/ContactSection.jsx'));
const Footer = lazy(() => import('@/components/Footer.jsx'));
const AdminPanel = lazy(() => import('@/components/AdminPanel.jsx'));
const CookieConsent = lazy(() => import('@/components/CookieConsent.jsx'));
const DoodleDivider = lazy(() => import('@/shared/components/canvas/DoodleDivider.jsx'));

const PortfolioShell = memo(function PortfolioShell({ children }) {
  return <div className="flex h-screen overflow-hidden bg-paper text-ink">{children}</div>;
});

function Portfolio() {
  const { data, isAdmin, logout, loading, error, refetch } = useData();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper text-ink">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState title={t('common.errorTitle')} description={t('common.errorConnectionDesc')} detail={error} onRetry={refetch} retryLabel={t('common.retry')} />
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
        <main className="relative h-full flex-1 overflow-y-auto">
          <MobileHeader data={data} />
          <div className="mx-auto flex max-w-[1400px] flex-col gap-7 p-4 lg:p-10">
            <ErrorBoundary><HeroSection data={data} /></ErrorBoundary>
            <ErrorBoundary><StatsSection stats={data.stats} /></ErrorBoundary>

            <Suspense fallback={null}><DoodleDivider seed={3} /></Suspense>

            <div className="grid grid-cols-1 gap-7 xl:grid-cols-3">
              <ErrorBoundary>
                <LazySection minHeight={420}>
                  <Suspense fallback={<SectionFallback minHeight={420} />}>
                    <ExperienceSection experience={data.experience} technologies={data.technologies} />
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

            <Suspense fallback={null}><DoodleDivider seed={9} /></Suspense>

            <ErrorBoundary>
              <LazySection minHeight={200}>
                <Suspense fallback={<SectionFallback minHeight={200} />}>
                  <ContactSection data={data} />
                </Suspense>
              </LazySection>
            </ErrorBoundary>

            <Suspense fallback={null}><Footer data={data} /></Suspense>
          </div>
        </main>
      </PortfolioShell>

      <Suspense fallback={null}><CookieConsent /></Suspense>
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
