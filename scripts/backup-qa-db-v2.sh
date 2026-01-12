#!/bin/bash

# Script to backup QA database using Railway CLI connection
# This avoids URL parsing issues by using Railway's native connection

set -e  # Exit on error

echo "🗄️  QA Database Backup Script (v2 - Railway Native)"
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

# Get database stats first
echo "📊 Gathering database statistics..."
STATS=$(railway run -- psql \$DATABASE_URL -t -c "SELECT (SELECT COUNT(*) FROM \"School\") as schools, (SELECT COUNT(*) FROM \"Admin\") as admins, (SELECT COUNT(*) FROM \"Event\") as events, (SELECT COUNT(*) FROM \"Registration\") as registrations;" 2>/dev/null || echo "Unable to fetch stats")

# Create SQL dump using Railway
echo "📦 Creating SQL dump via Railway..."
railway run -- pg_dump \$DATABASE_URL > "$BACKUP_DIR/${BACKUP_PREFIX}.sql"
echo "  ✅ SQL dump: ${BACKUP_PREFIX}.sql"

# Create README
echo "📝 Creating backup README..."
cat > "$BACKUP_DIR/${BACKUP_PREFIX}_README.md" <<EOF
# QA Database Backup

**Backup Date:** $(date)
**Database:** QA (postgres-copy)
**Environment:** Railway - TicketsSchool/production/Tickets_Pre_Prod

## Backup Files

- \`${BACKUP_PREFIX}.sql\` - Plain SQL dump (human-readable, can use with psql)

## Database Statistics

\`\`\`
$STATS
\`\`\`

## Restore Instructions

### Option 1: Using Railway CLI (Recommended)
\`\`\`bash
# Ensure you're connected to the right environment
railway status

# Restore directly
railway run -- psql \$DATABASE_URL < backups/qa/${BACKUP_PREFIX}.sql
\`\`\`

### Option 2: Manual restore with psql
\`\`\`bash
# Get DATABASE_PUBLIC_URL from Railway
railway variables --kv | grep DATABASE_PUBLIC_URL

# Restore
psql <DATABASE_PUBLIC_URL> < backups/qa/${BACKUP_PREFIX}.sql
\`\`\`

### Option 3: Using restore script
\`\`\`bash
./scripts/restore-qa-db-v2.sh ${BACKUP_PREFIX}.sql
\`\`\`

## Backup Created By

Script: \`scripts/backup-qa-db-v2.sh\`
User: $(whoami)
Machine: $(hostname)

---

**⚠️ IMPORTANT:** Always verify backup integrity before relying on it!

\`\`\`bash
# Verify SQL dump structure
head -20 backups/qa/${BACKUP_PREFIX}.sql
tail -20 backups/qa/${BACKUP_PREFIX}.sql

# Check for critical tables
grep -E "CREATE TABLE.*(School|Event|Registration)" backups/qa/${BACKUP_PREFIX}.sql
\`\`\`
EOF

echo "  ✅ README: ${BACKUP_PREFIX}_README.md"
echo ""

# Calculate file size
SQL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_PREFIX}.sql" | cut -f1)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Files created:"
echo "  - ${BACKUP_PREFIX}.sql ($SQL_SIZE)"
echo "  - ${BACKUP_PREFIX}_README.md"
echo ""
echo "📁 Location: $BACKUP_DIR/"
echo ""
echo "📊 Database Statistics:"
echo "$STATS"
echo ""
echo "💡 Next steps:"
echo "  - Verify backup: head -50 $BACKUP_DIR/${BACKUP_PREFIX}.sql"
echo "  - Read README: cat $BACKUP_DIR/${BACKUP_PREFIX}_README.md"
echo ""
echo "✨ Done!"
