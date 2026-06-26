# Security

TurkuCityTour is a GPS quiz game backed by Supabase. Game integrity is enforced by **RPCs + RLS** (migrations `00000`–`00020`).

See the live [security plan canvas](/Users/ari.lahti/.cursor/projects/Users-ari-lahti-WebstormProjects-TurkuCityTour/canvases/turkucitytour-security-plan.canvas.tsx) for the full audit and roadmap.

## Threat model (summary)

Players and admins authenticate via Supabase Auth. Org hosts manage games within subscription limits. Answers, progress, location guesses, and give-up actions are validated server-side via RPCs. Residual risk is mainly **operational** (Thunderforest key referrer, public signup default, CSP verification on live host).

## Controls in place

| Control | Location |
|---------|----------|
| Schema inventory | `00000_baseline.sql` · `npm run schema:manifest` |
| Secret scanner + npm audit | `security.yml` |
| Auth session validation | `AuthContext` → `getUser()` |
| Auth-gated routes | `AuthRoute` on `/map`, `/game-complete`, `/complete`, `/sorry` |
| Invite-only registration flag | `VITE_ENABLE_REGISTRATION=false` + Supabase Auth |
| Multi-tenant org RLS | `00016`–`00020` · org-scoped catalog + subscription limits |
| Server answer validation | `submit_answer` RPC |
| Map-guess validation | `record_location_guess` RPC |
| Give-up validation | `record_give_up` RPC |
| Walk-phase geofence | `validate_location_arrival` RPC |
| Answers column masking | `answers` view · `00010` |
| Progress integrity | `user_progress` trigger |
| Platform admin RLS rebuild | `00020_rebuild_rls_policies.sql` |
| Leaderboard admin-only | View wrappers · `00006` |
| Storage folder policies | `storage.objects` · `00012` |
| Client log hardening | `00007` + `logger.js` |
| 36 RLS integration tests | `test/integration/*.rls.test.js` · PR CI |
| Security headers | `public/_headers`, `vercel.json` |
| Header verification script | `npm run security:verify-headers` |

## Database migrations

| Migration | Purpose |
|-----------|---------|
| `00000` | Schema inventory manifest (reference; do not apply) |
| `00001`–`00009` | Core remediation (profile, answers RPC, RLS, logs, geofence) |
| `00010`–`00015` | Answers masking, guess/give-up RPCs, storage, legacy write cleanup |
| `00016`–`00020` | Multi-tenant schema, org RLS, platform admin rebuild |

> **Database:** Apply new SQL manually in Supabase SQL Editor. Merging code alone does not change production.

## Operational checklist

| Task | How |
|------|-----|
| Regenerate schema inventory | `npm run schema:manifest` after migration changes |
| Full DDL dump (optional) | `./scripts/dump-baseline-schema.sh` with Supabase CLI or `DATABASE_URL` |
| RLS audit | `scripts/audit-rls.sql` in SQL Editor |
| Integration test secrets | `.env.test.example` → `.env.test` |
| Thunderforest key | Restrict `VITE_THUNDERFOREST_API_KEY` by HTTP referrer |
| CSP on production | `DEPLOY_URL=https://… npm run security:verify-headers` |
| Invite-only signup | `VITE_ENABLE_REGISTRATION=false` + disable Auth signup |

## Reporting

Rotate Supabase keys and review `client_logs` + Auth audit logs after incidents.
