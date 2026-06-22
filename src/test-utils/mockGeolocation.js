import { vi } from 'vitest';

export function createGeolocationMock(initialPosition = null) {
    let watchId = 0;
    const watchers = new Map();

    const clearWatch = vi.fn((id) => {
        watchers.delete(id);
    });

    const watchPosition = vi.fn((success, error, options) => {
        const id = ++watchId;
        watchers.set(id, { success, error, options });

        if (initialPosition) {
            success({
                coords: {
                    latitude: initialPosition.lat,
                    longitude: initialPosition.lng,
                    accuracy: 5,
                },
            });
        }

        return id;
    });

    const getCurrentPosition = vi.fn((success, error, options) => {
        if (initialPosition) {
            success({
                coords: {
                    latitude: initialPosition.lat,
                    longitude: initialPosition.lng,
                    accuracy: 5,
                },
            });
        } else if (error) {
            error({ code: 2, message: 'Position unavailable' });
        }
    });

    const emitPosition = (lat, lng) => {
        const payload = {
            coords: { latitude: lat, longitude: lng, accuracy: 5 },
        };
        watchers.forEach(({ success }) => success(payload));
    };

    const emitError = (message = 'Geolocation error') => {
        const payload = { code: 2, message };
        watchers.forEach(({ error }) => error?.(payload));
    };

    return {
        clearWatch,
        watchPosition,
        getCurrentPosition,
        emitPosition,
        emitError,
        watchers,
    };
}

export function installGeolocationMock(initialPosition = null) {
    const mock = createGeolocationMock(initialPosition);
    vi.stubGlobal('navigator', {
        ...navigator,
        geolocation: mock,
    });
    return mock;
}

export function removeGeolocationMock() {
    vi.unstubAllGlobals();
}
