import { memo, useEffect, useRef, useState } from 'react';
import { TEMPLATES, templateById } from './catalog.js';

/**
 * TemplatePreview - renders a miniature static version of a template
 * using the same CVView logic but in a small iframe for isolation.
 */
function TemplatePreview({ template, width = 480, height = 640 }) {
  const iframeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const theme = template.theme || {};
    const cvData = getPreviewData(theme);

    const html = buildPreviewHtml(cvData, theme);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => setLoaded(true);
  }, [template.id]);

  return (
    <iframe
      ref={iframeRef}
      title={`Preview ${template.name.es}`}
      className="w-full h-full border-0 bg-transparent"
      style={{ width, height }}
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
    />
  );
}

function getPreviewData(theme) {
  // Datos de prueba representativos para mostrar la plantilla
  return {
    theme: {
      primary: theme.primary,
      paper: theme.paper,
      ink: theme.ink,
      accent: theme.accent,
      backgroundDark: theme.paper,
      surfaceDark: theme.paper,
      backgroundLight: theme.paper,
    },
    profile: {
      name: 'María González',
      shortName: 'María G.',
      initials: 'MG',
      role: { es: 'Full Stack Developer', en: 'Full Stack Developer' },
      email: 'maria@ejemplo.com',
      phone: '+34 600 123 456',
      location: 'Madrid, España',
      github: 'github.com/mariagz',
      linkedin: 'linkedin.com/in/mariagz',
      cvUrl: '',
      avatarUrl: '',
    },
    hero: {
      greeting: { es: 'Hola, soy', en: 'Hi, I\'m' },
      description: { es: 'Desarrolladora apasionada por crear experiencias digitales excepcionales.', en: 'Passionate developer creating exceptional digital experiences.' },
    },
    stats: {
      yearsActive: { value: '5+', label: { es: 'Años activo', en: 'Years active' }, sublabel: { es: 'Desde 2019', en: 'Since 2019' } },
      projects: { value: '20+', label: { es: 'Proyectos', en: 'Projects' }, sublabel: { es: 'Completados', en: 'Completed' } },
      techStack: { value: '15+', label: { es: 'Tecnologías', en: 'Technologies' }, sublabel: { es: 'Dominadas', en: 'Mastered' } },
      experience: { value: '5+', label: { es: 'Experiencia', en: 'Experience' }, sublabel: { es: 'Años', en: 'Years' } },
    },
    experience: [
      { id: '1', icon: 'work', title: { es: 'Senior Developer', en: 'Senior Developer' }, date: '2022 - Presente', description: { es: 'Liderando equipo de 5 devs en startup fintech.', en: 'Leading 5-dev team at fintech startup.' }, isCurrent: true },
      { id: '2', icon: 'code', title: { es: 'Frontend Lead', en: 'Frontend Lead' }, date: '2020 - 2022', description: { es: 'Arquitectura frontend para e-commerce.', en: 'Frontend architecture for e-commerce.' }, isCurrent: false },
    ],
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Redis'],
    projects: [
      { id: 'p1', title: 'FinTech Dashboard', category: 'FinTech', categoryColor: 'primary', year: '2023', description: { es: 'Dashboard analítico para banca digital.', en: 'Analytics dashboard for digital banking.' }, technologies: ['React', 'D3.js', 'Node.js'], demoUrl: '', repoUrl: '', downloadUrl: '', imageUrl: '', icon: 'dashboard', gradient: 'from-blue-900/50 to-cyan-900/50' },
      { id: 'p2', title: 'E-Commerce Platform', category: 'E-Commerce', categoryColor: 'green', year: '2022', description: { es: 'Plataforma completa con pagos.', en: 'Full platform with payments.' }, technologies: ['Next.js', 'Stripe', 'PostgreSQL'], demoUrl: '', repoUrl: '', downloadUrl: '', imageUrl: '', icon: 'shopping_cart', gradient: 'from-green-900/50 to-emerald-900/50' },
      { id: 'p3', title: 'Task Manager App', category: 'Productivity', categoryColor: 'purple', year: '2022', description: { es: 'App colaborativa tiempo real.', en: 'Real-time collaborative app.' }, technologies: ['React', 'Socket.io', 'MongoDB'], demoUrl: '', repoUrl: '', downloadUrl: '', imageUrl: '', icon: 'task', gradient: 'from-purple-900/50 to-violet-900/50' },
    ],
    education: [
      { title: 'Máster en Ingeniería Software', details: 'Universidad Politécnica de Madrid – 2020' },
      { title: 'Grado en Informática', details: 'Universidad Complutense – 2018' },
    ],
    languages: { es: 'Español: Nativo | Inglés: C1', en: 'Spanish: Native | English: C1' },
    contact: { title: { es: 'Contacto', en: 'Contact' }, description: { es: 'Disponible para nuevos retos.', en: 'Available for new challenges.' } },
    sidebar: { availability: { es: 'Disponible', en: 'Available' }, openToWork: { es: 'Abierto a oportunidades', en: 'Open to opportunities' }, downloadCV: { es: 'Descargar CV', en: 'Download CV' } },
    footer: { builtWith: { es: 'Hecho con código y café', en: 'Made with code and coffee' } },
    sidebarLabels: { availability: { es: 'Disponibilidad', en: 'Availability' }, openToWork: { es: 'Abierto a oportunidades', en: 'Open to opportunities' }, downloadCV: { es: 'Descargar CV', en: 'Download CV' } },
  };
}

