/**
 * Capa de acceso a datos del portfolio.
 * - GET con caché SWR (memoria + localStorage).
 * - Mutaciones invalidan caché automáticamente.
 * @module shared/api/portfolio
 */
import { API_ENDPOINTS } from '@/config/env.js';
import { CACHE_POLICY } from '@/config/cache.js';
import { swr, setCached, invalidateCache, getCachedSync } from '@/shared/lib/cache.js';
import { apiGet, apiPost, apiRequest } from '@/shared/lib/api-client.js';

const POLICY = CACHE_POLICY.portfolio;

async function fetchPortfolioNetwork() {
  const data = await apiGet(API_ENDPOINTS.portfolio, {
    timeoutMs: POLICY.timeoutMs,
    retry: POLICY.retry,
  });
  if (!data || !data.profile) {
    throw new Error('Respuesta del backend inválida: falta `profile`.');
  }
  return data;
}

export async function getPortfolio({ revalidate = true } = {}) {
  if (!revalidate) {
    const hit = getCachedSync(POLICY.key, POLICY.cacheTime);
    if (hit) return { data: hit.data, isStale: false, fromCache: true };
  }
  return swr(POLICY.key, fetchPortfolioNetwork, {
    staleTime: POLICY.staleTime,
    cacheTime: POLICY.cacheTime,
  });
}

export function getPortfolioSync() {
  return getCachedSync(POLICY.key, POLICY.cacheTime)?.data ?? null;
}

export async function savePortfolio(nextData, { token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await apiPost(API_ENDPOINTS.portfolio, nextData, {
    headers,
    timeoutMs: POLICY.timeoutMs,
    retry: 0,
  }).catch(async (err) => {
    // Auto-refresh una vez ante 401 y reintentar
    if (err?.status === 401) {
      const refreshed = await refreshSession().catch(() => false);
      if (refreshed) {
        return apiPost(API_ENDPOINTS.portfolio, nextData, {
          headers,
          timeoutMs: POLICY.timeoutMs,
          retry: 0,
        });
      }
    }
    throw err;
  });

  // Actualización optimista de caché tras guardado exitoso
  setCached(POLICY.key, nextData);
  return res;
}

export function invalidatePortfolio() {
  invalidateCache(POLICY.key);
}

export async function verifyAdminKey(key) {
  return apiRequest(
    `${API_ENDPOINTS.authVerify}?admin=${encodeURIComponent(key)}`,
    { method: 'POST', credentials: 'include', timeoutMs: 10_000, retry: 0 },
  );
}

export async function refreshSession() {
  if (localStorage.getItem('cookie_consent') === 'rejected') return false;
  try {
    const result = await apiPost(API_ENDPOINTS.authRefresh, {}, { retry: 0 });
    return Boolean(result?.authenticated);
  } catch {
    return false;
  }
}

export async function logoutSession() {
  try {
    await apiPost(API_ENDPOINTS.authLogout, {}, { retry: 0 });
  } catch {
    /* logout es best-effort */
  }
}
