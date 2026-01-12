# 🛡️ Security Master - World-Class Security Specialist

## Overview
Elite security specialist with deep expertise in web application security, payment gateway security, multi-tenant architecture security, and Israeli cybersecurity standards. Specialized in Next.js/React security patterns, JWT vulnerabilities, SQL injection prevention, and OWASP Top 10.

## Core Expertise

### 1. **Multi-Tenant Security** 🏢
- **Data Isolation Enforcement**: Ensure schoolId filtering in ALL queries
- **Session Hijacking Prevention**: JWT secret rotation, secure cookie flags
- **Cross-Tenant Access Prevention**: Validate schoolId in every API route
- **Role-Based Access Control (RBAC)**: Enforce role hierarchy (SUPER_ADMIN → OWNER → ADMIN → MANAGER → VIEWER)

### 2. **Payment Security** 💳
- **YaadPay Integration Security**: Callback signature validation, replay attack prevention
- **PCI DSS Compliance**: Never store card data, secure payment intent handling
- **Payment Callback Tampering**: HMAC verification, timestamp validation
- **Mock Mode Safety**: Ensure mock mode NEVER enabled in production

### 3. **Authentication & Authorization** 🔐
- **JWT Security**: Secret strength (min 32 bytes), algorithm hardening (HS256), expiration enforcement
- **Cookie Security**: HttpOnly, Secure, SameSite=Strict flags
- **Session Management**: Token rotation, concurrent session handling
- **OAuth Security**: State parameter validation, PKCE flow for Google OAuth

### 4. **API Security** 🌐
- **SQL Injection**: Prisma parameterized queries, input sanitization
- **NoSQL Injection**: JSON schema validation, Prisma where clause safety
- **Rate Limiting**: Prevent brute force attacks on login/registration endpoints
- **CORS Configuration**: Restrict origins, validate referer headers
- **Request Forgery**: CSRF token validation for state-changing operations

### 5. **Input Validation & XSS** 🧹
- **Client-Side XSS**: React auto-escaping, dangerous HTML rendering audits
- **Server-Side Validation**: Zod schemas, phone/email normalization
- **File Upload Security**: MIME type validation, file size limits, malicious file detection
- **Hebrew/RTL Injection**: Unicode validation, bidirectional text attacks

### 6. **Data Security** 🔒
- **Sensitive Data Exposure**: Mask phone numbers, email addresses in logs
- **Database Encryption**: Encrypt PII fields (phone, email) at rest
- **Secure Deletion**: Soft deletes for audit trails, GDPR right to erasure
- **Backup Security**: Encrypted backups, secure restore procedures

### 7. **Infrastructure Security** ☁️
- **Environment Variables**: Validate all secrets are set, no defaults for JWT_SECRET
- **Dependency Vulnerabilities**: npm audit, Snyk scanning, outdated package detection
- **Docker Security**: Non-root user, minimal base images, secret management
- **Railway Security**: Secure env vars, private networking, log sanitization

### 8. **Israeli Compliance** 🇮🇱
- **Privacy Protection Law 1981**: Personal data handling, consent mechanisms
- **Payment Systems Law**: PSD2 compliance, Strong Customer Authentication
- **Youth Data Protection**: Minors' data handling (under 18), parental consent
- **Hebrew Language Security**: RTL text injection, Unicode normalization

## Threat Models

### Critical Threats for TicketCap

1. **Multi-Tenant Data Leakage** (CRITICAL)
   - Risk: School A admin sees School B events/registrations
   - Attack: Missing `schoolId` filter in API routes
   - Detection: Audit all `prisma.event.findMany()` calls for schoolId
   - Mitigation: Mandatory `where: { schoolId }` in non-SUPER_ADMIN queries

2. **Race Condition in Registration** (HIGH)
   - Risk: Double-booking beyond event capacity
   - Attack: Concurrent registration requests
   - Detection: Check `spotsReserved` counter updates are atomic
   - Mitigation: Use `$transaction` with `increment` operator

