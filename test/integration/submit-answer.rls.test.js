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

maybeDescribeIntegration('Supabase RPC — submit_answer', () => {
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
        if (fixture?.userId && fixture?.locationId) {
            await admin
                .from('user_progress')
                .delete()
                .eq('user_id', fixture.userId)
                .eq('location_id', fixture.locationId);
        }
        await cleanupGameFixture(admin, fixture);
        await signOut(anon);
    });

    test('player receives is_correct without selecting answer columns directly', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.rpc('submit_answer', {
            p_question_id: fixture.questionId,
            p_answer_id: fixture.answerId,
        });

        expect(error).toBeNull();
        expect(data?.is_correct).toBe(true);
    });

    test('player cannot set answered_correctly via direct update', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        await anon
            .from('user_progress')
            .upsert(
                {
                    user_id: fixture.userId,
                    location_id: fixture.locationId,
                    hints_used: 1,
                },
                { onConflict: 'user_id,location_id' }
            );

        const { error } = await anon
            .from('user_progress')
            .update({ answered_correctly: false })
            .eq('user_id', fixture.userId)
            .eq('location_id', fixture.locationId);

        expect(error).not.toBeNull();
        expect(error.message).toMatch(/answered_correctly can only be set via submit_answer/i);
    });
});
