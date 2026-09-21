/**
 * Configuración editable del front.
 * Cambia navegación, secciones lazy y metadatos en un solo lugar.
 * @module config/app
 */

export const SITE = Object.freeze({
  name: 'Portfolio Dashboard',
  version: 'v2.0',
  defaultLang: 'es',
  supportedLangs: ['es', 'en'],
});

export const NAVIGATION = Object.freeze([
  { id: 'dashboard', href: '#dashboard', icon: 'dashboard', i18nKey: 'nav.dashboard' },
  { id: 'projects', href: '#projects', icon: 'folder_open', i18nKey: 'nav.projects' },
  { id: 'experience', href: '#experience', icon: 'history', i18nKey: 'nav.experience' },
  { id: 'contact', href: '#contact', icon: 'mail', i18nKey: 'nav.contact' },
]);

/**
 * Orden de render de secciones. `load` permite code-splitting por sección.
 * Para agregar una sección nueva, añade una entrada aquí y crea el componente.
 */
export const SECTION_IDS = Object.freeze({
  HERO: 'dashboard',
  PROJECTS: 'projects',
  EXPERIENCE: 'experience',
  CONTACT: 'contact',
});

export const STORAGE_KEYS = Object.freeze({
  LANG: 'portfolio-lang',
  COOKIE_CONSENT: 'cookie_consent',
  ADMIN_ACTIVE: 'admin_active',
  ADMIN_TOKEN: 'admin_token',
  CACHE_PREFIX: 'portfolio:cache:v1:',
});
