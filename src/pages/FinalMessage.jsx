// TurkuCityTour/src/pages/FinalMessage.jsx
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

export default function FinalMessage() {
  const { user, supabase } = useAuthContext();
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchMessage() {
      const { data, error } = await supabase.from('users').select('message').eq('id', user.id).single();
      if (data) setMessage(data.message);
    }
    fetchMessage();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Congratulations!</h1>
      <p>{message || 'Thanks for playing!'}</p>
    </div>
  );
}