#!/bin/bash

# Kill any process using port 9000
echo "🔍 Checking for processes on port 9000..."

# Find PID of process using port 9000
PID=$(lsof -ti:9000)

if [ -z "$PID" ]; then
  echo "✅ Port 9000 is free"
else
  echo "🔪 Killing process $PID on port 9000..."
  kill -9 $PID
  echo "✅ Process killed"
  # Wait a moment for the port to be released
  sleep 1
fi

# Start the dev server
echo "🚀 Starting dev server on port 9000..."
npm run dev
