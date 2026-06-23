import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAnswerSubmission from './useAnswerSubmission';

vi.mock('../services/supabaseService', () => ({
    submitAnswer: vi.fn(),
}));

import { submitAnswer } from '../services/supabaseService';

const question = {
    id: 'q1',
    answers: [
        { id: 'a1', answer_text: 'Yes' },
        { id: 'a2', answer_text: 'No' },
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
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks a correct answer and calls onAnsweredCorrect', async () => {
        submitAnswer.mockResolvedValue({ is_correct: true });
        const { result, setSubmitted, setIsCorrect, onAnsweredCorrect } = setup();

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(submitAnswer).toHaveBeenCalledWith('q1', 'a1');
        expect(setIsCorrect).toHaveBeenCalledWith(true);
        expect(setSubmitted).toHaveBeenCalledWith(true);
        expect(onAnsweredCorrect).toHaveBeenCalledWith(true);
    });

    it('marks an incorrect answer', async () => {
        submitAnswer.mockResolvedValue({ is_correct: false });
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

        expect(submitAnswer).not.toHaveBeenCalled();
        expect(setSubmitted).not.toHaveBeenCalled();
    });

    it('does nothing when no answer is selected', async () => {
        const { result, setSubmitted } = setup({ selectedAnswer: null });

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(submitAnswer).not.toHaveBeenCalled();
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
