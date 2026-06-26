#!/usr/bin/env node
/**
 * Build supabase/migrations/00000_baseline.sql — schema inventory for PR review.
 * Scans migration SQL files for tables, views, functions, and policies.
 *
 * For a full pg_dump from live Supabase, use scripts/dump-baseline-schema.sh instead.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationsDir = path.join(root, 'supabase/migrations');
const outPath = path.join(migrationsDir, '00000_baseline.sql');

const tableRe = /CREATE TABLE(?: IF NOT EXISTS)?\s+public\.(\w+)/gi;
const viewRe = /CREATE(?: OR REPLACE)? VIEW\s+public\.(\w+)/gi;
const funcRe = /CREATE(?: OR REPLACE)? FUNCTION\s+public\.(\w+)/gi;
const policyRe = /CREATE POLICY\s+(\w+)\s+ON\s+(?:public\.)?(\w+)/gi;

const tables = new Set();
const views = new Set();
const functions = new Set();
const policies = new Set();

const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && f !== '00000_baseline.sql')
    .sort();

for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    for (const re of [tableRe, viewRe, funcRe]) {
        re.lastIndex = 0;
        let match;
        while ((match = re.exec(content))) {
            const name = match[1];
            if (re === tableRe) tables.add(name);
            else if (re === viewRe) views.add(name);
            else functions.add(name);
        }
    }

    policyRe.lastIndex = 0;
    let match;
    while ((match = policyRe.exec(content))) {
        policies.add(`${match[1]} on ${match[2]}`);
    }
}

const baselineTables = [
    'users',
    'games',
    'game_players',
    'locations',
    'hints',
    'questions',
    'answers_data',
    'user_progress',
    'images',
    'client_logs',
    'organizations',
    'subscriptions',
    'organization_members',
];

for (const name of baselineTables) {
    tables.add(name);
}

const lines = [
    '-- TurkuCityTour baseline schema inventory',
    `-- Generated: ${new Date().toISOString().slice(0, 10)}`,
    '--',
    '-- This file documents the public schema objects versioned in this repo.',
    '-- Incremental migrations 00001+ apply security hardening on top of the core schema.',
    '-- For a full DDL dump from live Supabase: scripts/dump-baseline-schema.sh',
    '--',
    '-- Do not apply this file to production — it contains no DDL.',
    '',
    '-- Core tables',
    ...[...tables].sort().map((t) => `--   ${t}`),
    '',
    '-- Views',
    ...[...views].sort().map((v) => `--   ${v}`),
    '',
    '-- Functions (public)',
    ...[...functions].sort().map((f) => `--   ${f}()`),
    '',
    '-- RLS policies referenced in migrations',
    ...[...policies].sort().map((p) => `--   ${p}`),
    '',
    `-- Source migrations: ${files.length} files (${files[0]} … ${files[files.length - 1]})`,
    '',
];

fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${outPath}`);
console.log(
    `  ${tables.size} tables, ${views.size} views, ${functions.size} functions, ${policies.size} policies`
);
