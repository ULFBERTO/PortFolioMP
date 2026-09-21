/**
 * Cliente HTTP centralizado: timeout, reintentos, errores tipados.
 * Toda la app debe usar `apiGet/apiPost` en lugar de `fetch` directo.
 * @module shared/lib/api-client
 */

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {string} url
 * @param {RequestInit & {timeoutMs?: number, retry?: number}} opts
 */
export async function apiRequest(url, opts = {}) {
  const { timeoutMs = 10_000, retry = 1, ...init } = opts;
  let lastError = null;

  for (let attempt = 0; attempt <= retry; attempt += 1) {
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);

      if (res.status === 304) return null; // Not Modified (ETag)

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson
        ? await res.json().catch(() => null)
        : await res.text().catch(() => '');

      if (!res.ok) {
        const message =
          (payload && payload.error) || `Error ${res.status}: ${res.statusText}`;
        throw new ApiError(message, { status: res.status, payload });
      }
      return payload;
    } catch (err) {
      lastError = err?.name === 'AbortError'
        ? new ApiError(`Timeout tras ${timeoutMs}ms en ${url}`, { status: 408 })
        : err;
      if (attempt < retry) await sleep(400 * (attempt + 1)); // backoff lineal
    }
  }
  throw lastError;
}

export const apiGet = (url, opts) =>
  apiRequest(url, { method: 'GET', ...opts });

export const apiPost = (url, body, opts = {}) =>
  apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: opts.credentials ?? 'include',
    body: JSON.stringify(body ?? {}),
    ...opts,
  });
