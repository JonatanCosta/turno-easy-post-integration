import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http.js';

export default function IntegrationsPage() {
    const [items, setItems] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saveOk, setSaveOk] = useState('');
    const [busy, setBusy] = useState(false);
    const [removing, setRemoving] = useState(false);

    const load = useCallback(async () => {
        setLoadError('');
        try {
            const { data } = await http.get('/integrations/shipping');
            setItems(data.data ?? []);
        } catch {
            setLoadError('Could not load integrations.');
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const easypost = items.find((r) => r.key === 'easypost');

    async function onSaveEasypost(e) {
        e.preventDefault();
        setSaveError('');
        setSaveOk('');
        setBusy(true);
        try {
            await http.put('/integrations/shipping/easypost', { api_key: apiKey });
            setApiKey('');
            setSaveOk('EasyPost API key saved and encrypted on the server.');
            await load();
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors?.api_key) {
                setSaveError(Array.isArray(errors.api_key) ? errors.api_key.join(' ') : String(errors.api_key));
            } else {
                const msg = err.response?.data?.message;
                setSaveError(typeof msg === 'string' ? msg : 'Could not save the API key.');
            }
        } finally {
            setBusy(false);
        }
    }

    async function onRemoveEasypost() {
        if (!window.confirm('Remove your EasyPost API key from this workspace?')) {
            return;
        }
        setSaveError('');
        setSaveOk('');
        setRemoving(true);
        try {
            await http.delete('/integrations/shipping/easypost');
            setSaveOk('EasyPost integration removed.');
            await load();
        } catch {
            setSaveError('Could not remove the integration.');
        } finally {
            setRemoving(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-semibold text-secondary">Integrations</h1>
            <p className="mt-2 text-secondary/70">
                Connect your own shipping provider credentials. Keys are stored encrypted and never sent to the browser after you save them.
            </p>

            {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}

            <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-secondary">EasyPost</h2>
                        <p className="mt-1 text-sm text-secondary/65">
                            USPS labels use your EasyPost account. Test keys (EZTK…) and production keys (EZAK…) both work here — EasyPost chooses the environment from the key only; there is no extra mode switch in the API client.
                        </p>
                        {easypost ? (
                            <p className="mt-2 text-sm font-medium text-secondary">
                                Status:{' '}
                                <span className={easypost.configured ? 'text-emerald-700' : 'text-amber-700'}>
                                    {easypost.configured ? 'Connected' : 'Not connected'}
                                </span>
                            </p>
                        ) : null}
                    </div>
                    <Link to="/shipping-labels/generate" className="text-sm font-medium text-primary hover:text-primary/85">
                        Create label →
                    </Link>
                </div>

                <form onSubmit={onSaveEasypost} className="mt-6 space-y-4">
                    {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
                    {saveOk ? <p className="text-sm text-emerald-700">{saveOk}</p> : null}
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-secondary/50">
                            API key
                        </label>
                        <input
                            type="password"
                            autoComplete="off"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={easypost?.configured ? 'Enter a new key to replace the stored one' : 'EZTK_…'}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={busy || !apiKey.trim()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                        >
                            {busy ? 'Verifying…' : 'Save and verify'}
                        </button>
                        {easypost?.configured ? (
                            <button
                                type="button"
                                disabled={removing}
                                onClick={() => onRemoveEasypost()}
                                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-secondary/80 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                                {removing ? 'Removing…' : 'Remove integration'}
                            </button>
                        ) : null}
                    </div>
                </form>
            </section>

            <p className="mt-8 text-center text-sm text-secondary/55">
                <Link to="/" className="font-medium text-primary hover:text-primary/85">
                    Back to home
                </Link>
            </p>
        </div>
    );
}
