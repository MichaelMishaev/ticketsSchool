# Israeli PPL Compliance - Visual Guide

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TicketCap Platform                       │
│                  Israeli PPL Compliant                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│  Breach       │    │  Data          │    │  User        │
│  Notification │    │  Retention     │    │  Rights      │
│  System       │    │  Automation    │    │  Management  │
└───────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│ Auto-Report   │    │ Weekly Cron    │    │ API          │
│ to PPA        │    │ Cleanup        │    │ Endpoints    │
│ (72h)         │    │ (Sunday 2am)   │    │              │
└───────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│ Hebrew Email  │    │ Delete/        │    │ Export       │
│ Templates     │    │ Anonymize      │    │ User Data    │
│ (User + PPA)  │    │ Old Data       │    │ (JSON)       │
└───────────────┘    └────────────────┘    └──────────────┘
```

---

## 🚨 Breach Notification Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SECURITY BREACH DETECTED                                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Admin reports
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/admin/security/breach-report                     │
│  {                                                           │
│    "incidentType": "unauthorized_access",                   │
│    "severity": "high",                                      │
│    "affectedUsers": 150,                                    │
│    "dataTypes": ["email", "phone"]                          │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │  Severity Check         │
           └─────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ CRITICAL│    │  HIGH   │    │ MED/LOW │
    └─────────┘    └─────────┘    └─────────┘
          │              │              │
          ▼              ▼              │
    ┌─────────────────────────┐        │
    │ AUTO-NOTIFY PPA         │        │
    │ (Within 72 hours)       │        │
    │                         │        │
    │ [BREACH - PPA          │        │
    │  NOTIFICATION REQUIRED] │        │
    └─────────────────────────┘        │
          │              │              │
          ▼              ▼              ▼
    ┌─────────────────────────────────────┐
    │  SEND USER NOTIFICATION EMAILS      │
    │  (Hebrew RTL Template)              │
    │                                      │
    │  Subject: ⚠️ הודעה על אירוע אבטחה │
    └─────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────┐
    │  LOG TO DATABASE                    │
    │  (BreachIncident table)             │
    │                                      │
    │  • Timestamp                         │
    │  • Affected users                    │
    │  • Data types                        │
    │  • Actions taken                     │
    └─────────────────────────────────────┘
```

---

## 🗓️ Data Retention Timeline

```
TIME ─────────────────────────────────────────────────────────►

DAY 1        30 DAYS       1 YEAR              3 YEARS       7 YEARS
  │             │             │                    │             │
  ▼             ▼             ▼                    ▼             ▼
┌─────┐   ┌──────────┐  ┌──────────┐      ┌──────────┐  ┌──────────┐
│OAuth│   │ Expired  │  │Cancelled │      │Completed │  │ Payment  │
│State│   │Invite    │  │  Reg     │      │  Events  │  │ Records  │
└─────┘   └──────────┘  └──────────┘      └──────────┘  └──────────┘
  │             │             │                    │             │
  │ DELETE      │ DELETE      │ ANONYMIZE          │ DELETE      │ KEEP
  ▼             ▼             ▼                    ▼             ▼
┌─────┐   ┌──────────┐  ┌──────────┐      ┌──────────┐  ┌──────────┐
│  🗑️  │   │   🗑️      │  │   👤→❓   │      │   🗑️      │  │   📦     │
│     │   │          │  │          │      │          │  │Tax Law! │
└─────┘   └──────────┘  └──────────┘      └──────────┘  └──────────┘

ANONYMIZATION EXAMPLE:
Before: { name: "John Doe", email: "john@example.com", phone: "0501234567" }
After:  { name: "ANONYMIZED", email: "deleted@anonymized.local", phone: "0000000000" }
```

---

## 📊 Severity Matrix

