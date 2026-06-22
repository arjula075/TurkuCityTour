import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import QuestionDisplay from './QuestionDisplay';

function QuestionHarness({ question, onAnsweredCorrect = vi.fn(), onNextLocation = vi.fn() }) {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [buttonDisabled, setButtonDisabled] = useState(false);

    return (
        <QuestionDisplay
            question={question}
            selectedAnswer={selectedAnswer}
            setSelectedAnswer={setSelectedAnswer}
            submitted={submitted}
            setSubmitted={setSubmitted}
            isCorrect={isCorrect}
            setIsCorrect={setIsCorrect}
            buttonDisabled={buttonDisabled}
            setButtonDisabled={setButtonDisabled}
            onAnsweredCorrect={onAnsweredCorrect}
            onNextLocation={onNextLocation}
        />
    );
}

const question = {
    id: 'q1',
    question_header: 'Cathedral history',
    question_body: 'When was it built?',
    answers: [
        { id: 'a1', answer_text: '1300', is_correct: true },
        { id: 'a2', answer_text: '1900', is_correct: false },
    ],
};

describe('QuestionDisplay', () => {
    it('renders question text and answer choices', () => {
        render(<QuestionHarness question={question} />);

        expect(screen.getByText('Cathedral history')).toBeInTheDocument();
        expect(screen.getByText('When was it built?')).toBeInTheDocument();
        expect(screen.getByLabelText('1300')).toBeInTheDocument();
        expect(screen.getByLabelText('1900')).toBeInTheDocument();
    });

    it('submits a correct answer and shows feedback', async () => {
        const onAnsweredCorrect = vi.fn().mockResolvedValue(undefined);

        render(
            <QuestionHarness question={question} onAnsweredCorrect={onAnsweredCorrect} />
        );

        fireEvent.click(screen.getByLabelText('1300'));
        fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));

        await waitFor(() => {
            expect(screen.getByText(/correct/i)).toBeInTheDocument();
        });
        expect(onAnsweredCorrect).toHaveBeenCalledWith(true);
    });

    it('submits an incorrect answer', async () => {
        render(<QuestionHarness question={question} />);

        fireEvent.click(screen.getByLabelText('1900'));
        fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));

        await waitFor(() => {
            expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
        });
    });

    it('calls onNextLocation after answering', async () => {
        const onNextLocation = vi.fn();

        render(
            <QuestionHarness question={question} onNextLocation={onNextLocation} />
        );

        fireEvent.click(screen.getByLabelText('1300'));
        fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /next location/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /next location/i }));
        expect(onNextLocation).toHaveBeenCalled();
    });
});
