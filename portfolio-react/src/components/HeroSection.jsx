import { Suspense, lazy, memo, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';

const PacketField = lazy(() => import('@/shared/components/canvas/PacketField.jsx'));

function HeroSection({ data }) {
  const { lang } = useLanguage();
  const { profile, hero } = data;
  const firstName = useMemo(() => profile.name.split(' ').slice(0, 2).join(' '), [profile.name]);

  return (
    <section id="dashboard" className="ink-card tape relative overflow-hidden p-0">
      {/* Canvas procedural interactivo */}
      <div className="relative h-[340px] md:h-[380px]">
        <Suspense fallback={<div className="absolute inset-0 bg-paper" />}>
          <PacketField density={8} />
        </Suspense>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest">
            Portfolio · v3 hand-drawn
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-5 p-6 md:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/60">
          {'// una petición entra al servidor… y sale hecha portafolio'}
        </p>
        <h1 className="hand-title text-5xl leading-[0.95] md:text-7xl">
          {hero.greeting[lang]}{' '}
          <span className="hand-underline">{firstName}.</span>
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-ink/80">{hero.description[lang]}</p>
        <div className="flex flex-wrap gap-3">
          <SocialLink href={profile.github} label="GitHub" icon="arrow_outward" primary />
          <SocialLink href={profile.linkedin} label="LinkedIn" icon="arrow_outward" />
          {profile.cvUrl ? <SocialLink href={profile.cvUrl} label="CV" icon="download" /> : null}
        </div>
      </div>
    </section>
  );
}

const SocialLink = memo(function SocialLink({ href, label, icon, primary }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-ink flex items-center gap-2 px-5 py-2.5 font-mono text-sm font-bold ${
        primary ? 'bg-ink text-paper' : 'bg-paper text-ink'
      }`}
    >
      <span>{label}</span>
      <span className="material-symbols-outlined text-[18px]" aria-hidden>{icon}</span>
    </a>
  );
});

export default memo(HeroSection);
