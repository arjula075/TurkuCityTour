import { expect, test } from '@playwright/test';
import { mockAuthenticatedPlayer } from '../src/test-utils/e2eSupabaseMock.js';

const supabaseUrl = process.env.PLAYWRIGHT_SUPABASE_URL || 'http://127.0.0.1:54321';

test.describe('Map smoke', () => {
    test.beforeEach(async ({ page }) => {
        await mockAuthenticatedPlayer(page, supabaseUrl);
    });

    test('authenticated player sees the map and start controls', async ({ page }) => {
        await page.goto('/map');

        await expect(page.getByText(/welcome, e2e/i)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Exercise' })).toBeVisible();
        await expect(page.locator('.leaflet-container')).toBeVisible();
    });

    test('starts the game and shows the first hint', async ({ page }) => {
        await page.goto('/map');

        await page.getByRole('button', { name: 'Start Game' }).click();

        await expect(page.getByText('Look for tall spires')).toBeVisible();
        await expect(page.locator('.leaflet-container')).toBeVisible();
    });
});
