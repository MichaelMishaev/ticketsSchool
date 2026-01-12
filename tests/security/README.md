# Security Compliance Test Suite

This directory contains comprehensive security tests that verify all critical security fixes and compliance requirements for the TicketCap platform.

## Overview

The security test suite validates:

- **Phase 1 Critical Fixes** - Payment security, mock mode guards, error sanitization, multi-tenant isolation
- **Israeli PPL Compliance** - Data protection officer info, encryption, breach incident tracking
- **Authentication Security** - Rate limiting, password validation, JWT security
- **File Integrity** - Critical files exist and are properly configured
- **Code Quality** - No hardcoded secrets, input sanitization, SQL injection prevention
- **Payment Security** - Amount validation, mock mode warnings, callback logging

## Running the Tests

### Full Security Suite

```bash
# Run all security tests
npx playwright test tests/security/security-compliance.spec.ts

# Run with headed browser (see what's happening)
npx playwright test tests/security/security-compliance.spec.ts --headed

# Run with UI mode (interactive debugging)
npx playwright test tests/security/security-compliance.spec.ts --ui

# Generate HTML report
npx playwright test tests/security/security-compliance.spec.ts --reporter=html
```

### Run Specific Test Categories

```bash
# Test only Phase 1 critical fixes
npx playwright test tests/security/security-compliance.spec.ts -g "Phase 1 Critical"

# Test only PPL compliance
npx playwright test tests/security/security-compliance.spec.ts -g "Israeli PPL"

# Test only authentication security
npx playwright test tests/security/security-compliance.spec.ts -g "Authentication Security"

# Test only payment security
npx playwright test tests/security/security-compliance.spec.ts -g "Payment Security"
```

### Run Individual Tests

```bash
# Test payment signature validation
npx playwright test tests/security/security-compliance.spec.ts -g "should reject callbacks without signature"

# Test mock mode production safety
npx playwright test tests/security/security-compliance.spec.ts -g "should have runtime guard"

# Test error message sanitization
npx playwright test tests/security/security-compliance.spec.ts -g "should not expose internal errors"
```

## Test Categories

### 1. Phase 1 Critical Security Fixes (CRIT-1 to CRIT-4)

#### CRIT-1: Payment Signature Validation

- ✅ Rejects callbacks without signature
- ✅ Rejects callbacks with invalid signature
- ✅ Validates signature code exists in callback handler

**What it tests:**

- Payment callback endpoint requires HMAC-SHA256 signature
- Invalid signatures are rejected before processing
- Missing signatures are caught and logged

**Why it matters:**

- Prevents payment tampering attacks
- Ensures only YaadPay can trigger payment confirmations
- Protects against fraudulent payment notifications

#### CRIT-2: Mock Mode Production Safety

- ✅ Runtime guard exists in yaadpay.ts
- ✅ Mock mode is documented as dev-only

**What it tests:**

- Mock mode cannot be enabled in production environment
- Configuration throws error if NODE_ENV=production and MOCK_MODE=true
- Documentation clearly warns against production use

**Why it matters:**

- Prevents bypassing payment gateway in production
- Ensures real payments are processed through YaadPay
- Protects revenue and prevents fraud

#### CRIT-3: Error Message Sanitization

- ✅ No internal error exposure in signup API
- ✅ Request ID generation for support tracking
- ✅ Generic error messages returned to users

**What it tests:**

- API errors don't leak database schema details
- Stack traces are logged but not returned to client
- Request IDs allow support to debug without exposing internals

**Why it matters:**

- Prevents information disclosure attacks
- Protects database structure from reverse engineering
- Maintains professional error messages in Hebrew

#### CRIT-4: Multi-Tenant Isolation

- ✅ SchoolId validation in team invitations
- ✅ SchoolId filtering in events API
- ✅ Invariant violations logged for suspicious activity

**What it tests:**

- Non-super admins cannot access other schools' data
- All API endpoints filter by schoolId
- Missing schoolId triggers invariant violation alerts

**Why it matters:**

- Prevents data leaks between schools
- Ensures complete tenant isolation
- Critical for multi-tenant SaaS security

### 2. Israeli PPL Compliance

#### Data Protection Officer (DPO) Information

- ✅ DPO contact visible on privacy page
- ✅ Email address published (privacy@ticketcap.co.il)
- ✅ Amendment 13 compliance noted

**What it tests:**

- Privacy page displays required DPO information in Hebrew
- Contact details are accessible to data subjects
- Legal references to Amendment 13 are present

**Why it matters:**

- Required by Israeli Privacy Protection Law
- Gives users a point of contact for privacy concerns
- Demonstrates legal compliance

#### Encryption Library

- ✅ Phone number encryption/decryption works
- ✅ General data encryption works
- ✅ Encrypted data is base64 encoded (not readable)

**What it tests:**

