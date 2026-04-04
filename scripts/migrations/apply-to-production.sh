#!/bin/bash
set -e

echo "🔍 Checking production database connection..."

# Get production database URL
PROD_DB_URL=$(railway variables --json --environment production --service Tickets 2>&1 | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('DATABASE_URL', ''))")

if [ -z "$PROD_DB_URL" ]; then
    echo "❌ Could not get production DATABASE_URL"
    exit 1
fi

echo "✅ Connected to production database"
echo ""
echo "📋 Migration Summary:"
echo "  1. Make Registration.phoneNumber nullable (if needed)"
echo "  2. Create TableTemplate table (if not exists)"
echo "  3. Add indexes and foreign keys (if not exist)"
echo ""
echo "⚠️  This migration is IDEMPOTENT - safe to run multiple times"
echo ""
read -p "Apply migration to PRODUCTION? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying migration to production..."

# Apply migration using Docker PostgreSQL client
docker run --rm -i postgres:17 psql "$PROD_DB_URL" < scripts/migrations/sync-dev-to-prod.sql

echo ""
echo "✅ Migration completed successfully!"
