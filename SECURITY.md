# Security

TurkuCityTour is a client-heavy GPS quiz game backed by Supabase. This document tracks known risks, controls in place, and the remediation roadmap.

## Threat model (summary)

Players and admins authenticate via Supabase Auth. Game content and progress are stored in Postgres with RLS. The main risk is **client-trusted game logic**: a motivated user can call Supabase directly unless the database enforces integrity.

## Controls in place

| Control | Location |
|---------|----------|
| Secret scanner | `scripts/security-scan.mjs`, `security.yml` |
| npm audit (prod deps) | `security.yml` |
| Auth session validation | `AuthContext` uses `getUser()` |
| RLS integration tests | `test/integration/*.rls.test.js` (nightly CI) |
| No XSS primitives | No `dangerouslySetInnerHTML` / `eval` in `src/` |
| Game assignment gate | Unassigned players → `/sorry` |
| `.env` gitignored | Service role never bundled via Vite |

## Open risks (by priority)

### Critical

1. **Client-trusted game engine** — answers, scores, GPS, and progress validated in the browser until `submit_answer` RPC is live in Supabase.
2. **`create_user_profile` RPC** — must enforce `auth.uid()` (see `supabase/migrations/00001_create_user_profile.sql`).

### High

- Correct answers exposed in player API responses → mitigated in app by `fetchLocationsForPlayer` (no `is_correct` / `correct_answer`).
- Admin auth is UI-only → RLS must enforce `is_admin` on all admin tables.
- Client-writable `user_progress` → partial RLS; tighten WITH CHECK after RPC rollout.

### Medium

- `/map` requires auth (enforced in `App.jsx` `AuthRoute`).
- Open self-registration — configure in Supabase Auth if invite-only is desired.
- RLS tests not on every PR — nightly `supabase-integration.yml`.
- No CSP headers — configure at host (Netlify/Vercel/nginx).

## Remediation phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Version DB policies in `supabase/migrations/` | In progress |
| 1 | Server-authoritative answers (`submit_answer` RPC) | SQL + client ready; **apply SQL in Supabase** |
| 2 | Auth routes, admin RLS, leaderboard views | Partial (`AuthRoute`, DEV-only admin GPS) |
| 3 | CSP, PR integration tests, `.env.example`, dep cleanup | Partial |

See the [security plan canvas](/Users/ari.lahti/.cursor/projects/empty-window/canvases/turkucitytour-security-plan.canvas.tsx) for the full audit.

## Database changes

All SQL under `supabase/migrations/` must be applied manually:

> **Database:** Run SQL in Supabase Dashboard → **SQL Editor** → paste → **Run**. Merging code does not update production until SQL is executed.

## Environment variables

See `.env.example`. Never prefix service-role keys with `VITE_` — they would be embedded in the client bundle.

## Reporting

For production incidents, rotate Supabase keys in the dashboard and review `client_logs` and Auth audit logs.
