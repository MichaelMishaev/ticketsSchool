#!/bin/bash

# This script marks the failed migration as rolled back so new migrations can run

echo "🔧 Fixing failed migration..."
echo "Marking migration as rolled back: 20250920000000_allow_multiple_registrations_per_phone"

npx prisma migrate resolve --rolled-back 20250920000000_allow_multiple_registrations_per_phone

if [ $? -eq 0 ]; then
    echo "✅ Migration marked as rolled back successfully"
    echo "Now running migrations..."
    npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        echo "✅ All migrations completed successfully!"
    else
        echo "❌ Migration deploy failed"
        exit 1
    fi
else
    echo "❌ Failed to mark migration as rolled back"
    exit 1
fi
