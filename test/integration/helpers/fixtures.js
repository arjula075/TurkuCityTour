import { integrationEnv } from './env.js';

const FIXTURE_TAG = `e2e-${Date.now()}`;

/** Platform org for legacy games; matches 00016_multi_tenant_schema.sql */
export const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000001';

export function buildFixtureIds() {
    return {
        tag: FIXTURE_TAG,
        gameName: `RLS fixture ${FIXTURE_TAG}`,
        locationName: `RLS location ${FIXTURE_TAG}`,
    };
}

export async function ensureAuthUsers(admin) {
    const { data: existing, error } = await admin.auth.admin.listUsers();
    if (error) throw new Error(`Failed to list users: ${error.message}`);

    const emails = [integrationEnv.userEmail, integrationEnv.adminEmail];

    for (const email of emails) {
        const exists = existing.users.some((user) => user.email === email);
        if (exists) continue;

        const password =
            email === integrationEnv.adminEmail
                ? integrationEnv.adminPassword
                : integrationEnv.userPassword;

        const { error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) {
            throw new Error(`Failed to create user ${email}: ${createError.message}`);
        }
    }
}

export async function seedGameFixture(admin, { tag, gameName, locationName, ownerOrgId = PLATFORM_ORG_ID }) {
    const { data: game, error: gameError } = await admin
        .from('games')
        .insert([{ name: gameName, owner_org_id: ownerOrgId }])
        .select('id')
        .single();

    if (gameError) throw new Error(`Failed to seed game: ${gameError.message}`);

    const { data: users, error: usersError } = await admin.auth.admin.listUsers();
    if (usersError) throw new Error(`Failed to list users: ${usersError.message}`);

    const testUser = users.users.find((user) => user.email === integrationEnv.userEmail);
    if (!testUser) throw new Error('Test user not found after ensureAuthUsers');

    const { error: playerError } = await admin.from('game_players').insert([
        {
            game_id: game.id,
            user_id: testUser.id,
        },
    ]);

    if (playerError) {
        throw new Error(`Failed to seed game_players: ${playerError.message}`);
    }

    const { data: location, error: locationError } = await admin
        .from('locations')
        .insert([
            {
                game_id: game.id,
                name: locationName,
                latitude: 60.452324,
                longitude: 22.27824,
                display_order: 1,
            },
        ])
        .select('id')
        .single();

    if (locationError) {
        throw new Error(`Failed to seed location: ${locationError.message}`);
    }

    const { data: question, error: questionError } = await admin
        .from('questions')
        .insert([
            {
                location_id: location.id,
                question_header: `RLS question ${tag}`,
                question_body: 'Integration fixture question',
                correct_answer: `RLS answer ${tag}`,
            },
        ])
        .select('id')
        .single();

    if (questionError) {
        throw new Error(`Failed to seed question: ${questionError.message}`);
    }

    const { data: answer, error: answerError } = await admin
        .from('answers')
        .insert([
            {
                question_id: question.id,
                answer_text: `RLS answer ${tag}`,
                is_correct: true,
            },
        ])
        .select('id')
        .single();

    if (answerError) {
        throw new Error(`Failed to seed answer: ${answerError.message}`);
    }

    return {
        gameId: game.id,
        locationId: location.id,
        questionId: question.id,
        answerId: answer.id,
        userId: testUser.id,
    };
}

export async function cleanupGameFixture(admin, fixture) {
    if (!fixture) return;

    if (fixture.answerId) {
        await admin.from('answers').delete().eq('id', fixture.answerId);
    }

    if (fixture.questionId) {
        await admin.from('questions').delete().eq('id', fixture.questionId);
    }

    if (fixture.locationId) {
        await admin.from('user_progress').delete().eq('location_id', fixture.locationId);
        await admin.from('locations').delete().eq('id', fixture.locationId);
    }

    if (fixture.gameId) {
        await admin.from('game_players').delete().eq('game_id', fixture.gameId);
        await admin.from('games').delete().eq('id', fixture.gameId);
    }
}

export async function ensureUserProfile(admin, userId, { firstName = 'Test', lastName = 'User' } = {}) {
    const { error } = await admin.from('users').upsert(
        {
            id: userId,
            first_name: firstName,
            last_name: lastName,
            is_platform_admin: false,
        },
        { onConflict: 'id' }
    );

    if (error) {
        throw new Error(`Failed to ensure user profile: ${error.message}`);
    }
}

export async function seedOrgFixture(
    admin,
    { tag, ownerUserId, maxGames = 3, maxPlayers = 1, status = 'trialing' }
) {
    const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert([{ name: `Org ${tag}` }])
        .select('id')
        .single();

    if (orgError) throw new Error(`Failed to seed organization: ${orgError.message}`);

    const { error: subError } = await admin.from('subscriptions').insert([
        {
            org_id: org.id,
            status,
            tier: 'trial',
            max_games: maxGames,
            max_players: maxPlayers,
        },
    ]);

    if (subError) throw new Error(`Failed to seed subscription: ${subError.message}`);

    const { error: memberError } = await admin.from('organization_members').insert([
        {
            org_id: org.id,
            user_id: ownerUserId,
            role: 'owner',
        },
    ]);

    if (memberError) {
        throw new Error(`Failed to seed organization_members: ${memberError.message}`);
    }

    return { orgId: org.id };
}

export async function cleanupOrgFixture(admin, orgFixture) {
    if (!orgFixture?.orgId) return;

    const { data: games } = await admin
        .from('games')
        .select('id')
        .eq('owner_org_id', orgFixture.orgId);

    for (const game of games ?? []) {
        await admin.from('game_players').delete().eq('game_id', game.id);
        await admin.from('games').delete().eq('id', game.id);
    }

    await admin.from('organization_members').delete().eq('org_id', orgFixture.orgId);
    await admin.from('subscriptions').delete().eq('org_id', orgFixture.orgId);
    await admin.from('organizations').delete().eq('id', orgFixture.orgId);
}