```
┌────────────────────────────────────────────────────────────────┐
│              BREACH SEVERITY DECISION MATRIX                   │
└────────────────────────────────────────────────────────────────┘

Affected Users   │    1-10    │   11-100   │   101-1000  │  1000+
─────────────────┼────────────┼────────────┼─────────────┼────────
Sensitive Data   │            │            │             │
(Payment, SSN)   │   HIGH     │   HIGH     │  CRITICAL   │ CRITICAL
─────────────────┼────────────┼────────────┼─────────────┼────────
Personal Data    │            │            │             │
(Email, Phone)   │   LOW      │   MEDIUM   │    HIGH     │  HIGH
─────────────────┼────────────┼────────────┼─────────────┼────────
Public Data      │            │            │             │
(Name only)      │   LOW      │    LOW     │   MEDIUM    │ MEDIUM
─────────────────┴────────────┴────────────┴─────────────┴────────

ACTIONS BY SEVERITY:
┌──────────┬─────────────┬──────────────┬─────────────┐
│ Severity │ PPA Notify  │ User Notify  │ Response    │
├──────────┼─────────────┼──────────────┼─────────────┤
│ CRITICAL │ ✅ Auto     │ ✅ Immediate │  24 hours   │
│ HIGH     │ ✅ Auto     │ ✅ Immediate │  72 hours   │
│ MEDIUM   │ ⚠️  Manual  │ ⚠️  Review   │   7 days    │
│ LOW      │ ❌ Log only │ ❌ Not req.  │  Log review │
└──────────┴─────────────┴──────────────┴─────────────┘
```

---

## 🔄 Weekly Cleanup Cycle

```
SUNDAY 2:00 AM (Weekly Cron Job)
         │
         ▼
┌─────────────────────────────────────────┐
│  npm run cleanup:retention              │
│  (Data Retention Cleanup Script)        │
└─────────────────────────────────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│ FIND OLD     │  │ FIND OLD     │
│ EVENTS       │  │ REGISTRATIONS│
│ (3+ years)   │  │ (1+ year)    │
└──────────────┘  └──────────────┘
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   DELETE     │  │  ANONYMIZE   │
│  🗑️ 12 events │  │  👤→❓ 45 regs│
└──────────────┘  └──────────────┘
         │              │
         └──────┬───────┘
                ▼
       ┌─────────────────┐
       │ SUMMARY REPORT  │
       │                 │
       │ Deleted: 176    │
       │ Anonymized: 45  │
       └─────────────────┘
                │
                ▼
       ┌─────────────────┐
       │ LOG TO CONSOLE  │
       │ (Railway Logs)  │
       └─────────────────┘
```

---

## 📧 Email Template Examples

### User Notification (Hebrew)

```
┌────────────────────────────────────────────────────────────┐
│  ⚠️ הודעה על אירוע אבטחת מידע                              │
│  (Red gradient header)                                     │
└────────────────────────────────────────────────────────────┘

שלום [שם המשתמש],

בהתאם לתיקון 13 לחוק הגנת הפרטיות, התשמ״א-1981, אנו מודיעים לך
על אירוע אבטחת מידע שזוהה במערכת שלנו ביום [תאריך].

┌────────────────────────────────────────────────────────────┐
│  מה קרה? (Red box)                                        │
│  סוג האירוע: unauthorized_access                          │
│  זוהתה גישה לא מורשית למידע הבא:                          │
│    • כתובת אימייל                                          │
│    • מספר טלפון                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  מה עשינו? (Green box)                                    │
│    ✓ זיהינו וסגרנו את פרצת האבטחה מיידית                  │
│    ✓ דיווחנו לרשות להגנת הפרטיות בהתאם לחוק              │
│    ✓ שדרגנו את מערכות האבטחה שלנו                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  מה כדאי שתעשה? (Blue box)                                │
│    → החלף את הסיסמה שלך במערכת                            │
│    → בחר סיסמה חזקה (12+ תווים)                            │
│    → עקוב אחר פעילות חשודה בחשבון שלך                     │
└────────────────────────────────────────────────────────────┘

יצירת קשר:
קצין הגנת המידע: privacy@ticketcap.co.il
```

---

## 🎯 User Rights Flow

