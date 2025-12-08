# QA Database Restore Guide

Complete guide for restoring production backup to QA database for testing.

---

## 📋 Prerequisites

- ✅ Production backup exists: `backups/production/backup_20251205_215611.sql` (94 KB)
- ✅ QA database running: `postgres-copy` (db dev) in Railway
- ✅ Restore script ready: `scripts/restore-prod-to-qa.sh`
- ⏳ Fresh DATABASE_PUBLIC_URL needed (credentials may have rotated)

---

## 🔧 Step-by-Step Restore Process

### Step 1: Get Fresh QA Database Credentials

1. Go to Railway Dashboard: https://railway.app
2. Navigate to: **TicketsSchool** → **production** → **db dev**
3. Click **Variables** tab
4. Find and copy **DATABASE_PUBLIC_URL**
   - Should look like: `postgresql://postgres:PASSWORD@hopper.proxy.rlwy.net:PORT/railway`

### Step 2: Run Restore Script

```bash
# Replace <URL> with the DATABASE_PUBLIC_URL from Step 1
./scripts/restore-prod-to-qa.sh 'postgresql://postgres:PASSWORD@hopper.proxy.rlwy.net:PORT/railway'
```

**Example:**
```bash
./scripts/restore-prod-to-qa.sh 'postgresql://postgres:bgK0chFy...@hopper.proxy.rlwy.net:36617/railway'
```

### Step 3: Verify Restore

**Option A: Railway Dashboard**
1. Go to: **db dev** → **Database** → **Data** tab
2. Check tables have data:
   - School (should have schools from production)
   - Admin (should have admin users)
   - Event (should have events)
   - Registration (should have registrations)

**Option B: Command Line**
```bash
# Check table counts
docker run --rm postgres:17-alpine psql \
  "postgresql://postgres:PASSWORD@hopper.proxy.rlwy.net:PORT/railway" \
  -c "SELECT 'Schools:', COUNT(*) FROM \"School\" UNION ALL SELECT 'Events:', COUNT(*) FROM \"Event\" UNION ALL SELECT 'Registrations:', COUNT(*) FROM \"Registration\";"
```

---

## 🛠️ Alternative Restore Methods

### Method 1: Using Railway CLI (Recommended if external access fails)

```bash
# Ensure you're connected to the right service
railway link

# Switch to QA database variables (already done)
railway variables --kv | grep DATABASE_URL

# Run restore inside Railway's network
cat backups/production/backup_20251205_215611.sql | \
  railway run bash -c 'psql $DATABASE_URL'
```

### Method 2: Manual Restore via Railway Dashboard

1. Go to **db dev** → **Database** → **Query** tab
2. Copy contents of `backups/production/backup_20251205_215611.sql`
3. Paste into query editor
4. Execute (may need to run in chunks if file is large)

### Method 3: Using Docker with Volume Mount

```bash
# From project root
docker run --rm -v "$(pwd)/backups/production:/backup" postgres:17-alpine \
  psql "postgresql://postgres:PASSWORD@hopper.proxy.rlwy.net:PORT/railway" \
  -f /backup/backup_20251205_215611.sql
```

---

## ⚠️ Important Notes

### Before Restore

- **Backup QA Database First:** If QA has any data you want to keep
  ```bash
  ./scripts/backup-qa-db-simple.sh
  ```

- **Verify Target Database:** Ensure you're restoring to QA, not production!
  ```bash
  ./scripts/verify-db-connection.sh
  ```

### After Restore

- **Test Thoroughly:** QA now has production data - test features without affecting production
- **Data Privacy:** QA database contains real user data - handle appropriately
- **Isolate Testing:** QA is completely separate from production - safe to experiment

---

## 📊 Expected Results

After successful restore, QA database will contain:

**From Production Backup (Dec 5, 2025 21:56):**
- All schools from production
- All admin users from production
- All events from production
- All registrations from production
- All feedback from production
- Complete migration history

**Size:** ~94 KB of data (compressed ~45 KB)

---

## 🔍 Troubleshooting

### Issue: "password authentication failed"

**Cause:** DATABASE_PUBLIC_URL credentials rotated

**Solution:** Get fresh credentials from Railway dashboard (Step 1 above)

### Issue: "connection refused"

**Cause:** Public proxy not accessible

**Solution:** Use Method 1 (Railway CLI) instead

### Issue: "table already exists"

**Cause:** Tables weren't dropped before restore

**Solution:** Add `--clean` flag or manually drop tables first:
```bash
# Drop all tables
docker run --rm postgres:17-alpine psql "$QA_DB_URL" -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Issue: Restore hangs or times out

**Cause:** Large backup file

**Solution:**
1. Split backup into chunks
2. Or restore via Railway CLI (runs inside network, faster)

---

## ✅ Verification Checklist

After restore, verify:

- [ ] All tables exist (8 tables)
- [ ] School table has data
- [ ] Admin table has users
- [ ] Event table has events
- [ ] Registration table has registrations
- [ ] Application connects to QA database
- [ ] Can login with admin credentials
- [ ] Can view events
- [ ] Migrations history preserved

---

## 🎯 Next Steps After Restore

1. **Test Application:** Connect app to QA database and test features
2. **Create QA Backup:** Backup QA with production data
   ```bash
   ./scripts/backup-qa-db-simple.sh
   ```
3. **Seed Additional Test Data:** Add test-specific data if needed
4. **Document Test Cases:** Track what you're testing in QA

---

## 🔗 Related Documentation

- **Backup Scripts:** `scripts/README-DB-SCRIPTS.md`
- **Database Switching:** `scripts/switch-to-qa-db.sh`
- **Production Backup:** `backups/production/backup_20251205_215611_README.md`

---

**Last Updated:** 2025-12-05
**Author:** QA Database Setup Script
**Status:** ⏳ Waiting for fresh credentials to complete restore
