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

maybeDescribeIntegration('Supabase RPC — record_give_up', () => {
    let admin;
    let anon;
    const fixtureMeta = buildFixtureIds();
    let fixture;

    beforeAll(async () => {
        admin = createAdminClient();
        anon = createAnonClient();
        await ensureAuthUsers(admin);
        fixture = await seedGameFixture(admin, fixtureMeta);
    });

    afterAll(async () => {
        await admin
            .from('user_progress')
            .delete()
            .eq('user_id', fixture.userId)
            .eq('location_id', fixture.locationId);
        await cleanupGameFixture(admin, fixture);
        await signOut(anon);
    });

    test('records hints_used = 0 for assigned player', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.rpc('record_give_up', {
            p_location_id: fixture.locationId,
        });

        expect(error).toBeNull();
        expect(data?.hints_used).toBe(0);

        const { data: progress } = await anon
            .from('user_progress')
            .select('hints_used')
            .eq('user_id', fixture.userId)
            .eq('location_id', fixture.locationId)
            .single();

        expect(progress?.hints_used).toBe(0);
    });

    test('rejects unauthenticated calls', async () => {
        await signOut(anon);

        const { error } = await anon.rpc('record_give_up', {
            p_location_id: fixture.locationId,
        });

        expect(error).not.toBeNull();
    });
});
