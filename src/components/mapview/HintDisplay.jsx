import React, { useState } from 'react';

export default function HintDisplay({ location, hintIndex, setHintIndex, score, guessed, onGiveUp }) {
    const hints = location?.hints || [];
    const maxHints = hints.length;
    const [confirmGiveUp, setConfirmGiveUp] = useState(false);

    const handleGiveUpClick = () => {
        if (!confirmGiveUp) {
            setConfirmGiveUp(true);
        } else {
            onGiveUp(); // call parent to handle giving up
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow-md space-y-3">
            <p className="font-semibold text-4xl">Hint:</p>
            <p className="text-4xl">{hints[hintIndex]?.hint_text ?? 'No more hints'}</p>

            {!guessed && hintIndex < maxHints - 1 && (
                <button className="btn-pill2" onClick={() => setHintIndex((i) => i + 1)}>
                    Next Hint
                </button>
            )}

            {!guessed && hintIndex >= maxHints - 1 && (
                <button className="btn-pill2" onClick={handleGiveUpClick}>
                    {confirmGiveUp ? 'Are you sure? Click to confirm' : 'Give up'}
                </button>
            )}

            <p className="text-sm mt-2 text-gray-500">Score: {score}</p>
        </div>
    );
}
