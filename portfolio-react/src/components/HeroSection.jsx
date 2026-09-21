import { Suspense, lazy, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import Magnetic from '@/shared/motion/Magnetic.jsx';
import Scramble from '@/shared/motion/Scramble.jsx';
import { prefersReducedMotion } from '@/shared/motion/useInView.js';

const PacketField = lazy(() => import('@/shared/components/canvas/PacketField.jsx'));

/** Roles rotativos con decode terminal (re-monta Scramble por key). */
const RotatingRoles = memo(function RotatingRoles({ roles }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion() || roles.length < 2) return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % roles.length), 3000);
    return () => clearInterval(id);
  }, [roles.length]);
  const role = roles[i % roles.length];
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-ink">
      <span className="text-blush" aria-hidden>{'>'}</span>
      <Scramble key={role} text={role} />
      <span className="caret-blink inline-block h-4 w-[9px] bg-ink" aria-hidden />
    </span>
  );
});

function HeroSection({ data }) {
  const { lang } = useLanguage();
  const { profile, hero } = data;
  const firstName = useMemo(() => profile.name.split(' ').slice(0, 2).join(' '), [profile.name]);
  const roles = useMemo(
    () => [profile.role[lang], ...(data.technologies ?? []).slice(0, 3)],
    [profile.role, lang, data.technologies],
  );

  // Parallax sutil del canvas con el scroll (transform, rAF throttle)
  const canvasWrap = useRef(null);
  useEffect(() => {
    const el = canvasWrap.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      // Solo mientras el hero está en viewport
      if (r.bottom > 0 && r.top < window.innerHeight) {
        el.style.transform = `translate3d(0, ${(window.scrollY * 0.12).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section id="dashboard" className="ink-card tape relative overflow-hidden p-0">
      <div className="relative h-[340px] overflow-hidden md:h-[400px]">
        <div ref={canvasWrap} className="absolute inset-0 will-change-transform">
          <Suspense fallback={<div className="absolute inset-0 bg-paper" />}>
            <PacketField density={8} />
          </Suspense>
        </div>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest">
            Portfolio · v3 hand-drawn
          </span>
        </div>
        <a
          href="#projects"
          aria-label="Scroll a proyectos"
          className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 md:flex"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">scroll</span>
          <span className="flex h-9 w-6 justify-center rounded-full border-2 border-ink bg-paper/70 pt-1.5">
            <span className="scroll-dot block size-1.5 rounded-full bg-ink" />
          </span>
        </a>
      </div>

      <div className="relative z-10 flex flex-col gap-4 p-6 md:p-10">
        <Reveal from="none">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/60">
            {'// una petición entra al servidor… y sale hecha portafolio'}
          </p>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="hand-title text-5xl leading-[0.95] md:text-7xl">
            {hero.greeting[lang]}{' '}
            <span className="hand-underline">{firstName}.</span>
          </h1>
        </Reveal>
        <Reveal delay={170}>
          <RotatingRoles roles={roles} />
        </Reveal>
        <Reveal delay={240}>
          <p className="max-w-xl text-[15px] leading-relaxed text-ink/80">{hero.description[lang]}</p>
        </Reveal>
        <Reveal delay={310} from="none">
          <div className="flex flex-wrap gap-3">
            <Magnetic><SocialLink href={profile.github} label="GitHub" icon="arrow_outward" primary /></Magnetic>
            <Magnetic><SocialLink href={profile.linkedin} label="LinkedIn" icon="arrow_outward" /></Magnetic>
            {profile.cvUrl ? <Magnetic><SocialLink href={profile.cvUrl} label="CV" icon="download" /></Magnetic> : null}
          </div>
        </Reveal>
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
