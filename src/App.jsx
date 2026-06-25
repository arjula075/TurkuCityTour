// TurkuCityTour/src/App.jsx
import React, { Suspense } from 'react';
import {
    createBrowserRouter,
    createHashRouter,
    RouterProvider,
    Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import Login from './pages/Login';
import MapView from './pages/MapView';
import FinalMessage from './pages/FinalMessage';
import Register from './pages/Register';
import GameComplete from './pages/GameComplete';
import Sorry from './pages/Sorry';
import PrivacyPolicy from './pages/PrivacyPolicy';
import OfflineBanner from './components/OfflineBanner';
import {
    isAdminEnabled,
    isMobileBuild,
    isRegistrationEnabled,
} from './config/features';
import '@fontsource/montserrat';

const AdminView = isAdminEnabled
    ? React.lazy(() => import('./pages/AdminView'))
    : null;
const Results = isAdminEnabled
    ? React.lazy(() => import('./pages/Results'))
    : null;

function AuthRoute({ children }) {
    const { user, loading } = useAuthContext();
    if (loading) return null;
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function AdminRoute({ children }) {
    const { profile, loading } = useAuthContext();
    if (loading) return null;
    if (!isAdminEnabled || !profile?.is_platform_admin) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function LazyAdminPage({ Page }) {
    return (
        <Suspense fallback={null}>
            <Page />
        </Suspense>
    );
}

const playerRoutes = [
    {
        path: '/',
        element: <Login />,
    },
    ...(isRegistrationEnabled
        ? [
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/privacy',
        element: <PrivacyPolicy />,
    },
          ]
        : []),
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
        path: '/sorry',
        element: (
            <AuthRoute>
                <Sorry />
            </AuthRoute>
        ),
    },
];

const adminRoutes = isAdminEnabled
    ? [
          {
              path: '/admin',
              element: (
                  <AdminRoute>
                      <LazyAdminPage Page={AdminView} />
                  </AdminRoute>
              ),
          },
          {
              path: '/results',
              element: (
                  <AdminRoute>
                      <LazyAdminPage Page={Results} />
                  </AdminRoute>
              ),
          },
      ]
    : [];

const router = (isMobileBuild ? createHashRouter : createBrowserRouter)(
  [
      ...playerRoutes,
      ...adminRoutes,
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
            <OfflineBanner />
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;
