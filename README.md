# TurkuCityTour

Location-based city tour game built with React, Vite, Redux, Leaflet, and Supabase.

## Development

```bash
npm install
npm run dev
```

Copy `.env.test` to configure local Supabase credentials (not committed).

## Testing

| Command | What it runs |
|---------|----------------|
| `npm test` | Unit and component tests (Vitest + Testing Library) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Unit tests with coverage thresholds |
| `npm run test:integration` | Live Supabase RLS tests (skipped without credentials) |
| `npm run test:e2e` | Playwright smoke tests (desktop + mobile) |
| `npm run test:e2e:mobile` | Playwright mobile-chrome project only |
| `npm run security:check` | Audit, secret scan, and unit tests |

### Coverage thresholds

CI enforces minimum coverage (ratchet upward over time):

| Metric | Current gate | Next target |
|--------|--------------|-------------|
| Lines / statements | 29% | 40% |
| Functions | 27% | 40% |
| Branches | 25% | 30% |

### Supabase integration tests (local or nightly CI)

Integration tests are **not** part of default PR CI. They run locally and in the scheduled `supabase-integration` workflow.

Required environment variables (in `.env.test` locally, or GitHub secrets for nightly).

Set `SUPABASE_TEST_URL` to opt in; other values fall back to `VITE_*` from `.env.test`:

- `SUPABASE_TEST_URL` (required to run — not inferred from `VITE_SUPABASE_URL` alone)
- `SUPABASE_TEST_ANON_KEY` (falls back to `VITE_SUPABASE_ANON_KEY`)
- `SUPABASE_TEST_SERVICE_ROLE_KEY` (falls back to `VITE_SUPABASE_SERVICE_ROLE_KEY`)
- `SUPABASE_TEST_USER_EMAIL` / `SUPABASE_TEST_USER_PASSWORD`
- `SUPABASE_TEST_ADMIN_EMAIL` / `SUPABASE_TEST_ADMIN_PASSWORD`

```bash
npm run test:integration
```

Tests seed and clean up their own fixture data (games, locations, questions, answers).

### Playwright E2E

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Optional live login walkthrough (skipped by default):

```bash
E2E_TEST_USER_EMAIL=you@example.com E2E_TEST_USER_PASSWORD=secret npm run test:e2e
```

## CI workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR / push to `First-release` | Unit tests, coverage, build, Playwright smoke |
| `security.yml` | PR / push to `First-release` | npm audit, secret scan, unit tests |
| `supabase-integration.yml` | Nightly + manual | Live Supabase RLS regression |
| `supabase-keepalive.yml` | Mon/Thu cron | Keeps free-tier project active |
