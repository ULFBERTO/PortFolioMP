import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useRouter } from '@/shared/router.jsx';
import { useAuth } from '@/features/auth/AuthContext.jsx';
import { deleteCv, duplicateCv, invalidatePublicCv, listMyCvs } from '@/features/cvs/cvsApi.js';
import { printAtsPdf } from '@/features/cvs/atsResume.js';
import { professionById, templateById } from '@/features/cvs/catalog.js';
import Reveal from '@/shared/motion/Reveal.jsx';

function useMyCvs() {
  const [cvs, setCvs] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setCvs(await listMyCvs());
    } catch (err) {
      setError(err.message || 'Error cargando');
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { cvs, error, reload: load };
}

function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const { navigate } = useRouter();
  const { cvs, error, reload } = useMyCvs();
  const [deleting, setDeleting] = useState('');

  const onDelete = async (cv) => {
    if (!window.confirm(`¿Eliminar /cv/${cv.slug}?`)) return;
    setDeleting(cv.id);
    try {
      await deleteCv(cv.id);
      invalidatePublicCv(cv.slug);
      await reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting('');
    }
  };

  const onDuplicate = async (cv) => {
    setDeleting(cv.id);
    try {
      const copy = await duplicateCv(cv.id);
      navigate(`/app/cv/${copy.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting('');
    }
  };

  const onPdf = (cv) => {
    printAtsPdf(cv, { siteUrl: window.location.origin });
  };

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between p-4">
        <Link to="/" className="hand-title text-3xl">hojadevida</Link>
        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span className="hidden rounded-full border-2 border-ink px-3 py-1 sm:block">
            {user?.email} {isAdmin && '· admin'}
          </span>
          {isAdmin && <Link to="/app/admin" className="btn-ink bg-paper px-4 py-2">Admin</Link>}
          <button type="button" onClick={onLogout} className="btn-ink bg-paper px-4 py-2">Salir</button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 p-4 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="hand-title text-5xl">Mis hojas <span className="hand-underline">de vida</span></h1>
          <Link to="/app/nuevo" className="btn-ink bg-ink px-5 py-2.5 font-mono text-sm font-bold text-paper">
            + Nueva hoja de vida
          </Link>
        </div>

        {error && <p className="rounded-lg border border-blush/50 bg-blush/10 px-3 py-2 text-sm text-blush">{error}</p>}
        {cvs === null && !error && <p className="font-mono text-sm">Cargando…</p>}
        {cvs?.length === 0 && (
          <div className="ink-card-flat p-8 text-center">
            <p className="hand-title text-4xl">Aún no tienes ninguna</p>
            <p className="mt-2 text-sm text-ink/70">Crea la primera: elige profesión, plantilla, slug y visibilidad.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {cvs?.map((cv, i) => (
            <Reveal key={cv.id} delay={(i % 2) * 80}>
              <article className="ink-card-flat flex h-full flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="hand-title text-3xl leading-none">{cv.title || cv.slug}</h2>
                  <span className={`rounded-full border-2 px-2 py-0.5 font-mono text-[11px] font-bold ${cv.visibility === 'public' ? 'border-ink bg-pgreen/40' : 'border-ink/40 bg-paperdeep text-ink/60'}`}>
                    {cv.visibility === 'public' ? 'pública' : 'privada'}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink/60">
                  /cv/{cv.slug} · {professionById(cv.profession).name.es} · {templateById(cv.template).name.es}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to={`/cv/${cv.slug}`} className="btn-ink bg-paper px-4 py-1.5 font-mono text-xs font-bold">Ver</Link>
                  <Link to={`/app/cv/${cv.id}`} className="btn-ink bg-ink px-4 py-1.5 font-mono text-xs font-bold text-paper">Editar</Link>
                  <button type="button" disabled={deleting === cv.id} onClick={() => onDuplicate(cv)} className="btn-ink bg-paper px-4 py-1.5 font-mono text-xs font-bold disabled:opacity-50">
                    Duplicar
                  </button>
                  <button type="button" onClick={() => onPdf(cv)} className="btn-ink bg-paper px-4 py-1.5 font-mono text-xs font-bold">
                    PDF ATS
                  </button>
                  <button type="button" disabled={deleting === cv.id} onClick={() => onDelete(cv)} className="btn-ink bg-paper px-4 py-1.5 font-mono text-xs font-bold text-blush disabled:opacity-50">
                    {deleting === cv.id ? '…' : 'Eliminar'}
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </main>
    </div>
  );
}

export default memo(Dashboard);
