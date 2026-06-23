import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
    adminGames: {
        fetch: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    adminLocations: {
        fetchByGame: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    adminHints: {
        fetchByLocation: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    fetchQuestionsAndAnswers: vi.fn(),
}));

vi.mock('./HintEditor.jsx', () => ({
    default: ({ locationName }) => <div data-testid="hint-editor">{locationName}</div>,
}));

vi.mock('./QuestionEditor.jsx', () => ({
    default: () => <div data-testid="question-editor" />,
}));

vi.mock('./GameUserAssignment.jsx', () => ({
    default: () => <div data-testid="game-user-assignment" />,
}));

vi.mock('./MapCoordinatePicker.jsx', () => ({
    default: () => null,
}));

vi.mock('../../services/supabaseService', () => ({
    adminGames: mocks.adminGames,
    adminLocations: mocks.adminLocations,
    adminHints: mocks.adminHints,
    adminQuestions: {},
    adminAnswers: {},
    fetchQuestionsAndAnswers: mocks.fetchQuestionsAndAnswers,
}));

import GameAdminTab from './GameAdminTab.jsx';

describe('GameAdminTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.adminGames.fetch.mockResolvedValue([{ id: 'game-1', name: 'Turku Tour' }]);
        mocks.adminLocations.fetchByGame.mockResolvedValue([
            { id: 'loc-1', name: 'Cathedral', display_order: 1 },
        ]);
        mocks.adminHints.fetchByLocation.mockResolvedValue([
            { id: 'h1', hint_text: 'Look up', hint_order: 1 },
        ]);
        mocks.fetchQuestionsAndAnswers.mockResolvedValue([
            { id: 'q1', question_header: 'History', answers: [] },
        ]);
    });

    it('prompts for game selection before showing location tools', () => {
        render(<GameAdminTab />);

        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
        expect(
            screen.getByText(/Please select a game to begin managing locations/i)
        ).toBeInTheDocument();
    });

    it('loads locations and editors after a game is selected', async () => {
        render(<GameAdminTab />);

        await waitFor(() => {
            expect(mocks.adminGames.fetch).toHaveBeenCalled();
        });

        const gameSelect = await screen.findByRole('combobox');
        fireEvent.change(gameSelect, {
            target: { value: 'game-1' },
        });

        await waitFor(() => {
            expect(mocks.adminLocations.fetchByGame).toHaveBeenCalledWith('game-1');
        });

        expect(screen.getByTestId('hint-editor')).toHaveTextContent('Cathedral');
        expect(screen.getByRole('button', { name: /Cathedral/i })).toBeInTheDocument();
        expect(screen.getByTestId('question-editor')).toBeInTheDocument();
        expect(screen.getByTestId('game-user-assignment')).toBeInTheDocument();
    });
});
