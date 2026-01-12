#!/bin/bash
# Automated Production Database Backup Script
# Runs daily via cron to backup Railway PostgreSQL database

# Configuration
BACKUP_DIR="$HOME/Desktop/Projects/ticketsSchool/backups/daily"
DB_HOST="crossover.proxy.rlwy.net"
DB_PORT="41359"
DB_USER="postgres"
DB_NAME="railway"
PGPASSWORD="fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)

# Backup filename
BACKUP_FILE="$BACKUP_DIR/prod_backup_$TIMESTAMP.sql"

# Export password for pg_dump
export PGPASSWORD="$PGPASSWORD"

echo "========================================="
echo "Starting database backup: $TIMESTAMP"
echo "========================================="

# Backup all tables as JSON (version-independent)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY (SELECT json_agg(row_to_json(e)) FROM (SELECT * FROM \"Event\" ORDER BY \"createdAt\") e) TO STDOUT;
" > "$BACKUP_DIR/events_$DATE_ONLY.json"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY (SELECT json_agg(row_to_json(r)) FROM (SELECT * FROM \"Registration\" ORDER BY \"createdAt\") r) TO STDOUT;
" > "$BACKUP_DIR/registrations_$DATE_ONLY.json"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY (SELECT json_agg(row_to_json(s)) FROM (SELECT * FROM \"School\" ORDER BY \"createdAt\") s) TO STDOUT;
" > "$BACKUP_DIR/schools_$DATE_ONLY.json"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY (SELECT json_agg(row_to_json(a)) FROM (SELECT * FROM \"Admin\" ORDER BY \"createdAt\") a) TO STDOUT;
" > "$BACKUP_DIR/admins_$DATE_ONLY.json"

# Create a summary file
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  'Events' as table_name, COUNT(*) as count FROM \"Event\"
UNION ALL SELECT 'Registrations', COUNT(*) FROM \"Registration\"
UNION ALL SELECT 'Schools', COUNT(*) FROM \"School\"
UNION ALL SELECT 'Admins', COUNT(*) FROM \"Admin\";
" > "$BACKUP_DIR/summary_$DATE_ONLY.txt"

# Unset password
unset PGPASSWORD

# Check backup success
if [ -f "$BACKUP_DIR/events_$DATE_ONLY.json" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/events_$DATE_ONLY.json" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "   Events backup: $BACKUP_SIZE"
    echo "   Location: $BACKUP_DIR"

    # Delete backups older than retention period
    find "$BACKUP_DIR" -name "*.json" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.txt" -mtime +$RETENTION_DAYS -delete

    echo "   Old backups cleaned (kept last $RETENTION_DAYS days)"
else
    echo "❌ Backup FAILED!"
    exit 1
fi

echo "========================================="
