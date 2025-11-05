#!/bin/bash

echo "🚀 Starting production deployment..."
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   PORT: ${PORT:-3000}"

# Railway provides DATABASE_URL directly, no need to construct it
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Using Railway-provided DATABASE_URL"
    # Debug: Show DATABASE_URL format (without password)
    echo "📊 Database connection format check:"
    echo "$DATABASE_URL" | sed 's/:.*@/:****@/g'

    DB_AVAILABLE=true
elif [ -n "$PGDATABASE" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGHOST" ] && [ -n "$PGPORT" ]; then
    echo "⚠️  No DATABASE_URL found - constructing from PG variables"
    # Use the public URL for migrations (Railway's internal URL might not work for Prisma migrations)
    export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require"
    echo "✅ DATABASE_URL constructed from PostgreSQL variables"
    echo "📊 Database connection format check:"
    echo "$DATABASE_URL" | sed 's/:.*@/:****@/g'

    DB_AVAILABLE=true
else
    echo "⚠️  WARNING: No database configuration found!"
    echo "   Application will start without database access."
    echo "   Make sure DATABASE_URL is set in Railway environment variables."
    DB_AVAILABLE=false
fi

# Only run database operations if database is available
if [ "$DB_AVAILABLE" = true ]; then
    # Generate Prisma client (ensure it's available)
    echo "📦 Generating Prisma client..."
    if ! npx prisma generate; then
        echo "❌ ERROR: Failed to generate Prisma client"
        echo "   Continuing anyway..."
    fi

    # Run database migrations with retry logic
    echo "🗃️  Running database migrations..."
    MAX_RETRIES=3
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if npx prisma migrate deploy; then
            echo "✅ Database migrations completed successfully"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "⚠️  Migration failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
                sleep 5
            else
                echo "⚠️  Database migrations failed after $MAX_RETRIES attempts"
                echo "   Continuing with app startup (migrations may already be applied)"
                break
            fi
        fi
    done
else
    echo "⏭️  Skipping Prisma client generation and migrations (no database configured)"
fi

# Start the application
echo "🌟 Starting Next.js application..."
echo "   Port: ${PORT:-3000}"
echo "   Node version: $(node --version)"
echo "   Environment: ${NODE_ENV:-production}"

# Use Railway's PORT or default to 3000
exec npm start -- -p ${PORT:-3000}