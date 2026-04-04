# 🛡️ Security Master - Quick Reference

## One-Liner Commands

```bash
# Before deploy - Full audit
/security-master --audit-all

# Check payment security (CRITICAL!)
/security-master --focus payment

# Multi-tenant isolation check
/security-master --focus multi-tenant

# Review new code
/security-master --review app/api/new-feature/

# Penetration test scenario
/security-master --pentest payment-tampering
```

## Top 5 Critical Checks

1. **Multi-Tenant Data Leakage** - schoolId filter in ALL queries
2. **Payment Callback Security** - HMAC signature validation
3. **JWT Secret Strength** - Min 32 bytes, never default
4. **Race Condition** - Atomic spotsReserved increment
5. **Mock Mode** - NEVER enabled in production

## Security Severity Levels

```
🔴 CRITICAL  - Fix immediately (production down if exploited)
🟠 HIGH      - Fix before next deploy (major data breach risk)
🟡 MEDIUM    - Fix within sprint (moderate security risk)
🟢 LOW       - Fix when convenient (low impact)
```

## Common Vulnerabilities

| Vulnerability | Location | Fix |
|--------------|----------|-----|
| Missing schoolId filter | API routes | Add `where: { schoolId }` |
| Weak JWT secret | .env | Generate 32+ byte secret |
| No payment signature | payment/callback | Add HMAC validation |
| Race condition | event registration | Use `$transaction` |
| Mock mode in prod | Railway env vars | Remove YAADPAY_MOCK_MODE |

## Emergency Response

```bash
# 1. Rotate JWT secret (invalidates all sessions)
railway run railway variables --set JWT_SECRET=$(openssl rand -base64 32)

# 2. Enable maintenance mode
railway run railway variables --set MAINTENANCE_MODE=true

# 3. Investigate breach
/security-master --investigate [issue]

# 4. Fix vulnerability
/security-master --remediate [vulnerability]

# 5. Verify fix
/security-master --verify-fix [file-path]
```

## Integration

### Pre-Commit Hook
```bash
# .husky/pre-commit
npx claude /security-master --review-staged
```

### CI/CD
```yaml
# .github/workflows/security.yml
- run: npm audit --production
- run: npx claude /security-master --audit-all --ci-mode
```

## Key Files to Audit

1. `/lib/auth.server.ts` - Session management
2. `/app/api/payment/callback/route.ts` - Payment security
3. `/app/api/events/[id]/route.ts` - Multi-tenant isolation
4. `/middleware.ts` - Route protection
5. `/lib/prisma.ts` - Database client

## Israeli Compliance

- **Privacy Protection Law 1981** - Personal data handling
- **PSD2** - Payment security (YaadPay integration)
- **Youth Protection** - Minors' data (under 18)

---

**Quick Tip:** Run `/security-master --audit-all` before EVERY production deploy!
