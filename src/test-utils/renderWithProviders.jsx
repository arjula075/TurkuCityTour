import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import gameReducer from '../store/slices/gameSlice';
import { AuthContext } from '../contexts/AuthContext';

export function createMockSupabase(overrides = {}) {
    return {
        auth: {
            signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
        },
        from: vi.fn(),
        rpc: vi.fn(),
        storage: { from: vi.fn() },
        ...overrides,
    };
}

export const defaultAuthValue = {
    user: null,
    profile: null,
    loading: false,
    supabase: createMockSupabase(),
};

export function makeStore(preloadedState) {
    return configureStore({
        reducer: { game: gameReducer },
        preloadedState,
    });
}

export function renderWithProviders(
    ui,
    {
        route = '/',
        authValue = {},
        store,
        preloadedState,
    } = {}
) {
    const testStore = store ?? makeStore(preloadedState);
    const auth = { ...defaultAuthValue, ...authValue };

    if (authValue.supabase) {
        auth.supabase = { ...defaultAuthValue.supabase, ...authValue.supabase };
    }

    return {
        store: testStore,
        ...render(
            <Provider store={testStore}>
                <AuthContext.Provider value={auth}>
                    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
                </AuthContext.Provider>
            </Provider>
        ),
    };
}
