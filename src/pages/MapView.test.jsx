import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MapView from './MapView';
import { makeStore } from '../test-utils/renderWithProviders';
import { makeSupabaseFromMock, makeSupabaseTableMock } from '../test-utils/mockSupabase';
import { mockGame, mockLocations } from '../test-utils/fixtures';
import { AuthContext } from '../contexts/AuthContext';

const { mockNavigate, mockUseGeolocation, mapClickHandlerRef, geolocationState } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockUseGeolocation: vi.fn(),
    mapClickHandlerRef: { current: null },
    geolocationState: {
        current: { location: { lat: 60.4522438, lng: 22.268045 }, error: null },
    },
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../hooks/useGeolocation', () => ({
    default: (...args) => mockUseGeolocation(...args),
}));

vi.mock('../services/supabaseService', () => ({
    fetchLocationsForPlayer: vi.fn(),
    updateUserProgress: vi.fn().mockResolvedValue(undefined),
    clearUserProgress: vi.fn().mockResolvedValue(undefined),
    validateLocationArrival: vi.fn().mockResolvedValue({ arrived: false }),
    recordLocationGuess: vi.fn().mockResolvedValue({ accepted: true, hints_used: 5 }),
}));

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => null,
    Marker: () => null,
    useMapEvents: (handlers) => {
        mapClickHandlerRef.current = handlers?.click ?? null;
        return null;
    },
    useMap: () => ({
        panTo: vi.fn(),
        getZoom: vi.fn(() => 15),
    }),
}));

vi.mock('leaflet', () => ({
    default: {
        Icon: Object.assign(vi.fn(() => ({})), {
            Default: { mergeOptions: vi.fn() },
        }),
    },
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '' }));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '' }));

import {
    fetchLocationsForPlayer,
    updateUserProgress,
    validateLocationArrival,
    recordLocationGuess,
} from '../services/supabaseService';

function buildAuthValue(userProgress = []) {
    return {
        user: { id: 'user-1', email: 'player@example.com' },
        profile: { first_name: 'Test' },
        loading: false,
        supabase: {
            auth: {
                signOut: vi.fn().mockResolvedValue({ error: null }),
            },
            from: makeSupabaseFromMock({
                game_players: makeSupabaseTableMock({
                    data: [mockGame],
                    error: null,
                }),
                user_progress: makeSupabaseTableMock({
                    data: userProgress,
                    error: null,
                }),
            }),
        },
    };
}

function renderMapView({ userProgress = [], gameState = {} } = {}) {
    const authValue = buildAuthValue(userProgress);
    const store = makeStore({
        game: {
            availableGames: [mockGame],
            selectedGameId: 'game-1',
            gameActive: false,
            ...gameState,
        },
    });

    const ui = (
        <Provider store={store}>
            <AuthContext.Provider value={authValue}>
                <MemoryRouter initialEntries={['/map']}>
                    <MapView />
                </MemoryRouter>
            </AuthContext.Provider>
        </Provider>
    );

    const view = render(ui);

    return {
        store,
        authValue,
        ...view,
        rerenderMap: () =>
            view.rerender(
                <Provider store={store}>
                    <AuthContext.Provider value={authValue}>
                        <MemoryRouter initialEntries={['/map']}>
                            <MapView />
                        </MemoryRouter>
                    </AuthContext.Provider>
                </Provider>
            ),
    };
}

describe('MapView', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mapClickHandlerRef.current = null;
        geolocationState.current = {
            location: { lat: 60.4522438, lng: 22.268045 },
            error: null,
        };
        mockUseGeolocation.mockImplementation(() => geolocationState.current);
        fetchLocationsForPlayer.mockResolvedValue(mockLocations);
        vi.stubGlobal('alert', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('loads locations and shows the start game controls', async () => {
        renderMapView();

        expect(await screen.findByText(/welcome, test/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('starts the game and shows the first hint', async () => {
        const { store } = renderMapView();

        fireEvent.click(await screen.findByRole('button', { name: /start game/i }));

        await waitFor(() => {
            expect(store.getState().game.gameActive).toBe(true);
        });
        expect(screen.getByText('Look for tall spires')).toBeInTheDocument();
    });

    it('records a successful map guess and enters the walking phase', async () => {
        renderMapView();

        fireEvent.click(await screen.findByRole('button', { name: /start game/i }));
        await screen.findByText('Look for tall spires');

        mapClickHandlerRef.current?.({
            latlng: { lat: mockLocations[0].latitude, lng: mockLocations[0].longitude },
        });

        await waitFor(() => {
            expect(recordLocationGuess).toHaveBeenCalledWith(
                'loc-1',
                mockLocations[0].latitude,
                mockLocations[0].longitude,
                5,
                100
            );
        });
        expect(updateUserProgress).not.toHaveBeenCalled();
        expect(screen.getByText(/now move to the location/i)).toBeInTheDocument();
        expect(screen.getByText(/Distance to Turku Cathedral/i)).toBeInTheDocument();
    });

    it('shows the question when the player arrives within 50 meters', async () => {
        validateLocationArrival.mockResolvedValue({ arrived: true, distance_m: 5 });

        geolocationState.current = {
            location: { lat: 60.45, lng: 22.26 },
            error: null,
        };

        const { rerenderMap } = renderMapView();

        fireEvent.click(await screen.findByRole('button', { name: /start game/i }));
        await screen.findByText('Look for tall spires');

        mapClickHandlerRef.current?.({
            latlng: { lat: mockLocations[0].latitude, lng: mockLocations[0].longitude },
        });

        await screen.findByText(/now move to the location/i);

        geolocationState.current = {
            location: {
                lat: mockLocations[0].latitude,
                lng: mockLocations[0].longitude,
            },
            error: null,
        };

        rerenderMap();

        expect(await screen.findByText('Cathedral history')).toBeInTheDocument();
    });

    it('resumes a saved walking phase from user progress', async () => {
        const { store } = renderMapView({
            userProgress: [
                {
                    location_id: 'loc-1',
                    answered_correctly: null,
                },
            ],
        });

        await screen.findByText(/now move to the location/i);

        await waitFor(() => {
            expect(store.getState().game.gameActive).toBe(true);
        });
    });
});
