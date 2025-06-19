import React from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';

import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';

import SortableItem from './SortableItem';

export default function LocationEditor({ locations, setLocations, onDelete, onReorder, updateLocationField }) {
    if (!locations) return <p>Loading locations...</p>;

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = locations.findIndex((loc) => loc.id === active.id);
            const newIndex = locations.findIndex((loc) => loc.id === over.id);
            const newList = arrayMove(locations, oldIndex, newIndex);

            setLocations(newList);
            onReorder(newList); // persist order in AdminView
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Manage Locations</h2>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={locations.map((loc) => loc.id)} strategy={verticalListSortingStrategy}>
                    {locations.map((loc) => (
                        <SortableItem key={loc.id} id={loc.id}>
                            <div className="p-4 border rounded shadow-sm space-y-3 bg-white">
                                <input
                                    type="text"
                                    className="input-field w-full"
                                    value={loc.name ?? ''}
                                    placeholder="Location name"
                                    onChange={(e) => updateLocationField(loc.id, 'name', e.target.value)}
                                />
                                <textarea
                                    className="input-field w-full"
                                    value={loc.description ?? ''}
                                    placeholder="Location description"
                                    onChange={(e) => updateLocationField(loc.id, 'description', e.target.value)}
                                />
                                <input
                                    type="number"
                                    step="any"
                                    className="input-field w-full"
                                    value={loc.latitude ?? ''}
                                    placeholder="Latitude"
                                    onChange={(e) =>
                                        updateLocationField(loc.id, 'latitude', e.target.value === '' ? null : parseFloat(e.target.value))
                                    }
                                />
                                <input
                                    type="number"
                                    step="any"
                                    className="input-field w-full"
                                    value={loc.longitude ?? ''}
                                    placeholder="Longitude"
                                    onChange={(e) =>
                                        updateLocationField(loc.id, 'longitude', e.target.value === '' ? null : parseFloat(e.target.value))
                                    }
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => onDelete(loc.id)}
                                        className="btn-pill-sm bg-red-500 text-white"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
}