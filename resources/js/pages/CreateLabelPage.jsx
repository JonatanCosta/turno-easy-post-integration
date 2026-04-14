import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import http from '../api/http.js';
import { formatAddrSummary, isReferenceAddress } from '../utils/shippingLabelFormat.js';

const emptyAddr = {
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
};

const STEPS = [
    { id: 'from', title: 'Ship from', description: 'Where the package is sent from.' },
    { id: 'to', title: 'Ship to', description: 'Recipient address (US only).' },
    { id: 'parcel', title: 'Package', description: 'Dimensions and weight in inches and ounces.' },
    { id: 'review', title: 'Review', description: 'Confirm details before fetching rates.' },
];

/** HTML autocomplete tokens per field (grouped with section-* for two addresses). */
const FIELD_AUTOCOMPLETE = {
    name: 'name',
    company: 'organization',
    street1: 'address-line1',
    street2: 'address-line2',
    city: 'address-level2',
    state: 'address-level1',
    zip: 'postal-code',
    phone: 'tel',
    email: 'email',
};

/** Align with StoreShippingLabelRequest */
function sanitizeAddressField(field, value) {
    const v = typeof value === 'string' ? value : '';
    switch (field) {
        case 'state':
            return v.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
        case 'zip':
            return v.replace(/[^\d-]/g, '').slice(0, 10);
        case 'email':
            return v.trim().slice(0, 255);
        case 'name':
        case 'company':
        case 'street1':
        case 'street2':
        case 'city':
            return v.slice(0, 255);
        case 'phone':
            return v.slice(0, 32);
        default:
            return v;
    }
}

function addressInputProps(field) {
    switch (field) {
        case 'state':
            return {
                maxLength: 2,
                minLength: 2,
                className: 'uppercase tracking-wide',
                placeholder: 'CA',
                title: 'Two-letter US state code',
            };
        case 'zip':
            return {
                maxLength: 10,
                placeholder: '94102 or 94102-1234',
                title: 'ZIP or ZIP+4, up to 10 characters',
            };
        case 'email':
            return {
                type: 'email',
                maxLength: 255,
                autoComplete: 'email',
                placeholder: 'you@example.com',
            };
        case 'name':
        case 'company':
        case 'street1':
        case 'street2':
        case 'city':
            return { maxLength: 255 };
        case 'phone':
            return { maxLength: 32 };
        default:
            return {};
    }
}

function validateAddressBlock(label, a) {
    if (isReferenceAddress(a)) {
        return null;
    }
    if (!a.name?.trim()) {
        return `${label}: name is required.`;
    }
    if (!a.company?.trim()) {
        return `${label}: company is required.`;
    }
    if (!a.street1?.trim()) {
        return `${label}: street line 1 is required.`;
    }
    if (a.street2 === undefined || a.street2 === null) {
        return `${label}: street line 2 must be provided (use a dash if none).`;
    }
    if (!a.city?.trim()) {
        return `${label}: city is required.`;
    }
    if (a.state.length !== 2) {
        return `${label}: state must be exactly 2 letters.`;
    }
    if (!a.zip || a.zip.length > 10) {
        return `${label}: ZIP is required (max 10 characters).`;
    }
    if (!a.phone?.trim()) {
        return `${label}: phone is required.`;
    }
    if (!a.email?.trim()) {
        return `${label}: email is required.`;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim());
    if (!emailOk) {
        return `${label}: enter a valid email.`;
    }
    return null;
}

