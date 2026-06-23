import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;
const supabaseUrl = process.env.PLAYWRIGHT_SUPABASE_URL || 'http://127.0.0.1:54321';

export default defineConfig({
    testDir: './e2e',
    testMatch: /.*\.spec\.js$/,
    testIgnore: '**/helpers/**',
    timeout: 30_000,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: true,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
        geolocation: { latitude: 60.4522438, longitude: 22.268045 },
        permissions: ['geolocation'],
    },
    webServer: {
        command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            VITE_SUPABASE_URL: supabaseUrl,
            VITE_SUPABASE_ANON_KEY: process.env.PLAYWRIGHT_SUPABASE_ANON_KEY || 'playwright-anon-key',
            VITE_THUNDERFOREST_API_KEY:
                process.env.PLAYWRIGHT_THUNDERFOREST_API_KEY || 'playwright-thunderforest-key',
        },
    },
    projects: [
        {
            name: 'chromium',
            testIgnore: /map\.mobile\.spec\.js|full-game\.spec\.js/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            testIgnore: /full-game\.spec\.js/,
            use: { ...devices['Pixel 7'] },
        },
    ],
});
