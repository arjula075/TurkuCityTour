import { maybeDescribeIntegration } from './helpers/env.js';
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
import { integrationEnv } from './helpers/env.js';

maybeDescribeIntegration('Supabase RLS — games, locations, game_players', () => {
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

    test('assigned player can read their game assignment', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('game_players')
            .select('game_id, games(name)')
            .eq('user_id', fixture.userId);

        expect(error).toBeNull();
        expect(data?.some((row) => row.game_id === fixture.gameId)).toBe(true);
    });

    test('assigned player can read locations for their game', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('locations')
            .select('id, name, game_id')
            .eq('game_id', fixture.gameId);

        expect(error).toBeNull();
        expect(data?.some((row) => row.id === fixture.locationId)).toBe(true);
    });

    test('player can read games they are assigned to', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('games')
            .select('id, name')
            .eq('id', fixture.gameId);

        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThan(0);
    });

    test('non-admin cannot create games', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { error } = await anon
            .from('games')
            .insert([{ name: `Blocked game ${fixtureMeta.tag}` }]);

        expect(error).not.toBeNull();
        expect(error.message).toMatch(/row-level security/i);
    });

    test('non-admin cannot create locations', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { error } = await anon.from('locations').insert([
            {
                game_id: fixture.gameId,
                name: `Blocked location ${fixtureMeta.tag}`,
                latitude: 60.45,
                longitude: 22.27,
            },
        ]);

        expect(error).not.toBeNull();
        expect(error.message).toMatch(/row-level security/i);
    });
});
