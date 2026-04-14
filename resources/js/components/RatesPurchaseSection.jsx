export default function RatesPurchaseSection({
    rates,
    easypostMessages,
    selectedRateId,
    onSelectRate,
    onPurchase,
    busy,
    errorMessage,
}) {
    return (
        <div className="space-y-4">
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
            {easypostMessages?.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                    <p className="font-medium">Carrier notes</p>
                    <ul className="mt-1 list-inside list-disc space-y-1">
                        {easypostMessages.map((m, i) => (
                            <li key={`msg-${i}`}>
                                {m.carrier ? `${m.carrier}: ` : ''}
                                {typeof m.message === 'string' ? m.message : JSON.stringify(m.message)}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {!rates?.length ? (
                <p className="text-sm text-zinc-600">No rates available for this shipment.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-zinc-900">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th
                                    className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                    scope="col"
                                >
                                    Select
                                </th>
                                <th
                                    className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                    scope="col"
                                >
                                    Carrier
                                </th>
                                <th
                                    className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                    scope="col"
                                >
                                    Service
                                </th>
                                <th
                                    className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                    scope="col"
                                >
                                    Price
                                </th>
                                <th
                                    className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600"
                                    scope="col"
                                >
                                    Est. days
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {rates.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80"
                                >
                                    <td className="px-3 py-3 align-middle text-zinc-900">
                                        <input
                                            type="radio"
                                            name="rate"
                                            className="size-4 accent-primary"
                                            checked={selectedRateId === r.id}
                                            onChange={() => onSelectRate(r.id)}
                                        />
                                    </td>
                                    <td className="px-3 py-3 font-medium text-zinc-900">{r.carrier}</td>
                                    <td className="px-3 py-3 text-zinc-800">{r.service}</td>
                                    <td className="px-3 py-3 tabular-nums text-zinc-900">
                                        {r.rate} {r.currency}
                                    </td>
                                    <td className="px-3 py-3 tabular-nums text-zinc-800">
                                        {r.est_delivery_days ?? r.delivery_days ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {rates?.length > 0 ? (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onPurchase}
                        disabled={busy || !selectedRateId}
                        className="w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                    >
                        {busy ? 'Purchasing…' : 'Purchase label'}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
