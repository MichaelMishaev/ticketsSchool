# Database Switching Scripts

Quick scripts to switch between Production and QA databases on Railway.

## Available Scripts

### 🟢 Switch to QA Database

```bash
./scripts/switch-to-qa-db.sh
```

**What it does:**

- Updates `DATABASE_URL` to point to `postgres-copy` (QA database)
- Updates `PGHOST` to `postgres-copy.railway.internal`
- Updates `PGPASSWORD` to QA database password
- Adds `DATABASE_PUBLIC_URL` for external QA access
- Triggers automatic Railway redeployment

**When to use:**

- Testing new features in QA environment
- Running migrations on QA before production
- Validating changes without affecting production data

---

### 🔴 Switch Back to Production Database

```bash
./scripts/switch-to-prod-db.sh
```

**What it does:**

- Restores `DATABASE_URL` to point to `postgres` (production)
- Restores `PGHOST` to `postgres.railway.internal`
- Restores `PGPASSWORD` to production password
- Triggers automatic Railway redeployment

**When to use:**

- After QA testing is complete
- When you need to revert to production database

⚠️ **WARNING:** This connects to LIVE production data!

---

### 🔍 Verify Database Connection

```bash
./scripts/verify-db-connection.sh
```

**What it does:**

- Shows current `DATABASE_URL`, `PGHOST`, and `PGPASSWORD`
- Indicates whether connected to QA or Production
- Tests database connection

**When to use:**

- Before running migrations (to confirm target database)
- After switching databases (to verify changes)
- When debugging connection issues

---

## Quick Reference

| Database       | Host                             | Password    | Use Case     |
| -------------- | -------------------------------- | ----------- | ------------ |
| **Production** | `postgres.railway.internal`      | `fnkujY...` | Live data ⚠️ |
| **QA**         | `postgres-copy.railway.internal` | `bgK0ch...` | Testing ✅   |

---

## Workflow Example

```bash
# 1. Verify current connection
./scripts/verify-db-connection.sh

# 2. Switch to QA
./scripts/switch-to-qa-db.sh

# 3. Wait for Railway to redeploy (~2 minutes)
railway logs --follow

# 4. Run migrations on QA
railway run npm run db:migrate

# 5. Test your changes
# ... do your testing ...

# 6. Switch back to Production
./scripts/switch-to-prod-db.sh

# 7. Verify connection
./scripts/verify-db-connection.sh
```

---

## Important Notes

1. **Automatic Redeployment:** Railway automatically redeploys when variables change
2. **Migration Safety:** Always verify database connection before running migrations
3. **No Data Loss:** Switching databases doesn't delete data - just changes which DB to connect to
4. **Manual Cleanup:** `DATABASE_PUBLIC_URL` may need manual removal when switching back to prod

---

## Troubleshooting

**Script permission denied:**

```bash
chmod +x scripts/*.sh
```

**Railway CLI not found:**

```bash
npm install -g @railway/cli
railway login
```

**Variables not updating:**

```bash
# Ensure you're in the correct project/environment
railway status
railway link  # Re-link if needed
```

---

## Safety Checklist

Before running migrations:

- [ ] Run `verify-db-connection.sh` to confirm target database
- [ ] Check Railway deployment logs for errors
- [ ] Ensure you're not accidentally on production when testing
- [ ] Backup important data if running destructive migrations

---

**Created:** 2025-12-05
**Last Updated:** 2025-12-05
