#!/bin/bash

# Download QA database backup via API endpoint
# This uses the Railway-deployed backup endpoint

set -e

echo "📥 Downloading QA Database Backup via API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
BASE_URL="https://kartis.info"
BACKUP_ENDPOINT="/api/admin/super/backup-qa-db"
BACKUP_DIR="backups/qa"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.json"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔐 Please provide your SUPER_ADMIN credentials:"
read -p "Email: " EMAIL
read -s -p "Password: " PASSWORD
echo ""
echo ""

# Login and get session cookie
echo "🔑 Logging in..."
COOKIE_FILE=$(mktemp)
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST \
  "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "error"; then
  echo "❌ Login failed:"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool
  rm "$COOKIE_FILE"
  exit 1
fi

echo "  ✅ Login successful"
echo ""

# Download backup
echo "📦 Downloading backup..."
HTTP_CODE=$(curl -s -b "$COOKIE_FILE" -w "%{http_code}" -o "$BACKUP_DIR/$BACKUP_FILE" \
  "$BASE_URL$BACKUP_ENDPOINT")

# Clean up cookie file
rm "$COOKIE_FILE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Download failed with HTTP code: $HTTP_CODE"
  cat "$BACKUP_DIR/$BACKUP_FILE"
  rm "$BACKUP_DIR/$BACKUP_FILE"
  exit 1
fi

echo "  ✅ Backup downloaded"
echo ""

# Parse and display stats
echo "📊 Backup statistics:"
python3 -c "
import json
with open('$BACKUP_DIR/$BACKUP_FILE', 'r') as f:
    data = json.load(f)
    print(f\"  Database: {data.get('database', 'Unknown')}\")
    print(f\"  Timestamp: {data.get('timestamp', 'Unknown')}\")
    stats = data.get('stats', {})
    print(f\"  Schools: {stats.get('schools', 0)}\")
    print(f\"  Admins: {stats.get('admins', 0)}\")
    print(f\"  Events: {stats.get('events', 0)}\")
    print(f\"  Registrations: {stats.get('registrations', 0)}\")
"

# File size
FILESIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup completed successfully!"
echo ""
echo "📦 File: $BACKUP_FILE ($FILESIZE)"
echo "📁 Location: $BACKUP_DIR/"
echo ""
echo "✨ Done!"
