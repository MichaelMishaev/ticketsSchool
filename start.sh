#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Railway provides DATABASE_URL directly, no need to construct it
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Using Railway-provided DATABASE_URL"
else
    echo "⚠️  No DATABASE_URL found - setting from PG variables"
    # Fallback: construct from individual variables if needed
    if [ -n "$PGDATABASE" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGHOST" ] && [ -n "$PGPORT" ]; then
        # Use the public URL for migrations (Railway's internal URL might not work for Prisma migrations)
        export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require"
        echo "✅ DATABASE_URL constructed from PostgreSQL variables"
    fi
fi

# Debug: Show DATABASE_URL format (without password)
echo "📊 Database connection format check:"
echo "$DATABASE_URL" | sed 's/:.*@/:****@/g'

# Generate Prisma client (ensure it's available)
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting Next.js application..."
npm start