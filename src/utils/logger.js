import { supabase } from '../services/supabaseClient';

// Cache IP so we don't fetch repeatedly
let cachedIp = null;
async function getClientIp() {
    if (cachedIp) return cachedIp;
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        cachedIp = data.ip;
        return cachedIp;
    } catch (err) {
        console.error('Failed to fetch IP:', err);
        return null;
    }
}

function getCallerInfo(depth = 2) {
    const err = new Error();
    const stack = err.stack?.split('\n') ?? [];

    if (stack.length > depth) {
        const line = stack[depth].trim();
        const match = line.match(/(?:\()?(.*):(\d+):(\d+)\)?$/); // file:line:column
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
    // add more mappings as needed
};

// Map React game state keys to DB column names
function mapGameStateToDbFields(gameState) {
    const mapped = {};
    for (const [key, value] of Object.entries(gameState)) {
        if (stateToDbColumnMap.hasOwnProperty(key)) {
            mapped[stateToDbColumnMap[key]] = value;
        }
    }
    return mapped;
}

function createPayload({ userId, ip_address, file, line, message, gameState }) {
    return {
        created_at: new Date().toISOString(),
        user_id: userId ?? null,
        client_ip: ip_address,
        file_name: file,
        line_number: line,
        message,
        ...mapGameStateToDbFields(gameState),
    };
}

export async function logEvent(message, gameState = {}, callerDepth = 4) {
    try {
        const { file, line } = getCallerInfo(callerDepth);
        const ip_address = await getClientIp();

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('Error fetching user:', userError.message);
        }
        const userId = userData?.user?.id ?? null;

        const payload = createPayload({
            userId,
            ip_address,
            file,
            line,
            message,
            gameState,
        });

        const { error } = await supabase.from('client_logs').insert(payload);
        if (error) console.error('Failed to log to Supabase:', error.message);
    } catch (err) {
        console.error('logEvent error:', err);
    }
}
