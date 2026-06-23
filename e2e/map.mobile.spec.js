import { expect, test } from '@playwright/test';
import { mockAuthenticatedPlayer } from '../src/test-utils/e2eSupabaseMock.js';

const supabaseUrl = process.env.PLAYWRIGHT_SUPABASE_URL || 'http://127.0.0.1:54321';

test.describe('Map mobile smoke', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuthenticatedPlayer(page, supabaseUrl);
    });

    test('map is visible on a phone-sized screen', async ({ page }) => {
        await page.goto('/map');

        const map = page.locator('.leaflet-container');
        await expect(map).toBeVisible();

        const box = await map.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThan(100);
        expect(box?.width ?? 0).toBeGreaterThan(200);
    });
});
