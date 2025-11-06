#!/bin/bash

set -x  # Enable debug mode to see every command

echo "========================================"
echo "🚀 RAILWAY DEPLOYMENT - STARTUP LOG"
echo "========================================"
echo "Timestamp: $(date)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""
echo "ENVIRONMENT VARIABLES:"
echo "  NODE_ENV=${NODE_ENV:-not set}"
echo "  PORT=${PORT:-not set}"
echo "  DATABASE_URL=${DATABASE_URL:+[SET - $(echo $DATABASE_URL | sed 's/:.*@/:****@/g')]}"
echo "  DATABASE_URL=${DATABASE_URL:-[NOT SET]}"
echo ""
echo "DIRECTORY CONTENTS:"
ls -la
echo ""
echo "CHECKING .next BUILD:"
ls -la .next/ 2>/dev/null || echo ".next directory not found!"
echo "========================================"
echo ""

# Ensure PORT is set
if [ -z "$PORT" ]; then
    echo "⚠️  PORT not set, using default 3000"
    export PORT=3000
fi

echo "📊 Using PORT: $PORT"

# Database setup (skip on first attempt to test basic startup)
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set"

    # Only run migrations if explicitly enabled
    if [ "$RUN_MIGRATIONS" = "true" ]; then
        echo "🗃️  Running migrations (RUN_MIGRATIONS=true)..."
        npx prisma generate || echo "⚠️  Prisma generate failed"
        npx prisma migrate deploy || echo "⚠️  Migrations failed, continuing..."
    else
        echo "⏭️  Skipping migrations (set RUN_MIGRATIONS=true to enable)"
    fi
else
    echo "⚠️  No DATABASE_URL set - skipping database operations"
fi

echo ""
echo "========================================"
echo "🌟 STARTING NEXT.JS SERVER"
echo "========================================"
echo "Command: node_modules/.bin/next start -p $PORT"
echo "Starting at: $(date)"
echo "========================================"
echo ""

# Start Next.js directly (not through npm to avoid wrapper issues)
# Bind to 0.0.0.0 for Railway to access from outside container
exec node_modules/.bin/next start -H 0.0.0.0 -p $PORT