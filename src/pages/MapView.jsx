// TurkuCityTour/src/pages/MapView.jsx
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

export default function MapView() {
  const { user, supabase } = useAuthContext();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg mb-2">Welcome, {user?.email}</h2>
      {location ? (
        <iframe
          width="100%"
          height="400"
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
        ></iframe>
      ) : (
        <p>Getting your location...</p>
      )}
    </div>
  );
}