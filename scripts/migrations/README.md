# Database Migration Scripts

## Overview

This directory contains **idempotent** SQL migration scripts that safely sync schema changes between environments.

## Files

- `sync-dev-to-prod.sql` - SQL migration to sync production with development schema
- `apply-to-production.sh` - Interactive script to apply migration to production

## What This Migration Does

1. **Makes `Registration.phoneNumber` nullable** (if not already)
2. **Creates `TableTemplate` table** (if not exists)
3. **Adds indexes** for TableTemplate (if not exist)
4. **Adds foreign key constraints** (if not exist)

## Safety Features

✅ **Idempotent** - Safe to run multiple times  
✅ **Checks before changes** - Only applies missing changes  
✅ **No data loss** - Uses `IF NOT EXISTS` / `IF EXISTS` clauses  
✅ **Rollback safe** - Each change is isolated in a transaction block  

## How to Apply to Production

### Option 1: Interactive Script (Recommended)

```bash
./scripts/migrations/apply-to-production.sh
```

This will:
1. Connect to production database
2. Show migration summary
3. Ask for confirmation
4. Apply changes safely

### Option 2: Manual Application

```bash
# Get production DATABASE_URL
PROD_DB_URL=$(railway variables --json --environment production --service Tickets | jq -r '.DATABASE_URL')

# Apply migration
docker run --rm -i postgres:17 psql "$PROD_DB_URL" < scripts/migrations/sync-dev-to-prod.sql
```

### Option 3: Via Railway CLI

```bash
railway environment production
railway ssh --service Tickets "psql \$DATABASE_URL" < scripts/migrations/sync-dev-to-prod.sql
```

## Verification

After running, you should see output like:

```
NOTICE:  Registration.phoneNumber is already nullable
NOTICE:  Created index TableTemplate_schoolId_idx
NOTICE:  Created index TableTemplate_isPublic_idx
NOTICE:  Created foreign key TableTemplate_schoolId_fkey

 TableTemplate exists | phoneNumber nullable 
----------------------+---------------------
 t                    | t
(1 row)
```

## When to Use

- ✅ After using `prisma db push` on development
- ✅ When syncing schema changes from dev to prod
- ✅ When production is missing tables/columns that exist in dev
- ❌ **NOT for regular deployments** - Use Prisma migrations instead

## Important Notes

⚠️ **This is a one-time sync script**  
⚠️ **Always test on development first**  
⚠️ **Always backup production before applying**  
⚠️ **Review the SQL file before running**  

## Backup Production (Before Running)

```bash
# Backup production database
PROD_DB_URL=$(railway variables --json --environment production --service Tickets | jq -r '.DATABASE_URL')
docker run --rm postgres:17 pg_dump "$PROD_DB_URL" > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Future Schema Changes

**DO NOT use `prisma db push` on production!**

Instead, use proper Prisma migrations:

```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Apply to production (automatic on Railway deployment)
npx prisma migrate deploy
```

## Troubleshooting

**"relation already exists"** - Safe to ignore, migration is idempotent  
**"permission denied"** - Check DATABASE_URL has correct permissions  
**"connection refused"** - Verify Railway production service is running  

## Questions?

Ask before running if unsure!
