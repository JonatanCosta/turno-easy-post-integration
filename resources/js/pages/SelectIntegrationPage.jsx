import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http.js';

export default function SelectIntegrationPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await http.get('/integrations/shipping');
                setItems(data.data ?? []);
            } catch {
                setError('Could not load integrations.');
            }
        })();
    }, []);

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/shipping-labels" className="text-sm font-medium text-primary hover:text-primary/85">
                ← Back to Shipping Labels
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-secondary">Choose integration</h1>
            <p className="mt-1 text-secondary/70">Select how the label should be purchased. More providers can be added later.</p>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {items.map((row) => {
                    const isEasypost = row.key === 'easypost';
                    const needsSetup = isEasypost && !row.configured;

                    if (needsSetup) {
                        return (
                            <div
                                key={row.key}
                                className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-6 opacity-95 shadow-sm"
                                aria-disabled="true"
                            >
                                <h2 className="text-lg font-semibold text-secondary/80">{row.name}</h2>
                                <p className="mt-2 text-sm text-secondary/55">Key: {row.key}</p>
                                <p className="mt-3 text-sm text-secondary/65">
                                    Connect your EasyPost API key before you can use this integration.
                                </p>
                                <Link
                                    to="/integrations"
                                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                                >
                                    Configure integration
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={row.key}
                            to={`/shipping-labels/generate/${row.key}`}
                            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                        >
                            <h2 className="text-lg font-semibold text-secondary">{row.name}</h2>
                            <p className="mt-2 text-sm text-secondary/65">Key: {row.key}</p>
                            <span className="mt-4 inline-block text-sm font-medium text-primary">Continue →</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
