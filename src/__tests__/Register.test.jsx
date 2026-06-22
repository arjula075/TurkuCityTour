import React from 'react';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import Register from '../pages/Register';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Register Page', () => {
    it('renders Register form', () => {
        renderWithProviders(<Register />);

        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    });
});
