import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    availableGames: [],
    selectedGameId: null,
    gameActive: false,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setAvailableGames: (state, action) => {
            state.availableGames = action.payload;
        },
        setSelectedGameId: (state, action) => {
            console.log("setSelectedGameId: ", action.payload)
            state.selectedGameId = action.payload;
        },
        setGameActive: (state, action) => {
            state.gameActive = action.payload;
        },
    },
});

export const {
    setAvailableGames,
    setSelectedGameId,
    setGameActive,
} = gameSlice.actions;

export default gameSlice.reducer;
