#!/bin/bash
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MOBILE="$(cd "$(dirname "$0")" && pwd)"

echo "Killing old processes..."
lsof -ti:8081,8000 | xargs kill -9 2>/dev/null
sleep 1

# Start API
cd "$ROOT"
bun run dev --filter=@tejadev/api > /tmp/finance-api.log 2>&1 &
echo "API starting..."

# Start Metro in background, wait until it responds
cd "$MOBILE"
npx react-native start --reset-cache > /tmp/metro.log 2>&1 &
METRO_PID=$!

echo "Waiting for Metro..."
until curl -s http://localhost:8081/status | grep -q "running" 2>/dev/null; do
  sleep 2
done
echo "Metro ready!"

# Set ADB tunnels now that Metro is up
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
echo "ADB tunnels set"

# Keep re-setting tunnels whenever phone reconnects
(while true; do
  adb wait-for-device 2>/dev/null
  adb reverse tcp:8081 tcp:8081 2>/dev/null
  adb reverse tcp:8000 tcp:8000 2>/dev/null
  echo "Phone reconnected - tunnels restored"
  sleep 3
done) &

echo ""
echo "Dev environment ready. App will auto-update on every file save."
echo "Metro logs: tail -f /tmp/metro.log"
echo "API logs:   tail -f /tmp/finance-api.log"
echo ""

wait $METRO_PID
