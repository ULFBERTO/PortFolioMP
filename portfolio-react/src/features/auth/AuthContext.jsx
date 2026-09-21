import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { httpGet, httpPost } from '@/shared/api/http.js';

/**
 * Sesión por cookie HttpOnly (el login por ?admin= quedó desactivado).
 * @module features/auth
 */

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await httpGet('/auth/me');
      if (res?.authenticated && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch {
      /* sin sesión */
    }
    setUser(null);
    return null;
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(async (email, password) => {
    const res = await httpPost('/auth/login', { email, password });
    setUser(res.user ?? null);
    return res;
  }, []);

  const register = useCallback(async (email, password) => {
    const res = await httpPost('/auth/register', { email, password });
    setUser(res.user ?? null);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await httpPost('/auth/logout', {});
    } catch {
      /* best-effort */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, logout, refreshMe }),
    [user, loading, login, register, logout, refreshMe],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
