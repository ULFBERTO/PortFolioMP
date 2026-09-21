import { memo, useState } from 'react';
import { Link, useRouter } from '@/shared/router.jsx';
import { useAuth } from '@/features/auth/AuthContext.jsx';
import { ApiError } from '@/shared/api/http.js';

function Shell({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4 text-ink">
      <div className="ink-card w-full max-w-md p-8">
        <Link to="/" className="hand-title text-2xl">← hojadevida</Link>
        <h1 className="hand-title mt-2 text-5xl">{title}</h1>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function useAuthForm(submit) {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await submit(email.trim(), password);
      navigate('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  };
  return { email, setEmail, password, setPassword, error, busy, onSubmit };
}

const inputCls = 'w-full rounded-lg border-2 border-ink bg-paper px-3 py-2.5 text-ink focus:outline-none';

export const Login = memo(function Login() {
  const { login } = useAuth();
  const f = useAuthForm(login);
  return (
    <Shell title="Entrar">
      <form onSubmit={f.onSubmit} className="flex flex-col gap-3">
        <input type="email" required value={f.email} onChange={(e) => f.setEmail(e.target.value)} placeholder="email@ejemplo.com" className={inputCls} autoComplete="email" />
        <input type="password" required value={f.password} onChange={(e) => f.setPassword(e.target.value)} placeholder="Contraseña" className={inputCls} autoComplete="current-password" />
        {f.error && <p className="rounded-lg border border-blush/50 bg-blush/10 px-3 py-2 text-sm text-blush">{f.error}</p>}
        <button type="submit" disabled={f.busy} className="btn-ink bg-ink py-3 font-mono text-sm font-bold text-paper disabled:opacity-50">
          {f.busy ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="text-center font-mono text-sm">¿Sin cuenta? <Link to="/register" className="font-bold underline">Regístrate</Link></p>
      </form>
    </Shell>
  );
});

export const Register = memo(function Register() {
  const { register } = useAuth();
  const f = useAuthForm(register);
  return (
    <Shell title="Crear cuenta">
      <form onSubmit={f.onSubmit} className="flex flex-col gap-3">
        <input type="email" required value={f.email} onChange={(e) => f.setEmail(e.target.value)} placeholder="email@ejemplo.com" className={inputCls} autoComplete="email" />
        <input type="password" required minLength={8} value={f.password} onChange={(e) => f.setPassword(e.target.value)} placeholder="Contraseña (mín. 8)" className={inputCls} autoComplete="new-password" />
        {f.error && <p className="rounded-lg border border-blush/50 bg-blush/10 px-3 py-2 text-sm text-blush">{f.error}</p>}
        <button type="submit" disabled={f.busy} className="btn-ink bg-ink py-3 font-mono text-sm font-bold text-paper disabled:opacity-50">
          {f.busy ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="text-center font-mono text-sm">¿Ya tienes? <Link to="/login" className="font-bold underline">Entra</Link></p>
      </form>
    </Shell>
  );
});
