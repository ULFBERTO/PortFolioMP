/**
 * Loader lazy de diccionarios i18n (code-splitting por idioma).
 * Cada `es.json` / `en.json` se convierte en un chunk separado
 * que solo se descarga cuando se necesita.
 * @module i18n/loader
 */

const dictCache = new Map();

/** @param {'es'|'en'} lng */
export async function loadDictionary(lng) {
  const normalized = lng?.startsWith('en') ? 'en' : 'es';
  if (dictCache.has(normalized)) return dictCache.get(normalized);

  // Vite genera un chunk por idioma gracias al import dinámico con variable acotada.
  const mod = await import(`./locales/${normalized}.json`);
  const dict = mod.default ?? mod;
  dictCache.set(normalized, dict);
  return dict;
}

export function getCachedDictionary(lng) {
  return dictCache.get(lng) ?? null;
}
