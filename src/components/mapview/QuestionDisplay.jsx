// src/components/mapview/QuestionDisplay.jsx
import React from 'react';

export default function QuestionDisplay({
                                            question,
                                            selectedAnswer,
                                            setSelectedAnswer,
                                            onAnsweredCorrect
                                        }) {
    return (
        <div className="mt-6">
            <h3 className="text-4xl font-bold mb-4">{question?.question_text}</h3>
            <div className="grid grid-cols-2 gap-4">
                {question?.answers?.map((ans) => (
                    <button
                        key={ans.id}
                        className={`btn-pill2 ${selectedAnswer ? 'opacity-50' : ''}`}
                        onClick={async () => {
                            if (selectedAnswer) return;
                            setSelectedAnswer(ans.id);
                            if (ans.is_correct) {
                                await onAnsweredCorrect();
                            }
                        }}
                    >
                        {ans.answer_text}
                    </button>
                ))}
            </div>
        </div>
    );
}
