import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { STORAGE_KEYS } from '@/config/app.js';
import { CACHE_POLICY } from '@/config/cache.js';
import {
  getPortfolio,
  savePortfolio,
  verifyAdminKey as verifyKeyApi,
  refreshSession as refreshSessionApi,
  logoutSession,
  invalidatePortfolio,
  getPortfolioSync,
} from '@/shared/api/portfolio.api.js';

const DataContext = createContext(null);

function cleanAdminUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('admin')) {
      url.searchParams.delete('admin');
      const newSearch = url.searchParams.toString();
      window.history.replaceState(
        {},
        '',
        url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash,
      );
    }
  } catch (e) {
    console.warn('No se pudo limpiar la URL:', e);
  }
}

export function DataProvider({ children }) {
  // Hidratar desde caché persistente para primer paint instantáneo.
  const [data, setData] = useState(() => getPortfolioSync());
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(
    () => sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || null,
  );
  const [loading, setLoading] = useState(() => getPortfolioSync() == null);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader && getPortfolioSync() == null) setLoading(true);
    setError(null);
    try {
      const { data: fresh, isStale: stale } = await getPortfolio();
      if (!mounted.current) return;
      setData(fresh);
      setIsStale(Boolean(stale));
      setLastUpdated(Date.now());
    } catch (err) {
      if (!mounted.current) return;
      console.error('Error al conectar con el backend:', err?.message);
      // Si hay caché aunque sea expirado, no romper la UI: mantener dato + marcar stale.
      const fallback = getPortfolioSync();
      if (fallback) {
        setIsStale(true);
      } else {
        setError(err?.message || 'Error de conexión con el backend');
        setData(null);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // Carga inicial + revalidación al volver a la pestaña (SWR).
  useEffect(() => {
    fetchData({ showLoader: data == null });

    if (!CACHE_POLICY.portfolio.revalidateOnFocus) return undefined;
    const onFocus = () => fetchData({ showLoader: false });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchData({ showLoader: false });
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const verifyAdminKey = useCallback(async (key) => {
    try {
      const result = await verifyKeyApi(key);
      if (result?.authenticated) {
        setIsAdmin(true);
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_ACTIVE, 'true');
        if (result.token) {
          setAdminToken(result.token);
          sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, result.token);
        }
        return true;
      }
      console.warn('Acceso denegado o clave incorrecta:', result?.error);
      setIsAdmin(false);
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ACTIVE);
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      return false;
    } catch (err) {
      console.error('Error al validar credenciales con el backend:', err);
      return false;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const ok = await refreshSessionApi().catch(() => false);
    if (ok) {
      setIsAdmin(true);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_ACTIVE, 'true');
      return true;
    }
    return false;
  }, []);

  // Route Guard: ?admin=... o sesión existente.
  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const adminKey = params.get('admin');

      if (adminKey) {
        const success = await verifyAdminKey(adminKey);
        cleanAdminUrl();
        if (!success) console.warn('[Route Guard] Acceso admin denegado.');
      } else if (
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_ACTIVE) === 'true' ||
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      ) {
        const ok = await refreshSession();
        if (!ok) {
          setIsAdmin(false);
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ACTIVE);
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        }
      }
    };

    checkSession();

    const handleConsentChange = (e) => {
      if (e.detail === 'rejected') {
        // eslint-disable-next-line no-use-before-define
        logout();
      }
    };
    window.addEventListener('cookie-consent-changed', handleConsentChange);
    return () => window.removeEventListener('cookie-consent-changed', handleConsentChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyAdminKey, refreshSession]);

  const logout = useCallback(async () => {
    setIsAdmin(false);
    setAdminToken(null);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ACTIVE);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    cleanAdminUrl();
    await logoutSession();
  }, []);

  const updateData = useCallback(
    async (newData) => {
      // Optimistic UI + persistencia en caché; rollback implícito vía refetch si falla.
      setData({ ...newData });
      try {
        await savePortfolio(newData, { token: adminToken });
      } catch (err) {
        console.error('Error de red al guardar en la API:', err);
        // Revalidar para no dejar la UI divergente del servidor.
        invalidatePortfolio();
        fetchData({ showLoader: false });
        throw err;
      }
    },
    [adminToken, fetchData],
  );

  const downloadData = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const value = useMemo(
    () => ({
      data,
      updateData,
      isAdmin,
      setIsAdmin,
      logout,
      downloadData,
      loading,
      error,
      isStale,
      lastUpdated,
      refetch: () => fetchData({ showLoader: data == null }),
    }),
    [data, updateData, isAdmin, logout, downloadData, loading, error, isStale, lastUpdated, fetchData],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
