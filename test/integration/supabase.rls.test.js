// src/__tests__/supabaseRlsTests.test.js
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../src/services/supabaseClient';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD;
const USER_EMAIL = process.env.VITE_USER1_EMAIL;
const USER_PASSWORD = process.env.VITE_USER_PASSWORD || 'TestUserPass123!';
const UUID = '2e9443a2-bfac-4432-bb2d-bccc9f1124d2';

let insertedAnswerId = null;

beforeAll(async () => {
    const { data: existingUser, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (fetchError) throw new Error('Failed to fetch users: ' + fetchError.message);

    const userExists = existingUser.users.some((u) => u.email === USER_EMAIL);

    if (!userExists) {
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: USER_EMAIL,
            password: USER_PASSWORD,
            email_confirm: true,
        });
        if (createError) throw new Error('Failed to create test user: ' + createError.message);
    }

    await supabase.auth.signOut();
});

afterAll(async () => {
    await supabase.auth.signOut();
});

describe('RLS Policy Tests on Answers Table', () => {
    const testAnswer = {
        question_id: UUID,
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

        const { data, error } = await supabase
            .from('answers')
            .update({ answer_text: 'Unauthorized Update' })
            .eq('id', insertedAnswerId)
            .select();

        expect(error).toBeNull();
        expect(data).toEqual([]);
    });

    test('non-admin user cannot DELETE answers', async () => {
        await supabase.auth.signInWithPassword({
            email: USER_EMAIL,
            password: USER_PASSWORD,
        });

        const { data, error } = await supabase
            .from('answers')
            .delete()
            .eq('id', insertedAnswerId)
            .select();

        expect(error).toBeNull();
        expect(data).toEqual([]);
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
