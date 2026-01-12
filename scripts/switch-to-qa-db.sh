#!/bin/bash

# Script to switch Tickets_Pre_Prod service to QA database (postgres-copy)
# Run this script from the project root

echo "🔄 Switching Tickets_Pre_Prod to QA Database (postgres-copy)..."
echo ""

# QA Database credentials (postgres-copy)
QA_DATABASE_URL="postgresql://postgres:bgK0chFyHNPbUGztqRzYGl0RzCTVchrf@postgres-copy.railway.internal:5432/railway"
QA_DATABASE_PUBLIC_URL="postgresql://postgres:bgK0chFyHNPbUGztqRzYGl0RzCTVchrf@hopper.proxy.rlwy.net:36617/railway"
QA_PGHOST="postgres-copy.railway.internal"
QA_PGPASSWORD="bgK0chFyHNPbUGztqRzYGl0RzCTVchrf"

echo "📋 Variables to update:"
echo "  - DATABASE_URL"
echo "  - DATABASE_PUBLIC_URL (new)"
echo "  - PGHOST"
echo "  - PGPASSWORD"
echo ""

# Confirm before proceeding
read -p "⚠️  This will update Railway variables. Continue? (y/n) " -n 1 -r
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
  --set "DATABASE_URL=$QA_DATABASE_URL" \
  --set "DATABASE_PUBLIC_URL=$QA_DATABASE_PUBLIC_URL" \
  --set "PGHOST=$QA_PGHOST" \
  --set "PGPASSWORD=$QA_PGPASSWORD"

echo ""
echo "✅ Variables updated successfully!"
echo ""
echo "📊 Next steps:"
echo "  1. Railway will automatically redeploy the service"
echo "  2. Wait for deployment to complete"
echo "  3. Run migrations: railway run npm run db:migrate"
echo "  4. Verify connection: railway run npx prisma db push"
echo ""
echo "🔍 To check current variables:"
echo "  railway variables"
echo ""
echo "✨ Done!"