```
┌─────────────────────────────────────────────────────────┐
│          USER PRIVACY RIGHTS (PPL COMPLIANCE)           │
└─────────────────────────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  ACCESS  │  │ DELETION │  │CORRECTION│
    │  (עיון)  │  │ (מחיקה)  │  │ (תיקון)  │
    └──────────┘  └──────────┘  └──────────┘
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │   GET    │  │  DELETE  │  │  PATCH   │
    │/privacy/ │  │/privacy/ │  │/update-  │
    │data-     │  │delete-   │  │profile   │
    │access    │  │account   │  │          │
    └──────────┘  └──────────┘  └──────────┘
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Export   │  │Anonymize │  │ Update   │
    │ JSON     │  │ All Data │  │ Fields   │
    │(7 days)  │  │(30 days) │  │(instant) │
    └──────────┘  └──────────┘  └──────────┘
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Send Email│  │Keep Pay. │  │Confirm   │
    │w/ Export │  │Records   │  │Updated   │
    │          │  │(tax law) │  │          │
    └──────────┘  └──────────┘  └──────────┘
```

---

## 📈 Compliance Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────┐
│         ISRAELI PPL COMPLIANCE DASHBOARD                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  BREACH INCIDENTS    │  │  DATA RETENTION      │
│                      │  │                      │
│  Critical:  0        │  │  Last Run: Jan 7     │
│  High:      2 ⚠️      │  │  Deleted:  156       │
│  Medium:    5        │  │  Anonymized: 45      │
│  Low:       12       │  │  Next Run: Jan 14    │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  USER REQUESTS       │  │  PPA NOTIFICATIONS   │
│                      │  │                      │
│  Access:    15       │  │  Sent:     2         │
│  Deletion:  3        │  │  Pending:  0         │
│  Correction: 8       │  │  Failed:   0         │
│  Avg Time:  4.2 days │  │  Last:     Dec 28    │
└──────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  RECENT ACTIVITY                                            │
│  ────────────────────────────────────────────────────────── │
│  • Jan 12 10:30 - Breach reported (HIGH severity)           │
│  • Jan 12 10:31 - PPA notification sent                     │
│  • Jan 12 10:35 - 150 user emails sent                      │
│  • Jan 7  02:00 - Data retention cleanup completed          │
│  • Jan 5  14:20 - User data access request fulfilled        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Multi-Tenant Security

```
┌─────────────────────────────────────────────────────────────┐
│                 MULTI-TENANT ISOLATION                      │
└─────────────────────────────────────────────────────────────┘

School A Admin              School B Admin              SUPER_ADMIN
     │                           │                           │
     │ GET /breach-report        │ GET /breach-report        │ GET /breach-report
     ▼                           ▼                           ▼
┌──────────┐              ┌──────────┐              ┌──────────────┐
│ Check    │              │ Check    │              │ No Filter    │
│ schoolId │              │ schoolId │              │ (See All)    │
│ = "A"    │              │ = "B"    │              │              │
└──────────┘              └──────────┘              └──────────────┘
     │                           │                           │
     ▼                           ▼                           ▼
┌──────────┐              ┌──────────┐              ┌──────────────┐
│ Returns  │              │ Returns  │              │ Returns      │
│ Only     │              │ Only     │              │ ALL          │
│ School A │              │ School B │              │ Schools      │
│ Breaches │              │ Breaches │              │ Breaches     │
└──────────┘              └──────────┘              └──────────────┘

CODE PATTERN:
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    throw new Error('Admin must have a school assigned')
  }
  where.schoolId = admin.schoolId  // ✅ Enforced
}
```

---

## 📚 Documentation Structure

```
/docs/infrastructure/
├── PPL_COMPLIANCE_IMPLEMENTATION_SUMMARY.md  (Main doc)
├── DATA_RETENTION_POLICY.md                  (Legal policy)
├── PPL_QUICK_REFERENCE.md                    (Quick commands)
├── PPL_DEPLOYMENT_CHECKLIST.md               (Step-by-step)
└── PPL_VISUAL_GUIDE.md                       (This file)

/app/api/admin/security/
└── breach-report/
    └── route.ts                              (API endpoint)

/lib/email-templates/
└── breach-notification.ts                    (Email templates)

/scripts/
└── data-retention-cleanup.ts                 (Cleanup script)

/prisma/
└── schema.prisma                             (BreachIncident model)
```

---

**Last Updated:** January 12, 2026
**Version:** 1.0
**Purpose:** Visual reference for Israeli PPL compliance features
