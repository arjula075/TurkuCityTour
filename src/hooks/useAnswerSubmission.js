import { submitAnswer } from '../services/supabaseService';

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
        if (!selectedAnswer || submitted || !question?.id) return;

        try {
            const result = await submitAnswer(question.id, selectedAnswer);
            const correct = Boolean(result?.is_correct);

            setIsCorrect(correct);
            setSubmitted(true);

            if (typeof onAnsweredCorrect === 'function') {
                await onAnsweredCorrect(correct);
            }
        } catch (err) {
            console.error('Answer submission failed:', err);
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
