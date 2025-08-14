import React, { useState } from 'react';

export default function QuestionEditor({
                                           questions = [],
                                           locationName = '',
                                           updateQuestionText,
                                           updateCorrectAnswer,
                                           saveQuestion,
                                           deleteQuestion,
                                           addQuestion,
                                           updateAnswerText,
                                           toggleCorrectAnswer,
                                           saveAnswer,
                                           deleteAnswer,
                                           addAnswer,
                                           savedAnswerIds = new Set(),
                                       }) {
    const [isOpen, setIsOpen] = useState(false);

    const flashSavedStyle = (id) => {
        setSavedAnswerIds(prev => new Set(prev).add(id));
        setTimeout(() => {
            setSavedAnswerIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 600);
    };

    const handleAnswerChange = (questionId, answerId, newText) => {
        updateAnswerText(questionId, answerId, newText);

        // Optional: debounce this if needed to prevent spamming DB
        const answer = questions
            .find(q => q.id === questionId)
            ?.answers?.find(a => a.id === answerId);

        if (!answer) return;

        saveAnswer(questionId, {
            ...answer,
            answer_text: newText,
        });
    };


    return (
        <div className="mt-10 border rounded shadow-sm bg-white">
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full px-4 py-3 text-left bg-gray-300 hover:bg-gray-400 flex justify-between items-center"
            >
                <span className="text-xl font-semibold">Questions for {locationName || 'this location'}</span>
                <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="p-4 space-y-6 border-t">
                    {questions.map((q) => (
                        <div key={q.id} className="border p-4 rounded shadow-sm bg-white flex flex-col gap-4">
                            <label className="text-sm font-medium" htmlFor={`header-${q.id}`}>Question Header</label>
                            <input
                                id={`header-${q.id}`}
                                className="input-admin"
                                type="text"
                                value={q.question_header || ''}
                                onChange={(e) => updateQuestionText(q.id, 'question_header', e.target.value)}
                                placeholder="Question header"
                            />

                            <label className="text-sm font-medium" htmlFor={`body-${q.id}`}>Question Body</label>
                            <input
                                id={`body-${q.id}`}
                                className="input-admin"
                                type="text"
                                value={q.question_body || ''}
                                onChange={(e) => updateQuestionText(q.id, 'question_body', e.target.value)}
                                placeholder="Question body"
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => saveQuestion(q)}
                                    className="btn-pill-sm bg-slate-500 text-white px-3 py-1"
                                >
                                    Save Question
                                </button>
                                <button
                                    onClick={() => deleteQuestion(q.id)}
                                    className="btn-pill-sm-delete"
                                >
                                    Delete Question
                                </button>
                            </div>

                            {/* Answers */}
                            {/* Only show answers if the question is saved */}
                            {!q.id?.toString().startsWith('new') && (
                                <div className="ml-2">
                                    <h3 className="font-semibold text-md">Answers</h3>
                                    {q.answers?.map((a) => (
                                        <div key={a.id} className="flex items-center gap-2 my-2">
                                            <input
                                                className={`input-admin flex-grow ${savedAnswerIds.has(a.id) ? 'saved' : ''}`}
                                                type="text"
                                                value={a.answer_text}
                                                onChange={(e) => handleAnswerChange(q.id, a.id, e.target.value)}
                                                placeholder="Answer text"
                                            />

                                            <label className="flex items-center gap-1 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={a.is_correct}
                                                    onChange={() =>
                                                        toggleCorrectAnswer(q.id, a.id)
                                                    }
                                                />
                                                Correct
                                            </label>

                                            <button
                                                onClick={() => deleteAnswer(q.id, a.id)}
                                                className="btn-pill-sm-delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => addAnswer(q.id)}
                                        className="btn-pill-sm"
                                    >
                                        + Add Answer
                                    </button>
                                </div>
                            )}

                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="btn-pill-sm"
                    >
                        + Add Question
                    </button>
                </div>
            )}
        </div>
    );
}
