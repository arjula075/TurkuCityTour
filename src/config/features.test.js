import { describe, expect, it, vi } from 'vitest';

describe('features', () => {
    it('enables admin by default', async () => {
        const { isAdminEnabled } = await import('./features');
        expect(isAdminEnabled).toBe(true);
    });

    it('disables admin when VITE_ENABLE_ADMIN is false', async () => {
        vi.stubEnv('VITE_ENABLE_ADMIN', 'false');
        vi.resetModules();
        const { isAdminEnabled } = await import('./features');
        expect(isAdminEnabled).toBe(false);
        vi.unstubAllEnvs();
    });

    it('detects mobile build flag', async () => {
        vi.stubEnv('VITE_MOBILE_BUILD', 'true');
        vi.resetModules();
        const { isMobileBuild } = await import('./features');
        expect(isMobileBuild).toBe(true);
        vi.unstubAllEnvs();
    });
});
