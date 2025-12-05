#!/bin/bash

# Script to switch Tickets_Pre_Prod service BACK to Production database
# Run this script from the project root

echo "🔄 Switching Tickets_Pre_Prod BACK to Production Database..."
echo ""

# Production Database credentials (postgres)
PROD_DATABASE_URL="postgresql://postgres:fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt@postgres.railway.internal:5432/railway"
PROD_PGHOST="postgres.railway.internal"
PROD_PGPASSWORD="fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt"

echo "📋 Variables to update:"
echo "  - DATABASE_URL"
echo "  - PGHOST"
echo "  - PGPASSWORD"
echo "  - DATABASE_PUBLIC_URL (will be removed)"
echo ""

# Confirm before proceeding
read -p "⚠️  This will restore PRODUCTION database connection. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo ""
echo "🚀 Updating variables..."

# Update all variables at once
echo "  → Setting all database variables..."
railway variables \
  --set "DATABASE_URL=$PROD_DATABASE_URL" \
  --set "PGHOST=$PROD_PGHOST" \
  --set "PGPASSWORD=$PROD_PGPASSWORD"

# Note: DATABASE_PUBLIC_URL can be manually removed if needed

echo ""
echo "✅ Variables updated successfully!"
echo ""
echo "⚠️  Manual cleanup:"
echo "  - Remove DATABASE_PUBLIC_URL variable manually in Railway dashboard (if exists)"
echo ""
echo "📊 Next steps:"
echo "  1. Railway will automatically redeploy the service"
echo "  2. Wait for deployment to complete"
echo "  3. Verify connection: railway run npx prisma db push"
echo ""
echo "✨ Done!"
