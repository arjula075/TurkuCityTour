import { useEffect, useRef, useState } from 'react';

const TURKU_FALLBACK = { lat: 60.4522438, lng: 22.2680450 };

const WATCH_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000,
};

/**
 * Single geolocation source for the map.
 * Uses watchPosition plus optional polling while the game is active —
 * mobile browsers often throttle or stop watch callbacks in the background.
 */
export default function useGeolocation({ pollWhileActive = false } = {}) {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const locationRef = useRef(null);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(TURKU_FALLBACK);
            setError('Geolocation not supported');
            return;
        }

        const applyPosition = (pos) => {
            const next = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            };
            setLocation(next);
            setError(null);
        };

        const handleError = (err) => {
            console.warn('Geolocation error:', err);
            setError(err.message);
            if (!locationRef.current) {
                setLocation(TURKU_FALLBACK);
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            applyPosition,
            handleError,
            WATCH_OPTIONS
        );

        let pollId;
        if (pollWhileActive) {
            pollId = window.setInterval(() => {
                navigator.geolocation.getCurrentPosition(
                    applyPosition,
                    () => {},
                    WATCH_OPTIONS
                );
            }, 10000);
        }

        return () => {
            navigator.geolocation.clearWatch(watchId);
            if (pollId) window.clearInterval(pollId);
        };
    }, [pollWhileActive]);

    return { location, error };
}
