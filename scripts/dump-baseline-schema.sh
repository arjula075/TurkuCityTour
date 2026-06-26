#!/usr/bin/env bash
# Export live Supabase public schema to supabase/migrations/00000_baseline.sql
#
# Option A — Supabase CLI (linked project):
#   supabase link --project-ref <ref>
#   ./scripts/dump-baseline-schema.sh
#
# Option B — inventory from repo migrations (no live DB):
#   node scripts/generate-schema-manifest.mjs
#
# Option C — pg_dump with direct connection:
#   DATABASE_URL='postgresql://...' ./scripts/dump-baseline-schema.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/supabase/migrations/00000_baseline.sql"

if [[ -n "${DATABASE_URL:-}" ]] && command -v pg_dump >/dev/null 2>&1; then
  pg_dump --schema-only --schema=public --no-owner --no-privileges "$DATABASE_URL" > "$OUT"
  echo "Wrote $OUT (pg_dump)"
  exit 0
fi

if command -v supabase >/dev/null 2>&1; then
  supabase db dump --schema public -f "$OUT"
  echo "Wrote $OUT (supabase CLI)"
  exit 0
fi

echo "No pg_dump/supabase CLI — generating inventory manifest instead." >&2
node "$ROOT/scripts/generate-schema-manifest.mjs"
