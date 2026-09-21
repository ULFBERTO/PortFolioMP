import { Suspense, lazy, memo } from 'react';
import { AppProviders } from '@/app/providers.jsx';
import { useData } from '@/context/DataContext.jsx';
import { useLanguage } from '@/context/LanguageContext.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import MobileHeader from '@/components/MobileHeader.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import StatsSection from '@/components/StatsSection.jsx';
import Marquee from '@/shared/motion/Marquee.jsx';
import ScrollProgress from '@/shared/motion/ScrollProgress.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import { useScrollSpy } from '@/shared/motion/useScrollSpy.js';
import { Spinner, ErrorState, SectionFallback, LazySection } from '@/shared/components/ui/index.js';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary.jsx';

const ExperienceSection = lazy(() => import('@/components/ExperienceSection.jsx'));
const HexProjects = lazy(() => import('@/components/HexProjects.jsx'));
const PlantGrove = lazy(() => import('@/shared/components/canvas/PlantGrove.jsx'));
const ContactSection = lazy(() => import('@/components/ContactSection.jsx'));
const Footer = lazy(() => import('@/components/Footer.jsx'));
const AdminPanel = lazy(() => import('@/components/AdminPanel.jsx'));
const CookieConsent = lazy(() => import('@/components/CookieConsent.jsx'));
const DoodleDivider = lazy(() => import('@/shared/components/canvas/DoodleDivider.jsx'));

const SECTION_IDS = ['dashboard', 'projects', 'experience', 'contact'];

const PortfolioShell = memo(function PortfolioShell({ children }) {
  return <div className="flex h-screen overflow-hidden bg-paper text-ink">{children}</div>;
});

function Portfolio() {
  const { data, isAdmin, logout, loading, error, refetch } = useData();
  const { t } = useLanguage();
  const activeSection = useScrollSpy(SECTION_IDS);

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
      <ScrollProgress />
      {isAdmin && (
        <Suspense fallback={null}>
          <AdminPanel onClose={logout} />
        </Suspense>
      )}

      <PortfolioShell>
        <Sidebar data={data} activeSection={activeSection} />
        <main className="relative h-full flex-1 overflow-y-auto">
          <MobileHeader data={data} activeSection={activeSection} />
          <div className="mx-auto flex max-w-[1400px] flex-col gap-7 p-4 lg:p-10">
            <ErrorBoundary><HeroSection data={data} /></ErrorBoundary>

            <Reveal>
              <ErrorBoundary><StatsSection stats={data.stats} /></ErrorBoundary>
            </Reveal>

            <Suspense fallback={null}><DoodleDivider seed={3} /></Suspense>

            {/* Proyectos como panal hexagonal: cada celda se extruye al abrir */}
            <ErrorBoundary>
              <LazySection minHeight={520}>
                <Suspense fallback={<SectionFallback minHeight={520} />}>
                  <HexProjects projects={data.projects} />
                </Suspense>
              </LazySection>
            </ErrorBoundary>

            <Suspense fallback={null}><DoodleDivider seed={6} /></Suspense>

            <ErrorBoundary>
              <LazySection minHeight={420}>
                <Suspense fallback={<SectionFallback minHeight={420} />}>
                  <ExperienceSection experience={data.experience} technologies={data.technologies} />
                </Suspense>
              </LazySection>
            </ErrorBoundary>
          </div>

          {/* Cinta de tecnologías a sangre: rompe la columna y da ritmo */}
          <div className="my-7 -rotate-1">
            <Marquee items={data.technologies} />
          </div>

          <div className="mx-auto flex max-w-[1400px] flex-col gap-7 p-4 pt-0 lg:p-10 lg:pt-0">
            {/* Bosque procedural: seed aleatoria por visita */}
            <ErrorBoundary>
              <LazySection minHeight={300}>
                <Suspense fallback={<SectionFallback minHeight={300} />}>
                  <PlantGrove />
                </Suspense>
              </LazySection>
            </ErrorBoundary>

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
