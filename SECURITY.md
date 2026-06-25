# Security

TurkuCityTour is a GPS quiz game backed by Supabase. Game integrity is enforced by **RPCs + RLS** (migrations `00001`–`00015`).

See the live [security plan canvas](/Users/ari.lahti/.cursor/projects/Users-ari-lahti-WebstormProjects-TurkuCityTour/canvases/turkucitytour-security-plan.canvas.tsx) for the full audit and roadmap.

## Threat model (summary)

Players and admins authenticate via Supabase Auth. Answers, progress, location guesses, and give-up actions are validated server-side via RPCs. Residual risk is mainly **operational** (Thunderforest key, public signup, CSP on live host).

## Controls in place

| Control | Location |
|---------|----------|
| Secret scanner + npm audit | `security.yml` |
| Auth session validation | `AuthContext` → `getUser()` |
| Auth-gated routes | `AuthRoute` on `/map`, `/game-complete`, `/complete`, `/sorry` |
| Invite-only registration flag | `VITE_ENABLE_REGISTRATION=false` + Supabase Auth |
| Server answer validation | `submit_answer` RPC |
| Map-guess validation | `record_location_guess` RPC |
| Give-up validation | `record_give_up` RPC |
| Walk-phase geofence | `validate_location_arrival` RPC |
| Answers column masking | `answers` view · `00010` |
| Progress integrity | `user_progress` trigger |
| Admin catalog RLS | RESTRICTIVE policies · `00005` |
| Legacy write policy cleanup | `00014` |
| Leaderboard admin-only | View wrappers · `00006` |
| Storage folder policies | `storage.objects` · `00012` |
| Client log hardening | `00007` + `logger.js` |
| 29 RLS integration tests | `test/integration/*.rls.test.js` · PR CI |
| Security headers | `public/_headers`, `vercel.json` |
| Header verification script | `npm run security:verify-headers` |

## Database migrations

| Migration | Purpose |
|-----------|---------|
| `00001`–`00009` | Core remediation (profile, answers RPC, RLS, logs, geofence) |
| `00010` | Mask `is_correct` for non-admin `answers` reads |
| `00011` | `record_location_guess` RPC |
| `00012` | Storage `objects` folder policies |
| `00013` | Fix `submit_answer` to join `answers_data` |
| `00014` | Drop legacy permissive write policies on catalog tables |
| `00015` | `record_give_up` RPC |

> **Database:** Apply new SQL manually in Supabase SQL Editor. Merging code alone does not change production.

## Phase 5 operational checklist

| Task | How |
|------|-----|
| Baseline schema | `scripts/dump-baseline-schema.sh` → commit `00000_baseline.sql` |
| RLS audit | Run `scripts/audit-rls.sql` in SQL Editor after `00014` |
| Integration test secrets | Copy `.env.test.example` → `.env.test` (no `VITE_` service role) |
| Thunderforest key | Restrict `VITE_THUNDERFOREST_API_KEY` by HTTP referrer in provider dashboard |
| CSP on production | `DEPLOY_URL=https://… npm run security:verify-headers` or set `DEPLOY_URL` GitHub secret |
| Invite-only signup | `VITE_ENABLE_REGISTRATION=false` **and** disable signup in Supabase Auth → Providers |
| Auth abuse | Enable Supabase CAPTCHA or rate limits if registration spam appears |

## Reporting

Rotate Supabase keys and review `client_logs` + Auth audit logs after incidents.
