import { useEffect, useRef, useState } from 'react';

import { TURKU_FALLBACK } from '../utils/geo';
import { isNativePlatform } from '../utils/platform';

const WATCH_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000,
};

function coordsFromPosition(pos) {
    return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
    };
}

/**
 * Single geolocation source for the map.
 * Uses Capacitor Geolocation on native, navigator.geolocation on web.
 * Polls while the game is active — mobile browsers often throttle watch callbacks.
 */
export default function useGeolocation({ pollWhileActive = false } = {}) {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const locationRef = useRef(null);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        if (isNativePlatform()) {
            return bindNativeGeolocation({
                pollWhileActive,
                locationRef,
                setLocation,
                setError,
            });
        }

        return bindWebGeolocation({
            pollWhileActive,
            locationRef,
            setLocation,
            setError,
        });
    }, [pollWhileActive]);

    return { location, error };
}

function bindWebGeolocation({ pollWhileActive, locationRef, setLocation, setError }) {
    if (!navigator.geolocation) {
        setLocation(TURKU_FALLBACK);
        setError('Geolocation not supported');
        return undefined;
    }

    const applyPosition = (pos) => {
        setLocation(coordsFromPosition(pos));
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
        navigator.geolocation?.clearWatch(watchId);
        if (pollId) window.clearInterval(pollId);
    };
}

function bindNativeGeolocation({ pollWhileActive, locationRef, setLocation, setError }) {
    let watchId;
    let pollId;
    let appListener;
    let cancelled = false;

    const applyPosition = (pos) => {
        if (!pos) return;
        setLocation(coordsFromPosition(pos));
        setError(null);
    };

    const handleError = (err) => {
        const message = err?.message ?? String(err);
        console.warn('Geolocation error:', err);
        setError(message);
        if (!locationRef.current) {
            setLocation(TURKU_FALLBACK);
        }
    };

    const refreshPosition = async (Geolocation) => {
        try {
            const pos = await Geolocation.getCurrentPosition(WATCH_OPTIONS);
            applyPosition(pos);
        } catch (err) {
            handleError(err);
        }
    };

    (async () => {
        const [{ Geolocation }, { App }] = await Promise.all([
            import('@capacitor/geolocation'),
            import('@capacitor/app'),
        ]);

        if (cancelled) return;

        try {
            const perm = await Geolocation.requestPermissions();
            if (perm.location === 'denied') {
                handleError({ message: 'Location permission denied' });
                return;
            }

            watchId = await Geolocation.watchPosition(WATCH_OPTIONS, (pos, err) => {
                if (err) handleError(err);
                else applyPosition(pos);
            });

            if (pollWhileActive) {
                pollId = window.setInterval(() => refreshPosition(Geolocation), 10000);
            }

            appListener = await App.addListener('appStateChange', ({ isActive }) => {
                if (isActive) refreshPosition(Geolocation);
            });
        } catch (err) {
            handleError(err);
        }
    })();

    return () => {
        cancelled = true;
        if (pollId) window.clearInterval(pollId);
        appListener?.remove();
        if (watchId != null) {
            import('@capacitor/geolocation').then(({ Geolocation }) =>
                Geolocation.clearWatch({ id: watchId })
            );
        }
    };
}
