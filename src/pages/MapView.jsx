import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MapView() {
    const { user, profile, supabase } = useAuthContext();
    const [location, setLocation] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) =>
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            (error) => console.error('Location error:', error),
            { enableHighAccuracy: true }
        );
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/'); // Adjust this path if your login route is different
    };

    return (
        <div className="relative p-4 min-h-screen bg-white">
            {/* Log Out Button */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    Log Out
                </button>
            </div>

            <h2 className="form-heading">
                Welcome, {profile?.first_name ?? user?.email ?? 'Guest'}
            </h2>

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
