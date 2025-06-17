import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

let adminSession;
let adminUserId;
let regularUserId;
let testLocationId;

describe('Supabase RLS Tests', () => {
    beforeAll(async () => {
        console.log('Signing in as admin...');
        const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
            email: process.env.VITE_ADMIN_EMAIL,
            password: process.env.VITE_ADMIN_PASSWORD,
        });
        if (adminError) throw adminError;
        adminSession = adminData.session;
        adminUserId = adminData.user.id;

        console.log('Registering test user...');
        const { data: userData, error: userError } = await supabase.auth.signUp({
            email: `testuser-${uuidv4()}@gmail.com`,
            password: 'password123',
        });
        if (userError) throw userError;
        regularUserId = userData.user.id;

        console.log('Setting admin session...');
        await supabase.auth.setSession({ access_token: adminSession.access_token });

        console.log('Inserting test location...');
        const { data: locData, error: locError } = await supabase
            .from('locations')
            .insert([{ name: 'Test Location', latitude: 60.45, longitude: 22.26 }])
            .select();
        if (locError) throw locError;
        testLocationId = locData[0].id;
    });

    afterAll(async () => {
        console.log('Cleaning up test data...');
        await supabase.from('user_progress').delete().eq('user_id', regularUserId);
        await supabase.from('hints').delete().eq('location_id', testLocationId);
        await supabase.from('questions').delete().eq('location_id', testLocationId);
        await supabase.from('locations').delete().eq('id', testLocationId);
    });

    describe('Regular User', () => {
        it('should read all hints', async () => {
            console.log('Regular user: reading all hints...');
            const { data, error } = await supabase.from('hints').select('*');
            expect(error).toBeNull();
            expect(data).toBeInstanceOf(Array);
        });

        it('should read all questions', async () => {
            console.log('Regular user: reading all questions...');
            const { data, error } = await supabase.from('questions').select('*');
            expect(error).toBeNull();
            expect(data).toBeInstanceOf(Array);
        });

        it('should insert and read own user_progress', async () => {
            console.log('Regular user: inserting own user_progress...');
            const progress = {
                user_id: regularUserId,
                location_id: testLocationId,
                hints_used: 2,
                answered_correctly: false,
            };
            const { error: insertError } = await supabase
                .from('user_progress')
                .insert([progress]);
            expect(insertError).toBeNull();

            console.log('Regular user: reading own user_progress...');
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', regularUserId);
            expect(error).toBeNull();
            expect(data.length).toBeGreaterThan(0);
        });

        it('should not read other users user_progress', async () => {
            console.log('Regular user: attempting to read other users\' user_progress...');
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .neq('user_id', regularUserId);
            expect(error).toBeNull();
            expect(data.length).toBe(0);
        });
    });

    describe('Admin User', () => {
        it('should perform full CRUD on hints', async () => {
            console.log('Admin user: performing CRUD on hints...');
            const hint = {
                location_id: testLocationId,
                hint_text: 'Test hint',
                hint_order: 1,
            };
            const { data: insertData, error: insertError } = await supabase
                .from('hints')
                .insert([hint])
                .select();
            expect(insertError).toBeNull();

            const hintId = insertData[0].id;

            const { error: updateError } = await supabase
                .from('hints')
                .update({ hint_text: 'Updated test hint' })
                .eq('id', hintId);
            expect(updateError).toBeNull();

            const { error: deleteError } = await supabase
                .from('hints')
                .delete()
                .eq('id', hintId);
            expect(deleteError).toBeNull();
        });

        it('should perform full CRUD on questions', async () => {
            console.log('Admin user: performing CRUD on questions...');
            const question = {
                location_id: testLocationId,
                question_text: 'Test question',
                correct_answer: 'Test answer',
            };
            const { data: insertData, error: insertError } = await supabase
                .from('questions')
                .insert([question])
                .select();
            expect(insertError).toBeNull();

            const questionId = insertData[0].id;

            const { error: updateError } = await supabase
                .from('questions')
                .update({ question_text: 'Updated test question' })
                .eq('id', questionId);
            expect(updateError).toBeNull();

            const { error: deleteError } = await supabase
                .from('questions')
                .delete()
                .eq('id', questionId);
            expect(deleteError).toBeNull();
        });

        it('should perform full CRUD on user_progress', async () => {
            console.log('Admin user: performing CRUD on user_progress...');
            const progress = {
                user_id: regularUserId,
                location_id: testLocationId,
                hints_used: 2,
                answered_correctly: false,
            };
            const { data: insertData, error: insertError } = await supabase
                .from('user_progress')
                .insert([progress])
                .select();
            expect(insertError).toBeNull();

            const progressId = insertData[0].id;

            const { error: updateError } = await supabase
                .from('user_progress')
                .update({ hints_used: 3 })
                .eq('id', progressId);
            expect(updateError).toBeNull();

            const { error: deleteError } = await supabase
                .from('user_progress')
                .delete()
                .eq('id', progressId);
            expect(deleteError).toBeNull();
        });
    });
});
