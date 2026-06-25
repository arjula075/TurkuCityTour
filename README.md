# TurkuCityTour

Location-based city tour game built with React, Vite, Redux, Leaflet, and Supabase.

## Development

```bash
npm install
npm run dev
```

Copy `.env.test` from `.env.example` to configure local Supabase credentials (not committed).

Security notes: see [SECURITY.md](SECURITY.md). Database migrations: [supabase/README.md](supabase/README.md). Mobile (Capacitor): [MOBILE.md](MOBILE.md).

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
| Lines / statements | 40% | 60% |
| Functions | 40% | 50% |
| Branches | 30% | 50% |

### Supabase integration tests (local or CI)

Integration tests run locally and in `supabase-integration.yml`. On PRs and pushes to `First-release`, they run **only when all `SUPABASE_TEST_*` GitHub secrets are configured**; otherwise the workflow skips them without failing. Fork PRs never receive secrets and skip the job entirely.

Required environment variables (in `.env.test` locally, or GitHub Actions secrets for CI).

Set `SUPABASE_TEST_URL` to opt in; other values fall back to `VITE_*` from `.env.test`:

- `SUPABASE_TEST_URL` (required to run — not inferred from `VITE_SUPABASE_URL` alone)
- `SUPABASE_TEST_ANON_KEY` (falls back to `VITE_SUPABASE_ANON_KEY`)
- `SUPABASE_TEST_SERVICE_ROLE_KEY` (falls back to `VITE_SUPABASE_SERVICE_ROLE_KEY` in `.env.test` only — use non-`VITE_` name in GitHub secrets)
- `SUPABASE_TEST_USER_EMAIL` / `SUPABASE_TEST_USER_PASSWORD`
- `SUPABASE_TEST_ADMIN_EMAIL` / `SUPABASE_TEST_ADMIN_PASSWORD`

```bash
npm run test:integration
```

Tests seed and clean up their own fixture data (games, locations, questions, answers).

### Playwright E2E

Pinned to `@playwright/test@1.60.0` — Playwright 1.61.0 breaks local ESM imports on Node 22.15+ ([issue #41311](https://github.com/microsoft/playwright/issues/41311)). CI uses Node 20.

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
| `mobile-android.yml` | PR / push to `First-release` | Capacitor Android debug APK (+ optional signed AAB) |
| `mobile-ios.yml` | PR / push to `First-release` | Capacitor iOS Simulator build |
| `security.yml` | PR / push to `First-release` | npm audit, secret scan, unit tests |
| `supabase-integration.yml` | PR / push `First-release` (when secrets set), nightly, manual | Live Supabase RLS regression |
| `supabase-keepalive.yml` | Mon/Thu cron | Keeps free-tier project active |

## GitHub secrets (optional workflows)

Add these under **Settings → Secrets and variables → Actions** in the GitHub repo.

### Supabase RLS (`supabase-integration.yml`)

| Secret | Description |
|--------|-------------|
| `SUPABASE_TEST_URL` | Project URL |
| `SUPABASE_TEST_ANON_KEY` | Anon key |
| `SUPABASE_TEST_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_TEST_USER_EMAIL` | Test player account |
| `SUPABASE_TEST_USER_PASSWORD` | Test player password |
| `SUPABASE_TEST_ADMIN_EMAIL` | Admin account |
| `SUPABASE_TEST_ADMIN_PASSWORD` | Admin password |

### Gated full-game E2E (`e2e/full-game.spec.js`)

| Secret | Description |
|--------|-------------|
| `E2E_TEST_USER_EMAIL` | Login email for live walkthrough |
| `E2E_TEST_USER_PASSWORD` | Login password |

The full-game spec is excluded from default CI; set these secrets and run `npm run test:e2e` locally or add a dedicated workflow when ready.
