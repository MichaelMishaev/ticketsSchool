# Israeli PPL Compliance - Deployment Checklist

## ✅ Pre-Deployment (COMPLETED)

- [x] **Breach Notification API** created (`/app/api/admin/security/breach-report/route.ts`)
- [x] **Email Templates** created (`/lib/email-templates/breach-notification.ts`)
- [x] **Data Retention Script** created (`/scripts/data-retention-cleanup.ts`)
- [x] **npm Script** added to `package.json` (`cleanup:retention`)
- [x] **Documentation** written (3 comprehensive docs)
- [x] **Database Schema** verified (BreachIncident model exists)

**Status:** ✅ All code is ready for deployment

---

## 📋 Deployment Steps (DO THESE NOW)

### Step 1: Deploy to Railway

```bash
# From project root
git add .
git commit -m "feat(compliance): implement Israeli PPL compliance features

- Add breach notification API with auto-PPA reporting
- Add Hebrew email templates for user/PPA notifications
- Add data retention cleanup script (3yr events, 1yr registrations)
- Add comprehensive PPL compliance documentation

Compliance: Amendment 13 to Israeli Privacy Protection Law
"

git push origin development
```

### Step 2: Verify Deployment

```bash
# Check Railway deployment status
railway status

# Check logs for errors
railway logs --follow

# Test health check
curl https://your-production-domain.com/api/health
```

### Step 3: Set Up Cron Job for Data Retention

**Option A: Railway Cron Jobs (Recommended)**

1. Go to Railway dashboard → Your service
2. Click "Settings" → "Cron Jobs"
3. Add new cron job:
   - **Schedule:** `0 2 * * 0` (Every Sunday at 2:00 AM)
   - **Command:** `npm run cleanup:retention`
   - **Name:** "Data Retention Cleanup"

**Option B: External Scheduler (Alternative)**
Use a service like:

