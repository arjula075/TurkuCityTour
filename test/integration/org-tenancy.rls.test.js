import { integrationEnv, maybeDescribeIntegration } from './helpers/env.js';
import {
    createAdminClient,
    createAnonClient,
    signIn,
    signOut,
} from './helpers/clients.js';
import {
    buildFixtureIds,
    cleanupOrgFixture,
    ensureUserProfile,
    seedOrgFixture,
} from './helpers/fixtures.js';
import { listAllAuthUsers } from './helpers/authUsers.js';

maybeDescribeIntegration('Supabase RLS — org tenancy', () => {
    let admin;
    let anon;
    let hostAId;
    let hostBId;
    let hostBEmail;
    const fixtureMeta = buildFixtureIds();
    let orgA;
    let orgB;
    let gameAId;
    let gameBId;

    beforeAll(async () => {
        admin = createAdminClient();
        anon = createAnonClient();

        const users = await listAllAuthUsers(admin);

        hostAId = users.find((u) => u.email === integrationEnv.userEmail)?.id;
        if (!hostAId) throw new Error('Test user missing');

        await ensureUserProfile(admin, hostAId, { firstName: 'Host', lastName: 'A' });

        hostBEmail = `host-b-${fixtureMeta.tag}@rls-fixture.test`;
        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email: hostBEmail,
            password: integrationEnv.userPassword,
            email_confirm: true,
        });
        if (createError) throw new Error(`Failed to create host B: ${createError.message}`);

        hostBId = created.user.id;
        await ensureUserProfile(admin, hostBId, { firstName: 'Host', lastName: 'B' });

        orgA = await seedOrgFixture(admin, {
            tag: `${fixtureMeta.tag}-a`,
            ownerUserId: hostAId,
            maxGames: 2,
            maxPlayers: 1,
        });

        orgB = await seedOrgFixture(admin, {
            tag: `${fixtureMeta.tag}-b`,
            ownerUserId: hostBId,
            maxGames: 2,
            maxPlayers: 2,
        });

        const { data: gameA, error: gameAError } = await admin
            .from('games')
            .insert([{ name: `Org A game ${fixtureMeta.tag}`, owner_org_id: orgA.orgId }])
            .select('id')
            .single();
        if (gameAError) throw gameAError;
        gameAId = gameA.id;

        const { data: gameB, error: gameBError } = await admin
            .from('games')
            .insert([{ name: `Org B game ${fixtureMeta.tag}`, owner_org_id: orgB.orgId }])
            .select('id')
            .single();
        if (gameBError) throw gameBError;
        gameBId = gameB.id;
    });

    afterAll(async () => {
        if (gameAId) await admin.from('games').delete().eq('id', gameAId);
        if (gameBId) await admin.from('games').delete().eq('id', gameBId);
        await cleanupOrgFixture(admin, orgA);
        await cleanupOrgFixture(admin, orgB);
        if (hostBId) await admin.auth.admin.deleteUser(hostBId);
        await signOut(anon);
    });

    test('org owner can create a game in their organization', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('games')
            .insert([{ name: `Host A new ${fixtureMeta.tag}`, owner_org_id: orgA.orgId }])
            .select('id')
            .single();

        expect(error).toBeNull();
        expect(data?.id).toBeTruthy();

        await admin.from('games').delete().eq('id', data.id);
    });

    test('org owner cannot create a game in another organization', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { error } = await anon
            .from('games')
            .insert([{ name: `Blocked cross-org ${fixtureMeta.tag}`, owner_org_id: orgB.orgId }]);

        expect(error).not.toBeNull();
        expect(error.message).toMatch(
            /row-level security|not authorized|game limit/i
        );
    });

    test('org owner can read their own games', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('games')
            .select('id, name, owner_org_id')
            .eq('id', gameAId);

        expect(error).toBeNull();
        expect(data?.length).toBe(1);
        expect(data[0].owner_org_id).toBe(orgA.orgId);
    });

    test('org owner cannot update another org game', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('games')
            .update({ name: `Hijacked ${fixtureMeta.tag}` })
            .eq('id', gameBId)
            .select('id');

        if (error) {
            expect(error.message).toMatch(/row-level security/i);
            return;
        }

        expect(data).toEqual([]);
    });

    test('trial max_players=1 blocks a second player on the same game', async () => {
        const { data: extraUser, error: extraError } = await admin.auth.admin.createUser({
            email: `extra-${fixtureMeta.tag}@rls-fixture.test`,
            password: integrationEnv.userPassword,
            email_confirm: true,
        });
        expect(extraError).toBeNull();

        try {
            await ensureUserProfile(admin, extraUser.user.id);
            await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

            const { error: firstError } = await anon.from('game_players').insert([
                { game_id: gameAId, user_id: hostAId },
            ]);
            expect(firstError).toBeNull();

            const { error: secondError } = await anon.from('game_players').insert([
                { game_id: gameAId, user_id: extraUser.user.id },
            ]);

            expect(secondError).not.toBeNull();
            expect(secondError.message).toMatch(/player limit/i);

            await admin.from('game_players').delete().eq('game_id', gameAId);
        } finally {
            await admin.auth.admin.deleteUser(extraUser.user.id);
        }
    });

    test('platform admin can still create games without owner_org_id', async () => {
        await signIn(anon, integrationEnv.adminEmail, integrationEnv.adminPassword);

        const { data, error } = await anon
            .from('games')
            .insert([{ name: `Platform admin game ${fixtureMeta.tag}` }])
            .select('id, owner_org_id')
            .single();

        expect(error).toBeNull();
        expect(data?.id).toBeTruthy();

        await admin.from('games').delete().eq('id', data.id);
    });

    test('org owner can read their subscription limits', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('subscriptions')
            .select('org_id, max_games, max_players, status')
            .eq('org_id', orgA.orgId)
            .maybeSingle();

        expect(error).toBeNull();
        expect(data?.max_players).toBe(1);
        expect(data?.max_games).toBe(2);
    });
});