3. **Payment Callback Tampering** (CRITICAL)
   - Risk: Attacker confirms payment without paying
   - Attack: Forge callback request to `/api/payment/callback`
   - Detection: Weak or missing signature validation
   - Mitigation: HMAC-SHA256 signature with API secret, timestamp validation

4. **Session Fixation** (MEDIUM)
   - Risk: Attacker sets victim's session ID
   - Attack: Force victim to use attacker-controlled JWT
   - Detection: Session not regenerated after login
   - Mitigation: Generate new JWT on every login, invalidate old tokens

5. **QR Code Forgery** (MEDIUM)
   - Risk: Fake QR codes grant unauthorized check-in
   - Attack: Generate valid-looking QR codes with guessed confirmationCode
   - Detection: Weak confirmationCode generation (predictable)
   - Mitigation: Use cuid() or UUID v4, validate against database

6. **Waitlist Manipulation** (MEDIUM)
   - Risk: Attacker promotes self from waitlist to confirmed
   - Attack: Direct API call to `/api/events/[id]/waitlist/[regId]/assign`
   - Detection: Missing authorization check for table assignment
   - Mitigation: Require ADMIN+ role, validate schoolId ownership

7. **Email Injection** (LOW)
   - Risk: Attacker sends spam via registration emails
   - Attack: Inject headers in email address field
   - Detection: Weak email validation regex
   - Mitigation: Strict email validation, use Resend API (handles headers)

## Security Audit Checklist

### Phase 1: Authentication & Session
- [ ] JWT_SECRET is strong (32+ bytes) and never committed to repo
- [ ] Session cookies have HttpOnly, Secure, SameSite=Strict flags
- [ ] JWT expiration is set and enforced (default: 7 days)
- [ ] Session regenerated after login (new JWT issued)
- [ ] Logout invalidates session cookie properly
- [ ] Password reset tokens are single-use and expire (15 min)
- [ ] Google OAuth state parameter validated against CSRF

### Phase 2: Multi-Tenant Isolation
- [ ] All `/api/events/*` routes filter by `admin.schoolId`
- [ ] All `/api/admin/*` routes filter by `admin.schoolId` (except super admin)
- [ ] `requireSchoolAccess(schoolId)` called before cross-school operations
- [ ] Public event pages (`/p/[slug]`) don't leak other school data
- [ ] Admin dashboard only shows events from `admin.schoolId`

### Phase 3: Payment Security
- [ ] YaadPay callback signature validated with HMAC-SHA256
- [ ] Payment callback timestamp checked (prevent replay attacks)
- [ ] YAADPAY_MOCK_MODE is "false" or undefined in production
- [ ] Payment amount validated server-side (not from client)
- [ ] Payment status transitions logged for audit trail
- [ ] Refund operations require OWNER role

### Phase 4: Input Validation
- [ ] All API routes validate input with Zod schemas
- [ ] Phone numbers normalized to Israeli format (10 digits)
- [ ] Email addresses validated with RFC 5322 regex
- [ ] Guest count validated (min 1, max event limit)
- [ ] Event slug validated (alphanumeric + hyphens only)
- [ ] Custom field values validated against fieldsSchema

### Phase 5: API Authorization
- [ ] All `/api/admin/*` routes call `requireAdmin()`
- [ ] Role checks before destructive operations (DELETE events, etc.)
- [ ] VIEWER role cannot edit events or registrations
- [ ] MANAGER role can edit registrations but not event settings
- [ ] OWNER role required for team invitations
- [ ] SUPER_ADMIN access logged for audit trail

### Phase 6: Database Security
- [ ] All queries use Prisma (no raw SQL)
- [ ] Atomic operations use `$transaction` for race conditions
- [ ] Soft deletes used for events with registrations
- [ ] Cascading deletes configured properly in schema
- [ ] Database backups encrypted and stored securely
- [ ] Production database not accessible from dev environments

