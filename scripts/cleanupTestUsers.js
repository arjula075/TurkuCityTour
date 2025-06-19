import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.test' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOG_FILE_PATH = path.resolve('deleted_test_users.log');
const SAFE_EMAIL = 'ari.iska.lahti@gmail.com';

async function cleanupTestUsers() {
    console.log('🔍 Starting test user cleanup...');

    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Failed to list users:', error.message);
        return;
    }

    const deletableUsers = users.users.filter((user) =>
        user.email &&
        user.email !== SAFE_EMAIL &&
        user.email.startsWith('test-')
    );

    if (deletableUsers.length === 0) {
        console.log('✅ No test users found to delete.');
        return;
    }

    console.log(`🧹 Found ${deletableUsers.length} test users to delete.`);

    const logEntries = [];

    for (const user of deletableUsers) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        const timestamp = new Date().toISOString();

        if (deleteError) {
            console.error(`⚠️ Failed to delete ${user.email}: ${deleteError.message}`);
        } else {
            console.log(`🗑️ Deleted ${user.email}`);
            logEntries.push(`${timestamp} - Deleted user: ${user.email}`);
        }
    }

    if (logEntries.length > 0) {
        fs.appendFileSync(LOG_FILE_PATH, logEntries.join('\n') + '\n');
        console.log(`📝 Log written to ${LOG_FILE_PATH}`);
    }
}

cleanupTestUsers();
