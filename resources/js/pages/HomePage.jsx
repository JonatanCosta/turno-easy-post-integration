import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-semibold text-secondary">Home</h1>
            <p className="mt-2 text-secondary/70">
                Hello, {user?.name}. Generate USPS shipping labels through EasyPost — all requests stay on the server.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                    to="/integrations"
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-primary/35 hover:shadow-md"
                >
                    <h2 className="font-semibold text-secondary">Integrations</h2>
                    <p className="mt-1 text-sm text-secondary/65">Add your EasyPost API key (stored encrypted).</p>
                </Link>
                <Link
                    to="/shipping-labels"
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-primary/35 hover:shadow-md"
                >
                    <h2 className="font-semibold text-secondary">Shipping Labels</h2>
                    <p className="mt-1 text-sm text-secondary/65">View history and create new labels.</p>
                </Link>
            </div>
        </div>
    );
}
