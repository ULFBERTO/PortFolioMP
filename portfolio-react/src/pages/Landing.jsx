import { memo } from 'react';
import { Link } from '@/shared/router.jsx';
import { useAuth } from '@/features/auth/AuthContext.jsx';
import { useLanguage } from '@/context/LanguageContext.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import Magnetic from '@/shared/motion/Magnetic.jsx';

/** Portada: qué es la plataforma + entrar/crear cuenta. */
function Landing() {
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const es = lang === 'es';

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between p-4">
        <p className="hand-title text-3xl">hojas<span className="hand-underline">devida</span></p>
        <nav className="flex items-center gap-2 font-mono text-sm font-bold">
          {user ? (
            <>
              <Link to="/app" className="btn-ink bg-ink px-4 py-2 text-paper">Mis CVs</Link>
              <button type="button" onClick={logout} className="btn-ink bg-paper px-4 py-2">Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ink bg-paper px-4 py-2">Entrar</Link>
              <Link to="/register" className="btn-ink bg-ink px-4 py-2 text-paper">Crear cuenta</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-8 p-4 pb-16">
        <Reveal from="none">
          <div className="ink-card tape relative overflow-hidden p-8 md:p-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/60">
              {es ? '// tu hoja de vida con url propia' : '// your resume with its own url'}
            </p>
            <h1 className="hand-title mt-2 text-5xl leading-[0.95] md:text-7xl">
              {es ? 'Tu HV en ' : 'Your resume at '}
              <span className="hand-underline">/cv/tu-nombre</span>
            </h1>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/75">
              {es
                ? 'Crea tu cuenta, elige profesión (desarrollador, diseñador, general) y plantilla (hecho a mano, ejecutivo, minimalista). Cada hoja de vida tiene su formulario y su URL exacta, pública o privada.'
                : 'Create your account, pick a profession (developer, designer, general) and a template (hand-drawn, executive, minimal). Each resume has its own form and exact URL, public or private.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Magnetic>
                <Link to={user ? '/app' : '/register'} className="btn-ink inline-flex items-center gap-2 bg-ink px-6 py-3 font-mono text-sm font-bold text-paper">
                  {es ? 'Empezar gratis' : 'Start free'}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_forward</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link to="/cv/mario-patio" className="btn-ink inline-flex items-center gap-2 bg-paper px-6 py-3 font-mono text-sm font-bold">
                  {es ? 'Ver ejemplo' : 'See example'}
                </Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: 'badge', t: es ? 'Perfiles por profesión' : 'Profession profiles', d: es ? 'Cada tipo pide sus propios campos: proyectos y stack, obras, o resumen general.' : 'Each type asks its own fields: projects and stack, works, or general summary.' },
            { icon: 'draw', t: es ? '3 plantillas' : '3 templates', d: es ? 'Hecho a mano con canvas procedurales, ejecutivo sobrio o minimalista.' : 'Hand-drawn with procedural canvases, sober executive or minimal.' },
            { icon: 'link', t: es ? 'URL exacta + privacidad' : 'Exact URL + privacy', d: es ? 'Elige tu slug (/cv/ana-lopez) y si es público o privado.' : 'Pick your slug (/cv/ana-lopez) and public or private.' },
          ].map((c, i) => (
            <Reveal key={c.icon} delay={i * 90}>
              <div className="sticky h-full p-5">
                <span className="material-symbols-outlined text-3xl" aria-hidden>{c.icon}</span>
                <h2 className="hand-title mt-2 text-3xl">{c.t}</h2>
                <p className="mt-1 text-sm text-ink/70">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </main>

      <footer className="border-t-[2.5px] border-ink py-6 text-center font-mono text-xs text-ink/60">
        hojadevida · {es ? 'hecho a mano con canvas' : 'hand-made with canvas'}
      </footer>
    </div>
  );
}

export default memo(Landing);
