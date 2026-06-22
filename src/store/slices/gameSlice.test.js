import { describe, it, expect } from 'vitest';
import gameReducer, {
    setAvailableGames,
    setSelectedGameId,
    setGameActive,
} from './gameSlice';

describe('gameSlice', () => {
    const initialState = {
        availableGames: [],
        selectedGameId: null,
        gameActive: false,
    };

    it('returns initial state', () => {
        expect(gameReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('setAvailableGames stores assigned games', () => {
        const games = [{ game_id: 'g1', games: { name: 'Tour A' } }];
        const state = gameReducer(initialState, setAvailableGames(games));
        expect(state.availableGames).toEqual(games);
    });

    it('setSelectedGameId stores the chosen game', () => {
        const state = gameReducer(initialState, setSelectedGameId('game-42'));
        expect(state.selectedGameId).toBe('game-42');
    });

    it('setGameActive toggles play mode', () => {
        const active = gameReducer(initialState, setGameActive(true));
        expect(active.gameActive).toBe(true);

        const inactive = gameReducer(active, setGameActive(false));
        expect(inactive.gameActive).toBe(false);
    });
});
