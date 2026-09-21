import { Suspense, lazy } from 'react';
import { LanguageProvider } from '@/context/LanguageContext.jsx';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext.jsx';
import { RouterProvider, matchRoute, useRouter } from '@/shared/router.jsx';
import Landing from '@/pages/Landing.jsx';
import { Login, Register } from '@/pages/AuthPages.jsx';
import MotionToggle from '@/shared/motion/MotionToggle.jsx';
import ScrollProgress from '@/shared/motion/ScrollProgress.jsx';
import CookieConsent from '@/components/CookieConsent.jsx';
import { Spinner } from '@/shared/components/ui/index.js';

// Chunks por ruta: el visitante público no descarga el editor ni el admin.
const Dashboard = lazy(() => import('@/pages/Dashboard.jsx'));
const CvNew = lazy(() => import('@/pages/CvPages.jsx').then((m) => ({ default: m.NewCV })));
const CvEdit = lazy(() => import('@/pages/CvPages.jsx').then((m) => ({ default: m.EditCV })));
const CvPublic = lazy(() => import('@/pages/CvPages.jsx').then((m) => ({ default: m.PublicCV })));
const CvAdmin = lazy(() => import('@/pages/CvPages.jsx').then((m) => ({ default: m.AdminUsers })));

function RequireAuth({ children, admin }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <Spinner label="Cargando…" />
      </div>
    );
  }
  if (!user) {
    navigate('/login');
    return null;
  }
  if (admin && user.role !== 'admin') {
    navigate('/app');
    return null;
  }
  return children;
}

function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
      <Spinner label="Cargando…" />
    </div>
  );
}

function Routes() {
  const { path } = useRouter();

  if (path === '/') return <Landing />;
  if (path === '/login') return <Login />;
  if (path === '/register') return <Register />;
  if (path === '/app') {
    return <RequireAuth><Suspense fallback={<PageLoading />}><Dashboard /></Suspense></RequireAuth>;
  }
  if (path === '/app/nuevo') {
    return <RequireAuth><Suspense fallback={<PageLoading />}><CvNew /></Suspense></RequireAuth>;
  }

  const editMatch = matchRoute('/app/cv/:id', path);
  if (editMatch) {
    return <RequireAuth><Suspense fallback={<PageLoading />}><CvEdit id={editMatch.id} /></Suspense></RequireAuth>;
  }
  const publicMatch = matchRoute('/cv/:slug', path);
  if (publicMatch) {
    return <Suspense fallback={<PageLoading />}><CvPublic slug={publicMatch.slug} /></Suspense>;
  }
  if (path === '/app/admin') {
    return <RequireAuth admin><Suspense fallback={<PageLoading />}><CvAdmin /></Suspense></RequireAuth>;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper p-6 text-center text-ink">
      <p className="hand-title text-5xl">404 · nada por aquí</p>
      <a href="/" className="btn-ink bg-ink px-5 py-2.5 font-mono text-sm font-bold text-paper">Ir al inicio</a>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider>
          <ScrollProgress />
          <MotionToggle />
          <Routes />
          <Suspense fallback={null}>
            <CookieConsent />
          </Suspense>
        </RouterProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