function AddressFields({ side, address, updateAddr, inputClass, sectionSlug }) {
    const fields = ['name', 'company', 'street1', 'street2', 'city', 'state', 'zip', 'phone', 'email'];
    const sectionPrefix = `section-${sectionSlug}`;

    return (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
                const extra = addressInputProps(f);
                const { className: extraClass, type, ...restExtra } = extra;
                const mergedClass = [inputClass, extraClass].filter(Boolean).join(' ');
                const token = FIELD_AUTOCOMPLETE[f];
                const autoComplete = token ? `${sectionPrefix} ${token}` : undefined;

                return (
                    <div
                        key={`${side}-${f}`}
                        className={f === 'street1' || f === 'email' ? 'sm:col-span-2' : ''}
                    >
                        <label className="mb-1 block text-xs uppercase text-secondary/55">{f}</label>
                        <input
                            type={type || 'text'}
                            value={address[f]}
                            onChange={(e) => updateAddr(side, f, e.target.value)}
                            className={mergedClass}
                            required
                            autoComplete={autoComplete}
                            {...restExtra}
                        />
                        {f === 'street2' ? (
                            <p className="mt-1 text-xs text-secondary/50">Use — if there is no line 2.</p>
                        ) : null}
                        {f === 'state' ? (
                            <p className="mt-1 text-xs text-secondary/50">Exactly 2 letters (US state).</p>
                        ) : null}
                        {f === 'zip' ? (
                            <p className="mt-1 text-xs text-secondary/50">Max 10 characters (ZIP or ZIP+4).</p>
                        ) : null}
                    </div>
                );
            })}
            <div>
                <label className="mb-1 block text-xs uppercase text-secondary/55">country</label>
                <input
                    value="US"
                    disabled
                    autoComplete={`${sectionPrefix} country`}
                    className="w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-secondary/50"
                />
            </div>
        </div>
    );
}

