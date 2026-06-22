import { defineConfig, loadEnv } from 'vite';

export default defineConfig(() => {
    const env = loadEnv('test', process.cwd(), '');

    return {
        define: {
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL ?? ''),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
                env.VITE_SUPABASE_ANON_KEY ?? ''
            ),
        },
        test: {
            globals: true,
            environment: 'node',
            include: ['test/integration/**/*.test.js'],
            testTimeout: 30_000,
        },
    };
});
