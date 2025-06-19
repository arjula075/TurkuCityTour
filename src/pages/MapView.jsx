import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MapView() {
    const { user, profile, supabase } = useAuthContext();
    const [location, setLocation] = useState(null);
    const navigate = useNavigate();
    const isAdmin = profile?.is_admin;

    useEffect(() => {
        if (!navigator.geolocation) {
            // Fallback immediately if geolocation isn't supported
            setLocation({ lat: 52.520008, lng: 13.404954 }); // Berlin
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) =>
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            (error) => {
                console.error('Location error:', error);
                // Fallback to Berlin if error occurs
                setLocation({ lat: 52.520008, lng: 13.404954 });
            },
            { enableHighAccuracy: true }
        );
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const goToAdmin = () => {
        navigate('/admin');
    };

    return (
        <div className="flex flex-col items-center p-4 bg-white">
            <h2 className="text-5xl font-semibold mb-4 text-center">
                Welcome, {profile?.first_name ?? user?.email ?? 'Guest'}
            </h2>

            {location ? (
                <iframe
                    className="w-full h-[40vh] rounded-md shadow-md"
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                    title="User Location Map"
                ></iframe>
            ) : (
                <p className="text-gray-600">Getting your location...</p>
            )}

            <div className="mt-6 w-full max-w-md">
                <button
                    onClick={handleLogout}
                    className="btn-pill2"
                >
                    Log Out
                </button>

                {isAdmin && (
                    <button onClick={goToAdmin} className="btn-pill2 bg-blue-600 text-white hover:bg-blue-700">
                        Admin View
                    </button>
                )}
            </div>
        </div>
    );
}
