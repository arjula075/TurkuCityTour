#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

dotenv.config({ path: '.env.test' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SAFE_EMAILS = (process.env.SAFE_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase());

const program = new Command();

program
    .description('CLI tool to delete test users from Supabase Auth')
    .option('--dry-run', 'List users that would be deleted without deleting them')
    .option('--confirm', 'Actually delete users (required for deletion)')
    .option('--log <file>', 'Path to log file', 'deleted_test_users.log');

program.parse(process.argv);
const options = program.opts();

if (!SUPABASE_URL || !VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY);

async function confirmPrompt() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('⚠️ Are you sure you want to delete users? Type "yes" to confirm: ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

async function cleanupTestUsers() {
    console.log('🔍 Fetching users...');

    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Failed to list users:', error.message);
        process.exit(1);
    }

    const deletableUsers = users.users.filter(
        user => user.email && !SAFE_EMAILS.includes(user.email.toLowerCase())
    );

    if (deletableUsers.length === 0) {
        console.log('✅ No test users found to delete.');
        return;
    }

    console.log(`🔎 Found ${deletableUsers.length} test users:`);

    for (const user of deletableUsers) {
        console.log(` - ${user.email}`);
    }

    if (options.dryRun) {
        console.log('\n🧪 Dry run complete. No users deleted.');
        return;
    }

    if (!options.confirm) {
        const confirmed = await confirmPrompt();
        if (!confirmed) {
            console.log('❌ Deletion cancelled.');
            process.exit(0);
        }
    }

    const logEntries = [];
    const logPath = path.resolve(options.log);

    for (const user of deletableUsers) {
        const timestamp = new Date().toISOString();

        // 💥 Delete from your custom users table first (UUID = user.id)
        const { error: dbDeleteError } = await supabase
            .from('users') // replace with actual table name if different
            .delete()
            .eq('id', user.id);

        if (dbDeleteError) {
            console.error(`⚠️ Failed to delete from users table for ${user.email}: ${dbDeleteError.message}`);
        } else {
            console.log(`🗑️ Deleted ${user.email} from 'users' table`);
        }

        // 🚫 Then delete from Supabase Auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error(`⚠️ Failed to delete ${user.email} from Auth: ${deleteError.message}`);
        } else {
            console.log(`🗑️ Deleted ${user.email} from Auth`);
            logEntries.push(`${timestamp} - Deleted user: ${user.email}`);
        }
    }


    if (logEntries.length > 0) {
        fs.appendFileSync(logPath, logEntries.join('\n') + '\n');
        console.log(`📝 Log written to ${logPath}`);
    }

    console.log('✅ Cleanup complete.');
}

cleanupTestUsers();
