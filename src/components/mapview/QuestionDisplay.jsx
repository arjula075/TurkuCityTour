import React, { useEffect } from 'react';
import useAnswerSubmission from '../../hooks/useAnswerSubmission';

export default function QuestionDisplay({
                                            question,
                                            selectedAnswer,
                                            setSelectedAnswer,
                                            submitted,
                                            setSubmitted,
                                            isCorrect,
                                            setIsCorrect,
                                            onAnsweredCorrect,
                                            onNextLocation,
                                            buttonDisabled,
                                            setButtonDisabled,
                                        }) {
    const { handleSubmit } = useAnswerSubmission({
        question,
        selectedAnswer,
        submitted,
        setSubmitted,
        isCorrect,
        setIsCorrect,
        onAnsweredCorrect,
    });

    useEffect(() => {
        setSubmitted(false);
        setIsCorrect(null);
        setButtonDisabled(false); // Reset when new question is shown
    }, [question?.id, setSubmitted, setIsCorrect, setButtonDisabled]);

    return (
        <div className="mt-6">
            <h3 className="text-6xl font-bold mb-4">{question?.question_header}</h3>
            <p className="whitespace-pre-line text-4xl mb-6">{question?.question_body}</p>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                {question?.answers?.map((ans) => (
                    <label key={ans.id} className="flex items-center space-x-3 text-5xl">
                        <input
                            type="radio"
                            name="answer"
                            value={ans.id}
                            disabled={submitted}
                            checked={selectedAnswer === ans.id}
                            onChange={() => setSelectedAnswer(ans.id)}
                            className="form-radio text-gray-600 text-6xl"
                        />
                        <span className="bg-gray-100 block w-full">{ans.answer_text}</span>
                    </label>
                ))}

                {!submitted ? (
                    <button
                        type="button"
                        className="btn-pill2 mt-4"
                        onClick={handleSubmit}
                        disabled={!selectedAnswer}
                    >
                        Submit Answer
                    </button>
                ) : (
                    <>
                        <p className={`mt-4 text-3xl font-semibold ${
                            isCorrect === true ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {isCorrect === true ? '✅ Correct!' : '❌ Sorry, that is incorrect.'}
                        </p>

                        <button
                            type="button"
                            className="btn-pill2 mt-6"
                            onClick={() => {
                                setButtonDisabled(true);
                                onNextLocation();
                            }}
                            disabled={buttonDisabled}
                        >
                            Next Location
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
