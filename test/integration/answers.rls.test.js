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

maybeDescribeIntegration('Supabase RLS — answers', () => {
    let admin;
    let anon;
    const fixtureMeta = buildFixtureIds();
    let fixture;
    let insertedAnswerId;

    beforeAll(async () => {
        admin = createAdminClient();
        anon = createAnonClient();
        await ensureAuthUsers(admin);
        fixture = await seedGameFixture(admin, fixtureMeta);
    });

    afterAll(async () => {
        if (insertedAnswerId) {
            await admin.from('answers').delete().eq('id', insertedAnswerId);
        }
        await cleanupGameFixture(admin, fixture);
        await signOut(anon);
    });

    test('non-admin cannot read is_correct from answers', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon
            .from('answers')
            .select('id, is_correct')
            .eq('question_id', fixture.questionId);

        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThan(0);
        expect(data?.every((row) => row.is_correct === null)).toBe(true);
    });

    test('admin can read is_correct from answers', async () => {
        await signIn(anon, integrationEnv.adminEmail, integrationEnv.adminPassword);

        const { data, error } = await anon
            .from('answers')
            .select('id, is_correct')
            .eq('id', fixture.answerId)
            .single();

        expect(error).toBeNull();
        expect(data?.is_correct).toBe(true);
    });

    test('authenticated user can SELECT answer ids', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { data, error } = await anon.from('answers').select('id').limit(5);
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    test('non-admin user cannot INSERT answers', async () => {
        await signIn(anon, integrationEnv.userEmail, integrationEnv.userPassword);

        const { error } = await anon.from('answers').insert([
            {
                question_id: fixture.questionId,
                answer_text: 'Unauthorized answer',
                is_correct: false,
            },
        ]);

        expect(error).not.toBeNull();
        expect(error.message).toMatch(
            /row-level security|only admins may insert answers|not authorized to insert answers/i
        );
    });

    test('admin user can INSERT and DELETE answers', async () => {
        await signIn(anon, integrationEnv.adminEmail, integrationEnv.adminPassword);

        const { data, error } = await anon
            .from('answers')
            .insert([
                {
                    question_id: fixture.questionId,
                    answer_text: `Admin answer ${fixtureMeta.tag}`,
                    is_correct: false,
                },
            ])
            .select('id')
            .single();

        expect(error).toBeNull();
        insertedAnswerId = data.id;

        const { error: deleteError } = await anon
            .from('answers')
            .delete()
            .eq('id', insertedAnswerId);

        expect(deleteError).toBeNull();
        insertedAnswerId = null;
    });
});
