/**
 * API de CVs + micro-caché en memoria para la vista pública.
 * @module features/cvs/api
 */
import { httpDelete, httpGet, httpPost, httpPut, ApiError } from '@/shared/api/http.js';

export { ApiError };

const publicCache = new Map(); // slug -> { data, ts }
const PUBLIC_TTL = 60_000;

export const registerApi = (email, password) => httpPost('/auth/register', { email, password });
export const loginApi = (email, password) => httpPost('/auth/login', { email, password });

export const listMyCvs = () => httpGet('/cvs/mine');
export const getCv = (id) => httpGet(`/cvs/${id}`);
export const createCv = (payload) => httpPost('/cvs', payload);
export const updateCv = (id, payload) => httpPut(`/cvs/${id}`, payload);
export const deleteCv = (id) => httpDelete(`/cvs/${id}`);
export const duplicateCv = (id) => httpPost(`/cvs/${id}/duplicate`, {});

export async function getPublicCv(slug) {
  const hit = publicCache.get(slug.toLowerCase());
  if (hit && Date.now() - hit.ts < PUBLIC_TTL) return hit.data;
  const data = await httpGet(`/cv/${encodeURIComponent(slug)}`);
  publicCache.set(slug.toLowerCase(), { data, ts: Date.now() });
  return data;
}

export function invalidatePublicCv(slug) {
  if (slug) publicCache.delete(slug.toLowerCase());
  else publicCache.clear();
}

export const adminListUsers = () => httpGet('/admin/users');
export const adminSetRole = (id, role) => httpPut(`/admin/users/${id}/role`, { role });
export const adminDeleteUser = (id) => httpDelete(`/admin/users/${id}`);
export const adminListCvs = () => httpGet('/admin/cvs');
