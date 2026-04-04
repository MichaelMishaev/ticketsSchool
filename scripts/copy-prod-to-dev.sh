#!/bin/bash
set -e

echo "🚀 Copy Production Data to Development"
echo "======================================"
echo ""
echo "⚠️  WARNING: This will REPLACE all data in development with production data!"
echo ""
echo "What will be copied:"
echo "  • All schools"
echo "  • All admins and team invitations"
echo "  • All events, tables, and registrations"
echo "  • All usage records"
echo "  • OAuth states and feedback"
echo ""
read -p "Continue? Type 'yes' to proceed: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "📊 Step 1: Getting database connections..."

# Get production DATABASE_URL
PROD_DB="postgresql://postgres:fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt@crossover.proxy.rlwy.net:41359/railway"

# Get development DATABASE_URL
DEV_DB=$(railway variables --json --environment development --service ticketsSchool 2>&1 | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('DATABASE_URL', ''))")

if [ -z "$DEV_DB" ]; then
    echo "❌ Could not get development DATABASE_URL"
    exit 1
fi

echo "✅ Connected to both databases"
echo ""
echo "📊 Step 2: Counting production data..."

docker run --rm postgres:17 psql "$PROD_DB" <<'EOSQL'
SELECT 
    'Schools' as table_name, COUNT(*) as count FROM "School"
UNION ALL SELECT 'Admins', COUNT(*) FROM "Admin"
UNION ALL SELECT 'Events', COUNT(*) FROM "Event"
UNION ALL SELECT 'Tables', COUNT(*) FROM "Table"
UNION ALL SELECT 'Registrations', COUNT(*) FROM "Registration"
UNION ALL SELECT 'TeamInvitations', COUNT(*) FROM "TeamInvitation"
UNION ALL SELECT 'UsageRecords', COUNT(*) FROM "UsageRecord"
ORDER BY table_name;
EOSQL

echo ""
read -p "Copy this data to development? (yes/no): " confirm2

if [ "$confirm2" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🗑️  Step 3: Clearing development database..."

# Clear development data in correct order (respecting foreign keys)
railway ssh --environment development --service ticketsSchool 'psql $DATABASE_URL' <<'EOSQL'
-- Disable triggers temporarily for faster deletion
SET session_replication_role = replica;

-- Delete in order (child tables first)
TRUNCATE TABLE "Registration" CASCADE;
TRUNCATE TABLE "Table" CASCADE;
TRUNCATE TABLE "TableTemplate" CASCADE;
TRUNCATE TABLE "Event" CASCADE;
TRUNCATE TABLE "TeamInvitation" CASCADE;
TRUNCATE TABLE "UsageRecord" CASCADE;
TRUNCATE TABLE "OAuthState" CASCADE;
TRUNCATE TABLE "Feedback" CASCADE;
TRUNCATE TABLE "Log" CASCADE;
TRUNCATE TABLE "Admin" CASCADE;
TRUNCATE TABLE "School" CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

SELECT 'Development database cleared' as status;
EOSQL

echo "✅ Development cleared"
echo ""
echo "📥 Step 4: Dumping production data..."

# Dump only data (no schema) from production
docker run --rm postgres:17 pg_dump \
    "$PROD_DB" \
    --data-only \
    --no-owner \
    --no-acl \
    --inserts \
    --column-inserts \
    -t "School" \
    -t "Admin" \
    -t "Event" \
    -t "Table" \
    -t "Registration" \
    -t "TeamInvitation" \
    -t "UsageRecord" \
    -t "OAuthState" \
    -t "Feedback" \
    -t "Log" \
    > /tmp/prod-data-dump.sql

echo "✅ Production data dumped ($(wc -l < /tmp/prod-data-dump.sql) lines)"
echo ""
echo "📤 Step 5: Importing to development..."

# Import to development
railway ssh --environment development --service ticketsSchool 'psql $DATABASE_URL' < /tmp/prod-data-dump.sql

echo ""
echo "🔍 Step 6: Verifying import..."

railway ssh --environment development --service ticketsSchool 'psql $DATABASE_URL' <<'EOSQL'
SELECT 
    'Schools' as table_name, COUNT(*) as count FROM "School"
UNION ALL SELECT 'Admins', COUNT(*) FROM "Admin"
UNION ALL SELECT 'Events', COUNT(*) FROM "Event"
UNION ALL SELECT 'Tables', COUNT(*) FROM "Table"
UNION ALL SELECT 'Registrations', COUNT(*) FROM "Registration"
UNION ALL SELECT 'TeamInvitations', COUNT(*) FROM "TeamInvitation"
UNION ALL SELECT 'UsageRecords', COUNT(*) FROM "UsageRecord"
ORDER BY table_name;
EOSQL

echo ""
echo "✅ Data copy completed successfully!"
echo ""
echo "🎉 You can now access development at: https://dev.kartis.info"
echo "   Your account (345287@gmail.com) should now have access to all production schools and data"
echo ""
echo "🧹 Cleaning up..."
rm /tmp/prod-data-dump.sql

