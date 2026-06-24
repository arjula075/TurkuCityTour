import React, { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import { setAvailableGames, setSelectedGameId, setGameActive } from '../store/slices/gameSlice';
import FinalMessage from './FinalMessage';
import { logEvent } from '../utils/logger';
import {
    fetchLocationsForPlayer,
    updateUserProgress,
    clearUserProgress,
    validateLocationArrival,
    recordLocationGuess,
} from '../services/supabaseService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import HintDisplay from '../components/mapview/HintDisplay';
import QuestionDisplay from '../components/mapview/QuestionDisplay';
import TrainingPrompt from '../components/mapview/TrainingPrompt';
import useGeolocation from '../hooks/useGeolocation';
import { getDistance } from '../utils/geo';
import { isAdminEnabled } from '../config/features';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [50, 82],       // default is [25, 41], double it
    iconAnchor: [25, 82],     // anchor at bottom center
    popupAnchor: [1, -34],    // adjust popup
    shadowSize: [68, 95],
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: markerShadow,
    iconSize: [50, 81],
    iconAnchor: [25, 82],     // anchor at bottom center
    popupAnchor: [1, -34],    // adjust popup
    shadowSize: [68, 95],
});

export default function MapView() {
    const { user, profile, supabase } = useAuthContext();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const availableGames = useSelector(state => state.game.availableGames);
    const selectedGameId = useSelector(state => state.game.selectedGameId);
    const gameActive = useSelector(state => state.game.gameActive);

    const [locations, setLocations] = useState([]);
    const [trainingMode, setTrainingMode] = useState(false);
    const [trainingStep, setTrainingStep] = useState(0);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [loading, setLoading] = useState(true);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [hintIndex, setHintIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [guessed, setGuessed] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [showQuestion, setShowQuestion] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [quizComplete, setQuizComplete] = useState(false);
    const [centerOnUser, setCenterOnUser] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [ready, setReady] = useState(false);

    const needsLiveLocation = gameActive || waiting || trainingMode;
    const { location: gpsLocation } = useGeolocation({ pollWhileActive: needsLiveLocation });
    const [manualLocation, setManualLocation] = useState(null);
    const location = manualLocation ?? gpsLocation;

    const isAdmin = isAdminEnabled && profile?.is_admin;
    const thunderforestKey = import.meta.env.VITE_THUNDERFOREST_API_KEY;

    const TRAINING_POINTS = [
        { id: 1, name: "Turku Cathedral", lat: 60.452324, lng: 22.278240 },
        { id: 2, name: "Turku Art Museum", lat: 60.45408, lng: 22.26182 },
        { id: 3, name: "Turun Linna", lat: 60.435317, lng: 22.228635 },
    ];

    useEffect(() => {
        if (!user?.id) return;
        console.log('user', user);

        async function checkGameAccess() {
            const { data, error } = await supabase
                .from('game_players')
                .select('game_id, games (name)')
                .eq('user_id', user.id);

            console.log('Selected gameId', data);
            if (error || !data || data.length === 0) {
                navigate('/sorry');
                return;
            }

            dispatch(setAvailableGames(data));
            if (data.length === 1) {
                dispatch(setSelectedGameId(data[0].game_id));
            }
        }

        checkGameAccess();
    }, [user, supabase, navigate, dispatch]);

    useEffect(() => {
        if (!selectedGameId) return;

        console.log("📍 Game ID available:", selectedGameId);
        console.log("📦 Fetching locations...");

        fetchLocationsForPlayer(selectedGameId).then((data) => {
            const sorted = data.sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id));
            const formatted = sorted.map(loc => ({
                ...loc,
                hints: loc.hints?.sort((a, b) => a.hint_order - b.hint_order) || [],
                questions: loc.questions?.map(q => ({
                    ...q,
                    answers: q.answers?.sort((a, b) => a.answer_text.localeCompare(b.answer_text)) || [],
                })) || [],
            }));
            setLocations(formatted);
            setReady(true);
        });
    }, [selectedGameId]);

    useEffect(() => {
        if (!waiting || !locations[currentIndex] || !location) return;

        let cancelled = false;

        async function checkArrival() {
            const loc = locations[currentIndex];
            try {
                const result = await validateLocationArrival(
                    loc.id,
                    location.lat,
                    location.lng,
                    50
                );
                if (!cancelled && result?.arrived) {
                    setShowQuestion(true);
                }
            } catch (err) {
                const dist = getDistance(
                    location.lat,
                    location.lng,
                    loc.latitude,
                    loc.longitude
                );
                if (!cancelled && dist <= 50) {
                    setShowQuestion(true);
                }
            }
        }

        checkArrival();

        return () => {
            cancelled = true;
        };
    }, [waiting, locations, currentIndex, location]);

    useEffect(() => {
        if (showQuestion) {
            setQuizComplete(false);
        }
    }, [showQuestion]);

    useEffect(() => {
        if (user?.id && locations.length > 0 && selectedGameId) {
            getResumeState(user.id, locations, selectedGameId);
        }
    }, [user?.id, locations, selectedGameId]);

    useEffect(() => {
        if (location && locations.length > 0) {
            setReady(true);
        }
    }, [location, locations]);

    const startTraining = () => {
        setCenterOnUser(false);
        setTrainingMode(true);
        setTrainingStep(0);
        setTrainingComplete(false);
        alert("Training started!");
    };

    const getResumeState = async (userId, locations, selectedGameId) => {
        if (!userId || !locations || locations.length === 0 || !selectedGameId) return;

        // Step 1: Fetch all user progress
        const { data: progressData, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user progress:', error);
            return;
        }

        if (!progressData || progressData.length === 0) {
            return;
        }

        // Step 2: Get location IDs that belong to the current game
        const locationIdsForGame = locations.map(loc => loc.id);

        // Step 3: Filter progress entries to only include those in current game
        const progressForGame = progressData.filter(p =>
            locationIdsForGame.includes(p.location_id)
        );

        if (progressForGame.length === 0) return;

        dispatch(setGameActive(true));


        const sorted = [...locations].sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id));

        for (let i = 0; i < sorted.length; i++) {
            const loc = sorted[i];
            const progress = progressForGame.find(p => p.location_id === loc.id);

            if (!progress) {
                setCurrentIndex(i);
                setHintIndex(0);
                setGuessed(false);
                setWaiting(false);
                setShowQuestion(false);
                return;
            }

            if (progress.answered_correctly === null) {
                setCurrentIndex(i);
                setGuessed(true);
                setWaiting(true);
                setShowQuestion(false);
                return;
            }
        }

        setGameEnded(true);
        dispatch(setGameActive(false));

        navigate('/game-complete');
    };


    const handleMapClick = async (e) => {
        if (trainingMode) {
            const point = TRAINING_POINTS[trainingStep];
            const d = getDistance(e.latlng.lat, e.latlng.lng, point.lat, point.lng);
            if (d <= 100) {
                alert("✅ Correct! " + point.name);
                if (trainingStep === TRAINING_POINTS.length - 1) {
                    setTrainingComplete(true);
                    setTrainingMode(false);
                    setCenterOnUser(true);
                } else setTrainingStep((s) => s + 1);
            } else alert(`❌ Too far! ${Math.round(d)}m from ${point.name}`);
        } else if (gameActive && !guessed) {
            setCenterOnUser(false);
            const loc = locations[currentIndex];
            const pts = Math.max(5 - hintIndex, 1);

            try {
                const result = await recordLocationGuess(
                    loc.id,
                    e.latlng.lat,
                    e.latlng.lng,
                    pts,
                    100
                );

                if (!result?.accepted) {
                    const dist = result?.distance_m ?? getDistance(
                        e.latlng.lat,
                        e.latlng.lng,
                        loc.latitude,
                        loc.longitude
                    );
                    alert(`❌ Too far! ${Math.round(dist)} meters.`);
                    return;
                }

                setScore((s) => s + pts);
                setGuessed(true);
                setWaiting(true);
                alert(`✅ ${pts} points. Now walk to the location.`);
                setCenterOnUser(true);
            } catch (err) {
                const d = getDistance(e.latlng.lat, e.latlng.lng, loc.latitude, loc.longitude);
                if (d <= 100) {
                    setScore((s) => s + pts);
                    setGuessed(true);
                    await updateUserProgress(user.id, loc.id, pts);
                    setWaiting(true);
                    alert(`✅ ${pts} points. Now walk to the location.`);
                    setCenterOnUser(true);
                } else {
                    alert(`❌ Too far! ${Math.round(d)} meters.`);
                }
            }
        }
    };

    const TrainingClickHandler = () => {
        useMapEvents({ click: handleMapClick });
        return null;
    };

    function UserLocationMarker({ lat, lng }) {
        const markerRef = useRef(null);

        useEffect(() => {
            markerRef.current?.setLatLng([lat, lng]);
        }, [lat, lng]);

        return <Marker ref={markerRef} position={[lat, lng]} />;
    }

    function RecenterMap({ lat, lng, centerOnUser }) {
        const map = useMap();

        useEffect(() => {
            if (centerOnUser && lat && lng) {
                map.panTo([lat, lng], { animate: true, duration: 0.5 });
            }
        }, [lat, lng, centerOnUser, map]);

        return null;
    }

    const onNextLocation = () => {
        setButtonDisabled(true);
        setQuizComplete(true);
        setShowQuestion(false);
        setGuessed(false);
        setWaiting(false);
        setHintIndex(0);
        setSelectedAnswer(null);
        setSubmitted(null);
        setIsCorrect(null);
        setCenterOnUser(false);


        setTimeout(() => {
            if (currentIndex < locations.length - 1) {
                setCurrentIndex(i => i + 1);
                setQuizComplete(false);
                setButtonDisabled(false);
            } else {
                navigate('/game-complete'); // ✅ redirect to new page
            }
        }, 300);
    };


    const currentLoc = locations[currentIndex];
    const distanceToCurrent = location && currentLoc
        ? getDistance(location.lat, location.lng, currentLoc.latitude, currentLoc.longitude)
        : null;

    const getGameStateSnapshot = () => ({
        gameActive: useSelector(state => state.game.gameActive),
        currentIndex,
        hintIndex,
        score,
        guessed,
        waiting,
        showQuestion,
        selectedAnswer,
        quizComplete,
        centerOnUser,
        submitted,
        isCorrect,
        gameEnded,
    });

    const handleGiveUp = async () => {
        const loc = locations[currentIndex];

        // Update user progress with 0 points
        await updateUserProgress(user.id, loc.id, 0);

        // Set state: guessed, hintIndex reset, start walking to location
        setGuessed(true);
        setHintIndex(0);
        setWaiting(true);
        setCenterOnUser(true);
        alert("❌ No worries. Now walk to the location to continue.");
    };

    function mapViewLogEvent(text) {
        const states = getGameStateSnapshot();
        logEvent(text, states);
    };

    if (availableGames.length > 1 && !selectedGameId) {
        return (
            <div className="p-4 bg-white text-center">
                <h2 className="text-6xl font-semibold mb-6">Select Game</h2>
                <select
                    className="w-full max-w-md mx-auto px-6 py-5 rounded-xl border border-gray-400 text-4xl leading-tight bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                        console.log("🟢 setting selectedGameId:", e.target.value);
                        dispatch(setSelectedGameId(e.target.value));
                    }}
                    defaultValue=""
                >
                    <option value="" disabled className="text-4xl">Select one...</option>
                    {availableGames.map((g) => (
                        <option key={g.game_id} value={g.game_id} className="text-4xl">
                            {g.games?.name ?? `Game ${g.game_id}`}
                        </option>
                    ))}
                </select>
            </div>
        );
    }



    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-screen-safe page-safe-area">
                <p className="font-semibold text-gray-500 text-4xl sm:text-6xl">Loading game...</p>
            </div>
        );
    }

    return (

        <div className="page-safe-area bg-white animate-fadeIn min-h-screen-safe">
            {!gameActive && (
                <h2>
                    Welcome, {profile?.first_name ?? user?.email ?? 'Guest'}
                </h2>
            )}

            {!showQuestion && (() => {
                console.log("📍 showQuestion:", showQuestion);
                console.log("📍 location:", location);
                console.log("📍 centerOnUser:", centerOnUser);
                console.log("📍 guessed:", guessed);
                console.log("📍 waiting:", waiting);
                console.log("📍 currentLoc:", currentLoc);

                return location ? (
                    <MapContainer center={[location.lat, location.lng]} zoom={15} className="map-mobile-height">
                        <TileLayer
                            url={`https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}{r}.png?apikey=${thunderforestKey}`}
                            attribution='&copy; Thunderforest &copy; OpenStreetMap contributors'
                        />
                        <UserLocationMarker lat={location.lat} lng={location.lng} />
                        <RecenterMap lat={location.lat} lng={location.lng} centerOnUser={centerOnUser} />
                        <TrainingClickHandler />
                        {guessed && waiting && currentLoc && (
                            <Marker
                                icon={redIcon}
                                position={[currentLoc.latitude, currentLoc.longitude]}
                            />
                        )}
                    </MapContainer>
                ) : (
                    <p>Getting location...</p>
                );
            })()}


            <div className="mt-6 mx-auto space-y-4">
                {!gameActive && !gameEnded && (
                    <>
                        {locations.length > 0 && (
                            <button
                                className="btn-pill2"
                                onClick={async () => {
                                    await clearUserProgress(user.id, selectedGameId);
                                    dispatch(setGameActive(true));
                                    setCurrentIndex(0);
                                    setHintIndex(0);
                                    setScore(0);
                                    setGuessed(false);
                                    setCenterOnUser(false);
                                }}
                            >
                                Start Game
                            </button>
                        )}
                        <button
                            className="btn-pill2"
                            onClick={startTraining}
                            disabled={trainingMode}
                        >
                            Exercise
                        </button>
                        <button
                            className="btn-pill2"
                            onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
                        >
                            Log Out
                        </button>
                    </>
                )}

                {gameActive && !guessed && locations[currentIndex] && !showQuestion && (
                    <HintDisplay
                        location={locations[currentIndex]}
                        hintIndex={hintIndex}
                        setHintIndex={setHintIndex}
                        score={score}
                        guessed={guessed}
                        onGiveUp={handleGiveUp}
                    />
                )}

                {gameActive && guessed && currentLoc && location && !showQuestion && (
                    <div className="text-center p-4 bg-gray-100 rounded">
                        <p className="text-4xl font-semibold">
                            🎯 Great! Now move to the location:
                        </p>
                        <p className="text-3xl mt-2">
                            Distance to {currentLoc.name}: {Math.round(distanceToCurrent)} meters
                        </p>
                    </div>
                )}

                {showQuestion && !quizComplete && (
                    <QuestionDisplay
                        question={locations[currentIndex]?.questions?.[0]}
                        selectedAnswer={selectedAnswer}
                        setSelectedAnswer={setSelectedAnswer}
                        submitted={submitted}
                        setSubmitted={setSubmitted}
                        isCorrect={isCorrect}
                        setIsCorrect={setIsCorrect}
                        buttonDisabled={buttonDisabled}
                        setButtonDisabled={setButtonDisabled}
                        onAnsweredCorrect={async () => {
                            setCenterOnUser(true);
                        }}
                        onNextLocation={onNextLocation}
                    />
                )}

                {quizComplete && currentIndex < locations.length - 1 && (
                    <button
                        className="btn-pill2"
                        onClick={onNextLocation}
                        disabled={buttonDisabled}
                    >
                        Next Location
                    </button>
                )}

                {quizComplete && currentIndex >= locations.length - 1 && !gameEnded && (
                    <div className="text-center space-y-4">
                        <FinalMessage message={profile?.message ?? 'Thanks for playing!'} />
                        <button
                            className="btn-pill2"
                            onClick={() => {
                                dispatch(setGameActive(false));
                                setGameEnded(true);
                                setCurrentIndex(0);
                                setScore(0);
                                setGuessed(false);
                                setWaiting(false);
                                setShowQuestion(false);
                                setSelectedAnswer(null);
                                setSubmitted(false);
                                setIsCorrect(null);
                                setQuizComplete(false);
                            }}
                        >
                            End Game
                        </button>
                    </div>
                )}

                {trainingMode && (
                    <TrainingPrompt name={TRAINING_POINTS[trainingStep].name} />
                )}

                {isAdmin && (
                    <>
                        <button onClick={() => navigate('/admin')} className="btn-pill2">
                            Admin View
                        </button>
                        <button onClick={() => navigate('/results')} className="btn-pill2">
                            Results
                        </button>
                        {import.meta.env.DEV && locations[currentIndex] && (
                            <button
                                className="btn-pill2 mt-4"
                                onClick={() => {
                                    const loc = locations[currentIndex];
                                    setManualLocation({ lat: loc.latitude, lng: loc.longitude });
                                    setGuessed(true);
                                    setWaiting(true);
                                    setShowQuestion(true);
                                    alert(`Admin: User location set to ${loc.name}`);
                                }}
                            >
                                Beam me up, Scotty!
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

}