- AES-256-GCM encryption library is functional
- Phone numbers can be encrypted and decrypted
- Encrypted data is not stored in plaintext

**Why it matters:**

- Protects PII (personally identifiable information)
- Required for PPL compliance
- Prevents data breaches from exposing sensitive info

#### Breach Incident Model

- ✅ BreachIncident model exists in Prisma schema

**What it tests:**

- Database can track security incidents
- Breach notification system is in place

**Why it matters:**

- PPL requires documenting data breaches
- Enables compliance with 72-hour notification rule
- Provides audit trail for regulators

#### Data Retention Policy

- ✅ Retention policy documented on privacy page

**What it tests:**

- Privacy page explains how long data is kept
- Users understand their data lifecycle

**Why it matters:**

- PPL requires transparency about data retention
- Users have right to know retention periods
- Compliance with "data minimization" principle

### 3. Authentication Security

#### Rate Limiting

- ✅ Rate limiter library exists
- ⚠️ Excessive login attempts blocked (manual test only)

**What it tests:**

- Login endpoint has rate limiting
- Brute force attacks are prevented
- Rate limiter library is properly implemented

**Why it matters:**

- Prevents password guessing attacks
- Protects user accounts from compromise
- Standard security best practice

**Note:** The excessive login test is skipped by default to avoid triggering actual rate limits during CI/CD. Run manually when testing rate limiting specifically.

#### Password Validation

- ✅ Validator library exists with required rules
- ✅ Weak passwords are rejected
- ✅ Strong passwords are accepted
- ✅ Passwords containing email are rejected

**What it tests:**

- Password validator enforces complexity requirements
- Minimum 10 characters with uppercase, lowercase, number, special char
- Password strength scoring (weak/medium/strong)
- Prevents using email address in password

**Why it matters:**

- Prevents weak passwords that are easy to crack
- Reduces risk of account takeover
- Industry best practice for authentication

#### JWT Security

- ✅ JWT_SECRET must be configured (no default)
- ✅ Minimum 32 character requirement documented

**What it tests:**

- Auth library does not use fallback/default secret
- Environment variable documentation specifies minimum length
- JWT tokens cannot be forged

**Why it matters:**

- Weak JWT secrets can be brute-forced
- Session hijacking if secret is compromised
- Critical for authentication security

### 4. File Integrity Checks

- ✅ All critical security files exist
- ✅ Security documentation files exist
- ✅ Environment variables documented in .env.example
- ✅ Encryption key documented if encryption exists

**What it tests:**

- No files accidentally deleted during refactoring
- Documentation stays in sync with code
- New developers have proper setup guide

**Why it matters:**

- Prevents deployment of incomplete security features
- Ensures consistency across environments
- Documentation is source of truth

### 5. Code Quality Checks

#### No Hardcoded Secrets

- ✅ YaadPay config uses environment variables
- ✅ No hardcoded terminal numbers or API secrets

**What it tests:**

- All secrets come from environment variables
- No credentials committed to git
- Configuration is environment-specific

**Why it matters:**

- Prevents secret leakage in version control
- Allows different credentials per environment
- Security best practice

#### Payment Callback Validation

- ✅ All required YaadPay parameters checked
- ✅ CCode, Order, Id, Amount validated

**What it tests:**

- Callback handler validates all expected parameters
- Missing parameters are caught early

**Why it matters:**

- Prevents malformed callback processing
- Ensures data integrity in payment flow
- Reduces edge case bugs

#### Input Sanitization

- ✅ Signup API sanitizes email
- ✅ Password is hashed with bcrypt

**What it tests:**

- User input is validated before processing
- Passwords are never stored in plaintext
- Email addresses are properly formatted

**Why it matters:**

- Prevents injection attacks
- Password security best practice
- Data integrity

#### SQL Injection Prevention

- ✅ Uses Prisma ORM (safe by default)
- ✅ Raw queries use parameterization

**What it tests:**

- No raw SQL with string concatenation
- If using $queryRaw, uses Prisma.sql for parameterization

**Why it matters:**

- SQL injection is #1 web vulnerability (OWASP)
- Prisma prevents injection by default
- Database integrity and security

### 6. Payment Security

- ✅ Amount validation (must be positive)
- ✅ Mock mode displays clear warning
- ✅ Callback logs suspicious activity

**What it tests:**

- Payment amounts are validated before processing
- Mock mode shows "Development Only" badge
- Failed payments and invalid signatures are logged

**Why it matters:**

- Prevents negative or zero amount payments
- Developers know when using mock mode
- Security incidents are traceable

## Expected Test Results

### Passing Tests (Should Always Pass)

- Phase 1 Critical Fixes (all 4 categories)
- Israeli PPL Compliance (DPO info, breach model)
- Authentication Security (JWT, password validator exists)
- File Integrity (all critical files exist)
- Code Quality (no hardcoded secrets, input sanitization)
- Payment Security (validation and logging)

