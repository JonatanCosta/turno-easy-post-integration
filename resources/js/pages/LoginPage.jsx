import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await login(email, password);
            navigate('/');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-zinc-50 to-zinc-50" />
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-secondary/5">
                <div className="mb-6 flex justify-center">
                    <img
                        src="/images/turno-tm-logo.webp"
                        alt="Turno"
                        className="h-10 w-auto max-w-full object-contain"
                    />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-secondary">Welcome back</h1>
                <p className="mt-1 text-sm text-secondary/65">Sign in to manage USPS shipping labels.</p>
                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none ring-primary/30 focus:border-primary focus:ring-2"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none ring-primary/30 focus:border-primary focus:ring-2"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {busy ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-secondary/55">
                    No account?{' '}
                    <Link to="/register" className="font-medium text-primary hover:text-primary/85">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
