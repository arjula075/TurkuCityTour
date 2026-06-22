import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { makeStore } from '../test-utils/renderWithProviders';

vi.mock('../services/supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
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
});
