import { describe, expect, it } from 'vitest';
import {
    formatAddrSummary,
    formatCityStateLine,
    formatLabelDate,
    formatParcelSummary,
    formatRouteShort,
    isReferenceAddress,
} from './shippingLabelFormat.js';

describe('isReferenceAddress', () => {
    it('returns true only for a lone adr_* id', () => {
        expect(isReferenceAddress({ id: 'adr_abc123' })).toBe(true);
        expect(isReferenceAddress({ id: 'adr_abc123', city: 'SF' })).toBe(false);
        expect(isReferenceAddress({ id: 'not_an_id' })).toBe(false);
        expect(isReferenceAddress(null)).toBe(false);
    });
});

describe('formatAddrSummary', () => {
    it('formats a full address', () => {
        const lines = formatAddrSummary(
            {
                name: 'A',
                company: 'B Co',
                street1: '1 St',
                street2: '',
                city: 'SF',
                state: 'CA',
                zip: '94105',
                phone: '415',
                email: 'a@b.com',
            },
            null,
        );
        expect(lines).toContain('A');
        expect(lines).toContain('B Co');
        expect(lines.some((l) => l.includes('SF') && l.includes('CA'))).toBe(true);
        expect(lines).toContain('Tel: 415');
        expect(lines).toContain('Email: a@b.com');
    });

    it('uses snapshot for reference addresses when provided', () => {
        const snap = { name: 'Snap', company: '', street1: '2 Rd', street2: '—', city: 'LA', state: 'CA', zip: '90001' };
        const lines = formatAddrSummary({ id: 'adr_x' }, snap);
        expect(lines).toContain('Snap');
    });

    it('falls back to placeholder when reference has no snapshot', () => {
        expect(formatAddrSummary({ id: 'adr_only1' }, null)).toEqual(['Saved address (adr_only1)']);
    });
});

describe('formatCityStateLine', () => {
    it('returns em dash for missing input', () => {
        expect(formatCityStateLine(null)).toBe('—');
    });

    it('joins city and state', () => {
        expect(formatCityStateLine({ city: 'Portland', state: 'OR' })).toBe('Portland, OR');
    });
});

describe('formatRouteShort', () => {
    it('joins from and to summaries', () => {
        expect(
            formatRouteShort({ city: 'A', state: 'AA' }, { city: 'B', state: 'BB' }),
        ).toBe('A, AA → B, BB');
    });
});

describe('formatParcelSummary', () => {
    it('returns em dash when incomplete', () => {
        expect(formatParcelSummary({ length: 1 })).toBe('—');
        expect(formatParcelSummary(null)).toBe('—');
    });

    it('formats dimensions and weight', () => {
        expect(formatParcelSummary({ length: 10, width: 8, height: 4, weight: 16 })).toBe(
            '10" × 8" × 4" · 16 oz',
        );
    });
});

describe('formatLabelDate', () => {
    it('returns em dash for invalid input', () => {
        expect(formatLabelDate('')).toBe('—');
        expect(formatLabelDate('not-a-date')).toBe('—');
    });

    it('formats a valid ISO string', () => {
        const out = formatLabelDate('2026-01-15T14:30:00.000Z');
        expect(out).not.toBe('—');
        expect(out.length).toBeGreaterThan(4);
    });
});
