import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const findings = [];

const ignoredDirs = new Set([
    '.git',
    'node_modules',
    'coverage',
    'dist',
    'playwright-report',
    'test-results',
]);

const ignoredFiles = new Set(['package-lock.json']);

const suspectPatterns = [
    { name: 'aws-access-key-id', regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: 'github-token', regex: /\bghp_[A-Za-z0-9]{36}\b/g },
    { name: 'slack-token', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
    {
        name: 'private-key',
        regex: /-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----/g,
    },
    {
        name: 'supabase-service-role-assignment',
        regex: /\b(VITE_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_TEST_SERVICE_ROLE_KEY)\s*=\s*['"][^'"]+['"]/g,
    },
];

function shouldSkipFile(filePath) {
    const base = path.basename(filePath);
    if (ignoredFiles.has(base)) return true;
    if (base.endsWith('.min.js')) return true;
    if (filePath.includes(`${path.sep}test${path.sep}integration${path.sep}`)) return false;
    if (base === '.env' || base === '.env.test') return true;
    return false;
}

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(root, fullPath);

        if (entry.isDirectory()) {
            if (ignoredDirs.has(entry.name)) continue;
            walk(fullPath);
            continue;
        }

        if (shouldSkipFile(relativePath)) continue;

        let content;
        try {
            content = fs.readFileSync(fullPath, 'utf8');
        } catch {
            continue;
        }

        for (const pattern of suspectPatterns) {
            pattern.regex.lastIndex = 0;
            const match = pattern.regex.exec(content);
            if (!match) continue;

            const before = content.slice(0, match.index);
            const line = before.split('\n').length;
            findings.push({
                file: relativePath,
                line,
                type: pattern.name,
                snippet: match[0].slice(0, 80),
            });
        }
    }
}

walk(root);

if (findings.length > 0) {
    console.error('Potential secret findings:\n');
    for (const finding of findings) {
        console.error(
            `  ${finding.file}:${finding.line} [${finding.type}] ${finding.snippet}`
        );
    }
    process.exit(1);
}

console.log('No suspect secret patterns found in tracked source files.');