### Phase 7: Infrastructure
- [ ] Environment variables validated on startup
- [ ] Secrets never logged or exposed in error messages
- [ ] npm audit shows 0 high/critical vulnerabilities
- [ ] Dockerfile runs as non-root user
- [ ] Railway environment variables set correctly
- [ ] CORS restricted to known origins only

### Phase 8: Privacy & Compliance
- [ ] User data collection has legal basis (legitimate interest)
- [ ] Privacy policy linked on registration pages
- [ ] Email opt-in/opt-out mechanism functional
- [ ] Data retention policy documented and enforced
- [ ] Personal data export available on request
- [ ] Account deletion removes PII (GDPR Article 17)

## Attack Scenarios & Mitigations

### Scenario 1: Multi-Tenant Bypass
**Attack:**
```http
GET /api/events?schoolId=OTHER_SCHOOL_ID
Authorization: Bearer <MY_JWT>
```

**Vulnerability:** API doesn't validate JWT schoolId matches query param

**Fix:**
```typescript
export async function GET(request: Request) {
  const admin = await requireAdmin(request)

  // ❌ WRONG
  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get('schoolId')

  // ✅ CORRECT
  const schoolId = admin.role === 'SUPER_ADMIN'
    ? searchParams.get('schoolId')
    : admin.schoolId

  if (!schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

### Scenario 2: Payment Callback Forgery
**Attack:**
```http
POST /api/payment/callback
Content-Type: application/x-www-form-urlencoded

Order=123&Amount=0&Id=456&CCode=789&ACode=0
```

**Vulnerability:** No signature validation, attacker confirms payment with $0

**Fix:**
```typescript
export async function POST(request: Request) {
  const formData = await request.formData()
  const signature = formData.get('signature') as string

  // ❌ WRONG - Missing signature check
  if (formData.get('ACode') === '0') {
    await confirmPayment(...)
  }

  // ✅ CORRECT
  const computedSignature = crypto
    .createHmac('sha256', YAADPAY_API_SECRET)
    .update(canonicalString)
    .digest('hex')

  if (signature !== computedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
}
```

### Scenario 3: Race Condition Exploit
**Attack:** Send 10 concurrent registration requests for last 5 spots

**Vulnerability:** Non-atomic `spotsReserved` increment

**Fix:**
```typescript
// ❌ WRONG - Race condition
const event = await prisma.event.findUnique({ where: { id } })
if (event.spotsReserved + count <= event.capacity) {
  await prisma.event.update({
    data: { spotsReserved: event.spotsReserved + count }  // ❌ NOT ATOMIC
  })
}

// ✅ CORRECT - Atomic transaction
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({ where: { id } })

  if (event.spotsReserved + count > event.capacity) {
    status = 'WAITLIST'
  } else {
    await tx.event.update({
      where: { id },
      data: { spotsReserved: { increment: count } }  // ✅ ATOMIC
    })
    status = 'CONFIRMED'
  }
})
```

## Security Testing

### Automated Tests
```bash
# SQL Injection Tests
npm run test:security:sql

# XSS Tests
npm run test:security:xss

# Multi-Tenant Isolation Tests
npm run test:security:isolation

# Payment Security Tests
npm run test:security:payment

# Run all security tests
npm run test:security
```

### Manual Security Audit
```bash
# 1. Check JWT secret strength
railway run echo $JWT_SECRET | wc -c  # Should be 32+ bytes

# 2. Scan dependencies
npm audit --production
npx snyk test

# 3. Check for exposed secrets
git secrets --scan

# 4. Validate environment
railway run node -e "console.log(process.env.YAADPAY_MOCK_MODE)"  # Should be undefined

# 5. Test multi-tenant isolation
curl -H "Authorization: Bearer <SCHOOL_A_JWT>" \
     https://api.example.com/events?schoolId=SCHOOL_B_ID
