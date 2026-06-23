# Supabase schema and migrations

Database policies, RPCs, and views live in Supabase. This folder versions them so security changes are reviewable alongside app code.

## Applying migrations

**Database:** Run each SQL file manually in your Supabase project (SQL Editor or your migration runner). Updating the repo file alone does not change production until you execute it against Supabase.

Recommended order:

1. `migrations/00001_create_user_profile.sql` — harden registration RPC
2. `migrations/00002_submit_answer.sql` — server-authoritative answer validation
3. `migrations/00003_is_admin_helper.sql` — `is_admin()` helper for policies
4. `migrations/00004_user_progress_integrity.sql` — progress trigger + RLS (replaces `submit_answer` body)
5. `migrations/00005_admin_table_rls.sql` — admin-only catalog mutations + `users` escalation trigger
6. `migrations/00006_leaderboard_admin_only.sql` — admin-only leaderboard views (wraps views; safe to re-run)
7. `migrations/00007_client_logs_hardening.sql` — log insert policy + rate limit
8. `migrations/00008_validate_location_arrival.sql` — server-side geofence RPC

## Exporting the live schema (one-time baseline)

If your project predates this folder, capture the current state from the Supabase Dashboard:

1. **Database → Schema visualizer** or **SQL Editor** — note tables, views, and functions.
2. With [Supabase CLI](https://supabase.com/docs/guides/cli) linked to the project:
   ```bash
   supabase db dump --schema public -f supabase/migrations/00000_baseline.sql
   ```
3. Commit the dump, then apply incremental migrations from `00001` onward.

## Tables referenced by the app

| Table / view | Purpose |
|--------------|---------|
| `users` | Profile (`first_name`, `last_name`, `is_admin`, `message`) |
| `games` | Tour definitions |
| `game_players` | Player ↔ game assignments |
| `locations` | GPS stops per game |
| `hints` | Hint text per location |
| `questions` | Quiz per location |
| `answers` | Multiple-choice options |
| `user_progress` | Per-user location progress |
| `images` | User-uploaded media metadata |
| `client_logs` | Client-side event log |
| `hint_results`, `correct_answer_results`, `calculate_user_points` | Leaderboard views |

## RPCs

| Function | Called from | Notes |
|----------|-------------|-------|
| `create_user_profile(first_name, last_name)` | `Register.jsx` | Must use `auth.uid()` — never trust client `uid` |
| `submit_answer(p_question_id, p_answer_id)` | `useAnswerSubmission` | Returns `{ is_correct }` only; updates `user_progress` |
| `validate_location_arrival(p_location_id, p_latitude, p_longitude, p_tolerance_meters)` | `MapView` walk phase | Returns `{ arrived, distance_m }` |
| `is_admin()` | RLS policies | Returns whether `auth.uid()` has `users.is_admin` |
