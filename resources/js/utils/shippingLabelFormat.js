/** EasyPost saved address reference: only `{ id: "adr_..." }`. */
export function isReferenceAddress(a) {
    if (!a || typeof a !== 'object') {
        return false;
    }
    const id = a.id;
    if (typeof id !== 'string' || !/^adr_[A-Za-z0-9]+$/.test(id)) {
        return false;
    }
    const keys = Object.keys(a);

    return keys.length === 1 && keys[0] === 'id';
}

/**
 * @param {object} a - address object or reference
 * @param {object|null} snapshot - full row when `a` is a reference
 * @returns {string[]}
 */
export function formatAddrSummary(a, snapshot) {
    if (isReferenceAddress(a)) {
        const src = snapshot && typeof snapshot === 'object' ? snapshot : null;
        if (src) {
            return formatAddrSummary(src, null);
        }

        return [`Saved address (${a.id})`];
    }
    const lines = [
        a.name,
        a.company,
        a.street1,
        a.street2?.trim() ? a.street2 : null,
        `${a.city}, ${a.state} ${a.zip}`,
        a.phone ? `Tel: ${a.phone}` : null,
        a.email ? `Email: ${a.email}` : null,
    ].filter(Boolean);
    return lines;
}

export function formatCityStateLine(addr) {
    if (!addr || typeof addr !== 'object') {
        return '—';
    }
    if (isReferenceAddress(addr)) {
        return `Saved (${addr.id})`;
    }
    const parts = [addr.city, addr.state].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
}

export function formatRouteShort(fromAddr, toAddr) {
    return `${formatCityStateLine(fromAddr)} → ${formatCityStateLine(toAddr)}`;
}

export function formatParcelSummary(parcel) {
    if (!parcel || typeof parcel !== 'object') {
        return '—';
    }
    const { length, width, height, weight } = parcel;
    if ([length, width, height, weight].some((v) => v === undefined || v === null)) {
        return '—';
    }
    return `${length}" × ${width}" × ${height}" · ${weight} oz`;
}

export function formatLabelDate(isoString) {
    if (!isoString || typeof isoString !== 'string') {
        return '—';
    }
    try {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) {
            return '—';
        }
        return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return '—';
    }
}
