#!/usr/bin/env bash
# Export live Supabase public schema to supabase/migrations/00000_baseline.sql
# Requires Supabase CLI linked to the project: supabase link --project-ref <ref>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/supabase/migrations/00000_baseline.sql"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Install Supabase CLI: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

supabase db dump --schema public -f "$OUT"
echo "Wrote $OUT"
echo "Review and commit. Do not include secrets or service-role grants you do not intend to version."
