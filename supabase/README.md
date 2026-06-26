# Supabase schema and migrations

Database policies, RPCs, and views live in Supabase. This folder versions them so security changes are reviewable alongside app code.

## Applying migrations

**Database:** Run each SQL file manually in your Supabase project (SQL Editor or your migration runner). Updating the repo file alone does not change production until you execute it against Supabase.

Recommended order:

0. `migrations/00000_baseline.sql` — schema inventory (reference only; do not apply)
1. `migrations/00001_create_user_profile.sql` — harden registration RPC
2. `migrations/00002_submit_answer.sql` — server-authoritative answer validation
3. `migrations/00003_is_admin_helper.sql` — `is_admin()` helper for policies
4. `migrations/00004_user_progress_integrity.sql` — progress trigger + RLS (replaces `submit_answer` body)
5. `migrations/00005_admin_table_rls.sql` — admin-only catalog mutations + `users` escalation trigger
6. `migrations/00006_leaderboard_admin_only.sql` — admin-only leaderboard views (wraps views; safe to re-run)
7. `migrations/00007_client_logs_hardening.sql` — log insert policy + rate limit
8. `migrations/00008_validate_location_arrival.sql` — server-side geofence RPC
9. `migrations/00009_user_progress_trigger_service_role.sql` — allow service-role fixture seeding
10. `migrations/00010_answers_mask_is_correct.sql` — mask `is_correct` for non-admin reads
11. `migrations/00011_record_location_guess.sql` — server-validated map-click guess
12. `migrations/00012_storage_policies.sql` — storage.objects folder-scoped access
13. `migrations/00013_submit_answer_use_answers_data.sql` — fix submit_answer after answers view (run after 00010)
14. `migrations/00014_drop_legacy_write_policies.sql` — remove legacy permissive catalog write policies
15. `migrations/00015_record_give_up.sql` — server-validated give-up (hints_used = 0)
16. `migrations/00016_multi_tenant_schema.sql` — organizations, subscriptions, members, `games.owner_org_id`, rename `is_platform_admin`
17. `migrations/00017_org_tenancy_rls.sql` — org-scoped catalog RLS, subscription limits, tenancy helpers
18. `migrations/00018_fixup_platform_admin_functions.sql` — repair `is_admin()` after column rename (run if you see `column "is_admin" does not exist`)
19. `migrations/00019_drop_legacy_is_admin_policies.sql` — remove dashboard policies still referencing `users.is_admin`
20. `migrations/00020_rebuild_rls_policies.sql` — drop all core RLS policies and recreate (fixes stale `is_admin` refs)

## Auditing RLS

After applying `00014`, run `scripts/audit-rls.sql` in the SQL Editor. Any remaining rows are policies outside the `turkucitytour_*` set — review before dropping manually.

## Exporting the live schema (baseline)

`migrations/00000_baseline.sql` is a **schema inventory** (tables, views, functions, policies) for PR review. Regenerate after schema changes:

```bash
npm run schema:manifest
```

For a full DDL dump from live Supabase:

```bash
# Supabase CLI linked to project
./scripts/dump-baseline-schema.sh

# Or with direct Postgres URL
DATABASE_URL='postgresql://...' ./scripts/dump-baseline-schema.sh
```

Incremental migrations `00001` onward are authoritative for security hardening.

## Tables referenced by the app

| Table / view | Purpose |
|--------------|---------|
| `users` | Profile (`first_name`, `last_name`, `is_platform_admin`, `message`) |
| `organizations` | Host tenant (name, `stripe_customer_id`) |
| `subscriptions` | Per-org plan (`status`, `tier`, `max_games`, `max_players`) |
| `organization_members` | User ↔ org membership (`owner`, `member`) |
| `games` | Tour definitions (`owner_org_id`) |
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
| `validate_location_arrival(...)` | `MapView` walk phase | Returns `{ arrived, distance_m }` |
| `record_location_guess(...)` | `MapView` map-click guess | Returns `{ accepted, distance_m, hints_used }` |
| `record_give_up(p_location_id)` | `MapView` give-up | Returns `{ hints_used: 0 }` |
| `is_admin()` | RLS policies | Alias for `is_platform_admin()` — platform operator |
| `is_platform_admin()` | RLS policies | Whether `auth.uid()` has `users.is_platform_admin` |
| `is_org_owner(org_id)` | RLS / limits | Whether `auth.uid()` owns the organization |
| `can_org_create_game(org_id)` | Game insert | Subscription active and under `max_games` |
| `can_org_add_player_to_game(game_id)` | `game_players` insert | Under `max_players` for the game's org |
