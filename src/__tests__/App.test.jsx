// src/__tests__/App.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AuthContext } from '../contexts/AuthContext';

describe('App routing', () => {
    test('renders login page by default', () => {
        render(
            <AuthContext.Provider value={{ supabase: {}, user: null }}>
                <App />
            </AuthContext.Provider>
        );

        // Better: match the heading
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

});
