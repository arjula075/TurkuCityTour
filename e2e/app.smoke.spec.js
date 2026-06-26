import { expect, test } from '@playwright/test';
import { appRoute } from './helpers/appRoute.js';

test.describe('TurkuCityTour smoke', () => {
    test('loads the login screen', async ({ page }) => {
        await page.goto(appRoute('/'));

        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
        await expect(page.getByPlaceholder('Email address')).toBeVisible();
        await expect(page.getByPlaceholder('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('navigates from login to register', async ({ page }) => {
        await page.goto(appRoute('/'));

        await page.getByRole('link', { name: /register here/i }).click();

        await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
        await expect(page.getByPlaceholder('First name')).toBeVisible();
        await expect(page.getByPlaceholder('Email address')).toBeVisible();
    });

    test('redirects unknown routes to login', async ({ page }) => {
        await page.goto(appRoute('/does-not-exist'));

        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    });

    test('redirects unauthenticated users away from map', async ({ page }) => {
        await page.goto(appRoute('/map'));

        await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    });

    test('privacy policy page is public', async ({ page }) => {
        await page.goto(appRoute('/privacy'));

        await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
        await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible();
    });
});
