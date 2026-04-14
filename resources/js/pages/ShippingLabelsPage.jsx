import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http.js';
import { formatLabelDate, formatRouteShort } from '../utils/shippingLabelFormat.js';

export default function ShippingLabelsPage() {
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await http.get('/shipping-labels');
                if (!cancelled) {
                    setLabels(data.data ?? []);
                }
            } catch {
                if (!cancelled) {
                    setLabels([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-secondary">Shipping Labels</h1>
                    <p className="mt-1 text-secondary/70">US addresses only. Labels are stored for reprint.</p>
                </div>
                <Link
                    to="/shipping-labels/generate"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/90"
                >
                    Generate Shipping Label
                </Link>
            </div>

            <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary/55">Your labels</h2>
                </div>
                {loading ? (
                    <p className="px-6 py-10 text-center text-secondary/55">Loading…</p>
                ) : labels.length === 0 ? (
                    <p className="px-6 py-10 text-center text-secondary/55">No labels yet. Generate your first one.</p>
                ) : (
                    <ul className="divide-y divide-zinc-100">
                        {labels.map((row) => (
                            <li key={row.id} className="flex flex-col sm:flex-row sm:items-stretch">
                                <Link
                                    to={`/shipping-labels/${row.id}`}
                                    className="flex min-w-0 flex-1 flex-col gap-3 px-6 py-4 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-secondary">#{row.id}</p>
                                            <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase text-secondary/70">
                                                {row.status?.slug ?? '—'}
                                            </span>
                                            {row.integration_key ? (
                                                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                                    {row.integration_key}
                                                </span>
                                            ) : null}
                                            {row.status?.slug === 'rated' ? (
                                                <span className="text-xs font-medium text-amber-800">Awaiting rate selection</span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-sm text-secondary/70">
                                            {formatLabelDate(row.created_at)}
                                        </p>
                                        <p
                                            className="mt-1 truncate text-sm text-secondary/80"
                                            title={formatRouteShort(row.from_address, row.to_address)}
                                        >
                                            {formatRouteShort(row.from_address, row.to_address)}
                                        </p>
                                        {row.status?.slug === 'completed' || row.tracking_code ? (
                                            <p className="mt-1 text-sm text-secondary/65">
                                                {row.carrier ?? '—'} · {row.tracking_code ?? '—'}
                                            </p>
                                        ) : null}
                                    </div>
                                    {!row.label_url ? (
                                        <span className="shrink-0 self-start text-xs font-medium text-secondary/45 sm:self-center">
                                            View details →
                                        </span>
                                    ) : null}
                                </Link>
                                {row.label_url ? (
                                    <div className="flex items-center border-t border-zinc-100 px-6 py-3 sm:border-t-0 sm:border-l sm:py-4">
                                        <a
                                            href={row.label_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-primary hover:text-primary/85"
                                        >
                                            Open label
                                        </a>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
