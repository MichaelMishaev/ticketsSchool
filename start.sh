#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Set up Railway environment variables if available
if [ -n "$PGDATABASE" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGHOST" ] && [ -n "$PGPORT" ]; then
    export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
    echo "✅ DATABASE_URL configured from Railway PostgreSQL variables"
else
    echo "⚠️  Using existing DATABASE_URL"
fi

# Generate Prisma client (ensure it's available)
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting Next.js application..."
npm start