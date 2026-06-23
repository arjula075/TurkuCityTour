import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeHoistedTableMock } from '../test-utils/mockSupabase.js';

const mocks = vi.hoisted(() => ({
    from: vi.fn(),
    storageFrom: vi.fn(),
    tableMocks: {},
}));

function table(name, result = { data: null, error: null }) {
    if (!mocks.tableMocks[name]) {
        const mock = makeHoistedTableMock();
        mock.single.mockImplementation(() => Promise.resolve(result));
        mock.then = (onFulfilled, onRejected) =>
            Promise.resolve(result).then(onFulfilled, onRejected);
        mocks.tableMocks[name] = mock;
    }
    return mocks.tableMocks[name];
}

vi.mock('./supabaseClient', () => ({
    supabase: {
        from: mocks.from,
        rpc: vi.fn(),
        storage: {
            from: mocks.storageFrom,
        },
    },
}));

vi.mock('./adminImages', () => ({
    adminImages: {
        fetchByUserId: vi.fn().mockResolvedValue([]),
    },
}));

import {
    adminAnswers,
    adminGames,
    adminLocations,
    adminUsers,
    clearAllUserProgress,
    clearUserProgress,
    fetchHintsResults,
    fetchLocationsForPlayer,
    fetchQuestionsAndAnswers,
    fetchUserProfile,
    fetchUserProgress,
    gameAssignments,
    insertUserProgress,
    markQuestionAsAnsweredCorrectly,
    storage,
    submitAnswer,
    updateUserProgress,
} from './supabaseService.js';

