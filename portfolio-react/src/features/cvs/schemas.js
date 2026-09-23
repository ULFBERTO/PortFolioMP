/**
 * Formularios explícitos por profesión: qué campos pide cada tipo de hoja de vida.
 * kind: text|textarea|url|email|check|localized|chips|explist|projlist|stats
 * @module features/cvs/schemas
 */

const profileFields = [
  { key: 'profile.name', kind: 'text', label: 'Nombre completo' },
  { key: 'profile.shortName', kind: 'text', label: 'Nombre corto' },
  { key: 'profile.initials', kind: 'text', label: 'Iniciales' },
  { key: 'profile.email', kind: 'email', label: 'Email' },
  { key: 'profile.phone', kind: 'text', label: 'Teléfono' },
  { key: 'profile.location', kind: 'text', label: 'Ubicación' },
  { key: 'profile.role', kind: 'localized', label: 'Rol / título' },
  { key: 'profile.github', kind: 'url', label: 'GitHub URL' },
  { key: 'profile.linkedin', kind: 'url', label: 'LinkedIn URL' },
  { key: 'profile.cvUrl', kind: 'url', label: 'CV PDF URL' },
];

const heroFields = [
  { key: 'hero.greeting', kind: 'localized', label: 'Saludo' },
  { key: 'hero.description', kind: 'localized', label: 'Descripción', textarea: true },
];

const eduLangFields = [
  { key: 'education', kind: 'edulist', label: 'Estudios' },
  { key: 'languages', kind: 'localized', label: 'Idiomas (ej: Español: Nativo | Inglés: B1)' },
];

const contactFields = [
  { key: 'contact.title', kind: 'localized', label: 'Título contacto' },
  { key: 'contact.description', kind: 'localized', label: 'Texto contacto', textarea: true },
  { key: 'sidebar.availability', kind: 'localized', label: 'Disponibilidad' },
  { key: 'sidebar.openToWork', kind: 'localized', label: 'Abierto a trabajo' },
  { key: 'sidebar.downloadCV', kind: 'localized', label: 'Botón descargar CV' },
  { key: 'footer.builtWith', kind: 'localized', label: 'Firma footer' },
];

export const SCHEMAS = Object.freeze({
  developer: [
    { id: 'profile', title: 'Perfil', fields: profileFields },
    { id: 'hero', title: 'Presentación', fields: heroFields },
    { id: 'stats', title: 'Estadísticas', fields: [{ key: 'stats', kind: 'stats', label: 'Stats' }] },
    { id: 'experience', title: 'Experiencia', fields: [{ key: 'experience', kind: 'explist', label: 'Empleos' }] },
    { id: 'tech', title: 'Stack', fields: [{ key: 'technologies', kind: 'chips', label: 'Tecnologías' }] },
    { id: 'projects', title: 'Proyectos', fields: [{ key: 'projects', kind: 'projlist', label: 'Proyectos' }] },
    { id: 'education', title: 'Educación e idiomas', fields: eduLangFields },
    { id: 'contact', title: 'Contacto', fields: contactFields },
  ],
  designer: [
    { id: 'profile', title: 'Perfil', fields: profileFields },
    { id: 'hero', title: 'Presentación', fields: heroFields },
    { id: 'projects', title: 'Obras seleccionadas', fields: [{ key: 'projects', kind: 'projlist', label: 'Obras (usa Imagen del proyecto)' }] },
    { id: 'experience', title: 'Experiencia', fields: [{ key: 'experience', kind: 'explist', label: 'Empleos' }] },
    { id: 'tech', title: 'Herramientas', fields: [{ key: 'technologies', kind: 'chips', label: 'Herramientas' }] },
    { id: 'education', title: 'Educación e idiomas', fields: eduLangFields },
    { id: 'contact', title: 'Contacto', fields: contactFields },
  ],
  general: [
    { id: 'profile', title: 'Perfil', fields: profileFields },
    { id: 'hero', title: 'Resumen', fields: heroFields },
    { id: 'experience', title: 'Experiencia', fields: [{ key: 'experience', kind: 'explist', label: 'Empleos' }] },
    { id: 'tech', title: 'Habilidades', fields: [{ key: 'technologies', kind: 'chips', label: 'Habilidades' }] },
    { id: 'education', title: 'Educación e idiomas', fields: eduLangFields },
    { id: 'contact', title: 'Contacto', fields: contactFields },
  ],
});

export const schemaFor = (profession) => SCHEMAS[profession] ?? SCHEMAS.general;
