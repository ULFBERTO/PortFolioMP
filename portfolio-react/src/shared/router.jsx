import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Mini-router por paths (sin dependencias): pushState + popstate + params :slug.
 * OJO deploy: requiere rewrite SPA a /index.html (ver portfolio-react/vercel.json).
 * @module shared/router
 */

const RouterContext = createContext({ path: '/', navigate: () => {} });

export function getPath() {
  return window.location.pathname || '/';
}

export function navigate(to) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const onPop = () => {
      setPath(getPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((to) => navigate(to), []);
  const value = useMemo(() => ({ path, navigate: go }), [path, go]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

/** Compara "/cv/:slug" contra "/cv/mario-patio" → { slug } o null. */
export function matchRoute(pattern, path) {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('?')[0].split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export const Link = memo(function Link({ to, children, className = '', ...rest }) {
  const { navigate: go } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
});
