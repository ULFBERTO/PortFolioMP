import { memo, useState } from 'react';
import { schemaFor } from './schemas.js';
import { blankEduFactory, blankExpFactory, blankProjFactory } from './catalog.js';

/** Lee/escribe por path "a.b.c" sobre un clon. */
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null) o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
}

/**
 * Formulario explícito por profesión: renderiza el schema sobre `data`.
 * Llama onSave(nextData) al guardar.
 */
function CvForm({ profession, initialData, onSave, saving }) {
  const [form, setForm] = useState(() => structuredClone(initialData));
  const schema = schemaFor(profession);

  const set = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      setPath(next, path, value);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {schema.map((section) => (
        <section key={section.id} className="ink-card-flat p-5">
          <h3 className="hand-title mb-4 text-3xl">{section.title}</h3>
          <div className="flex flex-col gap-4">
            {section.fields.map((f) => (
              <Field key={f.key} field={f} form={form} set={set} />
            ))}
          </div>
        </section>
      ))}
      <button
        type="button"
        onClick={() => onSave(form)}
        disabled={saving}
        className="btn-ink bg-ink px-6 py-3 font-mono text-sm font-bold text-paper disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar hoja de vida'}
      </button>
    </div>
  );
}

const Field = memo(function Field({ field, form, set }) {
  const value = getPath(form, field.key);
  if (field.kind === 'localized') return <LocalizedInput label={field.label} value={value} onChange={(v) => set(field.key, v)} textarea={field.textarea} />;
  if (field.kind === 'check') return <CheckInput label={field.label} value={!!value} onChange={(v) => set(field.key, v)} />;
  if (field.kind === 'chips') return <ChipsInput label={field.label} value={value ?? []} onChange={(v) => set(field.key, v)} />;
  if (field.kind === 'stats') return <StatsEditor value={value} set={set} />;
  if (field.kind === 'explist') return <ExpListEditor label={field.label} value={value ?? []} set={set} fieldKey={field.key} />;
  if (field.kind === 'projlist') return <ProjListEditor label={field.label} value={value ?? []} set={set} fieldKey={field.key} />;
  if (field.kind === 'edulist') return <EduListEditor label={field.label} value={value ?? []} set={set} fieldKey={field.key} />;
  return <TextInput label={field.label} value={value ?? ''} onChange={(v) => set(field.key, v)} type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'} textarea={field.textarea} />;
});

function TextInput({ label, value, onChange, type = 'text', textarea }) {
  const cls = 'w-full rounded-lg border-2 border-ink bg-paper px-3 py-2 text-ink focus:outline-none';
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}

function LocalizedInput({ label, value = { es: '', en: '' }, onChange, textarea }) {
  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">{label}</span>
      <div className="grid gap-2 md:grid-cols-2">
        <TextInput label="ES" value={value.es ?? ''} onChange={(v) => onChange({ ...value, es: v })} textarea={textarea} />
        <TextInput label="EN" value={value.en ?? ''} onChange={(v) => onChange({ ...value, en: v })} textarea={textarea} />
      </div>
    </div>
  );
}

function CheckInput({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 font-mono text-sm">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#16a34a]" />
      {label}
    </label>
  );
}

