// src/services/supabaseService.js
import { supabase } from './supabaseClient';

// Utility
const handle = async (promise) => {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
};

// --- Public APIs ---

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
        console.log('toggleCorrectAnswer called with:', { answerId, currentStatus });
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
        hints (
          hint_text,
          hint_order
        ),
        questions (
          id,
          question_text,
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

