import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

export default function MapView() {
    const { user, profile, supabase } = useAuthContext();
    const [location, setLocation] = useState(null);
    const navigate = useNavigate();
    const [trainingMode, setTrainingMode] = useState(false);
    const [currentTrainingStep, setCurrentTrainingStep] = useState(0);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const isAdmin = profile?.is_admin;

    const TRAINING_POINTS = [
        { id: 1, name: "Turku Cathedral, Turun Tuomiokirkko", lat: 60.452324, lng: 22.278240 },
        { id: 2, name: "Turku Art Museum, Taidemuseo", lat: 60.45408, lng: 22.26182 },
        { id: 3, name: "Turun Linna, Castle of Turku", lat: 60.435317, lng: 22.228635 },
    ];


    useEffect(() => {
        if (!navigator.geolocation) {
            // Fallback immediately if geolocation isn't supported
            setLocation({ lat: 60.4522438, lng: 22.2680450}); // Berlin
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) =>
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            (error) => {
                console.error('Location error:', error);
                // Fallback to Berlin if error occurs
                setLocation({ lat: 60.4522438, lng: 22.2680450 });
            },
            { enableHighAccuracy: true }
        );
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const startTraining = () => {
        setTrainingMode(true);
        setCurrentTrainingStep(0);
        setTrainingComplete(false);
        alert('Training started! Click on the correct locations when prompted.');
    };

    const handleMapClick = (e) => {
        if (!trainingMode || trainingComplete) return;

        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        const target = TRAINING_POINTS[currentTrainingStep];

        const distance = getDistance(clickedLat, clickedLng, target.lat, target.lng);

        if (distance <= 100) {
            alert(`✅ Correct! (${target.name})`);
            if (currentTrainingStep === TRAINING_POINTS.length - 1) {
                setTrainingComplete(true);
                setTrainingMode(false);
                alert("🎉 Training complete! You can now use the map normally.");
            } else {
                setCurrentTrainingStep(currentTrainingStep + 1);
            }
        } else {
            alert(`❌ Try again! You're ${Math.round(distance)}m away from ${target.name}`);
        }
    };

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // metres
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // in meters
    }


    const goToAdmin = () => {
        navigate('/admin');
    };

    function TrainingClickHandler() {
        const map = useMapEvents({
            click(e) {
                handleMapClick(e);
            }
        });

        return null; // this component only listens for clicks
    }


    return (
        <div className="flex flex-col items-center p-4 bg-white">
            <h2 className="text-5xl font-semibold mb-4 text-center">
                Welcome, {profile?.first_name ?? user?.email ?? 'Guest'}
            </h2>

            {location ? (
                <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={15}
                    style={{ height: "40vh", width: "100%" }}
                    whenCreated={(map) => (window.leafletMap = map)} // optional ref
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    {/* Optionally show current location marker */}
                    <Marker position={[location.lat, location.lng]} />
                    <TrainingClickHandler />
                </MapContainer>
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

                <button className="btn-pill2 bg-blue-600 text-white hover:bg-blue-700" onClick={startTraining} disabled={trainingMode}>
                    🧪 Exercise
                </button>

                {trainingMode && (
                    <div>
                        <strong>Training Mode:</strong> Click on <em>{TRAINING_POINTS[currentTrainingStep].name}</em>
                    </div>
                )}

                {isAdmin && (
                    <button onClick={goToAdmin} className="btn-pill2 bg-blue-600 text-white hover:bg-blue-700">
                        Admin View
                    </button>
                )}
            </div>
        </div>
    );
}