describe('supabaseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.tableMocks = {};
        mocks.from.mockImplementation((name) => table(name));
    });

    describe('fetchLocationsForPlayer', () => {
        it('loads locations without answer correctness fields', async () => {
            const locations = [
                {
                    id: 'loc-1',
                    questions: [{ id: 'q1', answers: [{ id: 'a1', answer_text: 'Yes' }] }],
                },
            ];
            table('locations', { data: locations, error: null });

            const result = await fetchLocationsForPlayer('game-1');

            expect(result).toEqual(locations);
            expect(mocks.tableMocks.locations.eq).toHaveBeenCalledWith('game_id', 'game-1');
            const selectArg = mocks.tableMocks.locations.select.mock.calls[0][0];
            expect(selectArg).not.toMatch(/is_correct/);
            expect(selectArg).not.toMatch(/correct_answer/);
        });
    });

    describe('submitAnswer', () => {
        it('calls submit_answer RPC and returns the result', async () => {
            const { supabase } = await import('./supabaseClient');
            supabase.rpc.mockResolvedValue({
                data: { is_correct: true },
                error: null,
            });

            const result = await submitAnswer('q1', 'a1');

            expect(result).toEqual({ is_correct: true });
            expect(supabase.rpc).toHaveBeenCalledWith('submit_answer', {
                p_question_id: 'q1',
                p_answer_id: 'a1',
            });
        });
    });

    describe('fetchUserProfile', () => {
        it('returns the user message field', async () => {
            table('users', { data: { message: 'Welcome!' }, error: null });

            const result = await fetchUserProfile('user-1');

            expect(result).toEqual({ message: 'Welcome!' });
            expect(mocks.tableMocks.users.single).toHaveBeenCalled();
        });

        it('returns null when the profile lookup fails', async () => {
            table('users', { data: null, error: { message: 'missing' } });

            const result = await fetchUserProfile('user-1');

            expect(result).toBeNull();
        });
    });

    describe('fetchHintsResults', () => {
        it('reads from hint_results view', async () => {
            table('hint_results', { data: [{ user_id: 'u1' }], error: null });

            const result = await fetchHintsResults();

            expect(result).toEqual([{ user_id: 'u1' }]);
        });
    });

    describe('adminUsers', () => {
        it('fetchAll returns users', async () => {
            table('users', { data: [{ id: 'u1' }], error: null });

            const result = await adminUsers.fetchAll();

            expect(result).toEqual([{ id: 'u1' }]);
        });
    });

    describe('storage', () => {
        it('uploadFile writes to the configured bucket', async () => {
            const bucket = {
                upload: vi.fn().mockResolvedValue({ data: { path: 'a.jpg' }, error: null }),
            };
            mocks.storageFrom.mockReturnValue(bucket);

            const result = await storage.uploadFile('a.jpg', new Blob(['x']));

            expect(result).toEqual({ path: 'a.jpg' });
            expect(mocks.storageFrom).toHaveBeenCalled();
        });
    });

    describe('fetchUserProgress', () => {
        it('returns rows for the given user', async () => {
            const progress = [{ id: 'p1', user_id: 'user-1', location_id: 'loc-1' }];
            table('user_progress', { data: progress, error: null });

            const result = await fetchUserProgress('user-1');

            expect(result).toEqual(progress);
            expect(mocks.from).toHaveBeenCalledWith('user_progress');
            expect(mocks.tableMocks.user_progress.select).toHaveBeenCalledWith('*');
            expect(mocks.tableMocks.user_progress.eq).toHaveBeenCalledWith('user_id', 'user-1');
        });

        it('throws when Supabase returns an error', async () => {
            table('user_progress', { data: null, error: { message: 'denied' } });

            await expect(fetchUserProgress('user-1')).rejects.toEqual({
                message: 'denied',
            });
        });
    });

    describe('insertUserProgress', () => {
        it('inserts a progress row', async () => {
            const row = { user_id: 'user-1', location_id: 'loc-1', hints_used: 1 };
            table('user_progress', { data: [row], error: null });

            const result = await insertUserProgress(row);

            expect(result).toEqual([row]);
            expect(mocks.tableMocks.user_progress.insert).toHaveBeenCalledWith([row]);
        });
    });

    describe('fetchQuestionsAndAnswers', () => {
        it('joins answers onto their questions', async () => {
            const questions = [
                { id: 'q1', location_id: 'loc-1', question_header: 'Q1' },
                { id: 'q2', location_id: 'loc-1', question_header: 'Q2' },
            ];
            const answers = [
                { id: 'a1', question_id: 'q1', answer_text: 'Yes', is_correct: true },
                { id: 'a2', question_id: 'q2', answer_text: 'No', is_correct: false },
            ];

            table('questions', { data: questions, error: null });
            table('answers', { data: answers, error: null });

            const result = await fetchQuestionsAndAnswers('loc-1');

            expect(result).toEqual([
                { ...questions[0], answers: [answers[0]] },
                { ...questions[1], answers: [answers[1]] },
            ]);
            expect(mocks.tableMocks.questions.eq).toHaveBeenCalledWith('location_id', 'loc-1');
            expect(mocks.tableMocks.answers.in).toHaveBeenCalledWith('question_id', ['q1', 'q2']);
        });

        it('returns an empty array when no questions exist', async () => {
            table('questions', { data: [], error: null });

            const result = await fetchQuestionsAndAnswers('loc-1');

            expect(result).toEqual([]);
            expect(mocks.from).not.toHaveBeenCalledWith('answers');
        });
    });

    describe('adminLocations', () => {
        it('fetchByGame orders locations for a game', async () => {
            const locations = [{ id: 'loc-1', name: 'Cathedral', game_id: 'game-1' }];
            table('locations', { data: locations, error: null });

            const result = await adminLocations.fetchByGame('game-1');

            expect(result).toEqual(locations);
            expect(mocks.tableMocks.locations.eq).toHaveBeenCalledWith('game_id', 'game-1');
            expect(mocks.tableMocks.locations.order).toHaveBeenCalledWith('display_order', {
                ascending: true,
            });
        });
    });

    describe('adminAnswers.toggleCorrectAnswer', () => {
        it('flips is_correct for the answer', async () => {
            const updated = { id: 'a1', is_correct: true };
            table('answers', { data: updated, error: null });

            const result = await adminAnswers.toggleCorrectAnswer('a1', false);

            expect(result).toEqual(updated);
            expect(mocks.tableMocks.answers.update).toHaveBeenCalledWith({ is_correct: true });
            expect(mocks.tableMocks.answers.eq).toHaveBeenCalledWith('id', 'a1');
        });
    });

    describe('updateUserProgress', () => {
        it('upserts progress with completed_at timestamp', async () => {
            table('user_progress', { data: [{ id: 'p1' }], error: null });

            const result = await updateUserProgress('user-1', 'loc-1', 2);

            expect(result).toEqual([{ id: 'p1' }]);
            expect(mocks.tableMocks.user_progress.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'user-1',
                    location_id: 'loc-1',
                    hints_used: 2,
                    completed_at: expect.any(String),
                }),
                {
                    onConflict: ['user_id', 'location_id'],
                    returning: 'representation',
                }
            );
        });
    });

    describe('clearAllUserProgress', () => {
        it('deletes all progress rows for a user', async () => {
            table('user_progress', { data: null, error: null });

            await clearAllUserProgress('user-1');

            expect(mocks.tableMocks.user_progress.delete).toHaveBeenCalled();
            expect(mocks.tableMocks.user_progress.eq).toHaveBeenCalledWith('user_id', 'user-1');
        });
    });

    describe('clearUserProgress', () => {
        it('deletes progress only for locations in the game', async () => {
            table('locations', { data: [{ id: 'loc-1' }, { id: 'loc-2' }], error: null });
            table('user_progress', { data: null, error: null });

            await clearUserProgress('user-1', 'game-1');

            expect(mocks.tableMocks.locations.eq).toHaveBeenCalledWith('game_id', 'game-1');
            expect(mocks.tableMocks.user_progress.in).toHaveBeenCalledWith('location_id', [
                'loc-1',
                'loc-2',
            ]);
        });
    });

    describe('markQuestionAsAnsweredCorrectly', () => {
        it('updates answered_correctly on user_progress', async () => {
            table('user_progress', { data: null, error: null });

            await markQuestionAsAnsweredCorrectly('user-1', 'loc-1', true);

            expect(mocks.tableMocks.user_progress.update).toHaveBeenCalledWith({
                answered_correctly: true,
            });
            expect(mocks.tableMocks.user_progress.eq).toHaveBeenCalledWith('user_id', 'user-1');
        });
    });

    describe('adminGames', () => {
        it('fetches games ordered by created_at', async () => {
            const games = [{ id: 'g1', name: 'Tour' }];
            table('games', { data: games, error: null });

            const result = await adminGames.fetch();

            expect(result).toEqual(games);
            expect(mocks.tableMocks.games.order).toHaveBeenCalledWith('created_at', {
                ascending: true,
            });
        });
    });

    describe('gameAssignments', () => {
        it('fetchByGame returns assigned user ids', async () => {
            table('game_players', {
                data: [{ user_id: 'u1' }, { user_id: 'u2' }],
                error: null,
            });

            const result = await gameAssignments.fetchByGame('game-1');

            expect(result).toEqual(['u1', 'u2']);
        });

        it('assign inserts a game_players row', async () => {
            table('game_players', { data: null, error: null });

            await gameAssignments.assign('u1', 'game-1');

            expect(mocks.tableMocks.game_players.insert).toHaveBeenCalledWith({
                user_id: 'u1',
                game_id: 'game-1',
            });
        });

        it('unassign deletes the matching row', async () => {
            table('game_players', { data: null, error: null });

            await gameAssignments.unassign('u1', 'game-1');

            expect(mocks.tableMocks.game_players.delete).toHaveBeenCalled();
            expect(mocks.tableMocks.game_players.eq).toHaveBeenCalledWith('user_id', 'u1');
        });

        it('fetchGames returns all games', async () => {
            table('games', { data: [{ id: 'g1' }], error: null });

            const result = await gameAssignments.fetchGames();

            expect(result).toEqual([{ id: 'g1' }]);
        });

        it('fetchByUser returns assigned game ids', async () => {
            table('game_players', { data: [{ game_id: 'g1' }], error: null });

            const result = await gameAssignments.fetchByUser('u1');

            expect(result).toEqual(['g1']);
        });
    });
});
