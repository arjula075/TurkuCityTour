import React from 'react';
import { vi } from 'vitest';

export function installLeafletMocks() {
    vi.mock('react-leaflet', () => ({
        MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
        TileLayer: () => <div data-testid="tile-layer" />,
        Marker: ({ position }) => (
            <div data-testid="map-marker" data-lat={position?.[0]} data-lng={position?.[1]} />
        ),
        useMap: () => ({
            setView: vi.fn(),
            panTo: vi.fn(),
            getZoom: vi.fn(() => 15),
        }),
        useMapEvents: () => null,
    }));

    vi.mock('leaflet', () => ({
        default: {
            Icon: {
                Default: { mergeOptions: vi.fn() },
            },
        },
    }));

    vi.mock('leaflet/dist/leaflet.css', () => ({}));
    vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '' }));
    vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '' }));
    vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '' }));
}
