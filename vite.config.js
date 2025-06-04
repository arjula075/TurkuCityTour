// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,        // ✅ Enables global `test`, `expect`, etc.
        environment: 'jsdom', // ✅ Simulates browser for React DOM
        setupFiles: ['./src/setupTests.js'], // Optional: for extending matchers
    },
});
