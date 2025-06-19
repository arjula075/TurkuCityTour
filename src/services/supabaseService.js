import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log(supabaseUrl, supabaseKey);
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch all hints
export const fetchAllHints = async () => {
    const { data, error } = await supabase
        .from('hints')
        .select('*');
    if (error) throw error;
    return data;
};

// Fetch all questions
export const fetchAllQuestions = async () => {
    const { data, error } = await supabase
        .from('questions')
        .select('*');
    if (error) throw error;
    return data;
};

// Insert user progress
export const insertUserProgress = async (progress) => {
    const { data, error } = await supabase
        .from('user_progress')
        .insert([progress]);
    if (error) throw error;
    return data;
};

// Fetch user progress for the current user
export const fetchUserProgress = async (userId) => {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data;
};

// Admin: CRUD operations for hints
export const adminFetchHints = async () => {
    const { data, error } = await supabase
        .from('hints')
        .select('*');
    if (error) throw error;
    return data;
};

export const adminInsertHint = async (hint) => {
    const { data, error } = await supabase
        .from('hints')
        .insert([hint]);
    if (error) throw error;
    return data;
};

export const adminUpdateHint = async (id, hint) => {
    const { data, error } = await supabase
        .from('hints')
        .update(hint)
        .eq('id', id);
    if (error) throw error;
    return data;
};

export const adminDeleteHint = async (id) => {
    const { data, error } = await supabase
        .from('hints')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return data;
};

// Admin: CRUD operations for questions
export const adminFetchQuestions = async () => {
    const { data, error } = await supabase
        .from('questions')
        .select('*');
    if (error) throw error;
    return data;
};

export const adminInsertQuestion = async (question) => {
    const { data, error } = await supabase
        .from('questions')
        .insert([question]);
    if (error) throw error;
    return data;
};

export const adminUpdateQuestion = async (id, question) => {
    const { data, error } = await supabase
        .from('questions')
        .update(question)
        .eq('id', id);
    if (error) throw error;
    return data;
};

export const adminDeleteQuestion = async (id) => {
    const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return data;
};

// Admin: CRUD operations for user_progress
export const adminFetchUserProgress = async () => {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*');
    if (error) throw error;
    return data;
};

export const adminInsertUserProgress = async (progress) => {
    const { data, error } = await supabase
        .from('user_progress')
        .insert([progress]);
    if (error) throw error;
    return data;
};

export const adminUpdateUserProgress = async (id, progress) => {
    const { data, error } = await supabase
        .from('user_progress')
        .update(progress)
        .eq('id', id);
    if (error) throw error;
    return data;
};

export const adminDeleteUserProgress = async (id) => {
    const { data, error } = await supabase
        .from('user_progress')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return data;
};

// Admin: CRUD operations for locations
export const adminFetchLocations = async () => {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data;
};

export const adminInsertLocation = async (location) => {
    const { data, error } = await supabase
        .from('locations')
        .insert([location])
        .select();
    if (error) throw error;
    console.log('insert location data:', data, 'error:', error);
    return data;
};

export const adminUpdateLocation = async (id, location) => {
    const { data, error } = await supabase
        .from('locations')
        .update(location)
        .eq('id', id);
    if (error) throw error;
    return data;
};

export const adminDeleteLocation = async (id) => {
    const { data, error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return data;
};
