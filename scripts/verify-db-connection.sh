#!/bin/bash

# Script to verify which database the service is connected to
# Run this script from the project root

echo "🔍 Verifying Database Connection..."
echo ""

echo "📊 Current Railway Variables:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get current variables
DATABASE_URL=$(railway variables --kv | grep "^DATABASE_URL=" | cut -d'=' -f2-)
PGHOST=$(railway variables --kv | grep "^PGHOST=" | cut -d'=' -f2-)
PGPASSWORD=$(railway variables --kv | grep "^PGPASSWORD=" | cut -d'=' -f2-)

echo ""
echo "DATABASE_URL:"
if [[ $DATABASE_URL == *"postgres-copy"* ]]; then
    echo "  ✅ Connected to QA Database (postgres-copy)"
elif [[ $DATABASE_URL == *"postgres.railway.internal"* ]]; then
    echo "  ⚠️  Connected to Production Database (postgres)"
else
    echo "  ❓ Unknown database"
fi
echo "  $DATABASE_URL"

echo ""
echo "PGHOST:"
if [[ $PGHOST == "postgres-copy.railway.internal" ]]; then
    echo "  ✅ QA Database"
elif [[ $PGHOST == "postgres.railway.internal" ]]; then
    echo "  ⚠️  Production Database"
fi
echo "  $PGHOST"

echo ""
echo "PGPASSWORD:"
if [[ $PGPASSWORD == "bgK0chFyHNPbUGztqRzYGl0RzCTVchrf" ]]; then
    echo "  ✅ QA Database password"
elif [[ $PGPASSWORD == "fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt" ]]; then
    echo "  ⚠️  Production Database password"
fi
echo "  ${PGPASSWORD:0:20}..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test connection
echo "🧪 Testing Database Connection..."
railway run npx prisma db execute --stdin <<< "SELECT current_database(), version();" 2>&1 | head -5

echo ""
echo "✨ Verification complete!"
