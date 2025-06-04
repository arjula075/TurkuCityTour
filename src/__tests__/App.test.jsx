import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

import { vi } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
            signInWithOAuth: vi.fn()
        }
    })
}));

vi.mock('../contexts/AuthContext', () => ({
    AuthProvider: ({ children }) => <div>{children}</div>,
    useAuthContext: () => ({ user: null, supabase: {} })
}));

test('renders login page by default', () => {
    render(<App />);
    expect(screen.getByText(/login with magic link/i)).toBeInTheDocument();

});
