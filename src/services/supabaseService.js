// src/services/supabaseService.js
import { supabase } from './supabaseClient';
import { adminImages } from './adminImages';

// Utility
const handle = async (promise) => {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
};

// --- Public APIs ---
export { adminImages } from './adminImages';

export const fetchAllHints = () =>
    handle(supabase.from('hints').select('*').order('hint_order', { ascending: true }));

export const fetchAllQuestions = () =>
    handle(supabase.from('questions').select('*'));

export const fetchUserProgress = (userId) =>
    handle(supabase.from('user_progress').select('*').eq('user_id', userId));

export const insertUserProgress = (progress) =>
    handle(supabase.from('user_progress').insert([progress]));

export const fetchQuestionsAndAnswers = async (locationId) => {
    const questions = await handle(
        supabase.from('questions').select('*').eq('location_id', locationId)
    );

    if (!questions.length) return [];

    const questionIds = questions.map((q) => q.id);

    const answers = await handle(
        supabase.from('answers').select('*').in('question_id', questionIds)
    );

    return questions.map((q) => ({
        ...q,
        answers: answers.filter((a) => a.question_id === q.id),
    }));
};

// --- Admin APIs ---

// Generic helpers
const adminTable = (name) => ({
    fetch: () => handle(supabase.from(name).select('*')),
    insert: (item) => handle(supabase.from(name).insert([item]).select().single()),
    update: (id, updates) => handle(supabase.from(name).update(updates).eq('id', id)),
    delete: (id) => handle(supabase.from(name).delete().eq('id', id)),
});

// Admin: Hints
export const adminHints = {
    fetch: () => handle(supabase.from('hints').select('*')),
    fetchByLocation: (locationId) =>
        handle(
            supabase
                .from('hints')
                .select('*')
                .eq('location_id', locationId)
                .order('hint_order', { ascending: true })
        ),
    insert: (hint) => handle(supabase.from('hints').insert(hint).select()),
    update: (id, updates) => handle(supabase.from('hints').update(updates).eq('id', id)),
    delete: (id) => handle(supabase.from('hints').delete().eq('id', id)),
};

// Admin: Questions
export const adminQuestions = {
    ...adminTable('questions'),
    insert: (question) =>
        handle(supabase.from('questions').insert(question).select().single()),
};

// Admin: Answers
export const adminAnswers = {
    ...adminTable('answers'),

    toggleCorrectAnswer: (answerId, currentStatus) => {
        return handle(
            supabase
                .from('answers')
                .update({ is_correct: !currentStatus })
                .eq('id', answerId)
                .select()
                .single()
        );
    },
};

// Admin: Locations
export const adminLocations = {
    fetch: () =>
        handle(
            supabase
                .from('locations')
                .select('*')
                .order('display_order', { ascending: true })
        ),
    insert: (location) => handle(supabase.from('locations').insert([location]).select().single()),
    update: (id, updates) => handle(supabase.from('locations').update(updates).eq('id', id)),
    delete: (id) => handle(supabase.from('locations').delete().eq('id', id)),
};

// Admin: User Progress
export const adminUserProgress = adminTable('user_progress');

export const fetchLocationsWithHintsQuestionsAnswers = () =>
    handle(
        supabase
            .from('locations')
            .select(`
        id,
        name,
        latitude,
        longitude,
        display_order,
        hints (
          hint_text,
          hint_order
        ),
        questions (
          id,
          question_header,
          question_body,
          correct_answer,
          answers (
            id,
            answer_text,
            is_correct
          )
        )
      `)
            .order('id', { ascending: true })
    );

export async function updateUserProgress(userId, locationId, hintsUsed) {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .upsert(
                {
                    user_id: userId,
                    location_id: locationId,
                    hints_used: hintsUsed,
                    completed_at: new Date().toISOString(),
                },
                {
                    onConflict: ['user_id', 'location_id'], // unique constraint to update existing progress
                    returning: 'representation',
                }
            );

        if (error) {
            throw error;
        }
        return data;
    } catch (err) {
        console.error('Error updating user progress:', err.message);
        throw err;
    }
}

export async function clearUserProgress(user_id) {
    const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user_id);

    if (error) {
        throw error;
    }
}

export async function markQuestionAsAnsweredCorrectly(userId, locationId, isCorrect) {
    const { error } = await supabase
        .from('user_progress')
        .update({ answered_correctly: isCorrect })
        .eq('user_id', userId)
        .eq('location_id', locationId);

    if (error) {
        console.error("Failed to mark question as answered correctly:", error.message);
        throw error;
    }
}

export async function fetchUserProfile(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('message')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data;
}

export const adminUsers = {
    async fetchAll() {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data;
    },
    async update(id, fields) {
        const { error } = await supabase
            .from('users')
            .update(fields)
            .eq('id', id);
        if (error) throw error;
    },
};

const bucketName = import.meta.env.VITE_IMAGE_BUCKET_NAME;

export const storage = {
    uploadFile: async (filePath, file) => {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, { upsert: true });
        if (error) throw error;
        return data;
    },

    getSignedUrl: async (filePath, expiresInSec = 60) => {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, expiresInSec);
        if (error) throw error;
        return data.signedUrl;
    },

    deleteFile: async (filePath) => {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);
        if (error) throw error;
        return data;
    }
};

export async function fetchProfileImageUrl(userId) {
    const images = await adminImages.fetchByUserId(userId);
    if (!images || images.length === 0) return null;

    const profileImg = images.find((img) => img.is_profile_pic);
    const selected = profileImg || null;

    if (!selected?.file_path && !selected?.thumb_path) return null;

    const signedUrl = await storage.getSignedUrl(
        selected.thumb_path || selected.file_path,
        300
    );
    return signedUrl;
}

export async function fetchHintsResults() {
    return handle(supabase.from('hint_results').select('*'));
}

export async function fetchCorrectAnswerResults() {
    return handle(supabase.from('correct_answer_results').select('*'));
}

export async function fetchTotalPointsResults() {
    return handle(supabase.from('calculate_user_points').select('*'));
}
