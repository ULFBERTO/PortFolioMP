/**
 * Centraliza y valida las variables de entorno.
 * Para modificar el backend, edita solo `.env` (ver `.env.example`).
 * @module config/env
 */

function resolveApiBaseUrl() {
  const fromEnv = import.meta.env?.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) return 'https://port-folio-mp.vercel.app/api';
  }
  return 'http://localhost:8080/api';
}

export const ENV = Object.freeze({
  API_BASE_URL: resolveApiBaseUrl(),
  IS_DEV: Boolean(import.meta.env?.DEV),
  IS_PROD: Boolean(import.meta.env?.PROD),
  APP_VERSION: '2.0.0',
});

export const API_ENDPOINTS = Object.freeze({
  portfolio: `${ENV.API_BASE_URL}/portfolio`,
  authVerify: `${ENV.API_BASE_URL}/auth/verify`,
  authRefresh: `${ENV.API_BASE_URL}/auth/refresh`,
  authLogout: `${ENV.API_BASE_URL}/auth/logout`,
});
