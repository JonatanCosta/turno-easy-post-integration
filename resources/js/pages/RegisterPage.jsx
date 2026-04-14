import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
    const { user, register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
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
            await register({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message;
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(Object.values(errors).flat().join(' '));
            } else {
                setError(typeof msg === 'string' ? msg : 'Could not register.');
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-secondary/8 via-zinc-50 to-zinc-50" />
            <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-secondary/5">
                <div className="mb-6 flex justify-center">
                    <img
                        src="/images/turno-tm-logo.webp"
                        alt="Turno"
                        className="h-10 w-auto max-w-full object-contain"
                    />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-secondary">Create your account</h1>
                <p className="mt-1 text-sm text-secondary/65">
                    New accounts start on the Free plan. Connect EasyPost under Integrations to buy labels.
                </p>
                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            Name
                        </label>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {busy ? 'Creating…' : 'Create account'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-secondary/55">
                    Already registered?{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary/85">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
