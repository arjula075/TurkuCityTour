import { integrationEnv, maybeDescribeIntegration } from './helpers/env.js';
import {
    createAdminClient,
    createAnonClient,
    signIn,
    signOut,
} from './helpers/clients.js';
import {
    buildFixtureIds,
    cleanupGameFixture,
    ensureAuthUsers,
    seedGameFixture,
} from './helpers/fixtures.js';

maybeDescribeIntegration('Supabase RLS — user_progress', () => {
    let admin;
    let anon;
    const fixtureMeta = buildFixtureIds();
    let fixture;
    let progressId;

    beforeAll(async () => {
        admin = createAdminClient();
        anon = createAnonClient();
        await ensureAuthUsers(admin);
        fixture = await seedGameFixture(admin, fixtureMeta);
    });

    afterAll(async () => {
        if (progressId) {
            await admin.from('user_progress').delete().eq('id', progressId);
        }
        await cleanupGameFixture(admin, fixture);
        await signOut(anon);
    });

    test('player can upsert their own progress', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('user_progress')
            .upsert(
                {
                    user_id: fixture.userId,
                    location_id: fixture.locationId,
                    hints_used: 2,
                },
                { onConflict: 'user_id,location_id' }
            )
            .select('id')
            .single();

        expect(error).toBeNull();
        progressId = data.id;
    });

    test('player can read their own progress', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('user_progress')
            .select('id, location_id, hints_used')
            .eq('user_id', fixture.userId);

        expect(error).toBeNull();
        expect(data?.some((row) => row.location_id === fixture.locationId)).toBe(true);
    });

    test('non-admin cannot delete another users progress', async () => {
        await signIn(anon, integrationEnv.adminEmail, integrationEnv.adminPassword);

        const { data: session } = await anon.auth.getUser();
        const adminUserId = session.user?.id;
        expect(adminUserId).toBeTruthy();

        const { data: adminProgress, error: seedError } = await anon
            .from('user_progress')
            .upsert(
                {
                    user_id: adminUserId,
                    location_id: fixture.locationId,
                    hints_used: 0,
                },
                { onConflict: 'user_id,location_id' }
            )
            .select('id')
            .single();

        expect(seedError).toBeNull();

        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('user_progress')
            .delete()
            .eq('id', adminProgress.id)
            .select('id');

        expect(error).toBeNull();
        expect(data).toEqual([]);

        await signIn(anon, integrationEnv.adminEmail, integrationEnv.adminPassword);
        await anon.from('user_progress').delete().eq('id', adminProgress.id);
        await signOut(anon);
    });

    test('non-admin cannot upsert progress for another user', async () => {
        const { data: users, error: usersError } = await admin.auth.admin.listUsers();
        expect(usersError).toBeNull();

        const otherUser = users.users.find(
            (user) => user.email === integrationEnv.adminEmail
        );

        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('user_progress')
            .upsert(
                {
                    user_id: otherUser.id,
                    location_id: fixture.locationId,
                    hints_used: 99,
                },
                { onConflict: 'user_id,location_id' }
            )
            .select('id');

        if (error) {
            expect(error.message).toMatch(
                /row-level security|permission denied|user_progress\.user_id must match auth\.uid/i
            );
            return;
        }

        expect(data).toEqual([]);
    });
});
