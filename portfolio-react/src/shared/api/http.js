/**
 * Cliente HTTP con cookies de sesión (credentials:include), timeout y errores tipados.
 * @module shared/api/http
 */
import { API_ENDPOINTS } from '@/config/env.js';

export { API_ENDPOINTS };

export class ApiError extends Error {
  constructor(message, { status } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, timeoutMs = 12000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_ENDPOINTS.base}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(data.error || `Error ${res.status}`, { status: res.status });
    }
    return data;
  } catch (err) {
    if (err?.name === 'AbortError') throw new ApiError('Tiempo de espera agotado', { status: 408 });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const httpGet = (path, opts) => request(path, { ...opts, method: 'GET' });
export const httpPost = (path, body, opts) => request(path, { ...opts, method: 'POST', body });
export const httpPut = (path, body, opts) => request(path, { ...opts, method: 'PUT', body });
export const httpPatch = (path, body, opts) => request(path, { ...opts, method: 'PATCH', body });
export const httpDelete = (path, opts) => request(path, { ...opts, method: 'DELETE' });
