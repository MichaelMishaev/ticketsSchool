#!/bin/bash

# Railway Environment Variables Setup Script
# This script helps configure environment variables for Railway deployment

echo "Setting up Railway environment variables..."

# Database configuration
# Railway provides these automatically, but we need to construct DATABASE_URL
if [ -n "$PGDATABASE" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGHOST" ] && [ -n "$PGPORT" ]; then
    export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
    echo "✅ DATABASE_URL configured from Railway PostgreSQL variables"
fi

# Set default Node environment
export NODE_ENV="${NODE_ENV:-production}"
echo "✅ NODE_ENV set to: $NODE_ENV"

# Set port (Railway provides PORT automatically)
export PORT="${PORT:-3000}"
echo "✅ PORT set to: $PORT"

echo "Environment setup complete!"