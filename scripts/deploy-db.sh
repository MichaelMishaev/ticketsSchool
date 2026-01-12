#!/bin/bash

# Production Database Deployment Script
# This script sets up the production database with all necessary tables

set -e  # Exit on any error

echo "🚀 Starting database deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your production database URL"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Generate Prisma client (required for deployment)
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations (production-safe)
echo "🗃️  Deploying database migrations..."
npx prisma migrate deploy

# Check if migration was successful
echo "🔍 Verifying database deployment..."
npx prisma migrate status

echo "✅ Database deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  - Prisma client generated"
echo "  - All migrations applied to production database"
echo "  - Database schema is now up to date"
echo ""
echo "🌐 Your application is ready to use the production database!"