function buildPreviewHtml(data, theme) {
  const cssVars = `
    --primary: ${theme.primary};
    --paper: ${theme.paper};
    --ink: ${theme.ink};
    --accent: ${theme.accent};
    --bg: ${theme.paper};
    --card-bg: ${theme.paper};
    --border: ${theme.ink};
  `;

  const templateStyles = `
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:${theme.font || 'Arial,Helvetica,sans-serif'};font-size:9pt;line-height:1.4;color:${theme.ink};background:${theme.paper};margin:0;padding:10px}
    .cv-container{max-width:500px;margin:0 auto;background:${theme.paper}}
    .header{padding:15px;text-align:${theme.sidebar === 'center' ? 'center' : 'left'};border-bottom:2px solid ${theme.ink}}
    .name{font-size:16pt;font-weight:bold;color:${theme.ink};margin-bottom:4px;${theme.serif ? 'font-family:Georgia,serif' : ''}}
    .contact{font-size:7pt;color:#666;margin:8px 0;padding-bottom:8px;border-bottom:1px solid #ccc;display:flex;flex-wrap:wrap;gap:8px;justify-content:${theme.sidebar === 'center' ? 'center' : 'flex-start'}}
    .contact span{margin-right:12px;font-size:6.5pt}
    .contact a{color:${theme.ink};text-decoration:none;font-size:6.5pt}
    h2{font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${theme.primary};margin:14px 0 6px;padding-bottom:2px;color:${theme.primary}}
    .section{margin-bottom:10px}
    .job{margin-bottom:10px}
    .job-title{font-weight:bold;font-size:9pt;color:${theme.ink}}
    .job-date{font-size:7pt;color:#888;margin:2px 0 4px}
    .job-desc{font-size:8pt;margin:3px 0 0 12px}
    .job-desc li{margin:2px 0;font-size:7.5pt;text-align:justify}
    .skills{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
    .skill{background:${theme.primary};color:${theme.paper};padding:2px 6px;border-radius:3px;font-size:6pt;font-weight:bold}
    .project{margin-bottom:8px;padding:6px;border:1px solid ${theme.primary}22;border-radius:4px;background:${theme.primary}0a}
    .proj-title{font-weight:bold;font-size:8.5pt;color:${theme.ink}}
    .proj-tech{font-size:6.5pt;color:#666;margin:2px 0}
    .edu{margin-bottom:6px}
    .edu-title{font-weight:bold;font-size:8.5pt}
    .edu-detail{font-size:7pt;color:#888}
    @media print{body{font-size:8pt}}
  `;

  const t = templateById(theme.id || 'hand-drawn');
  const isHandDrawn = t?.id === 'hand-drawn';
  const isExecutive = t?.id === 'executive';
  const isMinimal = t?.id === 'minimal';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"><style>${cssVars}${templateStyles}</style>
</head>
<body>
<div class="cv-container">
  ${!isMinimal ? `<div class="header" style="background:${theme.primary}22">
    <h1 class="name">${data.profile.name}</h1>
    <div class="contact">
      <span>✉ ${data.profile.email}</span>
      <span>📱 ${data.profile.phone}</span>
      <span>📍 ${data.profile.location}</span>
      <span><a href="${data.profile.linkedin}">LinkedIn</a></span>
      <span><a href="${data.profile.github}">GitHub</a></span>
    </div>
  </div>` : ''}
  
  <div class="section">
    <h2>${data.hero.greeting.es} ${data.profile.shortName}.</h2>
    <p class="summary">${data.hero.description.es}</p>
  </div>

  ${data.technologies.length ? `<div class="section"><h2>Habilidades</h2><div class="skills">${data.technologies.map(t => `<span class="skill">${t}</span>`).join('')}</div></div>` : ''}

  <div class="section">
    <h2>Experiencia</h2>
    ${data.experience.map(e => `<div class="job"><div class="job-title">${e.title.es}</div><div class="job-date">${e.date}</div><ul class="job-desc">${e.description.es.split('\n').map(l => `<li>${l}</li>`).join('')}</ul></div>`).join('')}
  </div>

  <div class="section">
    <h2>Proyectos</h2>
    ${data.projects.map(p => `<div class="project"><div class="proj-title">${p.title}</div><div class="proj-tech">${p.technologies.join(', ')}</div></div>`).join('')}
  </div>

  <div class="section">
    <h2>Educación</h2>
    ${data.education.map(e => `<div class="edu"><div class="edu-title">${e.title}</div><div class="edu-detail">${e.details}</div></div>`).join('')}
  </div>

  <div class="section" style="margin-top:15px;padding-top:10px;border-top:1px solid #ccc;text-align:center;font-size:7pt;color:#888">
    ${data.footer.builtWith.es}
  </div>
</div>
</body></html>`;
}

/**
 * TemplateCard - casilla con mini página estática de la plantilla (solo divs,
 * sin imágenes ni iframes). ~500px adaptada al grid responsive.
 */
const TemplateCard = memo(function TemplateCard({ template, index, isCurrent, onHover, onLeave, onClick }) {
  const th = template.theme || {};
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      aria-pressed={isCurrent}
      className={`group flex min-h-[500px] flex-col overflow-hidden rounded-xl border-[2.5px] text-left transition-all ${
        isCurrent ? 'border-ink shadow-[5px_5px_0_#1e1630]' : 'border-ink/25 hover:border-ink hover:shadow-[4px_4px_0_#1e1630]'
      }`}
      style={{ background: th.paper }}
    >
      {/* Mini página estática */}
      <div className="pointer-events-none flex-1 p-4" aria-hidden style={{ color: th.ink, fontFamily: th.font || 'Arial,Helvetica,sans-serif' }}>
        <div className="mb-3 rounded-md px-3 py-2" style={{ background: th.primary }}>
          <div className="h-3 w-2/3 rounded" style={{ background: th.paper }} />
          <div className="mt-1.5 h-2 w-1/2 rounded opacity-80" style={{ background: th.paper }} />
        </div>
        <div className="mb-1 h-2.5 w-1/3 rounded" style={{ background: th.primary }} />
        <div className="mb-3 space-y-1.5">
          <div className="h-2 w-full rounded opacity-50" style={{ background: th.ink }} />
          <div className="h-2 w-11/12 rounded opacity-50" style={{ background: th.ink }} />
          <div className="h-2 w-4/5 rounded opacity-50" style={{ background: th.ink }} />
        </div>
        <div className="mb-3 flex gap-1.5">
          {[0, 1, 2].map((k) => (
            <span key={k} className="h-4 w-12 rounded-full" style={{ background: th.accent }} />
          ))}
        </div>
        <div className="mb-1 h-2.5 w-2/5 rounded" style={{ background: th.primary }} />
        {[0, 1].map((k) => (
          <div key={k} className="mb-2 rounded-md border p-2" style={{ borderColor: th.primary }}>
            <div className="h-2.5 w-3/5 rounded" style={{ background: th.ink }} />
            <div className="mt-1.5 h-2 w-full rounded opacity-40" style={{ background: th.ink }} />
            <div className="mt-1 h-2 w-5/6 rounded opacity-40" style={{ background: th.ink }} />
          </div>
        ))}
      </div>
      {/* Pie con nombre */}
      <div className="flex items-center gap-2 border-t-2 p-3" style={{ borderColor: th.ink, background: th.paper }}>
        <span className="material-symbols-outlined text-xl" style={{ color: th.primary }} aria-hidden>{template.icon}</span>
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-bold" style={{ color: th.ink }}>
            {String(index + 1).padStart(2, '0')} · {template.name.es}
          </p>
          <p className="truncate text-[11px] opacity-70" style={{ color: th.ink }}>{template.desc.es}</p>
        </div>
        {isCurrent && (
          <span className="ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-bold" style={{ background: th.primary, color: th.paper }}>
            actual
          </span>
        )}
      </div>
    </button>
  );
});

/**
 * TemplateSelectorModal - Modal con grid 5x3 + scroll + live preview
 */
export const TemplateSelectorModal = memo(function TemplateSelectorModal({ isOpen, onClose, onSelect, currentTemplate }) {
  const [hovered, setHovered] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-paper w-full max-w-[1400px] max-h-[90vh] rounded-xl overflow-hidden border-2 border-ink shadow-2xl flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-ink bg-paperdeep sticky top-0 z-10">
          <h2 className="hand-title text-3xl">Seleccionar plantilla</h2>
          <button onClick={onClose} className="btn-ink bg-ink px-4 py-2 text-paper">Cerrar</button>
        </div>

        {/* Grid 5x3 con scroll */}
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '65vh' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {TEMPLATES.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                isCurrent={currentTemplate === template.id}
                onHover={() => setHovered(template.id)}
                onLeave={() => setHovered(null)}
                onClick={() => onSelect(template.id)}
              />
            ))}
          </div>
        </div>

        {/* Preview panel (lado derecho en desktop, abajo en móvil) */}
        {hovered && (
          <div className="hidden lg:block fixed right-4 top-20 bottom-4 w-96 bg-paper border-2 border-ink rounded-xl shadow-2xl p-3 z-50 animate-fadeIn">
            <div className="font-mono text-xs font-bold mb-2 text-ink/60">Vista previa en vivo</div>
            <TemplatePreview template={templateById(hovered)} width="100%" height="500" />
          </div>
        )}
      </div>
    </div>
  );
});

export default TemplateSelectorModal;