/**
 * Política de caché centralizada. Ajusta TTLs aquí.
 * - staleTime: tiempo en que el dato se considera fresco (no refetch).
 * - cacheTime: tiempo máximo persistido en localStorage.
 * - revalidateOnFocus: revalidar al volver a la pestaña (SWR).
 * @module config/cache
 */

export const CACHE_POLICY = Object.freeze({
  portfolio: {
    key: 'portfolio:data',
    staleTime: 5 * 60 * 1000, // 5 min fresco en memoria
    cacheTime: 30 * 60 * 1000, // 30 min persistido
    revalidateOnFocus: true,
    retry: 2,
    timeoutMs: 10_000,
  },
  i18n: {
    key: 'i18n:dict',
    staleTime: 24 * 60 * 60 * 1000,
    cacheTime: 7 * 24 * 60 * 60 * 1000,
  },
});

export const HTTP_CACHE = Object.freeze({
  // Para fetch: usamos cache del navegador + ETag cuando el backend lo soporta.
  fetchCacheMode: 'default',
});
