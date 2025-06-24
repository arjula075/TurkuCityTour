import React, { useState } from 'react';
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

export default function HintEditor({
                                       hints,
                                       locationName = '',
                                       updateHintText,
                                       saveHint,
                                       deleteHint,
                                       addHint,
                                       onReorderHints,
                                   }) {
    const sensors = useSensors(useSensor(PointerSensor));
    const [isOpen, setIsOpen] = useState(false);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = hints.findIndex((h) => h.id === active.id);
            const newIndex = hints.findIndex((h) => h.id === over.id);
            const newList = arrayMove(hints, oldIndex, newIndex);
            onReorderHints(newList);
        }
    };

    return (
        <div className="mb-4 border rounded shadow-sm bg-white">
            {/* Accordion Header */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full px-4 py-3 text-left bg-gray-300 hover:bg-gray-400 flex justify-between items-center"
            >
                <span className="text-xl font-semibold">Hints for {locationName || 'this location'}</span>
                <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-4 space-y-3 border-t">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={hints.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                            {hints.map((hint) => (
                                <SortableItem key={hint.id} id={hint.id}>
                                    <div className="mb-3 border p-3 rounded shadow-sm flex gap-3 items-center bg-white">
                                        <input
                                            className="input-admin flex-grow"
                                            type="text"
                                            value={hint.hint_text}
                                            onChange={(e) => updateHintText(hint.id, e.target.value)}
                                            placeholder="Hint text"
                                        />
                                        <button
                                            onClick={() => saveHint(hint)}
                                            className="btn-pill-sm text-white px-3 py-1"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => deleteHint(hint.id)}
                                            className="btn-pill-sm-delete"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </SortableItem>
                            ))}
                        </SortableContext>
                    </DndContext>

                    <div className="pt-2">
                        <button
                            onClick={addHint}
                            className="btn-pill-sm text-white px-3 py-1"
                        >
                            + Add Hint
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
