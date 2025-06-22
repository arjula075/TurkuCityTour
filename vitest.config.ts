import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom', // Enables DOM APIs like document/window
        setupFiles: './vitest.setup.ts',
        deps: {
            inline: ['../src/services/supabaseClient'], // forces vitest to process this file instead of mocking/ignoring
        },// Optional, for global setup
    },
});
