# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **Do Not** Open a Public Issue

Please **do not** report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Send a detailed report to the project maintainers via:
- **GitHub Security Advisories**: Use the "Security" tab in this repository
- **Email**: [Add your security contact email here]

### 3. Include the Following Information

To help us understand and fix the issue quickly, please include:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Affected component(s)** (file paths, function names, API endpoints)
- **Steps to reproduce** the vulnerability
- **Proof of concept** or example exploit (if possible)
- **Impact assessment** (what an attacker could do)
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

### 4. Response Timeline

We aim to respond within:
- **24 hours**: Initial acknowledgment
- **7 days**: Assessment and severity classification
- **30 days**: Fix and security patch release (for HIGH/CRITICAL issues)

### 5. Disclosure Policy

- We practice **coordinated disclosure**
- Security advisories will be published after a fix is available
- We will credit reporters in the security advisory (unless you prefer anonymity)

## Security Best Practices

### For Contributors

When contributing code, please follow these security guidelines:

#### 1. **Never Commit Secrets**
- ❌ API keys, passwords, tokens
- ❌ Private keys, certificates
- ❌ Database credentials
- ✅ Use environment variables instead

#### 2. **Input Validation**
- Validate all user input (forms, API requests, URL parameters)
- Sanitize data before database queries (use Prisma's parameterized queries)
- Escape HTML output to prevent XSS

#### 3. **Authentication & Authorization**
- Use HTTP-only cookies for session tokens
- Enforce role-based access control (RBAC)
- Verify `schoolId` in all multi-tenant operations

#### 4. **Dependencies**
- Run `npm audit` before submitting PRs
- Fix HIGH/CRITICAL vulnerabilities immediately
- Update dependencies regularly

#### 5. **Secure Coding Patterns**
```typescript
// ✅ GOOD: Parameterized query (Prisma)
await prisma.event.findMany({
  where: { schoolId: session.schoolId }
})

// ❌ BAD: String concatenation (vulnerable to SQL injection)
await db.query(`SELECT * FROM events WHERE schoolId = '${schoolId}'`)

// ✅ GOOD: Multi-tenant isolation enforced
if (admin.role !== 'SUPER_ADMIN') {
  where.schoolId = admin.schoolId // Enforce tenant boundary
}

// ❌ BAD: Missing tenant isolation
const events = await prisma.event.findMany() // Returns ALL events!
```

### For Users

#### 1. **Keep Your Environment Secure**
- Use strong, unique passwords
- Enable 2FA when available
- Keep your JWT_SECRET secure (min 32 characters, random)

#### 2. **Monitor for Suspicious Activity**
- Review audit logs regularly
- Check for unauthorized team members
- Monitor usage metrics for anomalies

#### 3. **Report Issues**
- Report suspicious behavior immediately
- Change passwords if you suspect compromise
- Review recent access logs

## Security Features

### Built-in Protections

TicketCap includes these security features:

#### 1. **Authentication**
- JWT-based sessions with HTTP-only cookies
- Email verification required
- Password hashing with bcrypt (10 rounds)
- Session expiry (7 days)

#### 2. **Authorization**
- Role-based access control (SUPER_ADMIN, OWNER, ADMIN, MANAGER, VIEWER)
- Multi-tenant data isolation enforced at database level
- API route protection via middleware

#### 3. **Data Protection**
- Runtime invariant guards prevent data corruption
- Atomic operations prevent race conditions
- No hard deletes on protected models (soft delete only)

#### 4. **Input Validation**
- Phone number normalization (Israeli format)
- Email validation
- Capacity constraint enforcement
- Min/max guest validation

## Security Scanning

### Automated Scans

We run automated security scans on:
- **Every Pull Request**: Trivy filesystem scan, npm audit, dependency review
- **Every Push**: Security workflow execution
- **Daily**: Scheduled security scans at 2 AM UTC
- **Pre-commit**: Type checking, linting, unit tests
- **Pre-push**: npm audit (HIGH/CRITICAL), secret scanning (gitleaks), E2E tests

### Manual Reviews

Security-critical PRs undergo manual code review focusing on:
- Authentication/authorization logic
- Multi-tenant isolation
- Data validation
- SQL injection vectors
- XSS vulnerabilities

## Known Security Considerations

### 1. **Multi-Tenancy**
- Critical: All queries MUST filter by `schoolId` (except SUPER_ADMIN)
- Runtime guards enforce `Event.schoolId` and `Registration.eventId`
- Test coverage: 100% for `lib/prisma-guards.ts`

### 2. **Rate Limiting**
- ⚠️ Not yet implemented
- Future: Add rate limiting for registration endpoints
- Future: Add CAPTCHA for public registration forms

### 3. **Email Security**
- Resend API used for transactional emails
- Domain verification required in production
- No inline scripts in email templates

## Compliance

### Data Privacy
- User data isolated by school (multi-tenant)
- No personal data shared across schools
- Registration data includes: name, email, phone, guest count

### GDPR Considerations
- Right to erasure: Soft delete with anonymization
- Data portability: CSV export available
- Consent: Registration implies consent for event communication

## Security Tooling

### Recommended Tools

Install these tools for local development:

```bash
# Secret scanning
brew install gitleaks

# Dependency scanning
npm install -g npm-check-updates

# Security auditing
npm audit
```

### Pre-push Hook

Our pre-push hook automatically runs:
1. npm audit (HIGH/CRITICAL check)
2. gitleaks secret scan (if installed)
3. P0 critical E2E tests

## Contact

For security-related questions or concerns:
- **GitHub Security Advisories**: Preferred method
- **Email**: [Add your security contact email]
- **Response Time**: Within 24 hours

---

**Last Updated**: January 2026
**Version**: 1.0.0
