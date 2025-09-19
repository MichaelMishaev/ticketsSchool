#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Generate Prisma client (ensure it's available)
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting Next.js application..."
npm start