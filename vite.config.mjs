import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react(), tailwindcss()],
        define: {
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
                env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
            ),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
                env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key'
            ),
            'import.meta.env.VITE_THUNDERFOREST_API_KEY': JSON.stringify(
                env.VITE_THUNDERFOREST_API_KEY ?? 'test-thunderforest-key'
            ),
            'import.meta.env.VITE_ENABLE_ADMIN': JSON.stringify(
                env.VITE_ENABLE_ADMIN ?? 'true'
            ),
            'import.meta.env.VITE_MOBILE_BUILD': JSON.stringify(
                env.VITE_MOBILE_BUILD ?? 'false'
            ),
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./vitest.setup.ts'],
            include: [
                'src/**/*.test.{js,jsx}',
            ],
            exclude: [
                'test/integration/**',
            ],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html', 'lcov'],
                reportsDirectory: './coverage',
                include: ['src/**/*.{js,jsx}'],
                exclude: [
                    'src/**/*.test.{js,jsx}',
                    'src/main.jsx',
                    'src/test-utils/**',
                ],
                thresholds: {
                    lines: 40,
                    statements: 40,
                    functions: 40,
                    branches: 30,
                },
            },
        },
    };
});
