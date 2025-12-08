#!/bin/bash

# Script to backup QA database (postgres-copy) from Railway
# Creates both SQL dump and custom format dump with README

set -e  # Exit on error

echo "🗄️  QA Database Backup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify we're connected to Railway
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Check current database connection
CURRENT_DB=$(railway variables --kv | grep "^DATABASE_URL=" | cut -d'=' -f2-)
if [[ ! $CURRENT_DB == *"postgres-copy"* ]]; then
    echo "⚠️  WARNING: Not connected to QA database (postgres-copy)"
    echo "Current: $CURRENT_DB"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted."
        exit 1
    fi
fi

# Create backup directory
BACKUP_DIR="backups/qa"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PREFIX="backup_${TIMESTAMP}"

echo "📁 Backup directory: $BACKUP_DIR"
echo "🕒 Timestamp: $TIMESTAMP"
echo ""

# Get database credentials from Railway
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

echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo ""

# Create SQL dump
echo "📦 Creating SQL dump..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$BACKUP_DIR/${BACKUP_PREFIX}.sql"

echo "  ✅ SQL dump: ${BACKUP_PREFIX}.sql"

# Create custom format dump (for selective restore)
echo "📦 Creating custom format dump..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$BACKUP_DIR/${BACKUP_PREFIX}.dump"

echo "  ✅ Custom dump: ${BACKUP_PREFIX}.dump"

# Get database statistics
echo "📊 Gathering database statistics..."
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

# Create README
echo "📝 Creating backup README..."
cat > "$BACKUP_DIR/${BACKUP_PREFIX}_README.md" <<EOF
# QA Database Backup

**Backup Date:** $(date)
**Database:** QA (postgres-copy)
**Environment:** Railway - TicketsSchool/production/Tickets_Pre_Prod

## Backup Files

- \`${BACKUP_PREFIX}.sql\` - Plain SQL dump (human-readable, can use with psql)
- \`${BACKUP_PREFIX}.dump\` - Custom format dump (binary, use with pg_restore)

## Database Statistics

\`\`\`
$STATS
\`\`\`

## Database Info

- **Host:** $DB_HOST
- **Port:** $DB_PORT
- **Database:** $DB_NAME
- **PostgreSQL Version:** $(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();")

## Restore Instructions

### Option 1: Restore SQL dump
\`\`\`bash
# Drop existing database (CAUTION!)
psql -h HOST -p PORT -U USER -c "DROP DATABASE IF EXISTS railway;"
psql -h HOST -p PORT -U USER -c "CREATE DATABASE railway;"

# Restore from SQL
psql -h HOST -p PORT -U USER -d railway < ${BACKUP_PREFIX}.sql
\`\`\`

### Option 2: Restore custom dump
\`\`\`bash
# Restore entire database
pg_restore -h HOST -p PORT -U USER -d railway -c ${BACKUP_PREFIX}.dump

# Restore specific tables only
pg_restore -h HOST -p PORT -U USER -d railway -t School -t Event ${BACKUP_PREFIX}.dump
\`\`\`

### Option 3: Using Railway CLI
\`\`\`bash
# Connect to Railway database
railway connect postgres

# Then restore
\q  # Exit psql first
railway run -- psql \$DATABASE_URL < ${BACKUP_PREFIX}.sql
\`\`\`

## Backup Created By

Script: \`scripts/backup-qa-db.sh\`
User: $(whoami)
Machine: $(hostname)

---

**⚠️ IMPORTANT:** Always verify backup integrity before relying on it!

\`\`\`bash
# Verify SQL dump
head -20 ${BACKUP_PREFIX}.sql
tail -20 ${BACKUP_PREFIX}.sql

# List contents of custom dump
pg_restore -l ${BACKUP_PREFIX}.dump
\`\`\`
EOF

echo "  ✅ README: ${BACKUP_PREFIX}_README.md"
echo ""

# Calculate file sizes
SQL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_PREFIX}.sql" | cut -f1)
DUMP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_PREFIX}.dump" | cut -f1)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Files created:"
echo "  - ${BACKUP_PREFIX}.sql ($SQL_SIZE)"
echo "  - ${BACKUP_PREFIX}.dump ($DUMP_SIZE)"
echo "  - ${BACKUP_PREFIX}_README.md"
echo ""
echo "📁 Location: $BACKUP_DIR/"
echo ""
echo "💡 Next steps:"
echo "  - Verify backup: pg_restore -l $BACKUP_DIR/${BACKUP_PREFIX}.dump"
echo "  - Read README: cat $BACKUP_DIR/${BACKUP_PREFIX}_README.md"
echo ""
echo "✨ Done!"
