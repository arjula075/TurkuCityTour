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
import '@fontsource/montserrat';

// Admin route guard wrapper component
function AdminRoute({ children }) {
  const { profile } = useAuthContext();
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
        element: <MapView />,
      },
      {
        path: '/complete',
        element: <FinalMessage />,
      },
      {
        path: '/game-complete',
        element: <GameComplete />,
      },
      {
        path: '/admin',
        element: (
            <AdminRoute>
              <AdminView />
            </AdminRoute>
        ),
      },
    ],
    {
      future: {
        v7_startTransition: true,
        // You can add other future flags here as needed
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
