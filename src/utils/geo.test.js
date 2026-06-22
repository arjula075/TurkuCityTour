import { describe, it, expect } from 'vitest';
import { getDistance, TURKU_FALLBACK } from './geo';

describe('getDistance', () => {
    it('returns 0 for identical coordinates', () => {
        expect(getDistance(60.45, 22.27, 60.45, 22.27)).toBe(0);
    });

    it('computes known distance between Turku Cathedral and Art Museum (~1.1 km)', () => {
        const cathedral = { lat: 60.452324, lng: 22.27824 };
        const museum = { lat: 60.45408, lng: 22.26182 };
        const metres = getDistance(cathedral.lat, cathedral.lng, museum.lat, museum.lng);
        expect(metres).toBeGreaterThan(900);
        expect(metres).toBeLessThan(1400);
    });

    it('exports Turku fallback coordinates', () => {
        expect(TURKU_FALLBACK.lat).toBeCloseTo(60.452, 2);
        expect(TURKU_FALLBACK.lng).toBeCloseTo(22.268, 2);
    });
});
