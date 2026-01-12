# Data Retention Policy - Israeli PPL Compliance

## Overview

This document outlines TicketCap's data retention policy in compliance with Israeli Privacy Protection Law (PPL), specifically Amendment 13 (תיקון 13 לחוק הגנת הפרטיות, התשמ״א-1981).

**Key Principles:**

1. **Minimal Retention** - Keep data only as long as necessary
2. **Purpose Limitation** - Data stored only for original purpose
3. **Secure Deletion** - Proper anonymization/deletion when no longer needed
4. **Legal Compliance** - Meet Israeli tax law requirements (7 years for financial records)

---

## Retention Periods by Data Type

### 1. Event Data (3 Years)

**What:** Completed events and related metadata
**Retention:** 3 years after event completion
**Reason:** Analytics, historical tracking, dispute resolution
**After Expiry:** Permanently deleted

```typescript
// Automatically deleted by cleanup script
EVENT_DATA: 3 * 365 days
```

### 2. Cancelled Registrations (1 Year)

**What:** User registrations with status "CANCELLED"
**Retention:** 1 year after cancellation
**Reason:** Fraud prevention, analytics
**After Expiry:** **Anonymized** (not deleted - kept for statistics)

**Anonymization Process:**

```typescript
{
  name: 'ANONYMIZED',
  email: 'deleted@anonymized.local',
  phone: '0000000000',
  customFields: '{}'
}
```

### 3. Payment Records (7 Years) - NEVER DELETED

**What:** Payment transactions, invoices, financial records
**Retention:** **7 years minimum** (Israeli tax law requirement)
**Reason:** Legal compliance (תקנות מס הכנסה)
**After Expiry:** Flagged for manual review (DO NOT AUTO-DELETE)

```typescript
// WARNING: Never auto-delete payment records
PAYMENT_RECORDS: 7 * 365 days
```

### 4. Team Invitations (30 Days)

**What:** Expired team invitations with status "PENDING"
**Retention:** 30 days after expiration
**Reason:** Grace period for late acceptance
**After Expiry:** Permanently deleted

```typescript
EXPIRED_INVITATIONS: 30 days
```

### 5. OAuth States (1 Day)

**What:** OAuth state tokens for authentication flow
**Retention:** 1 day after creation
**Reason:** Security (prevent replay attacks)
**After Expiry:** Permanently deleted

```typescript
OAUTH_STATES: 1 day
```

---

## Automated Cleanup Job

### Running the Cleanup Script

**Manual Execution:**

```bash
npm run cleanup:retention
```

**Production Schedule (Railway):**

```bash
# Add to Railway cron jobs or use external scheduler
# Run weekly on Sunday at 2:00 AM
0 2 * * 0 npm run cleanup:retention
```

### Script Location

`/scripts/data-retention-cleanup.ts`

### What It Does

1. Deletes completed events older than 3 years
2. Anonymizes cancelled registrations older than 1 year
3. Checks (but does NOT delete) payment records older than 7 years
4. Deletes expired team invitations older than 30 days
5. Deletes OAuth states older than 1 day

### Output Example

```
[Data Retention] Starting cleanup job...
[Data Retention] Started at: 2026-01-12T15:30:00.000Z
[Data Retention] Deleted 12 events older than 3 years
[Data Retention] Anonymized 45 cancelled registrations older than 1 year
[Data Retention] Found 3 payment records older than 7 years (KEPT for tax compliance)
[Data Retention] Deleted 8 expired invitations older than 30 days
[Data Retention] Deleted 156 expired OAuth states older than 1 day

[Data Retention] ===== SUMMARY =====
[Data Retention] Total records deleted: 176
[Data Retention] Total records anonymized: 45
[Data Retention] Completed at: 2026-01-12T15:30:05.123Z
[Data Retention] ====== END ======
```

---

## User Rights (PPL Compliance)

### Right to Access (זכות עיון)

Users can request their data through:

- API: `GET /api/admin/privacy/data-access`
- Email: privacy@ticketcap.co.il

**Response Time:** 7 days (as required by PPL)

### Right to Deletion (זכות למחיקה)

Users can request deletion through:

- API: `DELETE /api/admin/privacy/delete-account`
- Email: privacy@ticketcap.co.il

**Processing:**

1. Anonymize all registrations
2. Delete account data
3. Keep payment records (tax law requirement)
4. Send confirmation email

**Response Time:** 30 days maximum

### Right to Correction (זכות לתיקון)

Users can update their data through:

- Admin dashboard (self-service)
- API: `PATCH /api/admin/update-profile`

---

