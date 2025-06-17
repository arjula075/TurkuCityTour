import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const logFilePath = path.resolve('deleted_test_users.log');

async function cleanupTestUsers() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Failed to list users:', error.message);
        return;
    }

    const testUsers = users.users.filter((u) => u.email?.startsWith('test-'));
    console.log(`Found ${testUsers.length} test users.`);

    for (const user of testUsers) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        const timestamp = new Date().toISOString();
        if (deleteError) {
            console.error(`Failed to delete ${user.email}:`, deleteError.message);
        } else {
            console.log(`Deleted ${user.email}`);
            fs.appendFileSync(logFilePath, `${timestamp} - Deleted user: ${user.email}\n`);
        }
    }

    console.log(`Log written to ${logFilePath}`);
}

cleanupTestUsers();
