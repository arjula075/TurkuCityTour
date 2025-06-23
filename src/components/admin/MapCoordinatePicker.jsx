// components/admin/MapCoordinatePicker.js
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function ClickHandler({ onClick }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng);
        },
    });
    return null;
}

export default function MapCoordinatePicker({ initialPosition, onCancel, onSave }) {
    const [position, setPosition] = useState(initialPosition);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 max-w-xl w-full h-[500px]">
                <h2 className="text-xl font-semibold mb-2">Pick Location</h2>
                <MapContainer
                    center={position || [60.4518, 22.2666]} // fallback to Turku
                    zoom={13}
                    style={{ height: '350px', width: '100%' }}
                >
                    <TileLayer
                        url={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`}
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    {position && <Marker position={position} />}
                    <ClickHandler onClick={setPosition} />
                </MapContainer>

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(position)}
                        className="btn btn-primary"
                        disabled={!position}
                    >
                        Save Coordinates
                    </button>
                </div>
            </div>
        </div>
    );
}
