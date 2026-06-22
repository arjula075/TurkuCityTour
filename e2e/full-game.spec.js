import { expect, test } from '@playwright/test';

const email = process.env.E2E_TEST_USER_EMAIL;
const password = process.env.E2E_TEST_USER_PASSWORD;
const hasCredentials =
    Boolean(email && password) &&
    email !== 'replace-me@example.com' &&
    password !== 'replace-me';

const describeLive = hasCredentials ? test.describe : test.describe.skip;

describeLive('Full game walk — live Supabase', () => {
    test('player can log in and reach the map', async ({ page }) => {
        await page.goto('/');

        await page.getByPlaceholder('Email address').fill(email);
        await page.getByPlaceholder('Password').fill(password);
        await page.getByRole('button', { name: 'Login' }).click();

        await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
        await expect(page.locator('.leaflet-container')).toBeVisible();
    });
});
