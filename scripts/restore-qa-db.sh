#!/bin/bash

# Script to restore QA database from a backup
# Run this script from the project root

set -e  # Exit on error

echo "🔄 QA Database Restore Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for backup files
BACKUP_DIR="backups/qa"
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# List available backups
echo "📦 Available backups:"
echo ""
ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}' || echo "  (no SQL backups found)"
echo ""

# Prompt for backup file
read -p "Enter backup filename (without path, e.g., backup_20251205_220000.sql): " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

# Detect backup type
if [[ $BACKUP_FILE == *.sql ]]; then
    BACKUP_TYPE="sql"
elif [[ $BACKUP_FILE == *.dump ]]; then
    BACKUP_TYPE="dump"
else
    echo "❌ Unknown backup type. Use .sql or .dump file"
    exit 1
fi

echo "📁 Backup file: $BACKUP_FILE"
echo "📄 Backup type: $BACKUP_TYPE"
echo ""

# Warning
echo "⚠️  WARNING: This will REPLACE all data in the QA database!"
echo ""
read -p "Are you sure you want to continue? Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled."
    exit 1
fi

# Verify we're connected to QA database
CURRENT_DB=$(railway variables --kv | grep "^DATABASE_URL=" | cut -d'=' -f2-)
if [[ ! $CURRENT_DB == *"postgres-copy"* ]]; then
    echo ""
    echo "⚠️  WARNING: Not connected to QA database (postgres-copy)"
    echo "Current: $CURRENT_DB"
    echo ""
    read -p "Continue anyway? Type 'yes' to confirm: " CONFIRM2
    if [ "$CONFIRM2" != "yes" ]; then
        echo "❌ Restore cancelled."
        exit 1
    fi
fi

echo ""
echo "🔐 Fetching database credentials..."
# Use DATABASE_PUBLIC_URL for external access (falls back to DATABASE_URL)
DATABASE_URL=$(railway variables --kv | grep "^DATABASE_PUBLIC_URL=" | cut -d'=' -f2-)
if [ -z "$DATABASE_URL" ]; then
    echo "  ⚠️  DATABASE_PUBLIC_URL not found, using DATABASE_URL..."
    DATABASE_URL=$(railway variables --kv | grep "^DATABASE_URL=" | cut -d'=' -f2-)
fi

# Parse connection string
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo ""
echo "🗄️  Restoring to:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo ""

# Restore based on type
if [ "$BACKUP_TYPE" == "sql" ]; then
    echo "📥 Restoring SQL dump..."
    PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      < "$BACKUP_DIR/$BACKUP_FILE"
else
    echo "📥 Restoring custom dump..."
    PGPASSWORD="$DB_PASSWORD" pg_restore \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c \
      "$BACKUP_DIR/$BACKUP_FILE"
fi

echo ""
echo "✅ Restore completed successfully!"
echo ""

# Verify data
echo "📊 Verifying restored data..."
STATS=$(PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t -c "
SELECT
  (SELECT COUNT(*) FROM \"School\") as schools,
  (SELECT COUNT(*) FROM \"Admin\") as admins,
  (SELECT COUNT(*) FROM \"Event\") as events,
  (SELECT COUNT(*) FROM \"Registration\") as registrations;
")

echo "Database statistics:"
echo "$STATS"
echo ""

echo "✨ Done!"
