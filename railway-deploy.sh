#!/bin/bash

# Railway Deployment Script
# This script should be run during Railway deployment to set up the database

set -e

echo "🚂 Railway deployment: Setting up database..."

# Railway automatically provides DATABASE_URL, but let's verify
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not found. Please check Railway database configuration."
    exit 1
fi

# Generate Prisma client (required before migration)
echo "📦 Generating Prisma client..."
npx prisma generate

# Deploy migrations to production database
echo "🗃️  Deploying database migrations..."
npx prisma migrate deploy

echo "✅ Railway database deployment completed!"

# Continue with the normal build process
echo "🏗️  Building Next.js application..."
npm run build

echo "🚀 Railway deployment completed successfully!"