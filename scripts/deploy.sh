#!/bin/sh

echo "🚀 Starting deployment process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Run Prisma migrations
echo "🗃️  Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Generate Prisma Client
echo "📦 Generating Prisma client..."
npx prisma generate

# Start the Next.js application
echo "🌟 Starting Next.js application..."
npm start