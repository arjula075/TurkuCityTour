import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { makeStore } from '../test-utils/renderWithProviders';

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

vi.mock('../services/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: (...args) => mockGetUser(...args),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(),
    },
}));

import App from '../App';

describe('App', () => {
    beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('renders login page by default', async () => {
        render(
            <Provider store={makeStore()}>
                <App />
            </Provider>
        );

        expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    it('redirects unauthenticated users away from /map', async () => {
        window.history.pushState({}, '', '/map');

        render(
            <Provider store={makeStore()}>
                <App />
            </Provider>
        );

        expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument();
    });
});
