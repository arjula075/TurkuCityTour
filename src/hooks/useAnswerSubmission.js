export default function useAnswerSubmission({
                                                question,
                                                selectedAnswer,
                                                submitted,
                                                setSubmitted,
                                                isCorrect,
                                                setIsCorrect,
                                                onAnsweredCorrect,
                                            }) {
    const handleSubmit = async () => {
        if (!selectedAnswer || submitted) return;

        const answer = question.answers.find(ans => ans.id === selectedAnswer);
        const correct = answer?.is_correct ?? false;

        setIsCorrect(correct);
        setSubmitted(true);

        if (typeof onAnsweredCorrect === 'function') {
            await onAnsweredCorrect(correct);
        }
    };

    const reset = () => {
        setSubmitted(false);
        setIsCorrect(null);
    };

    return {
        submitted,
        isCorrect,
        handleSubmit,
        reset,
    };
}
