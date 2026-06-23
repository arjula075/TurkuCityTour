import { createClient } from '@supabase/supabase-js';
import { integrationEnv } from './env.js';

export function createAdminClient() {
    return createClient(integrationEnv.url, integrationEnv.serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export function createAnonClient() {
    return createClient(integrationEnv.url, integrationEnv.anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export async function signIn(client, email, password) {
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(`Failed to sign in as ${email}: ${error.message}`);
    }

    return data.user;
}

export async function signOut(client) {
    await client.auth.signOut();
}
