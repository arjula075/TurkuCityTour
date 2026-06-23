import { supabase } from '../services/supabaseClient';

const MAX_MESSAGE_LENGTH = 500;

function getCallerInfo(depth = 2) {
    const err = new Error();
    const stack = err.stack?.split('\n') ?? [];

    if (stack.length > depth) {
        const line = stack[depth].trim();
        const match = line.match(/(?:\()?(.*):(\d+):(\d+)\)?$/);
        if (match) {
            const [, file, lineNum] = match;
            return {
                file,
                line: parseInt(lineNum, 10),
            };
        }
    }
    return { file: null, line: null };
}

const stateToDbColumnMap = {
    gameActive: "game_active",
    currentIndex: "current_index",
    hintIndex: "hint_index",
    score: "score",
    guessed: "guessed",
    waiting: "waiting",
    showQuestion: "show_question",
    selectedAnswer: "selected_answer",
    quizComplete: "quiz_complete",
    centerOnUser: "center_on_user",
    submitted: "submitted",
    isCorrect: "is_correct",
    buttonDisabled: "button_disabled",
    gameEnded: "game_ended",
};

function mapGameStateToDbFields(gameState) {
    const mapped = {};
    for (const [key, value] of Object.entries(gameState)) {
        if (stateToDbColumnMap.hasOwnProperty(key)) {
            mapped[stateToDbColumnMap[key]] = value;
        }
    }
    return mapped;
}

function createPayload({ userId, file, line, message, gameState }) {
    return {
        created_at: new Date().toISOString(),
        user_id: userId ?? null,
        client_ip: null,
        file_name: file,
        line_number: line,
        message,
        ...mapGameStateToDbFields(gameState),
    };
}

export async function logEvent(message, gameState = {}, callerDepth = 4) {
    try {
        const { file, line } = getCallerInfo(callerDepth);
        const trimmedMessage = String(message ?? '').slice(0, MAX_MESSAGE_LENGTH);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('Error fetching user:', userError.message);
        }
        const userId = userData?.user?.id ?? null;

        if (!userId) {
            return;
        }

        const payload = createPayload({
            userId,
            file,
            line,
            message: trimmedMessage,
            gameState,
        });

        const { error } = await supabase.from('client_logs').insert(payload);
        if (error) console.error('Failed to log to Supabase:', error.message);
    } catch (err) {
        console.error('logEvent error:', err);
    }
}
