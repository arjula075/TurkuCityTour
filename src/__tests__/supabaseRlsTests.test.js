// src/__tests__/supabaseRlsTests.test.js
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient'; // Your regular client with anon key
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// User credentials from env
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.VITE_USER1_EMAIL;
const USER_PASSWORD = process.env.VITE_USER_PASSWORD || 'TestUserPass123!';
const UUID = "2e9443a2-bfac-4432-bb2d-bccc9f1124d2";

let insertedAnswerId = null;

beforeAll(async () => {
    // Use the admin client to create normal test user if it doesn't exist
    const { data: existingUser, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (fetchError) throw new Error('Failed to fetch users: ' + fetchError.message);

    const userExists = existingUser.users.some((u) => u.email === USER_EMAIL);

    if (!userExists) {
        const { user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: USER_EMAIL,
            password: USER_PASSWORD,
            email_confirm: true, // Automatically confirm email so user is active
        });
        if (createError) throw new Error('Failed to create test user: ' + createError.message);
    }

    // Also make sure admin user exists and is confirmed (optional)
    // Assuming your admin user is already set up manually

    // Sign out any user to start fresh
    await supabase.auth.signOut();
});

afterAll(async () => {
    // Sign out after tests
    await supabase.auth.signOut();
});

describe('RLS Policy Tests on Answers Table', () => {
    const testAnswer = {
        question_id: UUID, // Adjust this to match a real question ID
        answer_text: 'RLS Test Answer',
        is_correct: false,
    };

    test('authenticated user can SELECT from answers', async () => {
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: USER_EMAIL,
            password: USER_PASSWORD,
        });

        expect(loginError).toBeNull();

        const { data, error } = await supabase.from('answers').select('*');
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    test('non-admin user cannot INSERT into answers', async () => {
        const { error } = await supabase.from('answers').insert([testAnswer]);
        expect(error).not.toBeNull();
        expect(error.message).toMatch(/row-level security/i);
    });

    test('admin user can INSERT into answers', async () => {
        await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        });

        const { data, error } = await supabase.from('answers').insert([testAnswer]).select();

        expect(error).toBeNull();
        expect(data?.[0]?.answer_text).toBe(testAnswer.answer_text);
        insertedAnswerId = data?.[0]?.id;
        expect(insertedAnswerId).toBeDefined();
    });

    test('non-admin user cannot UPDATE answers', async () => {
        await supabase.auth.signInWithPassword({
            email: USER_EMAIL,
            password: USER_PASSWORD,
        });

        const { data, error, status, statusText } = await supabase
            .from('answers')
            .update({ answer_text: 'Unauthorized Update' })
            .eq('id', insertedAnswerId)
            .select(); // ← Important: returns matched rows

        console.log('Update response:', { data, error, status, statusText });

        // Now assert based on expected behavior
        expect(error).toBeNull(); // ← still no error
        expect(data).toEqual([]); // ← nothing was updated
    });

    test('non-admin user cannot DELETE answers', async () => {
        await supabase.auth.signInWithPassword({
            email: USER_EMAIL,
            password: USER_PASSWORD,
        });

        const { data, error, status } = await supabase
            .from('answers')
            .delete()
            .eq('id', insertedAnswerId)
            .select(); // This will return deleted rows if allowed

        console.log('Delete response:', { data, error, status });

        // Expect no rows were deleted
        expect(error).toBeNull();       // No error is expected
        expect(data).toEqual([]);       // Empty array = no rows deleted
    });


    test('admin user can DELETE answers', async () => {
        await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        });

        const { error } = await supabase.from('answers').delete().eq('id', insertedAnswerId);
        expect(error).toBeNull();
    });
});
