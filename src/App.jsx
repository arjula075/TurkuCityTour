// TurkuCityTour/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import Login from './pages/Login';
import MapView from './pages/MapView';
import FinalMessage from './pages/FinalMessage';
import Register from './pages/Register';
import AdminView from './pages/AdminView';

// ⛔ Route Guard: Admin only
function AdminRoute({ children }) {
  const { profile } = useAuthContext();
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/complete" element={<FinalMessage />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminView />
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;