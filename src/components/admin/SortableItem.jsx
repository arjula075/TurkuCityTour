import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react'; // optional icon

export function SortableItem({ id, children }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {/* 👇 Drag handle so we don’t block inputs */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 cursor-grab text-gray-400"
                title="Drag to reorder"
            >
                <GripVertical />
            </div>
            {children}
        </div>
    );
}

export default SortableItem;
