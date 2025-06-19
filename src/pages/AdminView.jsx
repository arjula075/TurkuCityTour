import React, { useEffect, useState } from 'react';
import {
    adminFetchHints,
    adminInsertHint,
    adminUpdateHint,
    adminDeleteHint,
    adminFetchQuestions,
    adminInsertQuestion,
    adminUpdateQuestion,
    adminDeleteQuestion,
    adminFetchLocations,
    adminUpdateLocation,
    adminDeleteLocation,
} from '../services/supabaseService';

import LocationEditor from '../components/admin/LocationEditor';
import HintEditor from '../components/admin/HintEditor';

export default function AdminView() {
    const [locations, setLocations] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [hints, setHints] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch locations and initialize selected
    useEffect(() => {
        async function loadLocations() {
            try {
                const locs = await adminFetchLocations();
                setLocations(locs);
                if (locs.length > 0) setSelectedLocationId(locs[0].id);
            } catch (e) {
                alert('Failed to load locations: ' + e.message);
            }
        }
        loadLocations();
    }, []);

    // Load hints and questions when location changes
    useEffect(() => {
        async function loadData() {
            if (!selectedLocationId) return;
            setLoading(true);
            try {
                const hintsData = await adminFetchHints();
                setHints(hintsData.filter(h => h.location_id === selectedLocationId));

                const questionsData = await adminFetchQuestions();
                setQuestions(questionsData.filter(q => q.location_id === selectedLocationId));
            } catch (e) {
                alert('Failed to load hints or questions: ' + e.message);
            }
            setLoading(false);
        }
        loadData();
    }, [selectedLocationId]);

    async function addHint() {
        if (!selectedLocationId) return alert('Select a location first');
        const newHint = { location_id: selectedLocationId, hint_text: '', hint_order: hints.length + 1 };
        try {
            const data = await adminInsertHint(newHint);
            setHints([...hints, ...data]);
        } catch (e) {
            alert('Failed to add hint: ' + e.message);
        }
    }

    function updateHintText(id, text) {
        setHints(hints.map(h => (h.id === id ? { ...h, hint_text: text } : h)));
    }

    async function saveHint(hint) {
        try {
            await adminUpdateHint(hint.id, { hint_text: hint.hint_text, hint_order: hint.hint_order });
            alert('Hint saved');
        } catch (e) {
            alert('Failed to save hint: ' + e.message);
        }
    }

    async function deleteHint(id) {
        if (!window.confirm('Delete this hint?')) return;
        try {
            await adminDeleteHint(id);
            setHints(hints.filter(h => h.id !== id));
        } catch (e) {
            alert('Failed to delete hint: ' + e.message);
        }
    }

    async function handleDeleteLocation(id) {
        if (!window.confirm('Are you sure you want to delete this location?')) return;

        try {
            await adminDeleteLocation(id);
            setLocations(prev => prev.filter(loc => loc.id !== id));

            // Reset selection if the deleted location was selected
            if (selectedLocationId === id) {
                const remaining = locations.filter(loc => loc.id !== id);
                setSelectedLocationId(remaining[0]?.id || null);
            }
        } catch (e) {
            alert('Failed to delete location: ' + e.message);
        }
    }

    async function updateLocationField(id, field, value) {
        // Update state immediately
        setLocations(prev =>
            prev.map(loc => (loc.id === id ? { ...loc, [field]: value } : loc))
        );

        // Persist to DB
        try {
            await adminUpdateLocation(id, { [field]: value });
        } catch (e) {
            alert(`Failed to update location: ${e.message}`);
        }
    }

    async function handleReorderLocations(updatedList) {
        try {
            // Update state
            setLocations(updatedList);

            // Persist order to DB
            await Promise.all(
                updatedList.map((loc, index) =>
                    adminUpdateLocation(loc.id, { display_order: index + 1 })
                )
            );
        } catch (e) {
            alert('Failed to reorder locations: ' + e.message);
        }
    }

    const selectedLocationName =
        locations.find(loc => loc.id === selectedLocationId)?.name || '(none selected)';


    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            {/* 🔧 Location Management Component */}
            <LocationEditor
                locations={locations}
                setLocations={setLocations}
                onDelete={handleDeleteLocation}
                onReorder={handleReorderLocations}
                updateLocationField={updateLocationField}
            />

            {/* 🔽 Select location to manage hints/questions */}
            <div className="mb-6 mt-10">
                <label htmlFor="location-select" className="block mb-2 font-semibold">
                    Select Location for Hints:
                </label>
                <select
                    id="location-select"
                    value={selectedLocationId || ''}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="input-field"
                >
                    {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                            {loc.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 🧩 Hints for selected location */}
            {Array.isArray(hints) && hints.length >= 0 && (
            <HintEditor
                hints={hints}
                updateHintText={updateHintText}
                saveHint={saveHint}
                deleteHint={deleteHint}
                addHint={addHint}
                onReorderHints={async (newList) => {
                    setHints(newList);
                    await Promise.all(
                        newList.map((hint, index) =>
                            adminUpdateHint(hint.id, { hint_order: index + 1 })
                        )
                    );
                }

            }
            />
            )}

            {/* TODO: Add question UI */}
        </div>
    );
}
