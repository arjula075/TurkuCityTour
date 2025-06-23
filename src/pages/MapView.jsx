import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { fetchLocationsWithHintsQuestionsAnswers, updateUserProgress, clearUserProgress } from '../services/supabaseService';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet's default icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function MapView() {
    const { user, profile, supabase } = useAuthContext();
    const [locations, setLocations] = useState([]);
    const [location, setLocation] = useState(null);
    const navigate = useNavigate();
    const [trainingMode, setTrainingMode] = useState(false);
    const [currentTrainingStep, setCurrentTrainingStep] = useState(0);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [gameActive, setGameActive] = useState(false);
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
    const [currentHintIndex, setCurrentHintIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [guessed, setGuessed] = useState(false);
    const [waitingAtLocation, setWaitingAtLocation] = useState(false);
    const [showQuestion, setShowQuestion] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [quizComplete, setQuizComplete] = useState(false);
    const isAdmin = profile?.is_admin;
    const thunderforestKey = import.meta.env.VITE_THUNDERFOREST_API_KEY;


    const TRAINING_POINTS = [
        { id: 1, name: "Turku Cathedral, Turun Tuomiokirkko", lat: 60.452324, lng: 22.278240 },
        { id: 2, name: "Turku Art Museum, Taidemuseo", lat: 60.45408, lng: 22.26182 },
        { id: 3, name: "Turun Linna, Castle of Turku", lat: 60.435317, lng: 22.228635 },
    ];


    // 1. Runs on mount (initial location + load data)
    useEffect(() => {
        const fallbackLocation = { lat: 60.4522438, lng: 22.2680450 };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                },
                (error) => {
                    console.warn("⚠️ Geolocation not allowed or failed. Using fallback location.");
                    console.warn("Geolocation error:", error.message);
                    setLocation(fallbackLocation);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setLocation(fallbackLocation);
        }

        fetchLocationsWithHintsQuestionsAnswers()
            .then((data) => {
                const sortedLocations = data.sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id));
                const formatted = sortedLocations.map(loc => ({
                    ...loc,
                    hints: (loc.hints ?? []).sort((a, b) => a.hint_order - b.hint_order),
                    questions: (loc.questions ?? []).map(q => ({
                        ...q,
                        answers: (q.answers ?? []).sort((a, b) => a.answer_text.localeCompare(b.answer_text)),
                    })),
                }));
                setLocations(formatted);
            })
            .catch((error) => {
                console.error('Error fetching locations:', error);
            });
    }, []);


