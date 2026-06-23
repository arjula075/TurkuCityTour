import { integrationEnv, maybeDescribeIntegration } from './helpers/env.js';
import {
    createAdminClient,
    createAnonClient,
    signIn,
    signOut,
} from './helpers/clients.js';
import { ensureAuthUsers } from './helpers/fixtures.js';

maybeDescribeIntegration('Supabase RLS — leaderboard views', () => {
    let admin;
    let anon;

    beforeAll(async () => {
        admin = createAdminClient();
        anon = createAnonClient();
        await ensureAuthUsers(admin);
    });

    afterAll(async () => {
        await signOut(anon);
    });

    test('non-admin cannot read hint_results', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.from('hint_results').select('*').limit(5);

        if (error) {
            expect(error.message).toMatch(/permission denied|row-level security/i);
            return;
        }

        expect(data ?? []).toEqual([]);
    });

    test('admin can read hint_results', async () => {
        await signIn(anon, integrationEnv.adminEmail, integrationEnv.adminPassword);

        const { error } = await anon.from('hint_results').select('*').limit(1);

        expect(error).toBeNull();
    });
});
