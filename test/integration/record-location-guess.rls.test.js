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

maybeDescribeIntegration('Supabase RPC — record_location_guess', () => {
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

    test('accepts a guess within tolerance and writes hints_used', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.rpc('record_location_guess', {
            p_location_id: fixture.locationId,
            p_latitude: 60.452324,
            p_longitude: 22.27824,
            p_hints_used: 5,
            p_tolerance_meters: 100,
        });

        expect(error).toBeNull();
        expect(data?.accepted).toBe(true);
        expect(data?.hints_used).toBe(5);

        const { data: progress } = await anon
            .from('user_progress')
            .select('hints_used')
            .eq('user_id', fixture.userId)
            .eq('location_id', fixture.locationId)
            .single();

        expect(progress?.hints_used).toBe(5);
    });

    test('rejects a guess outside tolerance', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.rpc('record_location_guess', {
            p_location_id: fixture.locationId,
            p_latitude: 60.5,
            p_longitude: 22.5,
            p_hints_used: 5,
            p_tolerance_meters: 100,
        });

        expect(error).toBeNull();
        expect(data?.accepted).toBe(false);
    });

    test('rejects invalid hints_used values', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { error } = await anon.rpc('record_location_guess', {
            p_location_id: fixture.locationId,
            p_latitude: 60.452324,
            p_longitude: 22.27824,
            p_hints_used: 99,
            p_tolerance_meters: 100,
        });

        expect(error).not.toBeNull();
    });
});
