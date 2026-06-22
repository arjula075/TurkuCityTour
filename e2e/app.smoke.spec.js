import { expect, test } from '@playwright/test';

test.describe('TurkuCityTour smoke', () => {
    test('loads the login screen', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
        await expect(page.getByPlaceholder('Email address')).toBeVisible();
        await expect(page.getByPlaceholder('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('navigates from login to register', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: /register here/i }).click();

        await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
        await expect(page.getByPlaceholder('First name')).toBeVisible();
        await expect(page.getByPlaceholder('Email address')).toBeVisible();
    });

    test('redirects unknown routes to login', async ({ page }) => {
        await page.goto('/does-not-exist');

        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    });

    test('shows loading state on map without a session', async ({ page }) => {
        await page.goto('/map');

        await expect(page.getByText('Loading game...')).toBeVisible();
    });
});
