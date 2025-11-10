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

    # Always run migrations in production (unless explicitly disabled)
    if [ "$SKIP_MIGRATIONS" != "true" ]; then
        echo "🗃️  Running migrations..."
        npx prisma generate || echo "⚠️  Prisma generate failed"

        # Try to run migrations (capture exit code properly)
        set +e  # Temporarily disable exit on error
        npx prisma migrate deploy
        MIGRATION_EXIT_CODE=$?
        set -e  # Re-enable exit on error

        # If migrations fail, try to fix failed migrations and retry
        if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
            echo "⚠️  Initial migration failed (exit code: $MIGRATION_EXIT_CODE)"
            echo "🔧 Attempting to fix all failed migrations..."

            # Fix data issues FIRST before anything else
            echo "🔧 Step 1: Fixing data integrity issues and removing failed migration records..."
            if [ -f "scripts/fix-events-school-id.sql" ]; then
                echo "Running comprehensive data fix script using psql..."
                if [ -n "$DATABASE_URL" ]; then
                    if psql "$DATABASE_URL" -f scripts/fix-events-school-id.sql; then
                        echo "✅ Data fix completed successfully!"

                        # Since we manually applied the changes, mark ALL affected migrations as applied
                        echo "🔧 Step 2: Marking migrations as manually applied..."
                        npx prisma migrate resolve --applied 20251107211615_add_multi_school_support || echo "Could not mark multi_school migration"
                        npx prisma migrate resolve --applied 20251107_add_spots_reserved || echo "Could not mark spots_reserved migration"
                        echo "✅ Migrations marked as applied"
                    else
                        echo "⚠️  Data fix script failed"
                    fi
                else
                    echo "❌ DATABASE_URL not set, cannot run SQL fix"
                fi
            else
                echo "⚠️  Data fix script not found at scripts/fix-events-school-id.sql"
                # Fallback: try to mark migrations as rolled back
                FAILED_MIGRATIONS=(
                    "20250920000000_allow_multiple_registrations_per_phone"
                    "20251107211615_add_multi_school_support"
                    "20251107_add_spots_reserved"
                )

                for migration in "${FAILED_MIGRATIONS[@]}"; do
                    echo "Attempting to resolve migration: $migration"
                    npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null || true
                done
            fi

            # Retry migrations up to 3 times
            RETRY_COUNT=0
            MAX_RETRIES=3
            while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                RETRY_COUNT=$((RETRY_COUNT + 1))
                echo "🔄 Retry attempt $RETRY_COUNT of $MAX_RETRIES..."

                set +e
                npx prisma migrate deploy
                RETRY_EXIT_CODE=$?
                set -e

                if [ $RETRY_EXIT_CODE -eq 0 ]; then
                    echo "✅ Migrations completed successfully on retry $RETRY_COUNT"
                    break
                else
                    echo "⚠️  Retry $RETRY_COUNT failed"
                    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                        echo "Waiting 5 seconds before next retry..."
                        sleep 5
                    fi
                fi
            done

            if [ $RETRY_EXIT_CODE -ne 0 ]; then
                echo "❌ All migration retries failed, continuing anyway..."
            fi
        else
            echo "✅ Migrations completed successfully"
        fi
    else
        echo "⏭️  Skipping migrations (SKIP_MIGRATIONS=true)"
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