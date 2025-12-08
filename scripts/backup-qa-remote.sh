#!/bin/bash

# Backup QA database by running pg_dump inside Railway's environment
# This avoids public URL connection issues

set -e

echo "🗄️  QA Database Remote Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create backup directory
BACKUP_DIR="backups/qa"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "📁 Backup directory: $BACKUP_DIR"
echo "🕒 Timestamp: $TIMESTAMP"
echo "📦 Backup file: $BACKUP_FILE"
echo ""

# Run pg_dump inside Railway using the internal DATABASE_URL
echo "🚀 Running pg_dump inside Railway environment..."
railway run bash -c 'pg_dump $DATABASE_URL' > "$BACKUP_DIR/$BACKUP_FILE"

echo "  ✅ Backup downloaded: $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Get file size
FILESIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "📊 Backup size: $FILESIZE"

# Get statistics by running query inside Railway
echo ""
echo "📈 Database statistics:"
railway run bash -c 'psql $DATABASE_URL -t -c "SELECT '\''Schools: '\'' || COUNT(*) FROM \"School\"; SELECT '\''Admins: '\'' || COUNT(*) FROM \"Admin\"; SELECT '\''Events: '\'' || COUNT(*) FROM \"Event\"; SELECT '\''Registrations: '\'' || COUNT(*) FROM \"Registration\";"'

# Create README
cat > "$BACKUP_DIR/backup_${TIMESTAMP}_README.md" <<EOF
# QA Database Backup

**Backup Date:** $(date)
**Database:** QA (postgres-copy)
**Method:** Remote backup via Railway CLI

## Files

- \`$BACKUP_FILE\` ($FILESIZE)

## Restore

\`\`\`bash
# Using Railway CLI
railway run bash -c 'psql \$DATABASE_URL' < $BACKUP_DIR/$BACKUP_FILE

# Or using restore script
./scripts/restore-qa-remote.sh $BACKUP_FILE
\`\`\`

Backup created by: $(whoami)@$(hostname)
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Location: $BACKUP_DIR/$BACKUP_FILE"
echo "📝 README: $BACKUP_DIR/backup_${TIMESTAMP}_README.md"
echo ""
echo "✨ Done!"
