import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Register from '../pages/Register';
import { renderWithProviders, createMockSupabase } from '../test-utils/renderWithProviders';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Register', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        vi.stubGlobal('alert', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders Register form', () => {
        renderWithProviders(<Register />);

        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });

    it('signs up and creates a user profile', async () => {
        const supabase = createMockSupabase();
        supabase.rpc.mockResolvedValue({ error: null });

        renderWithProviders(<Register />, { authValue: { supabase } });

        fireEvent.change(screen.getByPlaceholderText(/first name/i), {
            target: { value: 'Ada' },
        });
        fireEvent.change(screen.getByPlaceholderText(/last name/i), {
            target: { value: 'Lovelace' },
        });
        fireEvent.change(screen.getByPlaceholderText(/email address/i), {
            target: { value: 'ada@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
            target: { value: 'StrongPass123!' },
        });

        fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

        await waitFor(() => {
            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'ada@example.com',
                password: 'StrongPass123!',
            });
        });

        expect(supabase.rpc).toHaveBeenCalledWith('create_user_profile', {
            first_name: 'Ada',
            last_name: 'Lovelace',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('shows signup errors', async () => {
        const supabase = createMockSupabase();
        supabase.auth.signUp.mockResolvedValue({
            data: { user: null },
            error: { message: 'Email already registered' },
        });

        renderWithProviders(<Register />, { authValue: { supabase } });

        fireEvent.change(screen.getByPlaceholderText(/first name/i), {
            target: { value: 'Ada' },
        });
        fireEvent.change(screen.getByPlaceholderText(/last name/i), {
            target: { value: 'Lovelace' },
        });
        fireEvent.change(screen.getByPlaceholderText(/email address/i), {
            target: { value: 'ada@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
            target: { value: 'StrongPass123!' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

        expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    });
});
