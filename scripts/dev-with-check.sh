#!/bin/bash

# Kill any process using port 9000
echo "🔍 Checking for processes on port 9000..."
PID=$(lsof -ti:9000)

if [ -z "$PID" ]; then
  echo "✅ Port 9000 is free"
else
  echo "🔪 Killing process $PID on port 9000..."
  kill -9 $PID
  echo "✅ Process killed"
  sleep 1
fi

# Clear Next.js cache
echo "🧹 Clearing .next cache..."
rm -rf .next

# Start the dev server
echo "🚀 Starting dev server on port 9000..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:9000/api/health > /dev/null 2>&1; then
    echo ""
    echo "✅ ✅ ✅ SERVER IS READY! ✅ ✅ ✅"
    echo ""
    echo "🌐 Open: http://localhost:9000"
    echo "🏥 Health: http://localhost:9000/api/health"
    echo ""
    echo "Press Ctrl+C to stop the server"
    wait $DEV_PID
    exit 0
  fi
  sleep 1
done

echo "❌ Server didn't start in 30 seconds"
kill -9 $DEV_PID 2>/dev/null
exit 1
