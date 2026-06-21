#!/usr/bin/env bash
# Starts Vite for Playwright with credentials from the local Supabase stack.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "✗ supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

if ! supabase status >/dev/null 2>&1; then
  echo "✗ Local Supabase is not running. Run: pnpm run supabase:start" >&2
  exit 1
fi

eval "$(supabase status -o env)"

export VITE_SUPABASE_URL="$API_URL"
export VITE_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
export SUPABASE_URL="$API_URL"
export SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export CF_WORKERS=0

exec pnpm exec vite dev
