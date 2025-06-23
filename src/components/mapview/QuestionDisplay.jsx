import React, { useState } from 'react';

export default function QuestionDisplay({
                                            question,
                                            selectedAnswer,
                                            setSelectedAnswer,
                                            onAnsweredCorrect
                                        }) {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!selectedAnswer || submitted) return;
        setSubmitted(true);

        const answer = question.answers.find(ans => ans.id === selectedAnswer);
        if (answer?.is_correct) {
            await onAnsweredCorrect();
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-4xl font-bold mb-4">{question?.question_text}</h3>

            <form className="space-y-4">
                {question?.answers?.map((ans) => (
                    <label key={ans.id} className="flex items-center space-x-3">
                        <input
                            type="radio"
                            name="answer"
                            value={ans.id}
                            disabled={submitted}
                            checked={selectedAnswer === ans.id}
                            onChange={() => setSelectedAnswer(ans.id)}
                            className="form-radio text-blue-600"
                        />
                        <span>{ans.answer_text}</span>
                    </label>
                ))}

                <button
                    type="button"
                    className="btn-pill2 mt-4"
                    onClick={handleSubmit}
                    disabled={submitted || !selectedAnswer}
                >
                    Submit Answer
                </button>
            </form>
        </div>
    );
}
