import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SITE, STORAGE_KEYS } from '@/config/app.js';
import { loadDictionary } from './lazy-index.js';

export function getInitialLanguage() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    if (saved && SITE.supportedLangs.includes(saved)) return saved;
    const navLang = navigator.language?.split('-')[0];
    if (navLang === 'en') return 'en';
  }
  return SITE.defaultLang;
}

export const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  lng: initialLang,
  fallbackLng: SITE.defaultLang,
  // Sin `resources`: los diccionarios se cargan por demanda (lazy).
  // Esto evita descargar `en` cuando el usuario solo usa `es`.
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lng);
    } catch {
      /* noop */
    }
    document.documentElement.lang = lng;
  }
});

/**
 * Carga (con caché) el diccionario y lo registra en i18next.
 * Llamar antes/después de `changeLanguage` para garantizar traducciones.
 */
export async function ensureLanguageLoaded(lng) {
  const normalized = lng?.startsWith('en') ? 'en' : 'es';
  if (i18n.hasResourceBundle(normalized, 'translation')) return normalized;
  const dict = await loadDictionary(normalized);
  i18n.addResourceBundle(normalized, 'translation', dict, true, true);
  return normalized;
}

// El idioma inicial se carga de forma bloqueante en `main.jsx` antes del
// primer render (evita flash de keys como `experience.title`).
// Aquí solo precargamos el fallback en background para cambios rápidos ES<->EN.
if (typeof window !== 'undefined') {
  const preloadFallback = () => {
    if (initialLang !== SITE.defaultLang) {
      ensureLanguageLoaded(SITE.defaultLang).catch(() => undefined);
    }
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadFallback, { timeout: 2000 });
  } else {
    setTimeout(preloadFallback, 0);
  }
}

export default i18n;
