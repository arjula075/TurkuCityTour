import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => false,
    },
}));

describe('platform', () => {
    it('returns false on web', async () => {
        const { isNativePlatform } = await import('./platform');
        expect(isNativePlatform()).toBe(false);
    });
});
