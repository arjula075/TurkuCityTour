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

maybeDescribeIntegration('Supabase RPC — validate_location_arrival', () => {
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
        await cleanupGameFixture(admin, fixture);
        await signOut(anon);
    });

    test('player at the target coordinates is within tolerance', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.rpc('validate_location_arrival', {
            p_location_id: fixture.locationId,
            p_latitude: 60.452324,
            p_longitude: 22.27824,
            p_tolerance_meters: 50,
        });

        expect(error).toBeNull();
        expect(data?.arrived).toBe(true);
    });

    test('player far from the target is not within tolerance', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.rpc('validate_location_arrival', {
            p_location_id: fixture.locationId,
            p_latitude: 60.5,
            p_longitude: 22.5,
            p_tolerance_meters: 50,
        });

        expect(error).toBeNull();
        expect(data?.arrived).toBe(false);
    });
});
