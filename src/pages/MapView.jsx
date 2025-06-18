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
        navigate('/login');
    };

    return (
        <div className="flex flex-col items-center p-4 min-h-screen bg-white">
            <h2 className="text-xl font-semibold mb-4 text-center">
                Welcome, {profile?.first_name ?? user?.email ?? 'Guest'}
            </h2>

            {location ? (
                <iframe
                    className="w-full max-w-md h-64 rounded-md shadow-md"
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                    title="User Location Map"
                ></iframe>
            ) : (
                <p className="text-gray-600">Getting your location...</p>
            )}

            {/* Log Out Button Below Map */}
            <div className="mt-6 w-full max-w-md">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white text-lg font-medium py-3 px-6 rounded-lg shadow hover:bg-red-600 transition"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
