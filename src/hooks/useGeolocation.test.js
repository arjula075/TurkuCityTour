import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useGeolocation from './useGeolocation';
import { TURKU_FALLBACK } from '../utils/geo';
import {
    installGeolocationMock,
    removeGeolocationMock,
} from '../test-utils/mockGeolocation';

describe('useGeolocation', () => {
    afterEach(() => {
        removeGeolocationMock();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('uses Turku fallback when geolocation is unavailable', async () => {
        vi.stubGlobal('navigator', {});

        const { result } = renderHook(() => useGeolocation());

        await waitFor(() => {
            expect(result.current.location).toEqual(TURKU_FALLBACK);
        });
        expect(result.current.error).toBe('Geolocation not supported');
    });

    it('updates location from watchPosition callbacks', async () => {
        const geo = installGeolocationMock({ lat: 60.45, lng: 22.27 });

        const { result } = renderHook(() => useGeolocation());

        await waitFor(() => {
            expect(result.current.location).toEqual({ lat: 60.45, lng: 22.27 });
        });

        act(() => geo.emitPosition(60.46, 22.28));

        await waitFor(() => {
            expect(result.current.location).toEqual({ lat: 60.46, lng: 22.28 });
        });
    });

    it('falls back when first fix fails and no prior location exists', async () => {
        const geo = installGeolocationMock();
        geo.watchPosition.mockImplementation((_success, error) => {
            error({ message: 'denied' });
            return 1;
        });

        const { result } = renderHook(() => useGeolocation());

        await waitFor(() => {
            expect(result.current.location).toEqual(TURKU_FALLBACK);
        });
        expect(result.current.error).toBe('denied');
    });

    it('registers polling interval when pollWhileActive is true', async () => {
        const setIntervalSpy = vi.spyOn(window, 'setInterval');
        installGeolocationMock({ lat: 60.45, lng: 22.27 });

        const { unmount } = renderHook(() => useGeolocation({ pollWhileActive: true }));

        await waitFor(() => {
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
        });

        unmount();
        setIntervalSpy.mockRestore();
    });

    it('clears watch on unmount', async () => {
        const geo = installGeolocationMock({ lat: 60.45, lng: 22.27 });

        const { unmount } = renderHook(() => useGeolocation());

        await waitFor(() => expect(geo.watchPosition).toHaveBeenCalled());
        unmount();

        expect(geo.clearWatch).toHaveBeenCalled();
    });
});
