export const mockGame = {
    game_id: 'game-1',
    games: { name: 'Turku Tour' },
};

export const mockLocations = [
    {
        id: 'loc-1',
        name: 'Turku Cathedral',
        latitude: 60.452324,
        longitude: 22.27824,
        display_order: 1,
        hints: [
            { id: 'h1', hint_text: 'Look for tall spires', hint_order: 1 },
            { id: 'h2', hint_text: 'Near the river', hint_order: 2 },
        ],
        questions: [
            {
                id: 'q1',
                question_header: 'Cathedral history',
                question_body: 'When was it consecrated?',
                answers: [
                    { id: 'a1', answer_text: '1300', is_correct: true },
                    { id: 'a2', answer_text: '1900', is_correct: false },
                ],
            },
        ],
    },
    {
        id: 'loc-2',
        name: 'Market Square',
        latitude: 60.4515,
        longitude: 22.2669,
        display_order: 2,
        hints: [{ id: 'h3', hint_text: 'Busy square', hint_order: 1 }],
        questions: [
            {
                id: 'q2',
                question_header: 'Market trivia',
                question_body: 'What is sold here?',
                answers: [
                    { id: 'a3', answer_text: 'Food', is_correct: true },
                    { id: 'a4', answer_text: 'Cars', is_correct: false },
                ],
            },
        ],
    },
];
