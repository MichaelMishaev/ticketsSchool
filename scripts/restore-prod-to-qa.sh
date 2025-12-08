#!/bin/bash

# Restore Production Backup to QA Database
# This script restores the production backup to QA for testing

set -e

echo "🔄 Production → QA Database Restore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
BACKUP_FILE="backups/production/backup_20251205_215611.sql"
QA_DB_URL="$1"

# Validate inputs
if [ -z "$QA_DB_URL" ]; then
    echo "❌ Error: QA database URL required"
    echo ""
    echo "Usage:"
    echo "  $0 <QA_DATABASE_URL>"
    echo ""
    echo "Example:"
    echo "  $0 'postgresql://postgres:PASSWORD@hopper.proxy.rlwy.net:PORT/railway'"
    echo ""
    echo "Get the QA DATABASE_PUBLIC_URL from:"
    echo "  Railway Dashboard → db dev → Variables tab"
    echo ""
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "📦 Source: $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))"
echo "🎯 Target: QA Database (postgres-copy)"
echo ""

# Confirm
read -p "⚠️  This will REPLACE all data in QA database. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled."
    exit 1
fi

echo ""
echo "🗄️ Restoring..."

# Restore using Docker (ensures PostgreSQL 17 compatibility)
cat "$BACKUP_FILE" | docker run --rm -i postgres:17-alpine psql "$QA_DB_URL"

echo ""
echo "✅ Restore completed!"
echo ""

# Verify
echo "📊 Verifying data..."
docker run --rm postgres:17-alpine psql "$QA_DB_URL" -c "\dt" | grep -E "(Admin|Event|Registration|School)"

echo ""
echo "🎉 Production data successfully restored to QA!"
echo ""
echo "Next steps:"
echo "  1. Verify data: Check Railway → db dev → Database → Data"
echo "  2. Test features: Use QA database for testing"
echo "  3. Create backup: ./scripts/backup-qa-db-simple.sh"
echo ""
