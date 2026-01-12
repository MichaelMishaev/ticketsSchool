# Encryption Migration Quick Reference

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Backup database
docker exec ticketcap-postgres pg_dump -U ticketcap_user ticketcap > backup-$(date +%Y%m%d).sql

# 2. Dry run (preview)
npm run encrypt:check

# 3. Live migration (with 5-second warning)
npm run encrypt:existing

# 4. Verify encryption
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\" WHERE \"payerPhone\" LIKE '%0%';"
# Should return 0
```

## 📋 Pre-Flight Checklist

- [ ] `ENCRYPTION_KEY` set in `.env` (32+ characters)
- [ ] Database backup completed
- [ ] Dry-run completed successfully
- [ ] Services stopped (no incoming writes)

## 🎯 What Gets Encrypted

| Table        | Fields                     | Detection           |
| ------------ | -------------------------- | ------------------- |
| Payment      | `payerPhone`, `payerEmail` | Contains `0` or `@` |
| Registration | `phoneNumber`, `email`     | Contains `0` or `@` |
| UserBan      | `phoneNumber`, `email`     | Contains `0` or `@` |

**Skipped (intentional):**

- Admin emails (used for authentication)
- Anonymous ban emails (`anonymous@banned.local`)

## 🔍 Verification Commands

```bash
# Count plaintext phones in payments (should be 0 after migration)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\" WHERE \"payerPhone\" LIKE '%0%';"

# View encrypted sample (should show base64)
psql $DATABASE_URL -c "SELECT \"payerPhone\" FROM \"Payment\" WHERE \"payerPhone\" IS NOT NULL LIMIT 3;"

# Check registrations encrypted
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Registration\" WHERE \"phoneNumber\" LIKE '%0%';"
```

## ⏱️ Expected Duration

| Records | Duration    |
| ------- | ----------- |
| 1,000   | ~30 seconds |
| 10,000  | ~5 minutes  |
| 100,000 | ~45 minutes |

## 🔄 Rollback (Emergency Only)

```bash
# Restore from backup (NO automated rollback for security)
docker exec -i ticketcap-postgres psql -U ticketcap_user ticketcap < backup-YYYYMMDD.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Payment\";"
```

## ❌ Common Errors

### "ENCRYPTION_KEY must be set"

```bash
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
```

### "Some records failed to encrypt"

1. Check logs for specific errors
2. Fix data issues manually
3. Re-run migration (safe - skips encrypted records)

### Migration too slow

- **Expected:** 100k records = ~45 minutes
- **If slower:** Check database CPU (<80% is normal)

## 🔐 Security Notes

**Idempotency:** Safe to re-run (skips already-encrypted data)

**Encrypted format:**

- Plaintext: `0501234567`, `user@example.com`
- Encrypted: `kL9x2+8pQ3mN7v...` (base64, 120+ chars)

**Performance impact:**

- Decryption: +10ms per record
- Bulk exports: +1 second per 1,000 records

## 📊 Success Criteria

After migration:

- ✅ Dry-run count = Migration count
- ✅ Zero plaintext PII in database
- ✅ Admin dashboard shows readable data (decryption works)
- ✅ No errors in application logs
- ✅ Critical flows work (registration, payment, check-in)

## 📞 Emergency Contacts

**Issue during migration?**

1. Stop migration (Ctrl+C)
2. Restore from backup
3. Check logs for errors
4. Contact security team

**Post-migration issues?**

1. Verify `ENCRYPTION_KEY` matches production
2. Test decryption with known value
3. Review audit logs

## 🎓 Training Notes

**For developers:**

- Never log decrypted PII
- Always encrypt before saving to database
- Use `encryptPhone()` / `encryptEmail()` from `/lib/encryption.ts`

**For ops:**

- Database dumps contain encrypted data (safe to store)
- Backups must include `ENCRYPTION_KEY` separately
- Key rotation requires decrypt → re-encrypt all data

## 📈 Post-Migration

1. Enable breach detection:

   ```bash
   npm run test:security
   ```

2. Schedule monthly audits (check for plaintext leaks)

3. Update runbooks with encryption procedures

4. Train team on handling encrypted data

---

**Full guide:** `/docs/infrastructure/ENCRYPTION_MIGRATION_GUIDE.md`
