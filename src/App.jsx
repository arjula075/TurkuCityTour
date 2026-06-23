// TurkuCityTour/src/App.jsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import Login from './pages/Login';
import MapView from './pages/MapView';
import FinalMessage from './pages/FinalMessage';
import Register from './pages/Register';
import AdminView from './pages/AdminView';
import GameComplete from './pages/GameComplete';
import Results from './pages/Results';
import Sorry from './pages/Sorry';
import '@fontsource/montserrat';

function AuthRoute({ children }) {
    const { user, loading } = useAuthContext();
    if (loading) return null;
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children;
}

// Admin route guard wrapper component
function AdminRoute({ children }) {
    const { profile, loading } = useAuthContext();
    if (loading) return null;
    if (!profile?.is_admin) {
        return <Navigate to="/" replace />;
    }
    return children;
}

// Routes definition
const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <Login />,
        },
        {
            path: '/register',
            element: <Register />,
        },
        {
            path: '/map',
            element: (
                <AuthRoute>
                    <MapView />
                </AuthRoute>
            ),
        },
        {
            path: '/complete',
            element: (
                <AuthRoute>
                    <FinalMessage />
                </AuthRoute>
            ),
        },
        {
            path: '/game-complete',
            element: (
                <AuthRoute>
                    <GameComplete />
                </AuthRoute>
            ),
        },
        {
            path: '/admin',
            element: (
                <AdminRoute>
                    <AdminView />
                </AdminRoute>
            ),
        },
        {
            path: "/sorry",
            element: (
                <AuthRoute>
                    <Sorry />
                </AuthRoute>
            ),
        },
        {
            path: '/results',
            element: (
                <AdminRoute>
                    <Results />
                </AdminRoute>
            ),
        },
        // 👇 Catch-all fallback route
        {
            path: '*',
            element: <Navigate to="/" replace />,
        },

    ],
    {
        future: {
            v7_startTransition: true,
        },
    }
);


function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;
