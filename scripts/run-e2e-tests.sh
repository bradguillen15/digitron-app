#!/usr/bin/env bash
# Runs Playwright with Supabase credentials in the environment (for seed helpers + Vite).
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v supabase >/dev/null 2>&1 && supabase status >/dev/null 2>&1; then
  eval "$(supabase status -o env)"
  export VITE_SUPABASE_URL="$API_URL"
  export VITE_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
  export SUPABASE_URL="$API_URL"
  export SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
  export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
fi

exec pnpm exec playwright test "$@"
