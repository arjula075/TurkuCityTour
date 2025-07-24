import React, { useState, useRef } from 'react';
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
    const inputRefs = useRef({});

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = hints.findIndex((h) => h.id === active.id);
            const newIndex = hints.findIndex((h) => h.id === over.id);
            const newList = arrayMove(hints, oldIndex, newIndex);
            onReorderHints(newList);
        }
    };

    const flashSuccess = (id) => {
        const input = inputRefs.current[id];
        if (input) {
            input.classList.add('saved');
            setTimeout(() => input.classList.remove('saved'), 800);
        }
    };

    const handleInputChange = async (hintId, newText) => {
        updateHintText(hintId, newText);
        try {
            await saveHint({ id: hintId, hint_text: newText });
            flashSuccess(hintId);
        } catch (e) {
            console.error('Failed to auto-save hint:', e);
        }
    };

    const handleTyping = async (e, hint, index) => {
        const text = e.target.value;
        const isLast = index === hints.length - 1;
        const lastIsFilled = hints[hints.length - 1]?.hint_text?.trim() !== '';

        if (isLast && lastIsFilled) {
            await addHint();
        }

        handleInputChange(hint.id, text);
    };

    return (
        <div className="mb-4 border rounded shadow-sm bg-white">
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full px-4 py-3 text-left bg-gray-300 hover:bg-gray-400 flex justify-between items-center"
            >
                <span className="text-xl font-semibold">Hints for {locationName || 'this location'}</span>
                <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="p-4 space-y-3 border-t">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={hints.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                            {hints.map((hint, index) => (
                                <SortableItem key={hint.id} id={hint.id}>
                                    <div className="mb-3 border p-3 rounded shadow-sm flex gap-3 items-center bg-white">
                                        <input
                                            ref={(el) => (inputRefs.current[hint.id] = el)}
                                            className="input-admin flex-grow"
                                            type="text"
                                            value={hint.hint_text}
                                            onChange={(e) => handleTyping(e, hint, index)}
                                            placeholder="Hint text"
                                        />
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