### Conditional Tests (May Be Skipped)

These tests are skipped if the feature is not yet implemented:

- **Encryption Library Tests** - Skipped if `lib/encryption.ts` doesn't exist
- **Password Validation Tests** - Skipped if `lib/password-validator.ts` doesn't exist
- **Rate Limiting Live Test** - Always skipped (manual only)

### Tests That Should Be Implemented

If any of these tests are skipped, the corresponding feature needs to be implemented:

1. **Encryption Library** (`lib/encryption.ts`)
   - Implement AES-256-GCM encryption
   - Add phone number encryption helpers
   - Update ENCRYPTION_KEY in .env.example

2. **Password Validator** (`lib/password-validator.ts`)
   - Implement password strength checking
   - Add complexity rules (10+ chars, uppercase, lowercase, number, special)
   - Add email-in-password detection

3. **Rate Limiter** (`lib/rate-limiter.ts`)
   - Implement IP-based rate limiting
   - Add to login and signup endpoints
   - Configure limits (5 attempts per 15 minutes recommended)

## Integration with CI/CD

### Pre-Commit Checks

Add to `.husky/pre-commit`:

```bash
# Run security tests before commit
npx playwright test tests/security/security-compliance.spec.ts --reporter=list
```

### Pre-Push Checks

Add to `.husky/pre-push`:

```bash
# Full security suite before push
npm run test:security
```

### Add to package.json

```json
{
  "scripts": {
    "test:security": "playwright test tests/security/security-compliance.spec.ts",
    "test:security:ui": "playwright test tests/security/security-compliance.spec.ts --ui",
    "test:security:report": "playwright test tests/security/security-compliance.spec.ts --reporter=html"
  }
}
```

### GitHub Actions

Add to `.github/workflows/security-checks.yml`:

```yaml
name: Security Compliance Tests

on:
  pull_request:
    branches: [main, development]
  push:
    branches: [main, development]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:security
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-test-report
          path: playwright-report/
```

## Troubleshooting

### Tests Fail Due to Missing Files

**Error:** `Expected lib/encryption.ts to exist`

**Solution:** Implement the missing security feature. These are critical for production readiness.

### Rate Limiting Test Times Out

**Error:** Test timeout after 30 seconds

**Solution:** This test is skipped by default. If running manually, ensure dev server is responsive and not rate-limiting test requests.

### Privacy Page Tests Fail

**Error:** `DPO contact information not visible`

**Solution:** Check that `/app/privacy/page.tsx` has been updated with DPO information. The privacy page must display:

- קצין הגנת המידע (Data Protection Officer)
- privacy@ticketcap.co.il
- תיקון 13 (Amendment 13)

### Signature Validation Tests Fail

**Error:** `Missing callback signature` not found in response

**Solution:** Verify `/app/api/payment/callback/route.ts` has signature validation implemented. The callback must check for `signature` parameter and validate it using HMAC-SHA256.

## Manual Security Testing

### Payment Flow Testing

1. Set `YAADPAY_MOCK_MODE="true"` in `.env`
2. Create event with payment required
3. Register and submit payment
4. Verify mock screen shows "Development Only" warning
5. Check database for payment record with status="COMPLETED"

### Multi-Tenant Isolation Testing

1. Create two schools (School A and School B)
2. Create admin for each school
3. Login as School A admin
4. Attempt to access School B's events via API
5. Should receive 403 Forbidden

### Rate Limiting Testing

1. Make 6 rapid login attempts with wrong password
2. 6th attempt should return 429 Too Many Requests
3. Wait 15 minutes
4. Should be able to login again

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] All security tests pass
- [ ] `YAADPAY_MOCK_MODE` is `false` or removed
- [ ] `JWT_SECRET` is 32+ characters (unique per environment)
- [ ] `ENCRYPTION_KEY` is set (if using encryption)
- [ ] DPO information is visible on privacy page
- [ ] Rate limiting is enabled on auth endpoints
- [ ] Password validator is enforcing strong passwords
- [ ] Payment signature validation is active
- [ ] All critical files exist (run file integrity tests)
- [ ] No hardcoded secrets in code

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: security@ticketcap.co.il
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)
4. Wait for acknowledgment (within 72 hours)
5. Coordinate disclosure timeline with security team

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Israeli Privacy Protection Law](https://www.gov.il/en/departments/legalInfo/privacy_protection)
- [YaadPay Security Documentation](https://yaadpay.co.il/docs/security)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Playwright Testing Best Practices](https://playwright.dev/docs/best-practices)

## Maintenance

This test suite should be updated when:

- New security features are added
- Critical vulnerabilities are patched
- Compliance requirements change (PPL amendments)
- Payment gateway integration changes
- Authentication flow is modified

**Review Schedule:** Quarterly security audit (every 3 months)

---

**Last Updated:** 2026-01-12
**Maintained By:** Security Team
**Next Review:** 2026-04-12