function ChipsInput({ label, value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...value, v]);
    setDraft('');
  };
  return (
    <div>
      <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">{label}</span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {value.map((chip, i) => (
          <span key={`${chip}-${i}`} className="flex items-center gap-1 rounded-full border-2 border-ink bg-pgreen/30 px-2.5 py-0.5 font-mono text-xs font-bold">
            {chip}
            <button type="button" aria-label={`Quitar ${chip}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="font-bold">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} placeholder="Agregar + Enter" className="flex-1 rounded-lg border-2 border-ink bg-paper px-3 py-2 text-ink focus:outline-none" />
        <button type="button" onClick={add} className="btn-ink bg-paper px-4 font-bold">+</button>
      </div>
    </div>
  );
}

const STAT_KEYS = ['yearsActive', 'projects', 'techStack', 'experience'];

function StatsEditor({ value = {}, set }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {STAT_KEYS.map((k) => (
        <div key={k} className="rounded-xl border-2 border-dashed border-ink/40 p-3">
          <p className="mb-2 font-mono text-xs font-bold uppercase">{k}</p>
          <TextInput label="Valor" value={value[k]?.value ?? ''} onChange={(v) => set(`stats.${k}.value`, v)} />
          <LocalizedInput label="Etiqueta" value={value[k]?.label} onChange={(v) => set(`stats.${k}.label`, v)} />
          <LocalizedInput label="Subetiqueta" value={value[k]?.sublabel} onChange={(v) => set(`stats.${k}.sublabel`, v)} />
        </div>
      ))}
    </div>
  );
}

function ExpListEditor({ label, value, set, fieldKey }) {
  const update = (i, path, v) => {
    const next = structuredClone(value);
    setPath(next[i], path, v);
    set(fieldKey, next);
  };
  const add = () => set(fieldKey, [...value, blankExpFactory()]);
  const remove = (i) => set(fieldKey, value.filter((_, j) => j !== i));
  return (
    <div>
      <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">{label} ({value.length})</span>
      <div className="flex flex-col gap-3">
        {value.map((exp, i) => (
          <div key={exp.id ?? i} className="rounded-xl border-2 border-ink bg-paper p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold">#{i + 1} {exp.title?.es}</span>
              <button type="button" onClick={() => remove(i)} className="font-mono text-xs font-bold text-blush">eliminar</button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextInput label="Título ES" value={exp.title?.es ?? ''} onChange={(v) => update(i, 'title.es', v)} />
              <TextInput label="Título EN" value={exp.title?.en ?? ''} onChange={(v) => update(i, 'title.en', v)} />
              <TextInput label="Fecha" value={exp.date ?? ''} onChange={(v) => update(i, 'date', v)} />
              <TextInput label="Icono" value={exp.icon ?? ''} onChange={(v) => update(i, 'icon', v)} />
              <div className="md:col-span-2"><TextInput label="Descripción ES" textarea value={exp.description?.es ?? ''} onChange={(v) => update(i, 'description.es', v)} /></div>
              <div className="md:col-span-2"><TextInput label="Descripción EN" textarea value={exp.description?.en ?? ''} onChange={(v) => update(i, 'description.en', v)} /></div>
              <CheckInput label="Trabajo actual" value={!!exp.isCurrent} onChange={(v) => update(i, 'isCurrent', v)} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-ink mt-3 bg-paper px-4 py-2 font-mono text-xs font-bold">+ Agregar experiencia</button>
    </div>
  );
}

function EduListEditor({ label, value, set, fieldKey }) {
  const update = (i, path, v) => {
    const next = structuredClone(value);
    next[i][path] = v;
    set(fieldKey, next);
  };
  const add = () => set(fieldKey, [...value, blankEduFactory()]);
  const remove = (i) => set(fieldKey, value.filter((_, j) => j !== i));
  return (
    <div>
      <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">{label} ({value.length})</span>
      <div className="flex flex-col gap-3">
        {value.map((edu, i) => (
          <div key={edu.id ?? i} className="rounded-xl border-2 border-ink bg-paper p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold">#{i + 1} {edu.title}</span>
              <button type="button" onClick={() => remove(i)} className="font-mono text-xs font-bold text-blush">eliminar</button>
            </div>
            <div className="grid gap-2">
              <TextInput label="Título (ej: Diseño y Desarrollo de Software)" value={edu.title ?? ''} onChange={(v) => update(i, 'title', v)} />
              <TextInput label="Detalle (ej: SENA – Nov 2019 – Nov 2020)" value={edu.details ?? ''} onChange={(v) => update(i, 'details', v)} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-ink mt-3 bg-paper px-4 py-2 font-mono text-xs font-bold">+ Agregar estudio</button>
    </div>
  );
}

function ProjListEditor({ label, value, set, fieldKey }) {
  const update = (i, path, v) => {
    const next = structuredClone(value);
    setPath(next[i], path, v);
    set(fieldKey, next);
  };
  const add = () => set(fieldKey, [...value, blankProjFactory()]);
  const remove = (i) => set(fieldKey, value.filter((_, j) => j !== i));
  return (
    <div>
      <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">{label} ({value.length})</span>
      <div className="flex flex-col gap-3">
        {value.map((p, i) => (
          <div key={p.id ?? i} className="rounded-xl border-2 border-ink bg-paper p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold">#{i + 1} {p.title}</span>
              <button type="button" onClick={() => remove(i)} className="font-mono text-xs font-bold text-blush">eliminar</button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextInput label="Título" value={p.title ?? ''} onChange={(v) => update(i, 'title', v)} />
              <TextInput label="Categoría" value={p.category ?? ''} onChange={(v) => update(i, 'category', v)} />
              <TextInput label="Año" value={p.year ?? ''} onChange={(v) => update(i, 'year', v)} />
              <TextInput label="Icono" value={p.icon ?? ''} onChange={(v) => update(i, 'icon', v)} />
              <TextInput label="Demo URL" value={p.demoUrl ?? ''} onChange={(v) => update(i, 'demoUrl', v)} />
              <TextInput label="Repo URL" value={p.repoUrl ?? ''} onChange={(v) => update(i, 'repoUrl', v)} />
              <TextInput label="Imagen URL" value={p.imageUrl ?? ''} onChange={(v) => update(i, 'imageUrl', v)} />
              <TextInput label="Descarga URL" value={p.downloadUrl ?? ''} onChange={(v) => update(i, 'downloadUrl', v)} />
              <div className="md:col-span-2"><TextInput label="Tecnologías (coma)" value={(p.technologies ?? []).join(', ')} onChange={(v) => update(i, 'technologies', v.split(',').map((s) => s.trim()).filter(Boolean))} /></div>
              <div className="md:col-span-2"><TextInput label="Descripción ES" textarea value={p.description?.es ?? ''} onChange={(v) => update(i, 'description.es', v)} /></div>
              <div className="md:col-span-2"><TextInput label="Descripción EN" textarea value={p.description?.en ?? ''} onChange={(v) => update(i, 'description.en', v)} /></div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-ink mt-3 bg-paper px-4 py-2 font-mono text-xs font-bold">+ Agregar proyecto</button>
    </div>
  );
}

export default memo(CvForm);
