import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAnswerSubmission from './useAnswerSubmission';

const question = {
    id: 'q1',
    answers: [
        { id: 'a1', answer_text: 'Yes', is_correct: true },
        { id: 'a2', answer_text: 'No', is_correct: false },
    ],
};

function setup(overrides = {}) {
    const setSubmitted = vi.fn();
    const setIsCorrect = vi.fn();
    const onAnsweredCorrect = vi.fn().mockResolvedValue(undefined);

    const props = {
        question,
        selectedAnswer: 'a1',
        submitted: false,
        setSubmitted,
        isCorrect: null,
        setIsCorrect,
        onAnsweredCorrect,
        ...overrides,
    };

    const hook = renderHook(() => useAnswerSubmission(props));
    return { ...hook, setSubmitted, setIsCorrect, onAnsweredCorrect, props };
}

describe('useAnswerSubmission', () => {
    it('marks a correct answer and calls onAnsweredCorrect', async () => {
        const { result, setSubmitted, setIsCorrect, onAnsweredCorrect } = setup();

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(setIsCorrect).toHaveBeenCalledWith(true);
        expect(setSubmitted).toHaveBeenCalledWith(true);
        expect(onAnsweredCorrect).toHaveBeenCalledWith(true);
    });

    it('marks an incorrect answer', async () => {
        const { result, setIsCorrect } = setup({ selectedAnswer: 'a2' });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(setIsCorrect).toHaveBeenCalledWith(false);
    });

    it('does nothing when already submitted', async () => {
        const { result, setSubmitted } = setup({ submitted: true });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(setSubmitted).not.toHaveBeenCalled();
    });

    it('does nothing when no answer is selected', async () => {
        const { result, setSubmitted } = setup({ selectedAnswer: null });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(setSubmitted).not.toHaveBeenCalled();
    });

    it('resets submission state', () => {
        const { result, setSubmitted, setIsCorrect } = setup({ submitted: true });

        act(() => {
            result.current.reset();
        });

        expect(setSubmitted).toHaveBeenCalledWith(false);
        expect(setIsCorrect).toHaveBeenCalledWith(null);
    });
});
