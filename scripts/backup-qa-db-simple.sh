#!/bin/bash

# Simple QA database backup using explicit Railway variables
# Uses hopper.proxy.rlwy.net public endpoint

set -e  # Exit on error

echo "🗄️  QA Database Backup (Simple)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create backup directory
BACKUP_DIR="backups/qa"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PREFIX="backup_${TIMESTAMP}"

# Get credentials from Railway variables
echo "🔐 Fetching database credentials from Railway..."
PGHOST="hopper.proxy.rlwy.net"
PGPORT="36617"
PGDATABASE="railway"
PGUSER="postgres"
PGPASSWORD=$(railway variables --kv | grep "^PGPASSWORD=" | cut -d'=' -f2-)

echo "  Host: $PGHOST"
echo "  Port: $PGPORT"
echo "  Database: $PGDATABASE"
echo "  User: $PGUSER"
echo ""

# Test connection first
echo "🔌 Testing connection..."
if ! PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Connection failed! Please check credentials."
    echo ""
    echo "Debugging info:"
    echo "  Password starts with: ${PGPASSWORD:0:10}..."
    exit 1
fi
echo "  ✅ Connection successful!"
echo ""

# Create SQL dump
echo "📦 Creating SQL dump..."
PGPASSWORD="$PGPASSWORD" pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  -f "$BACKUP_DIR/${BACKUP_PREFIX}.sql"

echo "  ✅ SQL dump: ${BACKUP_PREFIX}.sql"

# Get statistics
echo "📊 Gathering database statistics..."
STATS=$(PGPASSWORD="$PGPASSWORD" psql \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  -t -c "SELECT (SELECT COUNT(*) FROM \"School\") as schools, (SELECT COUNT(*) FROM \"Admin\") as admins, (SELECT COUNT(*) FROM \"Event\") as events, (SELECT COUNT(*) FROM \"Registration\") as registrations;")

# Create README
cat > "$BACKUP_DIR/${BACKUP_PREFIX}_README.md" <<EOF
# QA Database Backup

**Backup Date:** $(date)
**Database:** QA (postgres-copy)
**Host:** $PGHOST:$PGPORT

## Backup Files

- \`${BACKUP_PREFIX}.sql\` - Plain SQL dump

## Database Statistics

\`\`\`
$STATS
\`\`\`

## Restore

\`\`\`bash
# Using Railway
railway run -- psql \\\$DATABASE_URL < backups/qa/${BACKUP_PREFIX}.sql

# Or directly
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE < backups/qa/${BACKUP_PREFIX}.sql
\`\`\`

Backup created by: $(whoami)@$(hostname)
EOF

# File size
SQL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_PREFIX}.sql" | cut -f1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Files:"
echo "  - ${BACKUP_PREFIX}.sql ($SQL_SIZE)"
echo "  - ${BACKUP_PREFIX}_README.md"
echo ""
echo "📊 Statistics:"
echo "$STATS"
echo ""
echo "✨ Done!"
