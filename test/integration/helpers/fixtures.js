import { integrationEnv } from './env.js';

const FIXTURE_TAG = `e2e-${Date.now()}`;

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

export async function seedGameFixture(admin, { tag, gameName, locationName }) {
    const { data: game, error: gameError } = await admin
        .from('games')
        .insert([{ name: gameName }])
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
