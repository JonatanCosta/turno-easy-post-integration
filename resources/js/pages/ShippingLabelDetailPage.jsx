import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import http from '../api/http.js';
import RatesPurchaseSection from '../components/RatesPurchaseSection.jsx';
import {
    formatAddrSummary,
    formatLabelDate,
    formatParcelSummary,
    formatRouteShort,
} from '../utils/shippingLabelFormat.js';

const SLUG_RATED = 'rated';
const SLUG_COMPLETED = 'completed';
const SLUG_FAILED = 'failed';

export default function ShippingLabelDetailPage() {
    const { labelId } = useParams();
    const [label, setLabel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [selectedRateId, setSelectedRateId] = useState('');
    const [purchaseBusy, setPurchaseBusy] = useState(false);
    const [purchaseError, setPurchaseError] = useState('');

    const load = useCallback(async () => {
        if (!labelId) {
            return;
        }
        setLoading(true);
        setNotFound(false);
        setLoadError('');
        try {
            const { data } = await http.get(`/shipping-labels/${labelId}`);
            setLabel(data);
            const rates = Array.isArray(data.rates) ? data.rates : [];
            setSelectedRateId(rates[0]?.id ?? '');
            setPurchaseError('');
        } catch (err) {
            if (err.response?.status === 404) {
                setNotFound(true);
                setLabel(null);
            } else {
                const msg = err.response?.data?.message;
                setLoadError(typeof msg === 'string' ? msg : err?.message || 'Could not load label.');
                setLabel(null);
            }
        } finally {
            setLoading(false);
        }
    }, [labelId]);

    useEffect(() => {
        load();
    }, [load]);

    async function purchaseLabel() {
        if (!label?.id || !selectedRateId) {
            setPurchaseError('Select a shipping rate.');
            return;
        }
        setPurchaseError('');
        setPurchaseBusy(true);
        try {
            const { data } = await http.post(`/shipping-labels/${label.id}/purchase`, {
                rate_id: selectedRateId,
            });
            setLabel(data);
        } catch (err) {
            const msg = err.response?.data?.message;
            const errors = err.response?.data?.errors;
            if (errors) {
                setPurchaseError(Object.values(errors).flat().join(' '));
            } else {
                setPurchaseError(typeof msg === 'string' ? msg : err?.message || 'Could not purchase label.');
            }
        } finally {
            setPurchaseBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl">
                <p className="text-secondary/65">Loading…</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="mx-auto max-w-3xl">
                <p className="text-red-700">{loadError}</p>
                <Link to="/shipping-labels" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/85">
                    ← Back to shipping labels
                </Link>
            </div>
        );
    }

    if (notFound || !label) {
        return (
            <div className="mx-auto max-w-3xl">
                <p className="text-secondary/80">Label not found.</p>
                <Link to="/shipping-labels" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/85">
                    ← Back to shipping labels
                </Link>
            </div>
        );
    }

    const slug = label.status?.slug;
    const fromAddr = label.from_address;
    const toAddr = label.to_address;

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/shipping-labels" className="text-sm font-medium text-primary hover:text-primary/85">
                ← Back to list
            </Link>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-secondary">Label #{label.id}</h1>
                    <p className="mt-1 text-sm text-secondary/65">{formatLabelDate(label.created_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold uppercase text-secondary/70">
                        {label.integration_key ?? '—'}
                    </span>
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold uppercase text-secondary/70">
                        {label.status?.name ?? label.status?.slug ?? '—'}
                    </span>
                </div>
            </div>

            <p className="mt-2 text-sm text-secondary/70">{formatRouteShort(fromAddr, toAddr)}</p>

            <div className="mt-8 space-y-8">
                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-secondary">Shipment</h2>
                    <div className="mt-4 grid gap-6 sm:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold text-primary">From</h3>
                            <ul className="mt-2 space-y-0.5 text-sm text-secondary/80">
                                {formatAddrSummary(fromAddr, null).map((line, i) => (
                                    <li key={`from-${i}`}>{line}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-primary">To</h3>
                            <ul className="mt-2 space-y-0.5 text-sm text-secondary/80">
                                {formatAddrSummary(toAddr, null).map((line, i) => (
                                    <li key={`to-${i}`}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-primary">Parcel</h3>
                        <p className="mt-2 text-sm text-secondary/80">{formatParcelSummary(label.parcel)}</p>
                    </div>
                </section>

                {slug === SLUG_RATED ? (
                    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-zinc-900">Rates & purchase</h2>
                        <p className="mt-1 text-sm text-zinc-600">Choose a carrier rate and complete the label.</p>
                        <div className="mt-6">
                            <RatesPurchaseSection
                                rates={label.rates}
                                easypostMessages={label.easypost_messages}
                                selectedRateId={selectedRateId}
                                onSelectRate={setSelectedRateId}
                                onPurchase={purchaseLabel}
                                busy={purchaseBusy}
                                errorMessage={purchaseError}
                            />
                        </div>
                    </section>
                ) : null}

                {slug === SLUG_COMPLETED ? (
                    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-secondary">Label ready</h2>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div>
                                <dt className="text-xs uppercase text-secondary/55">Carrier / service</dt>
                                <dd className="text-secondary/85">
                                    {label.carrier ?? '—'} · {label.service ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-secondary/55">Tracking</dt>
                                <dd className="font-mono text-secondary/85">{label.tracking_code ?? '—'}</dd>
                            </div>
                        </dl>
                        {label.label_url ? (
                            <a
                                href={label.label_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/90"
                            >
                                Open label
                            </a>
                        ) : null}
                    </section>
                ) : null}

                {slug === SLUG_FAILED && label.last_error ? (
                    <section className="rounded-2xl border border-red-200 bg-red-50/80 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-red-900">Error</h2>
                        <p className="mt-2 text-sm text-red-900/90">{label.last_error}</p>
                    </section>
                ) : null}

                {slug !== SLUG_RATED && slug !== SLUG_COMPLETED && slug !== SLUG_FAILED ? (
                    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-secondary/70">
                            Status: <strong>{label.status?.name ?? slug}</strong>
                            {label.last_error ? (
                                <>
                                    <br />
                                    <span className="text-red-700">{label.last_error}</span>
                                </>
                            ) : null}
                        </p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}