## Breach Notification System

### When to Report

According to PPL Amendment 13, report to PPA (רשות להגנת הפרטיות) when:

1. **Unauthorized access** to sensitive data
2. **Data leakage** affecting users
3. **Security breach** compromising privacy

### Severity Levels

- **CRITICAL** - Auto-report to PPA, notify all users immediately
- **HIGH** - Auto-report to PPA, notify affected users
- **MEDIUM** - Internal review, notify if needed
- **LOW** - Log for DPO review

### Reporting API

```typescript
POST /api/admin/security/breach-report

{
  "incidentType": "unauthorized_access",
  "severity": "high",
  "description": "SQL injection attempt detected",
  "affectedUsers": 150,
  "dataTypes": ["email", "phone", "name"]
}
```

### Email Templates

- **User Notification:** `/lib/email-templates/breach-notification.ts`
- **PPA Report:** `/lib/email-templates/breach-notification.ts` (ppaBreachNotificationTemplate)

---

## Legal References

### Israeli Privacy Protection Law

1. **Main Law:** חוק הגנת הפרטיות, התשמ״א-1981
2. **Amendment 13:** תיקון 13 (Data breach notification requirement)
3. **Section 19א:** Obligation to report breaches to PPA
4. **Section 11:** Right to access personal data
5. **Section 13:** Right to correction

### Tax Law (Financial Records)

- **Tax Ordinance:** פקודת מס הכנסה
- **Requirement:** Keep financial records for 7 years
- **Applies to:** Invoices, payments, receipts, tax documents

---

## Data Protection Officer (DPO)

### Contact

- **Email:** privacy@ticketcap.co.il
- **Role:** Ensure PPL compliance, handle user requests, report breaches

### Responsibilities

1. Monitor data retention compliance
2. Handle user privacy requests (access, deletion, correction)
3. Report breaches to PPA within 72 hours (critical/high)
4. Train team on privacy best practices
5. Review and update privacy policy annually

---

## Monitoring & Auditing

### Monthly Review

- Check cleanup job logs
- Review breach incidents
- Analyze user privacy requests
- Update retention policy if needed

### Quarterly Audit

- Verify payment records retention (7 years)
- Test deletion/anonymization processes
- Review PPA compliance status
- Update documentation

### Annual Report

- Total data deleted/anonymized
- Breach incidents and PPA reports
- User privacy requests handled
- Policy updates and improvements

---

## Implementation Checklist

- [x] Create breach notification API (`/app/api/admin/security/breach-report/route.ts`)
- [x] Create email templates (`/lib/email-templates/breach-notification.ts`)
- [x] Create cleanup script (`/scripts/data-retention-cleanup.ts`)
- [x] Add npm script (`cleanup:retention`)
- [x] Document retention policy (this file)
- [ ] **TODO:** Set up Railway cron job (weekly Sunday 2:00 AM)
- [ ] **TODO:** Test cleanup script on staging environment
- [ ] **TODO:** Configure PPA notification email (production)
- [ ] **TODO:** Train team on breach reporting process
- [ ] **TODO:** Add retention policy to Terms of Service
- [ ] **TODO:** Add retention policy to Privacy Policy

---

## Emergency Procedures

### Critical Breach (Immediate Action Required)

1. **Contain:** Stop the breach immediately
2. **Assess:** Determine affected users and data types
3. **Report:** POST to `/api/admin/security/breach-report` with severity="critical"
4. **Notify:** PPA within 72 hours (auto-triggered for critical)
5. **Communicate:** Email all affected users within 72 hours
6. **Document:** Log all actions taken
7. **Review:** Post-incident security audit

### Data Deletion Request (User Right)

1. **Verify:** Confirm user identity
2. **Export:** Provide data export before deletion (if requested)
3. **Delete:** Run anonymization script
4. **Confirm:** Send deletion confirmation email
5. **Document:** Log deletion in audit trail

### Data Access Request (User Right)

1. **Verify:** Confirm user identity
2. **Export:** Generate JSON export of all user data
3. **Send:** Email encrypted file within 7 days
4. **Document:** Log access request in audit trail

---

## Contact & Support

**Questions about this policy:**

- Technical: tech@ticketcap.co.il
- Privacy: privacy@ticketcap.co.il
- Legal: legal@ticketcap.co.il

**Reporting a breach:**

- Internal: security@ticketcap.co.il
- PPA (רשות להגנת הפרטיות): https://www.gov.il/he/departments/the_privacy_protection_authority

---

**Last Updated:** January 12, 2026
**Version:** 1.0
**Next Review:** July 12, 2026
