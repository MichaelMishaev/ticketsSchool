# Encryption Migration Guide

## Overview

This guide walks you through encrypting existing payment and user data in the TicketCap database to comply with Israeli Privacy Protection Law (Amendment 13, August 2025).

**What gets encrypted:**

- Payment payer data: `payerPhone`, `payerEmail`
- Registration contact data: `phoneNumber`, `email`
- User ban contact data: `phoneNumber`, `email`

**What stays plaintext:**

- Admin emails (used for authentication - cannot be encrypted)
- Anonymous ban emails (`anonymous@banned.local`)

## Prerequisites

1. **ENCRYPTION_KEY must be set** in `.env`:

   ```bash
   # Generate a strong 32+ character key
   openssl rand -base64 32
   ```

2. **Backup your database** before running migration:

   ```bash
   # Local development
   docker exec ticketcap-postgres pg_dump -U ticketcap_user ticketcap > backup-$(date +%Y%m%d-%H%M%S).sql

   # Production (Railway)
   railway run pg_dump $DATABASE_URL > backup-prod-$(date +%Y%m%d-%H%M%S).sql
   ```

3. **Stop all services** to prevent writes during migration:
   ```bash
   # Local: stop dev server
   # Production: pause Railway service
   ```

## Migration Steps

### Step 1: Dry Run (Preview)

**Always run dry-run first** to preview what will be encrypted:

```bash
npm run encrypt:check
```

**Expected output:**

```
[Data Encryption Migration] Starting...
[Data Encryption Migration] Mode: DRY RUN (no changes)
[1/4] Found 342 payment records to encrypt
[1/4] Completed: 342 payments encrypted
[2/4] Admin emails kept plaintext for authentication (intentional)
[3/4] Found 1,523 registration records to encrypt
[3/4] Completed: 1,523 registrations encrypted
[4/4] Found 7 ban records to encrypt
[4/4] Completed: 7 bans encrypted
============================================================
MIGRATION SUMMARY
============================================================
Mode: DRY RUN (no changes made)
Payment records encrypted: 342
Registration records encrypted: 1,523
Ban records encrypted: 7
Total errors: 0
============================================================
✅ Dry run completed successfully!
Run without --dry-run to perform actual encryption.
```

### Step 2: Review Dry Run Results

Check the numbers match your expectations:

```bash
# Count plaintext phones in payments (should match dry-run count)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\" WHERE \"payerPhone\" IS NOT NULL AND \"payerPhone\" LIKE '%0%';"

# Count plaintext emails in payments
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\" WHERE \"payerEmail\" IS NOT NULL AND \"payerEmail\" LIKE '%@%';"

# Count plaintext phones in registrations
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Registration\" WHERE \"phoneNumber\" IS NOT NULL AND \"phoneNumber\" LIKE '%0%';"

# Count plaintext emails in registrations
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Registration\" WHERE \"email\" IS NOT NULL AND \"email\" LIKE '%@%';"
```

### Step 3: Live Migration

Once satisfied with dry-run results, run the live migration:

```bash
npm run encrypt:existing
```

**The script will:**

1. Show a warning and wait 5 seconds (cancel with Ctrl+C)
2. Encrypt all plaintext PII in batches
3. Show progress every 100 records
4. Display final summary

**Expected duration:**

- 1,000 records: ~30 seconds
- 10,000 records: ~5 minutes
- 100,000 records: ~45 minutes

### Step 4: Verify Encryption

After migration completes, verify data is encrypted:

```bash
# Check payment data (should return 0)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\" WHERE \"payerPhone\" IS NOT NULL AND \"payerPhone\" LIKE '%0%';"

# Verify encrypted format (should show base64 strings)
psql $DATABASE_URL -c "SELECT \"payerPhone\", \"payerEmail\" FROM \"Payment\" WHERE \"payerPhone\" IS NOT NULL LIMIT 3;"
```

**Encrypted data looks like:**

```
payerPhone: kL9x2+8pQ3mN7v...  (base64, no digits/special chars)
payerEmail: A5mP9k3+2nQ8v...  (base64, no @ symbol)
```

### Step 5: Restart Services

```bash
# Local: restart dev server
npm run dev

# Production: unpause Railway service
railway up
```

### Step 6: Test Decryption

Verify encrypted data can be decrypted correctly:

```bash
# Create a test registration
curl -X POST http://localhost:9000/api/p/your-school/your-event/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "0501234567", "email": "test@example.com"}'

# Check admin dashboard - should show decrypted phone/email
```

## Rollback Procedure

**IMPORTANT:** There is no automated rollback. This is intentional for security.

If you need to rollback:

1. **Restore from backup** (taken in Prerequisites step):

   ```bash
   # Local
   docker exec -i ticketcap-postgres psql -U ticketcap_user ticketcap < backup-YYYYMMDD-HHMMSS.sql

   # Production (Railway)
   railway run psql $DATABASE_URL < backup-prod-YYYYMMDD-HHMMSS.sql
   ```

