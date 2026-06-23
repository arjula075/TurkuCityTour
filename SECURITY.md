# Security

TurkuCityTour is a client-heavy GPS quiz game backed by Supabase. This document tracks known risks, controls in place, and the remediation roadmap.

## Threat model (summary)

Players and admins authenticate via Supabase Auth. Game content and progress are stored in Postgres with RLS. Game integrity is enforced by **RPCs + RLS** once migrations `00001`–`00008` are applied in Supabase.

## Controls in place

| Control | Location |
|---------|----------|
| Secret scanner | `scripts/security-scan.mjs`, `security.yml` |
| npm audit (prod deps) | `security.yml` |
| Auth session validation | `AuthContext` uses `getUser()` |
| Auth-gated routes | `AuthRoute` on `/map`, `/game-complete`, `/complete`, `/sorry` |
| Server answer validation | `submit_answer` RPC + `useAnswerSubmission` |
| Player query sanitization | `fetchLocationsForPlayer` (no `is_correct` / `correct_answer`) |
| Server geofence check | `validate_location_arrival` RPC (client fallback if RPC missing) |
| Client log hardening | `logger.js` — no third-party IP fetch, 500-char cap |
| RLS integration tests | `test/integration/*.rls.test.js` |
| Security headers | `public/_headers` (Netlify), `vercel.json` |
| No XSS primitives | No `dangerouslySetInnerHTML` / `eval` in `src/` |
| `.env` gitignored | Service role never bundled via Vite |

## Database migrations (apply in Supabase)

| Migration | Purpose |
|-----------|---------|
| `00001_create_user_profile.sql` | Bind profiles to `auth.uid()` |
| `00002_submit_answer.sql` | Server-authoritative answers |
| `00003_is_admin_helper.sql` | `is_admin()` for policies |
| `00004_user_progress_integrity.sql` | Block client `answered_correctly` writes |
| `00005_admin_table_rls.sql` | Admin-only catalog mutations |
| `00006_leaderboard_admin_only.sql` | Wrap leaderboard views with `is_admin()` filter |
| `00007_client_logs_hardening.sql` | Log rate limit + length cap |
| `00008_validate_location_arrival.sql` | Server geofence RPC |

> **Database:** Run SQL in Supabase Dashboard → **SQL Editor** → paste → **Run**. Merging code does not update production until SQL is executed.

## Remediation phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Version DB policies in `supabase/migrations/` | Migrations authored; **apply in Supabase** |
| 1 | Server-authoritative answers + progress | Client + SQL ready |
| 2 | Auth routes, admin RLS, leaderboard, logs | Client + SQL ready |
| 3 | CSP headers, PR integration, `.env.example`, deps | Done |

## Operational notes

### Thunderforest API key

`VITE_THUNDERFOREST_API_KEY` is embedded in the client bundle. In the [Thunderforest dashboard](https://www.thunderforest.com/), restrict the key by **HTTP referrer** to your production domain(s).

### Self-registration

Public signup is enabled in `Register.jsx`. To require invites only: Supabase Dashboard → **Authentication** → disable sign-ups or use an auth hook.

### Baseline schema export (Phase 0)

Export your live schema once with `supabase db dump --schema public` and commit as `00000_baseline.sql` so policies can be reviewed in PRs.

See the [security plan canvas](/Users/ari.lahti/.cursor/projects/empty-window/canvases/turkucitytour-security-plan.canvas.tsx) for the full audit.

## Environment variables

See `.env.example`. Never prefix service-role keys with `VITE_` — they would be embedded in the client bundle.

## Reporting

For production incidents, rotate Supabase keys in the dashboard and review `client_logs` and Auth audit logs.
