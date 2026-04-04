#!/usr/bin/env bash
# payment-tunnel.sh
#
# Starts a cloudflared tunnel and patches .env.local so the real HYP payment
# gateway can reach your local server for testing.
# .env.local has highest priority in Next.js — it overrides .env.
#
# Usage:
#   ./scripts/payment-tunnel.sh          # start tunnel + enable real payments
#   ./scripts/payment-tunnel.sh --stop   # restore mock mode

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_ENV="$ROOT/.env.local"

restore_mock() {
  echo ""
  echo "Restoring .env.local to mock mode..."
  sed -i '' 's|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL="http://localhost:9000"|' "$LOCAL_ENV"
  sed -i '' 's|^YAADPAY_MOCK_MODE=.*|YAADPAY_MOCK_MODE="true"|' "$LOCAL_ENV"
  echo "✅  Mock mode restored. Restart the dev server."
}

if [[ "${1:-}" == "--stop" ]]; then
  restore_mock
  exit 0
fi

# Trap Ctrl-C so we always restore mock mode on exit
trap restore_mock INT TERM EXIT

echo "Starting cloudflared tunnel on port 9000..."
echo "(Press Ctrl-C to stop and restore mock mode)"
echo ""

# Launch tunnel in background, capturing its log output to extract the URL
TUNNEL_LOG=$(mktemp)
cloudflared tunnel --url http://localhost:9000 --no-autoupdate 2>"$TUNNEL_LOG" &
TUNNEL_PID=$!

# Wait for the public URL to appear in the log (up to 15 seconds)
PUBLIC_URL=""
for i in $(seq 1 30); do
  PUBLIC_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 || true)
  [[ -n "$PUBLIC_URL" ]] && break
  sleep 0.5
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "❌  Could not detect tunnel URL after 15s. Check cloudflared output:"
  cat "$TUNNEL_LOG"
  kill "$TUNNEL_PID" 2>/dev/null || true
  exit 1
fi

echo "✅  Tunnel active: $PUBLIC_URL"
echo ""

# Patch .env.local (highest Next.js priority — overrides .env)
sed -i '' "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=\"$PUBLIC_URL\"|" "$LOCAL_ENV"
sed -i '' 's|^YAADPAY_MOCK_MODE=.*|YAADPAY_MOCK_MODE="false"|' "$LOCAL_ENV"

echo "✅  .env.local patched:"
echo "    NEXT_PUBLIC_BASE_URL=$PUBLIC_URL"
echo "    YAADPAY_MOCK_MODE=false"
echo ""
echo "👉  Restart the dev server now: npm run dev"
echo "    Payments will hit the real HYP gateway and callback to $PUBLIC_URL"
echo ""
echo "Keeping tunnel alive... (Ctrl-C to stop)"
wait "$TUNNEL_PID"
