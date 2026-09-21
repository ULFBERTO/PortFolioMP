/**
 * Caché ligero con estrategia Stale-While-Revalidate (SWR).
 * Capas: memoria (Map) -> localStorage (persistente) -> red.
 * @module shared/lib/cache
 */
import { STORAGE_KEYS } from '@/config/app.js';

const memory = new Map();
const inFlight = new Map();

function now() {
  return Date.now();
}

function storageKey(key) {
  return `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
}

function readPersistent(key) {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.timestamp !== 'number') return null;
    return entry;
  } catch {
    return null;
  }
}

function writePersistent(key, data) {
  try {
    localStorage.setItem(
      storageKey(key),
      JSON.stringify({ data, timestamp: now() }),
    );
  } catch {
    /* almacenamiento lleno o bloqueado: ignorar */
  }
}

export function invalidateCache(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    /* noop */
  }
}

export function getCachedSync(key, cacheTime) {
  const mem = memory.get(key);
  if (mem && now() - mem.timestamp < cacheTime) return mem;

  const persisted = readPersistent(key);
  if (persisted && now() - persisted.timestamp < cacheTime) {
    memory.set(key, persisted); // hidratar memoria
    return persisted;
  }
  return null;
}

export function setCached(key, data) {
  const entry = { data, timestamp: now() };
  memory.set(key, entry);
  writePersistent(key, data);
}

/**
 * Obtiene un recurso con deduplicación de peticiones en vuelo.
 * Si hay dato stale, lo devuelve de inmediato y revalida en background.
 */
export async function swr(key, fetcher, { staleTime = 0, cacheTime = 0 } = {}) {
  const cached = getCachedSync(key, cacheTime);

  const isFresh = cached && now() - cached.timestamp < staleTime;
  if (isFresh) return { data: cached.data, isStale: false, fromCache: true };

  // Deduplicar: si ya hay un fetch en vuelo para esta key, reutilizarlo.
  if (inFlight.has(key)) {
    const data = await inFlight.get(key);
    return { data, isStale: false, fromCache: false };
  }

  // Si hay stale, revalidar en background sin bloquear.
  if (cached) {
    const bg = Promise.resolve()
      .then(fetcher)
      .then((fresh) => {
        setCached(key, fresh);
        return fresh;
      })
      .catch(() => cached.data)
      .finally(() => inFlight.delete(key));
    inFlight.set(key, bg);
    return { data: cached.data, isStale: true, fromCache: true };
  }

  const promise = Promise.resolve()
    .then(fetcher)
    .then((fresh) => {
      setCached(key, fresh);
      return fresh;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  const data = await promise;
  return { data, isStale: false, fromCache: false };
}
