import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom', // Enables DOM APIs like document/window
        setupFiles: './vitest.setup.ts', // Optional, for global setup
    },
});
