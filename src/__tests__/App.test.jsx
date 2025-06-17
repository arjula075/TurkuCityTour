import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MockAuthProvider from './MockAuthProvider';
import App from '../App';

test('renders login page by default', () => {
    render(
        <MockAuthProvider>
                <App />
        </MockAuthProvider>
    );
});
