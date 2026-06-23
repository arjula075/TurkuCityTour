# Supabase schema and migrations

Database policies, RPCs, and views live in Supabase. This folder versions them so security changes are reviewable alongside app code.

## Applying migrations

**Database:** Run each SQL file manually in your Supabase project (SQL Editor or your migration runner). Updating the repo file alone does not change production until you execute it against Supabase.

Recommended order:

1. `migrations/00001_create_user_profile.sql` — harden registration RPC
2. `migrations/00002_submit_answer.sql` — server-authoritative answer validation

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
