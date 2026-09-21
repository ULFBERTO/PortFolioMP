/**
 * Catálogo híbrido: profesiones (formulario explícito) × plantillas (look).
 * @module features/cvs/catalog
 */

export const PROFESSIONS = Object.freeze([
  { id: 'developer', icon: 'terminal', name: { es: 'Desarrollador', en: 'Developer' }, desc: { es: 'Proyectos, stack, experiencia y stats técnicas.', en: 'Projects, stack, experience and tech stats.' } },
  { id: 'designer', icon: 'palette', name: { es: 'Diseñador', en: 'Designer' }, desc: { es: 'Obras seleccionadas, experiencia y contacto visual.', en: 'Selected works, experience and visual contact.' } },
  { id: 'general', icon: 'person', name: { es: 'General', en: 'General' }, desc: { es: 'Perfil, resumen, experiencia y habilidades.', en: 'Profile, summary, experience and skills.' } },
]);

export const TEMPLATES = Object.freeze([
  { id: 'hand-drawn', icon: 'draw', name: { es: 'Hecho a mano', en: 'Hand-drawn' }, desc: { es: 'Papel, tinta y canvas procedurales (el look actual).', en: 'Paper, ink and procedural canvases (current look).' } },
  { id: 'executive', icon: 'business_center', name: { es: 'Ejecutivo', en: 'Executive' }, desc: { es: 'Sobrio, tarjetas planas, sin canvas.', en: 'Sober, flat cards, no canvases.' } },
  { id: 'minimal', icon: 'density_large', name: { es: 'Minimalista', en: 'Minimal' }, desc: { es: 'Texto al centro, cero adornos.', en: 'Centered text, zero ornaments.' } },
]);

export const professionById = (id) => PROFESSIONS.find((p) => p.id === id) ?? PROFESSIONS[0];
export const templateById = (id) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

const L = (es, en) => ({ es, en });

function baseData() {
  return {
    theme: { primary: '#2bee79', backgroundDark: '#102217', surfaceDark: '#162e21', backgroundLight: '#f6f8f7', surfaceLight: '#ffffff' },
    profile: { name: '', shortName: '', initials: '', role: L('', ''), avatarUrl: '', email: '', github: '', linkedin: '', cvUrl: '' },
    hero: { greeting: L('', ''), description: L('', '') },
    stats: {
      yearsActive: { value: '', label: L('', ''), sublabel: L('', '') },
      projects: { value: '', label: L('', ''), sublabel: L('', '') },
      techStack: { value: '', label: L('', ''), sublabel: L('', '') },
      experience: { value: '', label: L('', ''), sublabel: L('', '') },
    },
    experience: [],
    technologies: [],
    projects: [],
    contact: { title: L('', ''), description: L('', '') },
    sidebar: { availability: L('', ''), openToWork: L('', ''), downloadCV: L('', '') },
    footer: { builtWith: L('', '') },
  };
}

const blankExp = () => ({ id: `exp-${Date.now()}`, icon: 'work', title: L('', ''), date: '', description: L('', ''), isCurrent: false });
const blankProj = () => ({
  id: `proj-${Date.now()}`, title: '', category: '', categoryColor: 'primary', year: '',
  description: L('', ''), technologies: [], demoUrl: '', repoUrl: '', downloadUrl: '',
  imageUrl: '', icon: 'code', gradient: 'from-purple-900/50 to-blue-900/50',
});

/** Plantilla de datos iniciales por profesión (formulario explícito arranca lleno de guía). */
export function blankDataFor(profession) {
  const d = baseData();
  if (profession === 'developer') {
    d.stats.yearsActive = { value: '3+', label: L('Años activo', 'Years active'), sublabel: L('Desde 2022', 'Since 2022') };
    d.stats.projects = { value: '5+', label: L('Proyectos', 'Projects'), sublabel: L('Principales', 'Main ones') };
    d.stats.techStack = { value: '10+', label: L('Stack', 'Stack'), sublabel: L('Tecnologías', 'Technologies') };
    d.stats.experience = { value: '3', label: L('Experiencia', 'Experience'), sublabel: L('Freelance y empresa', 'Freelance & company') };
    d.experience = [{ ...blankExp() }];
    d.projects = [{ ...blankProj() }];
    d.technologies = [''];
  } else if (profession === 'designer') {
    d.projects = [{ ...blankProj() }, { ...blankProj() }];
    d.experience = [{ ...blankExp() }];
    d.technologies = [''];
  } else {
    d.experience = [{ ...blankExp() }];
    d.technologies = [''];
  }
  return d;
}

export const blankExpFactory = blankExp;
export const blankProjFactory = blankProj;