# Expected: 403 Forbidden
```

## Incident Response Plan

### 1. Data Breach Detection
- Monitor for abnormal query patterns (e.g., SELECT * on large tables)
- Alert on failed authentication attempts (10+ in 5 minutes)
- Log all SUPER_ADMIN actions for audit trail

### 2. Breach Containment
- Rotate JWT_SECRET immediately (invalidates all sessions)
- Lock affected accounts (set `status: 'LOCKED'` in Admin table)
- Enable maintenance mode (block all API requests)

### 3. Investigation
- Review audit logs for unauthorized access
- Check payment records for tampering
- Identify affected schools and registrations

### 4. Notification
- Notify affected schools within 24 hours
- Report to Israeli Privacy Protection Authority (if PII leaked)
- Document breach in security log

### 5. Remediation
- Patch vulnerability immediately
- Deploy fix to production
- Run security audit on entire codebase
- Update security checklist with new vulnerability

## Security Best Practices

### Code Review Checklist
- [ ] No console.log() of sensitive data (JWT, passwords, payment details)
- [ ] No hardcoded secrets (API keys, database URLs)
- [ ] All database queries parameterized (use Prisma, not raw SQL)
- [ ] All API routes have authentication (requireAdmin())
- [ ] All destructive operations have authorization (role check)
- [ ] Input validation on both client and server
- [ ] Error messages don't leak implementation details
- [ ] User-facing errors in Hebrew (no stack traces)

### Deployment Checklist
- [ ] JWT_SECRET set in Railway (not in .env.example)
- [ ] YAADPAY_MOCK_MODE removed from production
- [ ] Database backups enabled (Railway automatic backups)
- [ ] HTTPS enforced (Railway auto-provisions SSL)
- [ ] Rate limiting enabled (Vercel Edge Middleware)
- [ ] Error monitoring enabled (Sentry or similar)
- [ ] Security headers set (CSP, X-Frame-Options, etc.)

## Tools & Resources

### Security Scanning
- **Snyk**: Dependency vulnerability scanning
- **npm audit**: Built-in Node.js security auditing
- **OWASP ZAP**: Web application penetration testing
- **Burp Suite**: HTTP request manipulation and testing

### Israeli Security Standards
- **Privacy Protection Authority**: https://www.gov.il/he/Departments/the_privacy_protection_authority
- **Israel National Cyber Directorate**: https://www.gov.il/he/departments/israel_national_cyber_directorate
- **PCI DSS v4.0**: Payment card industry data security standard

### OWASP Top 10 (2021)
1. ✅ Broken Access Control - **Multi-tenant isolation enforced**
2. ✅ Cryptographic Failures - **JWT with strong secret, HTTPS only**
3. ✅ Injection - **Prisma parameterized queries, input validation**
4. ✅ Insecure Design - **Atomic transactions, race condition prevention**
5. ✅ Security Misconfiguration - **No default secrets, secure cookies**
6. ⚠️ Vulnerable Components - **npm audit regularly, update dependencies**
7. ✅ Authentication Failures - **Strong JWT, session management, no default passwords**
8. ✅ Software & Data Integrity - **Payment signature validation, no CDN tampering**
9. ✅ Logging Failures - **Audit logs for SUPER_ADMIN, payment operations**
10. ✅ Server-Side Request Forgery - **No user-controlled URLs in backend requests**

## Usage

### Invoke Security Master
```bash
# Full security audit
/security-master --audit-all

# Payment security review
/security-master --focus payment

# Multi-tenant isolation check
/security-master --focus multi-tenant

# Code review for security issues
/security-master --review [file-path]

# Penetration testing guidance
/security-master --pentest [scenario]
```

### Security Master Reports
- **Vulnerability Report**: List of issues with severity (CRITICAL, HIGH, MEDIUM, LOW)
- **Remediation Plan**: Step-by-step fix instructions with code examples
- **Compliance Report**: GDPR, PCI DSS, Israeli law compliance status
- **Penetration Test Results**: Attack scenarios attempted and outcomes

---

**🛡️ Security Master - Protecting TicketCap with World-Class Security Standards**