function StepIndicator({ step }) {
    return (
        <ol
            className="mb-8 grid w-full grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:grid-cols-4"
            aria-label="Progress"
        >
            {STEPS.map((s, i) => {
                const active = i === step;
                const done = i < step;
                const cellBorder = [
                    i % 2 === 0 ? 'border-r border-zinc-200 sm:border-r' : '',
                    i < 2 ? 'border-b border-zinc-200 sm:border-b-0' : '',
                    i < STEPS.length - 1 ? 'sm:border-r sm:border-zinc-200' : '',
                ]
                    .filter(Boolean)
                    .join(' ');

                return (
                    <li
                        key={s.id}
                        className={`flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-2 px-2 py-3 sm:min-h-0 sm:flex-row sm:gap-3 sm:px-4 sm:py-4 ${cellBorder}`}
                    >
                        <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                active
                                    ? 'bg-primary text-white ring-2 ring-primary/25 ring-offset-2 ring-offset-white'
                                    : done
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-zinc-100 text-secondary/45'
                            }`}
                            aria-current={active ? 'step' : undefined}
                        >
                            {i + 1}
                        </span>
                        <span
                            className={`max-w-[11rem] text-center text-xs font-semibold leading-snug sm:max-w-none sm:text-left sm:text-sm ${
                                active ? 'text-secondary' : 'text-secondary/55'
                            }`}
                        >
                            {s.title}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function savedAddressLabel(row) {
    const line = [row.name, row.company].filter(Boolean).join(' · ');
    const place = [row.city, row.state, row.zip].filter(Boolean).join(', ');
    const short = [line || row.street1, place].filter(Boolean).join(' — ');

    return short || row.id || 'Address';
}

function addressFromSavedRow(row) {
    return {
        name: row.name ?? '',
        company: row.company ?? '',
        street1: row.street1 ?? '',
        street2: row.street2 ?? '',
        city: row.city ?? '',
        state: row.state ?? '',
        zip: row.zip ?? '',
        country: row.country ?? 'US',
        phone: row.phone ?? '',
        email: row.email ?? '',
    };
}

export default function CreateLabelPage() {
    const { integrationKey } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [fromAddress, setFromAddress] = useState({ ...emptyAddr });
    const [toAddress, setToAddress] = useState({ ...emptyAddr });
    const [parcel, setParcel] = useState({ length: 10, width: 8, height: 4, weight: 16 });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [easypostConfigured, setEasypostConfigured] = useState(null);
    const [fromSnapshot, setFromSnapshot] = useState(null);
    const [toSnapshot, setToSnapshot] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
    const [saveAddrBusy, setSaveAddrBusy] = useState(false);

    useEffect(() => {
        if (!integrationKey || integrationKey !== 'easypost') {
            setEasypostConfigured(true);

            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { data } = await http.get('/integrations/shipping');
                const row = (data.data ?? []).find((r) => r.key === 'easypost');
                if (!cancelled) {
                    setEasypostConfigured(Boolean(row?.configured));
                }
            } catch {
                if (!cancelled) {
                    setEasypostConfigured(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [integrationKey]);

    useEffect(() => {
        if (integrationKey !== 'easypost' || easypostConfigured !== true || (step !== 0 && step !== 1)) {
            return;
        }
        let cancelled = false;
        (async () => {
            setLoadingSavedAddresses(true);
            try {
                const { data } = await http.get('/integrations/shipping/easypost/addresses?page_size=50');
                if (!cancelled) {
                    setSavedAddresses(Array.isArray(data.data) ? data.data : []);
                }
            } catch {
                if (!cancelled) {
                    setSavedAddresses([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingSavedAddresses(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [integrationKey, easypostConfigured, step]);

    if (!integrationKey) {
        return <Navigate to="/shipping-labels/generate" replace />;
    }

    function updateAddr(side, field, value) {
        const next = sanitizeAddressField(field, value);
        if (side === 'from') {
            setFromSnapshot(null);
            setFromAddress((addr) => ({ ...addr, [field]: next }));
        } else {
            setToSnapshot(null);
            setToAddress((addr) => ({ ...addr, [field]: next }));
        }
    }

    function selectSavedAddress(side, adrId) {
        if (!adrId) {
            if (side === 'from') {
                setFromAddress({ ...emptyAddr });
                setFromSnapshot(null);
            } else {
                setToAddress({ ...emptyAddr });
                setToSnapshot(null);
            }
            return;
        }
        const row = savedAddresses.find((r) => r.id === adrId);
        if (!row) {
            return;
        }
        if (side === 'from') {
            setFromAddress({ id: row.id });
            setFromSnapshot(row);
        } else {
            setToAddress({ id: row.id });
            setToSnapshot(row);
        }
    }

    function editSavedManually(side) {
        const snap = side === 'from' ? fromSnapshot : toSnapshot;
        if (!snap) {
            return;
        }
        const full = { ...emptyAddr, ...addressFromSavedRow(snap) };
        if (side === 'from') {
            setFromAddress(full);
            setFromSnapshot(null);
        } else {
            setToAddress(full);
            setToSnapshot(null);
        }
    }

    async function saveCurrentAddressToEasyPost(side) {
        const addr = side === 'from' ? fromAddress : toAddress;
        const label = side === 'from' ? 'From address' : 'To address';
        if (isReferenceAddress(addr)) {
            return;
        }
        const err = validateAddressBlock(label, addr);
        if (err) {
            setError(err);
            return;
        }
        setError('');
        setSaveAddrBusy(true);
        try {
            const { data } = await http.post('/integrations/shipping/easypost/addresses', {
                address: addr,
            });
            const created = data.data;
            setSavedAddresses((prev) => {
                const rest = prev.filter((r) => r.id !== created.id);
                return [created, ...rest];
            });
        } catch (err) {
            const msg = err.response?.data?.message;
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(Object.values(errors).flat().join(' '));
            } else {
                setError(typeof msg === 'string' ? msg : err?.message || 'Could not save address.');
            }
        } finally {
            setSaveAddrBusy(false);
        }
    }

    function validateParcel() {
        const { length, width, height, weight } = parcel;
        if (length <= 0 || width <= 0 || height <= 0 || weight <= 0) {
            return 'All parcel dimensions and weight must be greater than zero.';
        }
        return null;
    }

    function goNext() {
        setError('');
        if (step === 0) {
            const err = validateAddressBlock('From address', fromAddress);
            if (err) {
                setError(err);
                return;
            }
        }
        if (step === 1) {
            const err = validateAddressBlock('To address', toAddress);
            if (err) {
                setError(err);
                return;
            }
        }
        if (step === 2) {
            const err = validateParcel();
            if (err) {
                setError(err);
                return;
            }
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }

    function goBack() {
        setError('');
        setStep((s) => Math.max(s - 1, 0));
    }

    async function requestRates() {
        setError('');
        const err =
            validateAddressBlock('From address', fromAddress) ||
            validateAddressBlock('To address', toAddress) ||
            validateParcel();
        if (err) {
            setError(err);
            return;
        }

        setBusy(true);
        try {
            const { data } = await http.post('/shipping-labels', {
                integration_key: integrationKey,
                from_address: fromAddress,
                to_address: toAddress,
                parcel,
            });
            navigate(`/shipping-labels/${data.id}`);
        } catch (err) {
            const msg = err.response?.data?.message;
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(Object.values(errors).flat().join(' '));
            } else {
                setError(typeof msg === 'string' ? msg : err?.message || 'Could not fetch rates.');
            }
        } finally {
            setBusy(false);
        }
    }

    function onFormSubmit(e) {
        e.preventDefault();
        if (step === 3) {
            requestRates();
        }
    }

    const inputClass =
        'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-secondary outline-none focus:border-primary focus:ring-1 focus:ring-primary/30';

    const current = STEPS[step];

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/shipping-labels/generate" className="text-sm font-medium text-primary hover:text-primary/85">
                ← Change integration
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-secondary">Label details</h1>
            <p className="mt-2 mb-3 text-secondary/70">United States addresses only — complete each step.</p>

            {integrationKey === 'easypost' && easypostConfigured === false ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <p className="font-medium">EasyPost is not connected.</p>
                    <p className="mt-1 text-amber-900/90">
                        Add your API key in{' '}
                        <Link to="/integrations" className="font-semibold text-primary underline hover:text-primary/85">
                            Integrations
                        </Link>{' '}
                        before submitting this form.
                    </p>
                </div>
            ) : null}

            <StepIndicator step={step} />

            <form onSubmit={onFormSubmit} className="mt-2 space-y-6">
                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-secondary">{current.title}</h2>
                    <p className="mt-1 text-sm text-secondary/65">{current.description}</p>

                    {step === 0 ? (
                        <div className="mt-6 space-y-4">
                            {integrationKey === 'easypost' && easypostConfigured ? (
                                <div>
                                    <label className="mb-1 block text-xs uppercase text-secondary/55">
                                        Use a saved EasyPost address
                                    </label>
                                    <select
                                        className={`${inputClass} max-w-xl`}
                                        value={isReferenceAddress(fromAddress) ? fromAddress.id : ''}
                                        onChange={(e) => selectSavedAddress('from', e.target.value)}
                                        disabled={loadingSavedAddresses}
                                    >
                                        <option value="">Fill manually (or save a new one below)</option>
                                        {savedAddresses.map((row) => (
                                            <option key={row.id} value={row.id}>
                                                {savedAddressLabel(row)}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingSavedAddresses ? (
                                        <p className="mt-1 text-xs text-secondary/50">Loading saved addresses…</p>
                                    ) : null}
                                </div>
                            ) : null}
                            {integrationKey === 'easypost' &&
                            easypostConfigured &&
                            isReferenceAddress(fromAddress) &&
                            fromSnapshot ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm">
                                    <ul className="space-y-0.5 text-secondary/80">
                                        {formatAddrSummary(fromAddress, fromSnapshot).map((line, i) => (
                                            <li key={`from-snap-${i}`}>{line}</li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={() => editSavedManually('from')}
                                        className="mt-3 text-xs font-semibold text-primary hover:text-primary/85"
                                    >
                                        Edit as manual entry
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <AddressFields
                                        side="from"
                                        address={fromAddress}
                                        updateAddr={updateAddr}
                                        inputClass={inputClass}
                                        sectionSlug="ship-from"
                                    />
                                    {integrationKey === 'easypost' && easypostConfigured && !isReferenceAddress(fromAddress) ? (
                                        <button
                                            type="button"
                                            disabled={saveAddrBusy}
                                            onClick={() => saveCurrentAddressToEasyPost('from')}
                                            className="text-sm font-semibold text-primary hover:text-primary/85 disabled:opacity-50"
                                        >
                                            {saveAddrBusy ? 'Saving…' : 'Save this address to EasyPost'}
                                        </button>
                                    ) : null}
                                </>
                            )}
                        </div>
                    ) : null}

                    {step === 1 ? (
                        <div className="mt-6 space-y-4">
                            {integrationKey === 'easypost' && easypostConfigured ? (
                                <div>
                                    <label className="mb-1 block text-xs uppercase text-secondary/55">
                                        Use a saved EasyPost address
                                    </label>
                                    <select
                                        className={`${inputClass} max-w-xl`}
                                        value={isReferenceAddress(toAddress) ? toAddress.id : ''}
                                        onChange={(e) => selectSavedAddress('to', e.target.value)}
                                        disabled={loadingSavedAddresses}
                                    >
                                        <option value="">Fill manually (or save a new one below)</option>
                                        {savedAddresses.map((row) => (
                                            <option key={row.id} value={row.id}>
                                                {savedAddressLabel(row)}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingSavedAddresses ? (
                                        <p className="mt-1 text-xs text-secondary/50">Loading saved addresses…</p>
                                    ) : null}
                                </div>
                            ) : null}
                            {integrationKey === 'easypost' &&
                            easypostConfigured &&
                            isReferenceAddress(toAddress) &&
                            toSnapshot ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm">
                                    <ul className="space-y-0.5 text-secondary/80">
                                        {formatAddrSummary(toAddress, toSnapshot).map((line, i) => (
                                            <li key={`to-snap-${i}`}>{line}</li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={() => editSavedManually('to')}
                                        className="mt-3 text-xs font-semibold text-primary hover:text-primary/85"
                                    >
                                        Edit as manual entry
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <AddressFields
                                        side="to"
                                        address={toAddress}
                                        updateAddr={updateAddr}
                                        inputClass={inputClass}
                                        sectionSlug="ship-to"
                                    />
                                    {integrationKey === 'easypost' && easypostConfigured && !isReferenceAddress(toAddress) ? (
                                        <button
                                            type="button"
                                            disabled={saveAddrBusy}
                                            onClick={() => saveCurrentAddressToEasyPost('to')}
                                            className="text-sm font-semibold text-primary hover:text-primary/85 disabled:opacity-50"
                                        >
                                            {saveAddrBusy ? 'Saving…' : 'Save this address to EasyPost'}
                                        </button>
                                    ) : null}
                                </>
                            )}
                        </div>
                    ) : null}

                    {step === 2 ? (
                        <div className="mt-6">
                            <div className="grid gap-4 sm:grid-cols-4">
                                {['length', 'width', 'height', 'weight'].map((f) => (
                                    <div key={f}>
                                        <label className="mb-1 block text-xs uppercase text-secondary/55">{f}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={parcel[f]}
                                            onChange={(e) => setParcel((p) => ({ ...p, [f]: parseFloat(e.target.value) || 0 }))}
                                            className={inputClass}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-secondary/55">Weight in ounces for USPS via EasyPost.</p>
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="mt-6 space-y-6 text-sm">
                            <div>
                                <h3 className="font-semibold text-primary">From</h3>
                                <ul className="mt-2 space-y-0.5 text-secondary/80">
                                    {formatAddrSummary(fromAddress, fromSnapshot).map((line, i) => (
                                        <li key={`from-${i}`}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary">To</h3>
                                <ul className="mt-2 space-y-0.5 text-secondary/80">
                                    {formatAddrSummary(toAddress, toSnapshot).map((line, i) => (
                                        <li key={`to-${i}`}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary">Parcel</h3>
                                <p className="mt-2 text-secondary/80">
                                    {parcel.length}&quot; × {parcel.width}&quot; × {parcel.height}&quot; · {parcel.weight} oz
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <div>
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={goBack}
                                className="w-full cursor-pointer rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-zinc-50 sm:w-auto"
                            >
                                Back
                            </button>
                        ) : (
                            <span className="hidden sm:block" />
                        )}
                    </div>
                    <div className="flex gap-3 sm:justify-end">
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 sm:w-auto"
                            >
                                Continue
                            </button>
                        ) : null}
                        {step === 3 ? (
                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                            >
                                {busy ? 'Fetching rates…' : 'Get shipping rates'}
                            </button>
                        ) : null}
                    </div>
                </div>
            </form>
        </div>
    );
}
