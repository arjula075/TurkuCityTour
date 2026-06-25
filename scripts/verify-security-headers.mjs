#!/usr/bin/env node
/**
 * Verify security headers on a deployed URL.
 * Usage: DEPLOY_URL=https://your-app.example npm run security:verify-headers
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const deployUrl = process.argv[2] || process.env.DEPLOY_URL;

if (!deployUrl) {
    console.error(
        'Set DEPLOY_URL or pass the site URL as the first argument.'
    );
    process.exit(1);
}

const vercelPath = path.join(root, 'vercel.json');
const expected = {};

if (fs.existsSync(vercelPath)) {
    const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    for (const block of config.headers ?? []) {
        for (const header of block.headers ?? []) {
            expected[header.key.toLowerCase()] = header.value;
        }
    }
}

const requiredKeys = [
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'content-security-policy',
];

const response = await fetch(deployUrl, { redirect: 'follow' });
const headers = response.headers;
const failures = [];

for (const key of requiredKeys) {
    const value = headers.get(key);
    if (!value) {
        failures.push(`Missing header: ${key}`);
        continue;
    }

    const want = expected[key];
    if (want && value !== want) {
        failures.push(
            `Header ${key} mismatch.\n  got:  ${value}\n  want: ${want}`
        );
    }
}

if (failures.length > 0) {
    console.error(`Security header check failed for ${deployUrl}:\n`);
    for (const failure of failures) {
        console.error(`  - ${failure}`);
    }
    process.exit(1);
}

console.log(`Security headers OK for ${deployUrl} (${response.status})`);