2. **Verify restoration**:

   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\";"
   ```

3. **DO NOT run migration again** until you've fixed the issue

## Troubleshooting

### Error: "ENCRYPTION_KEY must be set"

**Fix:** Add `ENCRYPTION_KEY` to `.env`:

```bash
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
```

Restart dev server or Railway service.

### Error: "Some records failed to encrypt"

**Cause:** Database connection issues or invalid data format

**Fix:**

1. Check migration logs for specific error messages
2. Fix data issues manually
3. Re-run migration (it will skip already-encrypted records)

### Migration running too slowly

**Expected:** 100k records = ~45 minutes

**If slower:**

1. Check database CPU usage (should be <80%)
2. Reduce concurrent operations (migration runs sequentially by design)
3. Consider splitting by table:
   ```bash
   # Encrypt payments only
   psql $DATABASE_URL -c "UPDATE \"Payment\" SET \"payerPhone\" = encrypt_function(\"payerPhone\") WHERE \"payerPhone\" LIKE '%0%';"
   ```

### Data looks corrupted after migration

**Symptoms:** Admin dashboard shows garbled text instead of phone/email

**Cause:** Encryption key changed or data encrypted twice

**Fix:**

1. Restore from backup immediately
2. Verify `ENCRYPTION_KEY` matches the one used during migration
3. Do NOT encrypt already-encrypted data

## Production Checklist

Before running in production:

- [ ] `ENCRYPTION_KEY` is set in Railway environment variables
- [ ] Database backup completed and verified
- [ ] Dry-run completed successfully
- [ ] Dry-run counts match database query counts
- [ ] Railway service paused (no incoming requests)
- [ ] Team notified of maintenance window
- [ ] Rollback procedure tested (restore backup to staging)

After running in production:

- [ ] Verify encryption completed (dry-run count = migration count)
- [ ] Test decryption (admin dashboard shows readable data)
- [ ] Check application logs for errors
- [ ] Monitor performance (encryption adds ~10ms to queries)
- [ ] Unpause Railway service
- [ ] Test critical flows (registration, payment, check-in)
- [ ] Update team on completion

## Security Notes

### Why no automated rollback?

**Security by design.** Decrypting data should require manual intervention:

1. Prevents accidental data exposure
2. Requires conscious decision to decrypt
3. Forces backup restoration (includes audit trail)

### Idempotency

The migration script is **safe to re-run**:

- Detects already-encrypted data (no `@` in email, no `0` in phone)
- Skips encrypted records
- Only encrypts plaintext data

### Performance Impact

**Query performance:**

- Encrypted lookups: N/A (we don't search encrypted fields)
- Decryption on read: +10ms per record
- Bulk exports: +1 second per 1,000 records

**Storage overhead:**

- Base64 encoding: +33% size per field
- Example: `0501234567` (10 chars) → encrypted (120+ chars)

### Israeli PPL Compliance

This migration addresses:

- **Amendment 13 (August 2025):** Encryption of PII at rest
- **Article 7:** Secure storage of personal data
- **Article 11:** Data minimization (we only encrypt necessary fields)

### Audit Trail

Migration creates audit logs in:

1. **Script output:** Saved to file for compliance records
2. **Database migrations table:** Tracks when encryption was applied
3. **Application logs:** All encryption/decryption events logged

Save migration output:

```bash
npm run encrypt:existing 2>&1 | tee migration-$(date +%Y%m%d-%H%M%S).log
```

## FAQ

**Q: Can I encrypt data incrementally?**
A: No. Run migration once on all data to avoid mixed encrypted/plaintext states.

**Q: What if I lose the ENCRYPTION_KEY?**
A: All encrypted data becomes unrecoverable. Store key in:

- Railway environment variables (production)
- Password manager (backup)
- Secure key vault (enterprise)

**Q: Can I change the encryption algorithm?**
A: Yes, but requires:

1. Decrypt all data with old algorithm
2. Re-encrypt with new algorithm
3. Update `/lib/encryption.ts`

**Q: Does this affect search functionality?**
A: No. We don't search encrypted fields (phone/email). Search uses other fields (name, confirmation code).

**Q: How do I verify compliance?**
A: Run security audit:

```bash
npm run test:security
```

Check for:

- No plaintext PII in database dumps
- Encryption key not in source code
- Audit logs enabled

## Support

**Issues during migration?**

1. **Stop migration immediately** (Ctrl+C)
2. **Restore from backup** (see Rollback Procedure)
3. **Check logs** for error messages
4. **Contact security team** if data appears corrupted

**Post-migration issues?**

1. Check `/lib/encryption.ts` for correct algorithm
2. Verify `ENCRYPTION_KEY` matches production key
3. Test decryption with known encrypted value
4. Review audit logs for encryption/decryption failures

## Next Steps

After successful migration:

1. **Enable breach detection** (monitors for plaintext PII):

   ```bash
   npm run test:security
   ```

2. **Schedule regular audits** (monthly):
   - Check for plaintext leaks
   - Verify encryption key rotation
   - Review audit logs

3. **Update runbooks** with encryption procedures

4. **Train team** on handling encrypted data

---

**Migration completed?** Update `/docs/infrastructure/SECURITY_AUDIT.md` with completion date and verification results.
