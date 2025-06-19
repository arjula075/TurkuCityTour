import React from 'react';

export default function QuestionEditor({
                                           questions = [],
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
                                       }) {
    return (
        <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">Questions</h2>

            {questions.map((q) => (
                <div
                    key={q.id}
                    className="mb-5 border p-4 rounded shadow-sm bg-white flex flex-col gap-4"
                >
                    {/* Question inputs */}
                    <input
                        className="input-field"
                        type="text"
                        value={q.question_text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        placeholder="Question text"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={() => saveQuestion(q)}
                            className="btn-pill-sm bg-blue-500 text-white px-3 py-1"
                        >
                            Save Question
                        </button>
                        <button
                            onClick={() => deleteQuestion(q.id)}
                            className="btn-pill-sm bg-red-500 text-white px-3 py-1"
                        >
                            Delete Question
                        </button>
                    </div>

                    {/* Answers */}
                    <div className="ml-2">
                        <h3 className="font-semibold text-md">Answers</h3>
                        {q.answers?.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center gap-2 my-2"
                            >
                                <input
                                    className="input-field flex-grow"
                                    type="text"
                                    value={a.answer_text}
                                    onChange={(e) =>
                                        updateAnswerText(q.id, a.id, e.target.value)
                                    }
                                    placeholder="Answer text"
                                />
                                <label className="flex items-center gap-1 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={a.is_correct}
                                        onChange={() => toggleCorrectAnswer(q.id, a.id)}
                                    />
                                    Correct
                                </label>
                                <button
                                    onClick={() => saveAnswer(q.id, a)}
                                    className="btn-pill-sm bg-blue-500 text-white px-2 py-1"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => deleteAnswer(q.id, a.id)}
                                    className="btn-pill-sm bg-red-500 text-white px-2 py-1"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => addAnswer(q.id)}
                            className="btn-pill-sm text-white px-2 py-1"
                        >
                            + Add Answer
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={addQuestion}
                className="btn-pill-sm text-white px-2 py-1"
            >
                + Add Question
            </button>
        </div>
    );
}
