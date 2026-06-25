import { integrationEnv, maybeDescribeIntegration } from './helpers/env.js';
import {
    createAdminClient,
    createAnonClient,
    signIn,
    signOut,
} from './helpers/clients.js';
import { ensureAuthUsers } from './helpers/fixtures.js';

maybeDescribeIntegration('Supabase RLS — users', () => {
    let admin;
    let anon;
    let testUserId;
    let adminUserId;

    beforeAll(async () => {
        admin = createAdminClient();
        anon = createAnonClient();
        await ensureAuthUsers(admin);

        const { data, error } = await admin.auth.admin.listUsers();
        if (error) throw error;

        testUserId = data.users.find((u) => u.email === integrationEnv.userEmail)?.id;
        adminUserId = data.users.find((u) => u.email === integrationEnv.adminEmail)?.id;

        if (!testUserId || !adminUserId) {
            throw new Error('Fixture users missing after ensureAuthUsers');
        }
    });

    afterAll(async () => {
        await signOut(anon);
    });

    test('player can read their own profile', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('users')
            .select('id, first_name, last_name, is_platform_admin')
            .eq('id', testUserId)
            .maybeSingle();

        expect(error).toBeNull();
        expect(data?.id).toBe(testUserId);
    });

    test('non-admin cannot set is_platform_admin on their own row', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('users')
            .update({ is_platform_admin: true })
            .eq('id', testUserId)
            .select('is_platform_admin');

        if (error) {
            expect(error.message).toMatch(
                /row-level security|permission denied|only platform admins may change is_platform_admin/i
            );
            return;
        }

        expect(data).toEqual([]);
    });

    test('non-admin cannot set is_platform_admin on another user', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('users')
            .update({ is_platform_admin: true })
            .eq('id', adminUserId)
            .select('is_platform_admin');

        if (error) {
            expect(error.message).toMatch(
                /row-level security|permission denied|only platform admins may change is_platform_admin/i
            );
            return;
        }

        expect(data).toEqual([]);
    });

    test('non-admin cannot fetch all users', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.from('users').select('id, first_name, last_name');

        if (error) {
            expect(error.message).toMatch(/row-level security|permission denied/i);
            return;
        }

        const ids = data?.map((row) => row.id) ?? [];
        expect(ids.every((id) => id === testUserId)).toBe(true);
    });
});
