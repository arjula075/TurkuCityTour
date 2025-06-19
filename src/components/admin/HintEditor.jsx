import React from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';

export default function HintEditor({ hints, updateHintText, saveHint, deleteHint, addHint, onReorderHints,  }) {
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = hints.findIndex((h) => h.id === active.id);
            const newIndex = hints.findIndex((h) => h.id === over.id);
            const newList = arrayMove(hints, oldIndex, newIndex);

            onReorderHints(newList); // pass reordered list up
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Hints</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={hints.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                    {hints.map((hint) => (
                        <SortableItem key={hint.id} id={hint.id}>
                            <div className="mb-3 border p-3 rounded shadow-sm flex gap-3 items-center bg-white">
                                <input
                                    className="input-field flex-grow"
                                    type="text"
                                    value={hint.hint_text}
                                    onChange={(e) => updateHintText(hint.id, e.target.value)}
                                    placeholder="Hint text"
                                />
                                <button
                                    onClick={() => saveHint(hint)}
                                    className="btn-pill-sm bg-blue-500 text-white px-3 py-1"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => deleteHint(hint.id)}
                                    className="btn-pill-sm bg-red-500 text-white px-3 py-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>
            {/* 🔼 Add Hint Button */}
            <div className="mt-4">
                <button
                    onClick={addHint}
                    className="btn-pill-sm bg-blue-500 text-white px-3 py-1"
                >
                    + Add Hint
                </button>
            </div>
        </div>

    );
}
