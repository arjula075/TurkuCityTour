import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Login from '../pages/Login';
import { renderWithProviders, createMockSupabase } from '../test-utils/renderWithProviders';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Login', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
    });

    it('submits credentials via supabase auth', async () => {
        const supabase = createMockSupabase();

        renderWithProviders(<Login />, { authValue: { supabase } });

        fireEvent.change(screen.getByPlaceholderText(/email address/i), {
            target: { value: 'player@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'secret-pass' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'player@example.com',
                password: 'secret-pass',
            });
        });
    });

    it('shows an error when sign-in fails', async () => {
        const supabase = createMockSupabase();
        supabase.auth.signInWithPassword.mockResolvedValue({
            error: { message: 'Invalid login credentials' },
        });

        renderWithProviders(<Login />, { authValue: { supabase } });

        fireEvent.change(screen.getByPlaceholderText(/email address/i), {
            target: { value: 'bad@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'wrong' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

        expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    });

    it('redirects authenticated users to the map', () => {
        renderWithProviders(<Login />, {
            authValue: { user: { id: 'user-1', email: 'player@example.com' } },
        });

        expect(mockNavigate).toHaveBeenCalledWith('/map');
    });
});
