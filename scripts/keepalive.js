/**
 * Manual keep-alive ping for local testing or ad-hoc use.
 * Loads credentials from .env (same vars as the app + service role key).
 *
 * Usage: node scripts/keepalive.js
 */
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error(
        'Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) in .env'
    );
    process.exit(1);
}

const endpoint = `${url}/rest/v1/games?select=id&limit=1`;
const response = await fetch(endpoint, {
    headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
    },
});

const body = await response.text();
console.log(`HTTP ${response.status}`);
console.log(body);

if (!response.ok) {
    process.exit(1);
}

console.log('Keep-alive succeeded.');