// 2. Runs when waitingAtLocation is true — monitors proximity
    useEffect(() => {
        if (!waitingAtLocation || !locations[currentLocationIndex]) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const loc = locations[currentLocationIndex];
                const dist = getDistance(lat, lng, loc.latitude, loc.longitude);
                if (dist <= 50) {
                    navigator.geolocation.clearWatch(watchId);
                    setShowQuestion(true);
                }
            },
            (err) => console.error("Geo error", err),
            { enableHighAccuracy: true }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [waitingAtLocation, locations, currentLocationIndex]);


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
        if (trainingMode) {
            handleTrainingClick(e);
        } else if (gameActive && !guessed) {
            handleGameClick(e);
        }
    };
    const handleTrainingClick = (e) => {
        if (trainingComplete) return;

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
                setCurrentTrainingStep((prev) => prev + 1);
            }
        } else {
            alert(`❌ Try again! You're ${Math.round(distance)}m away from ${target.name}`);
        }
    };

    const handleGameClick = async (e) => {
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        const loc = locations[currentLocationIndex];

        const distance = getDistance(clickedLat, clickedLng, loc.latitude, loc.longitude);

        if (distance <= 100) {
            const earnedPoints = Math.max(5 - currentHintIndex, 1);
            setScore((prev) => prev + earnedPoints);
            setGuessed(true);
            try {
                await updateUserProgress(user.id, loc.id, earnedPoints);
                console.log('User progress updated');
            } catch (error) {
                console.error('Failed to update user progress:', error);
            }
            alert(`✅ Correct! You earned ${earnedPoints} points. Now walk to the location.`);
            setWaitingAtLocation(true);
        } else {
            alert(`❌ Too far! You are ${Math.round(distance)} meters away.`);
        }
    };



    function TrainingClickHandler() {
        const map = useMapEvents({
            click(e) {
                handleMapClick(e);
            }
        });

        return null; // this component only listens for clicks
    }

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
                        url={`https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}{r}.png?apikey=${thunderforestKey}`}
                        attribution='&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        maxZoom={22}
                    />
                    {/* Optionally show current location marker */}
                    <Marker position={[location.lat, location.lng]} />
                    <TrainingClickHandler />
                </MapContainer>
            ) : (
                <p className="text-gray-600">Getting your location...</p>
            )}

            <div className="mt-6 w-full max-w-md">

                {!gameActive && (
                    <button
                        className="btn-pill2"
                        onClick={async() => {
                            try {
                                await clearUserProgress(user.id);
                                console.log('✅ Cleared previous user progress');
                            } catch (error) {
                                console.error('❌ Failed to clear progress:', error.message);
                            }
                            setGameActive(true);
                            setCurrentLocationIndex(0);
                            setCurrentHintIndex(0);
                            setScore(0);
                            setGuessed(false);

                        }}
                    >
                        Start Game
                    </button>
                )}

                {gameActive && (
                    <div className="bg-white p-4 rounded shadow-md space-y-3">
                        <p className="font-semibold">Hint:</p>
                        <p>{locations[currentLocationIndex]?.hints?.[currentHintIndex]?.hint_text ?? 'No more hints'}</p>


                        {!guessed && currentHintIndex < 4 && (
                            <button
                                className="btn bg-gray-300"
                                onClick={() => setCurrentHintIndex((prev) => prev + 1)}
                            >
                                Next Hint
                            </button>
                        )}

                        <p className="text-sm mt-2 text-gray-500">Score: {score}</p>
                    </div>
                )}

                {showQuestion && !quizComplete && (
                    <div className="mt-6">
                        <h3 className="text-4xl font-bold mb-4">
                            {locations[currentLocationIndex]?.questions?.[0]?.question_text}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {locations[currentLocationIndex]?.questions?.[0]?.answers?.map((answer) => (
                                <button
                                    key={answer.id}
                                    className={`btn-pill2 ${selectedAnswer ? 'opacity-50' : ''}`}
                                    onClick={async () => {
                                        if (selectedAnswer) return;

                                        const correct = answer.is_correct;
                                        setSelectedAnswer(answer.id);

                                        if (correct) {
                                            await supabase
                                                .from('user_progress')
                                                .update({ answered_correctly: true })
                                                .eq('user_id', user.id)
                                                .eq('location_id', locations[currentLocationIndex].id);
                                        }

                                        setQuizComplete(true);
                                    }}
                                >
                                    {answer.answer_text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {quizComplete && (
                    <div className="mt-6">
                        {currentLocationIndex < locations.length - 1 ? (
                            <button
                                className="btn-pill2 bg-green-600 text-white"
                                onClick={() => {
                                    setCurrentLocationIndex((prev) => prev + 1);
                                    setCurrentHintIndex(0);
                                    setGuessed(false);
                                    setWaitingAtLocation(false);
                                    setShowQuestion(false);
                                    setSelectedAnswer(null);
                                    setQuizComplete(false);
                                }}
                            >
                                ➡️ Next Location
                            </button>
                        ) : (
                            <div className="mt-4 text-xl font-semibold">
                                🎉 You’ve completed the tour!
                                <br />
                                Message: {profile?.message ?? "Thank you for playing!"}
                            </div>
                        )}
                    </div>
                )}

                {!gameActive && (
                    <>


                        <button
                            className="btn-pill2 bg-blue-600 text-white hover:bg-blue-700"
                            onClick={startTraining}
                            disabled={trainingMode}
                        >
                            🧪 Exercise
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-pill2"
                        >
                            Log Out
                        </button>
                    </>
                )}

                {trainingMode && (
                    <div className="text-4xl font-semibold mt-4">
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
