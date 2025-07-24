import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';

export const store = configureStore({
    reducer: {
        game: gameReducer,
        // Add more slices here as you refactor (e.g., location, progress, ui)
    },
});
