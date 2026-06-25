const DEFAULT_SUPABASE_URL = 'http://127.0.0.1:54321';

export const e2eUser = {
    id: 'e2e-user-1',
    email: 'player@example.com',
};

export const e2eProfile = {
    first_name: 'E2E',
    last_name: 'Player',
    is_platform_admin: false,
    message: 'Have fun in Turku!',
};

export const e2eGameAssignment = [
    {
        game_id: 'game-1',
        games: { name: 'Turku Tour' },
    },
];

export const e2eLocations = [
    {
        id: 'loc-1',
        name: 'Turku Cathedral',
        latitude: 60.452324,
        longitude: 22.27824,
        display_order: 1,
        hints: [
            { hint_text: 'Look for tall spires', hint_order: 1 },
            { hint_text: 'Near the river', hint_order: 2 },
        ],
        questions: [
            {
                id: 'q1',
                question_header: 'Cathedral history',
                question_body: 'When was it consecrated?',
                answers: [
                    { id: 'a1', answer_text: '1300' },
                    { id: 'a2', answer_text: '1900' },
                ],
            },
        ],
    },
];

export function getSupabaseStorageKey(supabaseUrl = DEFAULT_SUPABASE_URL) {
    const hostname = new URL(supabaseUrl).hostname.split('.')[0];
    return `sb-${hostname}-auth-token`;
}

export async function seedSupabaseSession(page, supabaseUrl = DEFAULT_SUPABASE_URL) {
    const storageKey = getSupabaseStorageKey(supabaseUrl);

    await page.addInitScript(
        ({ key, user }) => {
            const expiresAt = Math.floor(Date.now() / 1000) + 3600;
            localStorage.setItem(
                key,
                JSON.stringify({
                    access_token: 'e2e-access-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    expires_at: expiresAt,
                    refresh_token: 'e2e-refresh-token',
                    user,
                })
            );
        },
        { key: storageKey, user: e2eUser }
    );
}

export async function mockSupabaseApi(page, supabaseUrl = DEFAULT_SUPABASE_URL) {
    await page.route(`${supabaseUrl}/auth/v1/**`, async (route) => {
        const url = route.request().url();

        if (url.includes('/user')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ user: e2eUser }),
            });
            return;
        }

        if (url.includes('/token')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'e2e-access-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'e2e-refresh-token',
                    user: e2eUser,
                }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{}',
        });
    });

    await page.route(`${supabaseUrl}/rest/v1/**`, async (route) => {
        const url = route.request().url();

        if (url.includes('/users')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(e2eProfile),
            });
            return;
        }

        if (url.includes('/game_players')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(e2eGameAssignment),
            });
            return;
        }

        if (url.includes('/locations')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(e2eLocations),
            });
            return;
        }

        if (url.includes('/user_progress')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: '[]',
            });
            return;
        }

        if (url.includes('/rpc/submit_answer')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ is_correct: true }),
            });
            return;
        }

        if (url.includes('/rpc/validate_location_arrival')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ arrived: false, distance_m: 120 }),
            });
            return;
        }

        if (url.includes('/rpc/record_location_guess')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ accepted: true, hints_used: 5, distance_m: 10 }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '[]',
        });
    });
}

export async function mockAuthenticatedPlayer(page, supabaseUrl = DEFAULT_SUPABASE_URL) {
    await seedSupabaseSession(page, supabaseUrl);
    await mockSupabaseApi(page, supabaseUrl);
}
