// src/components/mapview/TrainingPrompt.jsx
import React from 'react';

export default function TrainingPrompt({ name }) {
    return (
        <div className="text-4xl font-semibold mt-4">
            <strong>Training Mode:</strong> Click on <em>{name}</em>
        </div>
    );
}
