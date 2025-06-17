import React from 'react';
import { AuthContext } from '../contexts/AuthContext';

const MockAuthProvider = ({
                              children,
                              user = null,
                              login = vi.fn(),
                              register = vi.fn(),
                              logout = vi.fn(),
                          }) => {
    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default MockAuthProvider;