- EasyCron (https://www.easycron.com/)
- Cron-job.org (https://cron-job.org/)

Configure:

- **URL:** `https://your-domain.com/api/admin/cron/data-retention`
- **Schedule:** Every Sunday at 2:00 AM
- **Method:** POST
- **Auth:** Add cron secret header

### Step 4: Configure Email Service

```bash
# Verify Resend API key is set
railway variables

# If not set:
railway variables set RESEND_API_KEY=re_...

# Verify sender email
railway variables set EMAIL_FROM=privacy@ticketcap.co.il

# Verify domain at resend.com/domains
```

### Step 5: Test Breach Reporting (Staging)

```bash
# Test LOW severity (no PPA notification)
curl -X POST https://your-staging-domain.com/api/admin/security/breach-report \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_TOKEN" \
  -d '{
    "incidentType": "data_leak",
    "severity": "low",
    "description": "Test breach - staging environment",
    "affectedUsers": 1,
    "dataTypes": ["email"]
  }'

# Expected: Success response, NO PPA notification in logs

# Test HIGH severity (auto PPA notification)
curl -X POST https://your-staging-domain.com/api/admin/security/breach-report \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_TOKEN" \
  -d '{
    "incidentType": "unauthorized_access",
    "severity": "high",
    "description": "Test critical breach - staging",
    "affectedUsers": 100,
    "dataTypes": ["email", "phone", "name"]
  }'

# Expected: Success response, PPA notification in logs
# Check logs for: [BREACH - PPA NOTIFICATION REQUIRED]
railway logs | grep "BREACH - PPA NOTIFICATION REQUIRED"
```

### Step 6: Test Data Retention Cleanup

```bash
# Run manually first time to verify
railway run npm run cleanup:retention

# Check logs for summary
# Expected output:
# [Data Retention] Deleted X events older than 3 years
# [Data Retention] Anonymized Y registrations older than 1 year
# [Data Retention] Total records deleted: Z
```

---

## 🔍 Post-Deployment Verification

### Checklist

- [ ] Breach API returns 200 OK for valid requests
- [ ] Breach API enforces multi-tenant isolation (school-level)
- [ ] High/critical severity breaches trigger PPA notification
- [ ] Email templates render correctly (test in staging)
- [ ] Data retention script runs without errors
- [ ] Cron job executes weekly (verify in logs)
- [ ] Documentation is accessible to team

### Monitoring

```bash
# Weekly checks (first 4 weeks)
1. Check cron job execution: railway logs | grep "Data Retention"
2. Review breach incidents: GET /api/admin/security/breach-report
3. Verify no failed emails: Check Resend dashboard
4. Audit PPA notifications: grep logs for BREACH notifications
```

---

## 🚨 Emergency Procedures

### If Critical Breach Occurs in Production

**Immediate Actions (Within 1 hour):**

1. Contain the breach (stop data leakage)
2. Assess impact (count affected users)
3. Report via API (auto-notifies PPA)
   ```bash
   curl -X POST https://your-domain.com/api/admin/security/breach-report \
     -H "Content-Type: application/json" \
     -H "Cookie: admin_session=YOUR_TOKEN" \
     -d '{
       "incidentType": "unauthorized_access",
       "severity": "critical",
       "description": "REAL BREACH - [describe what happened]",
       "affectedUsers": [count],
       "dataTypes": ["email", "phone", "name"]
     }'
   ```
4. Check logs for PPA notification: `railway logs | grep "BREACH - PPA NOTIFICATION REQUIRED"`
5. Email DPO: privacy@ticketcap.co.il

**Within 24 Hours:**

1. Send user notification emails (using template)
2. Contact PPA directly if auto-notification failed
3. Document all actions taken
4. Begin security audit

**Within 72 Hours:**

1. Complete user notifications
2. File official PPA report (if not auto-sent)
3. Implement security fixes
4. Update incident response plan

---

## 📞 Key Contacts

### Internal

- **DPO (Data Protection Officer):** privacy@ticketcap.co.il
- **Security Team:** security@ticketcap.co.il
- **Technical Lead:** tech@ticketcap.co.il
- **Legal:** legal@ticketcap.co.il

### External

- **PPA (Privacy Protection Authority):**
  - Website: https://www.gov.il/he/departments/the_privacy_protection_authority
  - Phone: +972-2-629-5555
  - Email: privacy@justice.gov.il
  - Address: רח' היצירה 1, ירושלים

- **Resend Support (Email):**
  - Dashboard: https://resend.com/overview
  - Docs: https://resend.com/docs
  - Support: support@resend.com

---

## 📚 Documentation Links

### Implementation Docs

- **Full Summary:** `/docs/infrastructure/PPL_COMPLIANCE_IMPLEMENTATION_SUMMARY.md`
- **Retention Policy:** `/docs/infrastructure/DATA_RETENTION_POLICY.md`
- **Quick Reference:** `/docs/infrastructure/PPL_QUICK_REFERENCE.md`
- **This Checklist:** `/docs/infrastructure/PPL_DEPLOYMENT_CHECKLIST.md`

### Code Files

- **Breach API:** `/app/api/admin/security/breach-report/route.ts`
- **Email Templates:** `/lib/email-templates/breach-notification.ts`
- **Cleanup Script:** `/scripts/data-retention-cleanup.ts`
- **Database Schema:** `/prisma/schema.prisma` (BreachIncident model)

### Legal References

- **Israeli PPL:** חוק הגנת הפרטיות, התשמ״א-1981
- **Amendment 13:** תיקון 13 (breach notification requirement)
- **Section 19א:** PPA reporting obligation
- **Tax Law:** פקודת מס הכנסה (7-year financial record retention)

---

## 🎯 Success Criteria

Your PPL compliance is successful when:

1. ✅ **Breach API is live** and returns 200 OK
2. ✅ **Multi-tenant isolation** prevents cross-school data access
3. ✅ **Auto-PPA notification** triggers for critical/high breaches
4. ✅ **Email templates** render correctly in Hebrew (RTL)
5. ✅ **Data retention cron** runs weekly without errors
6. ✅ **Team is trained** on breach reporting process
7. ✅ **Documentation** is accessible and up-to-date
8. ✅ **Privacy policy** references PPL compliance

---

## 📊 Monthly Reporting

**Track These Metrics:**

- Total breach incidents reported (by severity)
- PPA notifications sent (auto vs manual)
- User notification emails sent
- Data retention cleanup results (deleted/anonymized records)
- User privacy requests (access/deletion/correction)

**Generate Report:**

```bash
# Get breach statistics
curl https://your-domain.com/api/admin/security/breach-report \
  -H "Cookie: admin_session=YOUR_TOKEN" \
  | jq '{
    total: length,
    critical: [.[] | select(.severity == "critical")] | length,
    high: [.[] | select(.severity == "high")] | length,
    medium: [.[] | select(.severity == "medium")] | length,
    low: [.[] | select(.severity == "low")] | length
  }'
```

---

## 🔄 Maintenance Schedule

### Weekly

- [ ] Review cron job logs
- [ ] Check for failed breach notifications
- [ ] Monitor email delivery (Resend dashboard)

### Monthly

- [ ] Generate compliance report
- [ ] Review breach incidents
- [ ] Audit user privacy requests
- [ ] Update documentation if needed

### Quarterly

- [ ] Security audit
- [ ] Test breach notification flow
- [ ] Verify data retention policies
- [ ] Train team on updates

### Annually

- [ ] Update privacy policy
- [ ] Review legal compliance
- [ ] Audit all PPL features
- [ ] Report to management

---

**Deployment Date:** **\*\***\_**\*\***
**Deployed By:** **\*\***\_**\*\***
**Verified By:** **\*\***\_**\*\***
**Next Review:** **\*\***\_**\*\***

---

**Last Updated:** January 12, 2026
**Version:** 1.0
**Status:** Ready for Production Deployment
