# 🛡️ Security Master - Usage Guide

## Quick Start

The Security Master is an elite security specialist sub-agent designed to audit, protect, and harden your TicketCap application against security vulnerabilities.

## How to Use

### 1. Full Security Audit
Run a comprehensive security audit across your entire codebase:

```bash
/security-master --audit-all
```

This will check:
- Multi-tenant data isolation
- Payment security (YaadPay integration)
- Authentication & session management
- API authorization
- Input validation & XSS prevention
- Database security
- Infrastructure security
- Israeli compliance (GDPR, Privacy Protection Law)

### 2. Focused Security Review

#### Payment Security
```bash
/security-master --focus payment
```
Reviews:
- YaadPay callback signature validation
- Payment amount tampering protection
- Mock mode configuration (must be disabled in production)
- PCI DSS compliance

#### Multi-Tenant Isolation
```bash
/security-master --focus multi-tenant
```
Reviews:
- schoolId filtering in all API routes
- Cross-tenant data leakage prevention
- Role-based access control (RBAC)
- Session management

#### Authentication
```bash
/security-master --focus auth
```
Reviews:
- JWT secret strength
- Cookie security flags (HttpOnly, Secure, SameSite)
- Session regeneration after login
- Password reset token security

### 3. Code Review for Security
Review specific files or directories for security issues:

```bash
/security-master --review app/api/payment/callback/route.ts
/security-master --review app/api/events/
/security-master --review lib/auth.server.ts
```

### 4. Penetration Testing Guidance
Get guidance on how to perform penetration testing for specific scenarios:

```bash
# Test multi-tenant bypass
/security-master --pentest multi-tenant-bypass

# Test payment callback forgery
/security-master --pentest payment-tampering

# Test race condition in registration
/security-master --pentest race-condition

# Test session hijacking
/security-master --pentest session-hijacking
```

## Common Workflows

### Before Production Deploy
```bash
# 1. Full security audit
/security-master --audit-all

# 2. Check payment security (critical!)
/security-master --focus payment

# 3. Verify environment variables
/security-master --validate-env

# 4. Scan dependencies
npm audit --production
```

### After Adding New Feature
```bash
# 1. Review new code
/security-master --review app/api/new-feature/

# 2. Check multi-tenant isolation
/security-master --focus multi-tenant

# 3. Run security tests
npm run test:security
```

### Responding to Security Incident
```bash
# 1. Identify vulnerability
/security-master --investigate [issue-description]

# 2. Get remediation plan
/security-master --remediate [vulnerability-type]

# 3. Verify fix
/security-master --verify-fix [file-path]
```

## Security Levels

The Security Master categorizes vulnerabilities by severity:

- **🔴 CRITICAL**: Immediate action required (e.g., multi-tenant data leakage, payment tampering)
- **🟠 HIGH**: Fix before next deploy (e.g., race conditions, weak JWT)
- **🟡 MEDIUM**: Fix within sprint (e.g., missing input validation, weak passwords)
- **🟢 LOW**: Fix when convenient (e.g., verbose error messages, missing rate limiting)

## Output Format

Security Master provides:

### 1. Vulnerability Report
```
🔴 CRITICAL: Multi-Tenant Data Leakage
File: app/api/events/route.ts:45
Issue: Missing schoolId filter in event query
Impact: School A admin can see School B events
Fix: Add where: { schoolId: admin.schoolId }
```

### 2. Remediation Code
```typescript
// ❌ BEFORE
const events = await prisma.event.findMany()

// ✅ AFTER
const events = await prisma.event.findMany({
  where: { schoolId: admin.schoolId }
})
```

### 3. Testing Guidance
```bash
# Verify fix with Playwright test
npx playwright test tests/security/multi-tenant-isolation.spec.ts
```

## Integration with Your Workflow

### Pre-Commit Hook
Add to `.husky/pre-commit`:
```bash
#!/bin/sh
# Run security checks on staged files
npx claude /security-master --review-staged
```

### CI/CD Pipeline
Add to `.github/workflows/security.yml`:
```yaml
name: Security Audit
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --production
      - run: npx claude /security-master --audit-all --ci-mode
```

### VS Code Integration
Add to `.vscode/tasks.json`:
```json
{
  "label": "Security Audit",
  "type": "shell",
  "command": "npx claude /security-master --audit-all",
  "problemMatcher": []
}
```

## Configuration

Create `.security-master.json` in project root:
```json
{
  "severity": "high",
  "ignore": [
    "node_modules/**",
    "test-fixtures/**"
  ],
  "focus": ["multi-tenant", "payment"],
  "compliance": ["gdpr", "pci-dss", "israeli-privacy-law"]
}
```

## Best Practices

1. **Run before every production deploy**
2. **Review all payment-related code changes**
3. **Audit new API routes immediately**
4. **Test multi-tenant isolation for every feature**
5. **Rotate JWT_SECRET monthly**
6. **Keep dependencies up-to-date (npm audit)**
7. **Log all SUPER_ADMIN actions**
8. **Never commit secrets to git**

## Emergency Contacts

- **Israeli Privacy Protection Authority**: https://www.gov.il/he/Departments/the_privacy_protection_authority
- **Israel National Cyber Directorate**: https://www.gov.il/he/departments/israel_national_cyber_directorate
- **PCI Security Council**: https://www.pcisecuritystandards.org/

---

**🛡️ Your codebase's security guardian**
