# Israeli PPL Compliance - Quick Reference

## 🚀 Quick Start

### Report a Breach

```bash
curl -X POST http://localhost:9000/api/admin/security/breach-report \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_TOKEN" \
  -d '{
    "incidentType": "unauthorized_access",
    "severity": "high",
    "description": "Security incident description",
    "affectedUsers": 100,
    "dataTypes": ["email", "phone"]
  }'
```

### Run Data Cleanup

```bash
npm run cleanup:retention
```

### List All Breaches

```bash
curl http://localhost:9000/api/admin/security/breach-report \
  -H "Cookie: admin_session=YOUR_TOKEN"
```

---

## 📊 Severity Levels

| Severity     | PPA Notification | User Notification | Response Time |
| ------------ | ---------------- | ----------------- | ------------- |
| **CRITICAL** | ✅ Auto (72h)    | ✅ Immediate      | Within 24h    |
| **HIGH**     | ✅ Auto (72h)    | ✅ Immediate      | Within 72h    |
| **MEDIUM**   | ⚠️ Manual review | ⚠️ Case-by-case   | Within 7d     |
| **LOW**      | ❌ Log only      | ❌ Not required   | Log review    |

---

## 🗓️ Data Retention Periods

| Data Type               | Period  | Action         |
| ----------------------- | ------- | -------------- |
| Completed Events        | 3 years | DELETE         |
| Cancelled Registrations | 1 year  | ANONYMIZE      |
| Payment Records         | 7 years | KEEP (tax law) |
| Expired Invitations     | 30 days | DELETE         |
| OAuth States            | 1 day   | DELETE         |

---

## 🛡️ Incident Types

```typescript
// Choose one for "incidentType"
'data_leak' // Unintentional data exposure
'unauthorized_access' // Hacking, SQL injection, etc.
'payment_tampering' // Payment fraud attempt
'credential_theft' // Stolen passwords/tokens
'insider_threat' // Malicious employee action
'third_party_breach' // Vendor/partner breach
```

---

## 📧 Email Templates

### User Notification (Hebrew RTL)

- Visual severity indicators
- Clear incident explanation
- Action steps for users
- DPO contact info

### PPA Report (Formal)

- Incident ID and timestamp
- Affected users count
- Data types exposed
- Actions taken
- PPL compliance statement

---

## 🔐 User Rights

### Right to Access (זכות עיון)

- **Endpoint:** `GET /api/admin/privacy/data-access`
- **Response Time:** 7 days
- **Format:** JSON export

### Right to Deletion (זכות למחיקה)

- **Endpoint:** `DELETE /api/admin/privacy/delete-account`
- **Response Time:** 30 days
- **Note:** Payment records kept for tax law

### Right to Correction (זכות לתיקון)

- **Endpoint:** `PATCH /api/admin/update-profile`
- **Response Time:** Immediate

---

## 🚨 Emergency Response

### Critical Breach Detected

1. **Contain** - Stop the breach immediately
2. **Assess** - Count affected users and data types
3. **Report** - POST to breach API (auto-notifies PPA)
4. **Notify** - Email all affected users within 72h
5. **Document** - Log all actions
6. **Audit** - Security review after incident

---

## 📞 Contact

- **DPO:** privacy@ticketcap.co.il
- **PPA:** https://www.gov.il/he/departments/the_privacy_protection_authority
- **Security:** security@ticketcap.co.il

---

## 📚 Full Documentation

- **Implementation Summary:** `/docs/infrastructure/PPL_COMPLIANCE_IMPLEMENTATION_SUMMARY.md`
- **Retention Policy:** `/docs/infrastructure/DATA_RETENTION_POLICY.md`
- **Breach API:** `/app/api/admin/security/breach-report/route.ts`
- **Email Templates:** `/lib/email-templates/breach-notification.ts`
- **Cleanup Script:** `/scripts/data-retention-cleanup.ts`

---

**Last Updated:** January 12, 2026
