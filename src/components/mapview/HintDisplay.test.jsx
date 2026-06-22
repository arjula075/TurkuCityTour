import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import HintDisplay from './HintDisplay';

describe('HintDisplay', () => {
    const location = {
        hints: [
            { id: 'h1', hint_text: 'First hint', hint_order: 1 },
            { id: 'h2', hint_text: 'Second hint', hint_order: 2 },
        ],
    };

    it('shows the current hint text and score', () => {
        render(
            <HintDisplay
                location={location}
                hintIndex={0}
                setHintIndex={vi.fn()}
                score={3}
                guessed={false}
                onGiveUp={vi.fn()}
            />
        );

        expect(screen.getByText('First hint')).toBeInTheDocument();
        expect(screen.getByText(/Score: 3/)).toBeInTheDocument();
    });

    it('advances to the next hint', () => {
        const setHintIndex = vi.fn();

        render(
            <HintDisplay
                location={location}
                hintIndex={0}
                setHintIndex={setHintIndex}
                score={0}
                guessed={false}
                onGiveUp={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /next hint/i }));
        expect(setHintIndex).toHaveBeenCalled();
    });

    it('requires confirmation before giving up', () => {
        const onGiveUp = vi.fn();

        render(
            <HintDisplay
                location={location}
                hintIndex={1}
                setHintIndex={vi.fn()}
                score={0}
                guessed={false}
                onGiveUp={onGiveUp}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /^give up$/i }));
        expect(onGiveUp).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /are you sure/i }));
        expect(onGiveUp).toHaveBeenCalled();
    });
});
