// TurkuCityTour/src/pages/Login.jsx
import React, { useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { supabase, user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/map');
  }, [user]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({ email: prompt('Enter your email') });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Login</h1>
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">Login with Magic Link</button>
    </div>
  );
}