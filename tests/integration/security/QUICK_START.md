# Security Tests - Quick Start Guide

## Run All Security Tests (2 minutes)

```bash
npm run test:security
```

## What Gets Tested?

### ✅ Already Working (16/32 tests passing)

- Multi-tenant data isolation
- JWT authentication security
- No hardcoded secrets in code
- Input sanitization
- SQL injection prevention
- Payment amount validation
- Error logging

### ❌ Needs Implementation (16/32 tests failing)

- **CRITICAL:** Payment signature validation
- **CRITICAL:** Mock mode production guard
- **LEGAL:** DPO contact information (PPL)
- **LEGAL:** Data encryption library (PPL)
- **LEGAL:** Data retention policy (PPL)
- **SECURITY:** Rate limiting on login
- **SECURITY:** Password strength validation
- **QUALITY:** Request ID in errors

## Quick Commands

```bash
# Run all security tests
npm run test:security

# Interactive debugging mode
npm run test:security:ui

# Generate HTML report
npm run test:security:report

# Test specific category
npm run test:security -- -g "Payment Security"
npm run test:security -- -g "Israeli PPL"
npm run test:security -- -g "Authentication"

# Test only critical fixes
npm run test:security -- -g "Phase 1 Critical"
```

## Current Status

**Pass Rate:** ~37-41% (36-40 of 96 tests)
**Critical Issues:** 2 (payment signature, mock mode guard)
**Legal Issues:** 3 (DPO info, encryption, retention policy)
**Best Practice Issues:** 3 (rate limiting, password validation, request IDs)

## What to Do Next?

### Priority 1 - CRITICAL (Do This First!)

1. **Payment Signature Validation** (~2 hours)

   ```bash
   # Implement HMAC-SHA256 signature validation
   # File: app/api/payment/callback/route.ts
   ```

2. **Mock Mode Production Guard** (~30 min)
   ```bash
   # Add runtime environment check
   # File: lib/yaadpay.ts
   ```

### Priority 2 - LEGAL (Required for Israeli Market)

3. **DPO Information** (~1 hour)

   ```bash
   # Update privacy page with DPO contact
   # File: app/privacy/page.tsx
   ```

4. **Encryption Library** (~3 hours)

   ```bash
   # Implement AES-256-GCM encryption
   # File: lib/encryption.ts
   ```

5. **Data Retention Policy** (~30 min)
   ```bash
   # Document retention periods
   # File: app/privacy/page.tsx
   ```

### Priority 3 - BEST PRACTICES (Security Hardening)

6. **Rate Limiter** (~2 hours)

   ```bash
   # Implement IP-based rate limiting
   # File: lib/rate-limiter.ts
   ```

7. **Password Validator** (~2 hours)

   ```bash
   # Strong password requirements
   # File: lib/password-validator.ts
   ```

8. **Request IDs** (~1 hour)
   ```bash
   # Add tracking IDs to all errors
   # Files: app/api/**/route.ts
   ```

## Test Output Examples

### Passing Test ✅

```
✓ [chromium] › Code Quality › no hardcoded secrets in yaadpay config (2ms)
```

### Failing Test ❌

```
✘ [chromium] › CRIT-1 › should reject callbacks without signature (3.0s)
```

### Skipped Test ⊘

```
- [chromium] › Rate Limiting › should block excessive login attempts
```

## Understanding Test Results

**Green (✓)** - Feature is working correctly
**Red (✘)** - Feature needs implementation or is broken
**Dash (-)** - Test skipped (usually rate limiting live tests)

## Getting Help

1. **Read Full Documentation**

   ```bash
   cat tests/security/README.md
   ```

2. **Check Test Summary**

   ```bash
   cat tests/security/TEST_SUITE_SUMMARY.md
   ```

3. **View Detailed Report**

   ```bash
   npm run test:security:report
   open playwright-report/index.html
   ```

4. **Debug Specific Test**
   ```bash
   npm run test:security:ui
   # Click on failing test to see details
   ```

## Before Production Deployment

Run this checklist:

```bash
# 1. Run all security tests
npm run test:security

# 2. Ensure all critical tests pass
npm run test:security -- -g "Phase 1 Critical"

# 3. Verify PPL compliance
npm run test:security -- -g "Israeli PPL"

# 4. Check environment variables
grep "YAADPAY_MOCK_MODE" .env  # Should be false or missing
grep "JWT_SECRET" .env         # Should be 32+ characters
grep "ENCRYPTION_KEY" .env     # Should be set

# 5. Generate final report
npm run test:security:report
```

## CI/CD Integration

Add to your deployment pipeline:

```yaml
# .github/workflows/security-tests.yml
- name: Security Compliance Tests
  run: npm run test:security
```

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

### Missing Files Error

```bash
# Create the missing file (see error message)
# Example: lib/encryption.ts not found
touch lib/encryption.ts
```

### Import Errors

```bash
# Make sure dev server is NOT running during tests
pkill -f "next dev"
npm run test:security
```

### Rate Limiting Test Fails

```bash
# This test is skipped by default
# Only run manually when testing rate limiting
npm run test:security -- -g "should block excessive"
```

## Tips

1. **Run tests frequently** - Catch issues early
2. **Fix critical issues first** - Payment security is top priority
3. **Use UI mode for debugging** - Visual debugging is faster
4. **Check HTML report** - Better overview of all failures
5. **Commit passing tests** - Don't commit broken security tests

## Resources

- Full Documentation: `tests/security/README.md`
- Test Summary: `tests/security/TEST_SUITE_SUMMARY.md`
- Security Audit: `docs/SECURITY_AUDIT.md`
- Implementation Plan: `docs/SECURITY_IMPLEMENTATION_PLAN.md`

---

**Quick Status Check:**

```bash
npm run test:security | grep "passed\|failed"
```

**Expected Output (Current):**

```
36 passed, 57 failed, 3 skipped (96 total)
```

**Target Output (After Implementation):**

```
93 passed, 0 failed, 3 skipped (96 total)
```
