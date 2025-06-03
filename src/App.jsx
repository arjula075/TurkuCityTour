// TurkuCityTour/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import MapView from './pages/MapView';
import FinalMessage from './pages/FinalMessage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/complete" element={<FinalMessage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;