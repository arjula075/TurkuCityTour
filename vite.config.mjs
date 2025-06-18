// vite.config.mjs
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    // Load environment variables based on the current mode (e.g., 'test')
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react(),tailwindcss(),],
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/setupTests.js'],
            include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        },
        define: {
            'process.env': env, // Injects env variables into your test environment
        },
    };
});
