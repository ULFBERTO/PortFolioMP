import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useRouter } from '@/shared/router.jsx';
import { useAuth } from '@/features/auth/AuthContext.jsx';
import { createCv, getCv, getPublicCv, invalidatePublicCv, updateCv } from '@/features/cvs/cvsApi.js';
import { PROFESSIONS, TEMPLATES, blankDataFor, professionById, templateById } from '@/features/cvs/catalog.js';
import CvForm from '@/features/cvs/CvForm.jsx';
import CVView from '@/features/cvview/CVView.jsx';
import { useScrollSpy } from '@/shared/motion/useScrollSpy.js';
import { ErrorState, Spinner } from '@/shared/components/ui/index.js';

const SECTION_IDS = ['dashboard', 'projects', 'experience', 'contact'];

function PageShell({ title, back = '/app', children }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between p-4">
        <Link to={back} className="font-mono text-sm font-bold">← Volver</Link>
        <p className="hand-title text-2xl">hojadevida</p>
      </header>
      <main className="mx-auto w-full max-w-[1100px] p-4 pb-16">
        <h1 className="hand-title mb-5 text-5xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

/** Crear CV: profesión + plantilla + slug + visibilidad + datos iniciales. */
export const NewCV = memo(function NewCV() {
  const { navigate } = useRouter();
  const [profession, setProfession] = useState('developer');
  const [template, setTemplate] = useState('hand-drawn');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setError('');
    const clean = slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(clean)) {
      setError('Slug inválido: 3-48 caracteres, solo a-z 0-9 y guiones.');
      return;
    }
    setBusy(true);
    try {
      const cv = await createCv({
        slug: clean,
        title: title.trim() || clean,
        profession,
        template,
        visibility,
        data: blankDataFor(profession),
      });
      navigate(`/app/cv/${cv.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Nueva hoja de vida">
      <div className="flex flex-col gap-5">
        <section className="ink-card-flat p-5">
          <h2 className="hand-title mb-3 text-3xl">1 · Profesión (define el formulario)</h2>
          <div className="grid gap-2 md:grid-cols-3">
            {PROFESSIONS.map((p) => (
              <button key={p.id} type="button" onClick={() => setProfession(p.id)}
                className={`rounded-xl border-[2.5px] p-4 text-left transition-all ${profession === p.id ? 'border-ink bg-pgreen/30 shadow-[3px_3px_0_#1e1630]' : 'border-ink/25 bg-paper hover:border-ink'}`}>
                <span className="material-symbols-outlined text-2xl" aria-hidden>{p.icon}</span>
                <p className="hand-title text-2xl">{p.name.es}</p>
                <p className="text-xs text-ink/65">{p.desc.es}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="ink-card-flat p-5">
          <h2 className="hand-title mb-3 text-3xl">2 · Plantilla (define el look)</h2>
          <div className="grid gap-2 md:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                className={`rounded-xl border-[2.5px] p-4 text-left transition-all ${template === t.id ? 'border-ink bg-pgreen/30 shadow-[3px_3px_0_#1e1630]' : 'border-ink/25 bg-paper hover:border-ink'}`}>
                <span className="material-symbols-outlined text-2xl" aria-hidden>{t.icon}</span>
                <p className="hand-title text-2xl">{t.name.es}</p>
                <p className="text-xs text-ink/65">{t.desc.es}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="ink-card-flat p-5">
          <h2 className="hand-title mb-3 text-3xl">3 · URL y visibilidad</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">Título</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ana López" className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">URL exacta: /cv/{slug || '…'}</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="ana-lopez" className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 font-mono focus:outline-none" />
            </label>
          </div>
          <div className="mt-3 flex gap-2" role="group" aria-label="Visibilidad">
            {[['public', 'Pública — cualquiera con la URL'], ['private', 'Privada — solo tú (y admin)']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setVisibility(v)}
                className={`flex-1 rounded-full border-2 px-4 py-2 font-mono text-sm font-bold ${visibility === v ? 'border-ink bg-ink text-paper' : 'border-ink/30 text-ink/60'}`}>
                {l}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="rounded-lg border border-blush/50 bg-blush/10 px-3 py-2 text-sm text-blush">{error}</p>}
        <button type="button" onClick={onCreate} disabled={busy} className="btn-ink bg-ink px-6 py-3 font-mono text-sm font-bold text-paper disabled:opacity-50">
          {busy ? 'Creando…' : `Crear y editar · ${professionById(profession).name.es} · ${templateById(template).name.es}`}
        </button>
      </div>
    </PageShell>
  );
});

/** Editar CV: metadatos + formulario explícito + vista previa. */
export const EditCV = memo(function EditCV({ id }) {
  const { navigate } = useRouter();
  const [cv, setCv] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ title: '', slug: '', visibility: 'public', template: 'hand-drawn' });
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => {
    getCv(id).then((c) => {
      setCv(c);
      setMeta({ title: c.title, slug: c.slug, visibility: c.visibility, template: c.template });
    }).catch((err) => setError(err.message));
  }, [id]);

  const onSave = useCallback(async (nextData) => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateCv(id, {
        title: meta.title,
        slug: meta.slug,
        visibility: meta.visibility,
        template: meta.template,
        data: nextData,
      });
      // Invalidar la entrada vieja Y la nueva: si cambió el slug, la URL
      // anterior no debe seguir sirviendo el dato viejo desde el caché.
      invalidatePublicCv(cv?.slug);
      setCv(updated);
      setMeta({ title: updated.title, slug: updated.slug, visibility: updated.visibility, template: updated.template });
      invalidatePublicCv(updated.slug);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [id, meta, cv]);

  if (error && !cv) {
    return <PageShell title="Editar"><ErrorState title="No se pudo abrir" description={error} /></PageShell>;
  }
  if (!cv) {
    return <PageShell title="Editar"><div className="flex h-40 items-center justify-center"><Spinner label="Cargando…" /></div></PageShell>;
  }

  return (
    <PageShell title={`Editar · ${cv.slug}`}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link to={`/cv/${meta.slug}`} className="btn-ink bg-paper px-4 py-2 font-mono text-xs font-bold">Ver pública</Link>
        <span className="font-mono text-xs text-ink/60">/cv/{meta.slug} · {cv.profession}</span>
        {savedAt && <span className="font-mono text-xs text-[#16a34a]">guardado {savedAt}</span>}
      </div>
      {error && <p className="mb-4 rounded-lg border border-blush/50 bg-blush/10 px-3 py-2 text-sm text-blush">{error}</p>}
      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">Título</span>
          <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 focus:outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">Slug (URL)</span>
          <input value={meta.slug} onChange={(e) => setMeta({ ...meta, slug: e.target.value.toLowerCase() })} className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 font-mono focus:outline-none" />
        </label>
        <div className="flex gap-2" role="group" aria-label="Visibilidad">
          {['public', 'private'].map((v) => (
            <button key={v} type="button" onClick={() => setMeta({ ...meta, visibility: v })}
              className={`flex-1 rounded-full border-2 px-4 py-2 font-mono text-xs font-bold ${meta.visibility === v ? 'border-ink bg-ink text-paper' : 'border-ink/30 text-ink/60'}`}>
              {v === 'public' ? 'Pública' : 'Privada'}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">Plantilla</span>
          <select value={meta.template} onChange={(e) => setMeta({ ...meta, template: e.target.value })} className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 focus:outline-none">
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name.es}</option>)}
          </select>
        </label>
      </div>
      <CvForm profession={cv.profession} initialData={cv.data} onSave={onSave} saving={saving} />
      <button type="button" onClick={() => navigate('/app')} className="mt-6 font-mono text-sm underline">← Volver a mis CVs</button>
    </PageShell>
  );
});

/** Vista pública exacta: /cv/:slug */
export const PublicCV = memo(function PublicCV({ slug }) {
  const [cv, setCv] = useState(null);
  const [error, setError] = useState('');
  const activeSection = useScrollSpy(SECTION_IDS);

  useEffect(() => {
    getPublicCv(slug).then(setCv).catch((err) => setError(err.message || 'No encontrada'));
  }, [slug]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper p-6 text-center text-ink">
        <p className="hand-title text-5xl">Esta hoja no existe…</p>
        <p className="font-mono text-sm text-ink/60">/cv/{slug} {error.includes('encontrada') ? 'no existe o es privada' : error}</p>
        <Link to="/" className="btn-ink bg-ink px-5 py-2.5 font-mono text-sm font-bold text-paper">Ir al inicio</Link>
      </div>
    );
  }
  if (!cv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <Spinner label="Cargando hoja de vida…" />
      </div>
    );
  }
  return <CVView cv={cv} activeSection={activeSection} />;
});

/** Admin: usuarios + todos los CVs. */
export const AdminUsers = memo(function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [cvs, setCvs] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [{ adminListUsers, adminListCvs }] = [await import('@/features/cvs/cvsApi.js')];
    try {
      setUsers(await adminListUsers());
      setCvs(await adminListCvs());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (u, role) => {
    const { adminSetRole } = await import('@/features/cvs/cvsApi.js');
    try {
      await adminSetRole(u.id, role);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`¿Eliminar ${u.email} y todos sus CVs?`)) return;
    const { adminDeleteUser } = await import('@/features/cvs/cvsApi.js');
    try {
      await adminDeleteUser(u.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (user && user.role !== 'admin') {
    return <PageShell title="Admin" back="/app"><p>Solo administradores.</p></PageShell>;
  }

  return (
    <PageShell title="Administración" back="/app">
      {error && <p className="mb-4 rounded-lg border border-blush/50 bg-blush/10 px-3 py-2 text-sm text-blush">{error}</p>}
      <h2 className="hand-title mb-3 text-3xl">Usuarios ({users?.length ?? '…'})</h2>
      <div className="mb-8 flex flex-col gap-2">
        {users?.map((u) => (
          <div key={u.id} className="ink-card-flat flex flex-wrap items-center gap-2 p-3">
            <span className="font-mono text-sm font-bold">{u.email}</span>
            <span className="rounded-full border border-ink/40 px-2 py-0.5 font-mono text-[11px]">{u.role}</span>
            <span className="ml-auto flex gap-2">
              {u.id !== user?.id && (
                <>
                  <button type="button" onClick={() => changeRole(u, u.role === 'admin' ? 'user' : 'admin')} className="btn-ink bg-paper px-3 py-1 font-mono text-xs font-bold">
                    → {u.role === 'admin' ? 'user' : 'admin'}
                  </button>
                  <button type="button" onClick={() => removeUser(u)} className="btn-ink bg-paper px-3 py-1 font-mono text-xs font-bold text-blush">eliminar</button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
      <h2 className="hand-title mb-3 text-3xl">Todas las hojas ({cvs?.length ?? '…'})</h2>
      <div className="flex flex-col gap-2">
        {cvs?.map((c) => (
          <div key={c.id} className="ink-card-flat flex flex-wrap items-center gap-2 p-3">
            <Link to={`/cv/${c.slug}`} className="font-mono text-sm font-bold underline">/cv/{c.slug}</Link>
            <span className="font-mono text-xs text-ink/60">{c.title} · {c.profession} · {c.template} · {c.visibility} · {c.ownerEmail}</span>
            <Link to={`/app/cv/${c.id}`} className="ml-auto btn-ink bg-paper px-3 py-1 font-mono text-xs font-bold">editar</Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
});
