#!/bin/bash

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
    else
        echo "❌ ERROR: No database configuration found!"
        echo "   Missing required environment variables."
        exit 1
    fi
fi

# Debug: Show DATABASE_URL format (without password)
echo "📊 Database connection format check:"
echo "$DATABASE_URL" | sed 's/:.*@/:****@/g'

# Generate Prisma client (ensure it's available)
echo "📦 Generating Prisma client..."
if ! npx prisma generate; then
    echo "❌ ERROR: Failed to generate Prisma client"
    exit 1
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
            echo "❌ ERROR: Database migrations failed after $MAX_RETRIES attempts"
            echo "   Continuing with app startup anyway (migrations may already be applied)"
        fi
    fi
done

# Start the application
echo "🌟 Starting Next.js application..."
exec npm start