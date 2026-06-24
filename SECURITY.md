# Security

TurkuCityTour is a GPS quiz game backed by Supabase. Game integrity is enforced by **RPCs + RLS** (migrations `00001`–`00012`).

See the live [security plan canvas](/Users/ari.lahti/.cursor/projects/Users-ari-lahti-WebstormProjects-TurkuCityTour/canvases/turkucitytour-security-plan.canvas.tsx) for the full audit, open findings, and roadmap.

## Threat model (summary)

Players and admins authenticate via Supabase Auth. Answers, progress, and location guesses are validated server-side via RPCs. Residual risk: **legacy permissive RLS policies**, **give-up client writes**, and **operational** items (Thunderforest key, public signup).

## Controls in place

| Control | Location |
|---------|----------|
| Secret scanner + npm audit | `security.yml` |
| Auth session validation | `AuthContext` → `getUser()` |
| Auth-gated routes | `AuthRoute` on `/map`, `/game-complete`, `/complete`, `/sorry` |
| Server answer validation | `submit_answer` RPC |
| Map-guess validation | `record_location_guess` RPC |
| Walk-phase geofence | `validate_location_arrival` RPC |
| Answers column masking | `answers` view · `00010` |
| Progress integrity | `user_progress` trigger |
| Admin catalog RLS | RESTRICTIVE policies · `00005` |
| Leaderboard admin-only | View wrappers · `00006` |
| Storage folder policies | `storage.objects` · `00012` |
| Client log hardening | `00007` + `logger.js` |
| 25+ RLS integration tests | `test/integration/*.rls.test.js` · PR CI |
| Security headers | `public/_headers`, `vercel.json` |

## Database migrations

| Migration | Purpose |
|-----------|---------|
| `00001`–`00009` | Core remediation (profile, answers RPC, RLS, logs, geofence) |
| `00010` | Mask `is_correct` for non-admin `answers` reads |
| `00011` | `record_location_guess` RPC |
| `00012` | Storage `objects` folder policies |

> **Database:** Apply new SQL manually in Supabase SQL Editor. Merging code alone does not change production.

## Open findings

1. **Legacy permissive RLS** — audit Dashboard for policies that weaken RESTRICTIVE admin rules.
2. **Give-up path** — `handleGiveUp` uses client `updateUserProgress(0)` (low risk).
3. **Baseline schema** — run `scripts/dump-baseline-schema.sh` to commit `00000_baseline.sql`.

## Next steps (Phase 5)

- Audit Supabase Dashboard policies
- Thunderforest referrer restriction
- Verify CSP on live deploy
- Invite-only signup decision
- Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env.test`

## Operational notes

- **Thunderforest:** restrict `VITE_THUNDERFOREST_API_KEY` by HTTP referrer.
- **Signup:** disable public registration in Supabase Auth if invite-only is required.
- **Env vars:** see `.env.example`.

## Reporting

Rotate Supabase keys and review `client_logs` + Auth audit logs after incidents.
