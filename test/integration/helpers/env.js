import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const explicitIntegrationRun = Boolean(process.env.SUPABASE_TEST_URL);

function readEnv(primary, fallback) {
    if (process.env[primary]) return process.env[primary];
    if (explicitIntegrationRun && fallback) {
        return process.env[fallback] || '';
    }
    return '';
}

export const integrationEnv = {
    url: readEnv('SUPABASE_TEST_URL', 'VITE_SUPABASE_URL'),
    anonKey: readEnv('SUPABASE_TEST_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
    serviceRoleKey: readEnv(
        'SUPABASE_TEST_SERVICE_ROLE_KEY',
        'VITE_SUPABASE_SERVICE_ROLE_KEY'
    ),
    userEmail: readEnv('SUPABASE_TEST_USER_EMAIL', 'VITE_USER1_EMAIL'),
    userPassword:
        readEnv('SUPABASE_TEST_USER_PASSWORD', 'VITE_USER_PASSWORD') ||
        'TestUserPass123!',
    adminEmail: readEnv('SUPABASE_TEST_ADMIN_EMAIL', 'VITE_ADMIN_EMAIL'),
    adminPassword: readEnv('SUPABASE_TEST_ADMIN_PASSWORD', 'VITE_ADMIN_PASSWORD'),
};

export const hasIntegrationCredentials = Boolean(
    explicitIntegrationRun &&
        integrationEnv.url &&
        integrationEnv.anonKey &&
        integrationEnv.serviceRoleKey &&
        integrationEnv.userEmail &&
        integrationEnv.adminEmail &&
        integrationEnv.userPassword &&
        integrationEnv.adminPassword
);

export const maybeDescribeIntegration = hasIntegrationCredentials
    ? describe
    : describe.skip;
