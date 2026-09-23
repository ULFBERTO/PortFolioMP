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
  // Fila 1: Estilos clásicos
  { id: 'hand-drawn', icon: 'draw', name: { es: 'Hecho a mano', en: 'Hand-drawn' }, desc: { es: 'Papel, tinta y canvas procedurales (look original).', en: 'Paper, ink and procedural canvases (original look).' }, theme: { primary: '#2bee79', paper: '#f3e6cf', ink: '#1e1630', accent: '#c8473f', canvas: true, cardStyle: 'ink', sidebar: 'left' } },
  { id: 'executive', icon: 'business_center', name: { es: 'Ejecutivo', en: 'Executive' }, desc: { es: 'Sobrio, tarjetas planas, sin canvas.', en: 'Sober, flat cards, no canvas.' }, theme: { primary: '#1e3a5f', paper: '#f8f9fa', ink: '#1a1a2e', accent: '#2e86c1', canvas: false, cardStyle: 'flat', sidebar: 'left' } },
  { id: 'minimal', icon: 'density_large', name: { es: 'Minimalista', en: 'Minimal' }, desc: { es: 'Texto al centro, cero adornos.', en: 'Centered text, zero ornaments.' }, theme: { primary: '#333333', paper: '#ffffff', ink: '#1a1a1a', accent: '#666666', canvas: false, cardStyle: 'minimal', sidebar: 'center' } },
  { id: 'typewriter', icon: 'font_download', name: { es: 'Máquina de escribir', en: 'Typewriter' }, desc: { es: 'Estética mecanografiada, monoespaciado.', en: 'Typewriter aesthetic, monospaced.' }, theme: { primary: '#2d2d2d', paper: '#f5f0e1', ink: '#1a1a1a', accent: '#8b4513', canvas: false, cardStyle: 'typewriter', sidebar: 'left', font: 'monospace' } },
  { id: 'blueprint', icon: 'architecture', name: { es: 'Plano técnico', en: 'Blueprint' }, desc: { es: 'Estilo plano arquitectónico, líneas técnicas.', en: 'Architectural blueprint style.' }, theme: { primary: '#00d4ff', paper: '#0a1628', ink: '#00d4ff', accent: '#ffffff', canvas: true, cardStyle: 'blueprint', sidebar: 'left', bgGrid: true } },

  // Fila 2: Estilos modernos
  { id: 'dark-mode', icon: 'dark_mode', name: { es: 'Modo oscuro', en: 'Dark Mode' }, desc: { es: 'Fondo negro, acentos neón.', en: 'Black background, neon accents.' }, theme: { primary: '#00ff88', paper: '#0d0d0d', ink: '#e0ffe8', accent: '#ff006e', canvas: true, cardStyle: 'neon', sidebar: 'left', glow: true } },
  { id: 'solarized', icon: 'wb_sunny', name: { es: 'Solarizado', en: 'Solarized' }, desc: { es: 'Paleta solarizada, fácil lectura.', en: 'Solarized palette, easy reading.' }, theme: { primary: '#b58900', paper: '#fdf6e3', ink: '#657b83', accent: '#268bd2', canvas: false, cardStyle: 'solarized', sidebar: 'left' } },
  { id: 'nord', icon: 'ac_unit', name: { es: 'Nórdico', en: 'Nord' }, desc: { es: 'Frío, minimalista, estilo Nórdico.', en: 'Cool, minimalist, Nord style.' }, theme: { primary: '#88c0d0', paper: '#2e3440', ink: '#d8dee9', accent: '#81a1c1', canvas: true, cardStyle: 'nord', sidebar: 'left' } },
  { id: 'dracula', icon: 'vampire', name: { es: 'Drácula', en: 'Dracula' }, desc: { es: 'Oscuro con acentos púrpura/rosa.', en: 'Dark with purple/pink accents.' }, theme: { primary: '#bd93f9', paper: '#282a36', ink: '#f8f8f2', accent: '#ff79c6', canvas: true, cardStyle: 'dracula', sidebar: 'left', glow: true } },
  { id: 'github', icon: 'code', name: { es: 'GitHub', en: 'GitHub' }, desc: { es: 'Estilo GitHub, limpio y familiar.', en: 'GitHub style, clean and familiar.' }, theme: { primary: '#2da44e', paper: '#ffffff', ink: '#24292e', accent: '#0969da', canvas: false, cardStyle: 'github', sidebar: 'left' } },

  // Fila 3: Estilos creativos
  { id: 'retro', icon: 'cassette_tape', name: { es: 'Retro 80s', en: 'Retro 80s' }, desc: { es: 'Neón, gradientes, estilo synthwave.', en: 'Neon, gradients, synthwave style.' }, theme: { primary: '#ff00ff', paper: '#1a0033', ink: '#ffff00', accent: '#00ffff', canvas: true, cardStyle: 'retro', sidebar: 'left', gradient: 'linear-gradient(45deg, #ff00ff, #00ffff)' } },
  { id: 'forest', icon: 'forest', name: { es: 'Bosque', en: 'Forest' }, desc: { es: 'Verdes naturales, orgánico.', en: 'Natural greens, organic.' }, theme: { primary: '#2d5a27', paper: '#f0f8f0', ink: '#1a3a1a', accent: '#4a7c59', canvas: true, cardStyle: 'forest', sidebar: 'left' } },
  { id: 'ocean', icon: 'waves', name: { es: 'Océano', en: 'Ocean' }, desc: { es: 'Azules profundos, fluido.', en: 'Deep blues, fluid.' }, theme: { primary: '#0077b6', paper: '#e0f4ff', ink: '#001d3d', accent: '#00b4d8', canvas: true, cardStyle: 'ocean', sidebar: 'left', wave: true } },
  { id: 'sunset', icon: 'sunset', name: { es: 'Atardecer', en: 'Sunset' }, desc: { es: 'Naranjas, rojos, cálido.', en: 'Oranges, reds, warm.' }, theme: { primary: '#ff6b35', paper: '#fff5eb', ink: '#3d1a0c', accent: '#f7a072', canvas: true, cardStyle: 'sunset', sidebar: 'left', gradient: 'linear-gradient(135deg, #ff6b35, #f7a072)' } },
  { id: 'monochrome', icon: 'filter_b_and_w', name: { es: 'Monocromo', en: 'Monochrome' }, desc: { es: 'Solo grises, máximo contraste.', en: 'Only greys, max contrast.' }, theme: { primary: '#444444', paper: '#fafafa', ink: '#111111', accent: '#888888', canvas: false, cardStyle: 'monochrome', sidebar: 'left' } },
  { id: 'terminal', icon: 'terminal', name: { es: 'Terminal', en: 'Terminal' }, desc: { es: 'Estética CLI, verde sobre negro.', en: 'CLI aesthetic, green on black.' }, theme: { primary: '#00ff00', paper: '#000000', ink: '#00ff00', accent: '#00cc00', canvas: true, cardStyle: 'terminal', sidebar: 'left', font: 'monospace', scanlines: true } },

  // Fila 4: Estilos especializados
  { id: 'academic', icon: 'school', name: { es: 'Académico', en: 'Academic' }, desc: { es: 'Estilo paper LaTeX, formal.', en: 'LaTeX paper style, formal.' }, theme: { primary: '#1a1a1a', paper: '#fafafa', ink: '#000000', accent: '#8b0000', canvas: false, cardStyle: 'academic', sidebar: 'center', serif: true } },
  { id: 'portfolio', icon: 'photo_library', name: { es: 'Portafolio visual', en: 'Visual Portfolio' }, desc: { es: 'Enfocado en imágenes, grid.', en: 'Image-focused, grid layout.' }, theme: { primary: '#6366f1', paper: '#ffffff', ink: '#1f2937', accent: '#ec4899', canvas: false, cardStyle: 'portfolio', sidebar: 'left', imageHeavy: true } },
  { id: 'cv-standard', icon: 'description', name: { es: 'CV Estándar ATS', en: 'Standard ATS CV' }, desc: { es: 'Limpio, compatible con ATS.', en: 'Clean, ATS-compatible.' }, theme: { primary: '#1f2937', paper: '#ffffff', ink: '#111827', accent: '#374151', canvas: false, cardStyle: 'ats', sidebar: 'left', ats: true } },
]);

export const professionById = (id) => PROFESSIONS.find((p) => p.id === id) ?? PROFESSIONS[0];
export const templateById = (id) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

const L = (es, en) => ({ es, en });

function baseData() {
  return {
    theme: { primary: '#2bee79', backgroundDark: '#102217', surfaceDark: '#162e21', backgroundLight: '#f6f8f7', surfaceLight: '#ffffff' },
    profile: { name: '', shortName: '', initials: '', role: L('', ''), avatarUrl: '', email: '', phone: '', location: '', github: '', linkedin: '', cvUrl: '' },
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
    education: [],
    languages: L('', ''),
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

const blankEdu = () => ({ id: `edu-${Date.now()}`, title: '', details: '' });

export const blankExpFactory = blankExp;
export const blankProjFactory = blankProj;
export const blankEduFactory = blankEdu;
