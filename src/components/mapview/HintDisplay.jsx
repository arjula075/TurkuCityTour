// src/components/mapview/HintDisplay.jsx
import React from 'react';

export default function HintDisplay({ location, hintIndex, setHintIndex, score, guessed }) {
    const hints = location?.hints || [];
    const maxHints = hints.length;

    return (
        <div className="bg-white p-4 rounded shadow-md space-y-3">
            <p className="font-semibold">Hint:</p>
            <p>{hints[hintIndex]?.hint_text ?? 'No more hints'}</p>
            {!guessed && hintIndex < maxHints - 1 && (
                <button className="btn bg-gray-300" onClick={() => setHintIndex((i) => i + 1)}>
                    Next Hint
                </button>
            )}
            <p className="text-sm mt-2 text-gray-500">Score: {score}</p>
        </div>
    );
}
