import { Suspense, lazy, memo } from 'react';
import Sidebar from '@/components/Sidebar.jsx';
import MobileHeader from '@/components/MobileHeader.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import StatsSection from '@/components/StatsSection.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import Marquee from '@/shared/motion/Marquee.jsx';
import { SectionFallback, LazySection } from '@/shared/components/ui/index.js';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary.jsx';

const ExperienceSection = lazy(() => import('@/components/ExperienceSection.jsx'));
const HexProjects = lazy(() => import('@/components/HexProjects.jsx'));
const PlantGrove = lazy(() => import('@/shared/components/canvas/PlantGrove.jsx'));
const ContactSection = lazy(() => import('@/components/ContactSection.jsx'));
const Footer = lazy(() => import('@/components/Footer.jsx'));
const DoodleDivider = lazy(() => import('@/shared/components/canvas/DoodleDivider.jsx'));

/**
 * Render de una hoja de vida. `template` cambia el look vía data-template (CSS)
 * y desactiva canvases en executive/minimal.
 */
function CVView({ data, template = 'hand-drawn', activeSection }) {
  const rich = template === 'hand-drawn';

  return (
    <div data-template={template} className="flex h-screen overflow-hidden bg-paper text-ink">
      <Sidebar data={data} activeSection={activeSection} />
      <main className="relative h-full flex-1 overflow-y-auto">
        <MobileHeader data={data} activeSection={activeSection} />
        <div className="mx-auto flex max-w-[1400px] flex-col gap-7 p-4 lg:p-10">
          <ErrorBoundary><HeroSection data={data} canvas={rich} /></ErrorBoundary>

          <Reveal>
            <ErrorBoundary><StatsSection stats={data.stats} /></ErrorBoundary>
          </Reveal>

          {rich && <Suspense fallback={null}><DoodleDivider seed={3} /></Suspense>}

          <ErrorBoundary>
            <LazySection minHeight={520}>
              <Suspense fallback={<SectionFallback minHeight={520} />}>
                <HexProjects projects={data.projects} />
              </Suspense>
            </LazySection>
          </ErrorBoundary>

          {rich && <Suspense fallback={null}><DoodleDivider seed={6} /></Suspense>}

          <ErrorBoundary>
            <LazySection minHeight={420}>
              <Suspense fallback={<SectionFallback minHeight={420} />}>
                <ExperienceSection experience={data.experience} technologies={data.technologies} />
              </Suspense>
            </LazySection>
          </ErrorBoundary>
        </div>

        <div className="my-7 -rotate-1">
          <Marquee items={data.technologies} />
        </div>

        <div className="mx-auto flex max-w-[1400px] flex-col gap-7 p-4 pt-0 lg:p-10 lg:pt-0">
          {rich && (
            <ErrorBoundary>
              <LazySection minHeight={300}>
                <Suspense fallback={<SectionFallback minHeight={300} />}>
                  <PlantGrove />
                </Suspense>
              </LazySection>
            </ErrorBoundary>
          )}

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
    </div>
  );
}

export default memo(CVView);
