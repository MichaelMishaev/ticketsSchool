# Israeli PPL Compliance Implementation

**Status:** ✅ Infrastructure Complete (Phase 1)
**Compliance Target:** Amendment 13 to Israel's Privacy Protection Law (August 14, 2025)
**Date Implemented:** January 12, 2026

---

## Overview

This document outlines the technical infrastructure implemented to ensure compliance with Israel's Privacy Protection Law (חוק הגנת הפרטיות), specifically **Amendment 13** which came into effect on August 14, 2025.

### Key Compliance Requirements

1. **Data Protection Officer (DPO)** - חוק הגנת הפרטיות תיקון 13
2. **PII Encryption** - Encryption of personally identifiable information (phone numbers, emails)
3. **Breach Incident Tracking** - Mandatory reporting of data breaches to Privacy Protection Authority
4. **User Rights** - Right to access, correct, delete, and port personal data

---

## Implementation Summary

### 1. Encryption Library (`/lib/encryption.ts`)

**Purpose:** Encrypt/decrypt PII data (phone numbers, emails) using AES-256-GCM.

**Technical Details:**

- Algorithm: `aes-256-gcm` (industry standard, NIST approved)
- Key Derivation: PBKDF2 with SHA-512 (100,000 iterations)
- Random salt per encryption (64 bytes)
- Random IV per encryption (16 bytes)
- Authentication tag for integrity (16 bytes)

**API:**

```typescript
import { encryptPhone, decryptPhone, encryptEmail, decryptEmail } from '@/lib/encryption'

// Encrypt before storing in database
const encryptedPhone = encryptPhone('0521234567')
const encryptedEmail = encryptEmail('user@example.com')

// Decrypt when displaying to authorized users
const phone = decryptPhone(encryptedPhone)
const email = decryptEmail(encryptedEmail)
```

**Environment Variable (REQUIRED):**

```bash
ENCRYPTION_KEY="your-super-secret-encryption-key-minimum-32-chars"
```

Generate with:

```bash
openssl rand -base64 32
```

**Security Features:**

- Minimum 32-character key length enforced
- Runtime validation (throws error if key missing/too short)
- Unique salt and IV for each encryption (prevents pattern analysis)
- AEAD (Authenticated Encryption with Associated Data) prevents tampering

---

### 2. Data Protection Officer (DPO) Section

**Updated:** `/app/privacy/page.tsx`

**Compliance:** Article 29 of Amendment 13 requires organizations handling sensitive personal data to appoint a DPO.

**DPO Contact Information:**

- **Email:** privacy@ticketcap.co.il
- **Purpose:** Handle privacy inquiries, data subject requests, breach notifications

**User-Facing Content:**

- Hebrew RTL interface
- Prominent placement in privacy policy (Section 9)
- Legal citation: "תיקון 13 לחוק הגנת הפרטיות (התשמ״א-1981)"
- Visual indicators (purple gradient background, legal badge)

**What Users Can Contact DPO For:**

- הפעלת זכויות (exercising rights under the law)
- דיווח על אירוע אבטחת מידע (reporting security incidents)
- שאלות בנושאי פרטיות (privacy-related questions)
- ניהול מידע אישי (personal data management)

---

### 3. Breach Incident Tracking

**Database Model:** `BreachIncident` (Prisma schema)

**Purpose:** Track data breaches and comply with mandatory breach notification requirements under Amendment 13.

**Schema:**

```prisma
model BreachIncident {
  id            String   @id @default(cuid())
  schoolId      String?
  school        School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  incidentType  String   // "data_leak", "unauthorized_access", "payment_tampering"
  severity      String   // "low", "medium", "high", "critical"

  description   String   @db.Text
  affectedUsers Int
  dataTypes     String   // JSON array

  detectedAt    DateTime
  reportedAt    DateTime?
  resolvedAt    DateTime?

  notifiedPPA   Boolean  @default(false)  // Privacy Protection Authority
  notifiedUsers Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([schoolId, severity])
  @@index([detectedAt])
}
```

**Incident Types:**

- `data_leak` - Unauthorized disclosure of personal data
- `unauthorized_access` - Unauthorized access to systems or data
- `payment_tampering` - Tampering with payment data or transactions

**Severity Levels:**

- `low` - Minimal risk to data subjects
- `medium` - Moderate risk, limited scope
- `high` - Significant risk, large number of users affected
- `critical` - Severe risk, sensitive data exposed (e.g., payment details)

**Mandatory Reporting Timeline (Israeli Law):**

- **72 hours** to notify Privacy Protection Authority (PPA) after discovery
- **Immediate notification** to affected users if high/critical severity

**Example Usage:**

```typescript
await prisma.breachIncident.create({
  data: {
    schoolId: school.id,
    incidentType: 'data_leak',
    severity: 'high',
    description: 'Unauthorized access to registration data via API vulnerability',
    affectedUsers: 150,
    dataTypes: JSON.stringify(['phone_numbers', 'emails', 'names']),
    detectedAt: new Date(),
    notifiedPPA: false,
    notifiedUsers: false,
  },
})
```

---

## Migration Steps (Production)

### Before Deployment

1. **Generate encryption key:**

   ```bash
   openssl rand -base64 32
   ```

2. **Set environment variable in Railway:**

   ```bash
   railway variables set ENCRYPTION_KEY="[generated-key]"
   ```

3. **Run database migration:**
   ```bash
   railway run npx prisma migrate deploy
   ```

### After Deployment

1. **Verify DPO section is visible:**
   - Navigate to `/privacy` page
   - Confirm Section 9 (קצין הגנת המידע) is displayed
   - Verify email link works: `privacy@ticketcap.co.il`

2. **Test encryption library:**

   ```typescript
   // In Railway console or test script
   import { encryptPhone, decryptPhone } from '@/lib/encryption'
   const encrypted = encryptPhone('0521234567')
   const decrypted = decryptPhone(encrypted)
   console.log(decrypted === '0521234567') // Should print: true
   ```

3. **Verify breach incident tracking:**
   ```bash
   railway run npx prisma studio
   # Check that BreachIncident model is visible
   ```

---

## Next Steps (Phase 2 - Migration)

### Encrypt Existing Data

**⚠️ CRITICAL:** Existing phone numbers and emails in the database are currently stored in plain text. These must be encrypted BEFORE August 14, 2025.

**Migration Strategy:**

1. **Create data migration script** (`/scripts/encrypt-existing-pii.ts`):

   ```typescript
   import { PrismaClient } from '@prisma/client'
   import { encryptPhone, encryptEmail } from '@/lib/encryption'

   const prisma = new PrismaClient()

   async function encryptExistingData() {
     // Encrypt Registration phone numbers and emails
     const registrations = await prisma.registration.findMany({
       where: {
         OR: [{ phoneNumber: { not: null } }, { email: { not: null } }],
       },
     })

     for (const reg of registrations) {
       await prisma.registration.update({
         where: { id: reg.id },
         data: {
           phoneNumber: reg.phoneNumber ? encryptPhone(reg.phoneNumber) : null,
           email: reg.email ? encryptEmail(reg.email) : null,
         },
       })
     }

     // Encrypt Admin emails
     const admins = await prisma.admin.findMany()
     for (const admin of admins) {
       await prisma.admin.update({
         where: { id: admin.id },
         data: {
           email: encryptEmail(admin.email),
         },
       })
     }

     // Encrypt UserBan phone numbers and emails
     const bans = await prisma.userBan.findMany()
     for (const ban of bans) {
       await prisma.userBan.update({
         where: { id: ban.id },
         data: {
           phoneNumber: encryptPhone(ban.phoneNumber),
           email: ban.email ? encryptEmail(ban.email) : null,
         },
       })
     }

     console.log('✅ All PII data encrypted successfully')
   }

   encryptExistingData()
     .catch(console.error)
     .finally(() => prisma.$disconnect())
   ```

2. **Test on staging environment first**
3. **Backup production database**
4. **Run migration during low-traffic period**
5. **Verify all data is encrypted and decryptable**

### Update Application Code

**Files that need updating to use encryption:**

1. **Registration API** (`/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts`):

   ```typescript
   import { encryptPhone, encryptEmail } from '@/lib/encryption'

   // Before saving to database
   const registration = await prisma.registration.create({
     data: {
       phoneNumber: encryptPhone(phoneNumber),
       email: email ? encryptEmail(email) : null,
       // ... other fields
     },
   })
   ```

2. **Registration Display** (Admin dashboard, check-in pages):

   ```typescript
   import { decryptPhone, decryptEmail } from '@/lib/encryption'

   // When displaying to authorized users
   const displayPhone = registration.phoneNumber ? decryptPhone(registration.phoneNumber) : null
   const displayEmail = registration.email ? decryptEmail(registration.email) : null
   ```

3. **Search/Filter Functions** (Ban checking, registration lookup):

   ```typescript
   // Search by phone number requires encrypting search term
   const encryptedSearchPhone = encryptPhone(searchPhone)
   const registration = await prisma.registration.findFirst({
     where: { phoneNumber: encryptedSearchPhone },
   })
   ```

4. **Export Functions** (CSV exports):
   ```typescript
   // Decrypt before exporting for authorized admins
   const csvData = registrations.map((reg) => ({
     name: reg.data.name,
     phone: decryptPhone(reg.phoneNumber),
     email: reg.email ? decryptEmail(reg.email) : null,
   }))
   ```

---

## Legal Compliance Checklist

### ✅ Completed (Phase 1)

- [x] DPO contact information published on privacy policy page
- [x] AES-256-GCM encryption library implemented
- [x] Breach incident tracking database model created
- [x] Environment variable documentation updated
- [x] Privacy policy updated with Amendment 13 citation

### ⏳ Pending (Phase 2)

- [ ] Encrypt existing phone numbers in database
- [ ] Encrypt existing emails in database
- [ ] Update registration API to encrypt new data
- [ ] Update admin dashboard to decrypt for display
- [ ] Update search/filter functions to work with encrypted data
- [ ] Update export functions to decrypt for authorized users
- [ ] Create breach notification workflow (email templates)
- [ ] Train DPO on breach reporting procedures
- [ ] Document data retention policies
- [ ] Implement automated data deletion after retention period

---

## Security Considerations

### Key Management

**CRITICAL:** The `ENCRYPTION_KEY` must be:

- At least 32 characters (enforced by code)
- Generated using cryptographically secure random generator
- Never committed to Git
- Stored securely in Railway environment variables
- Backed up in secure password manager (in case Railway loses it)

**Key Rotation Strategy (Future):**

- Generate new key annually
- Re-encrypt all data with new key
- Keep old key temporarily for backward compatibility
- Document key rotation dates in security log

### Access Control

**Who Can Decrypt PII:**

- `SUPER_ADMIN` - Full access (platform owner)
- `OWNER` - Full access to their school's data
- `ADMIN` - Full access to their school's data
- `MANAGER` - Read-only access to their school's data
- `VIEWER` - Read-only access to their school's data

**Who CANNOT Decrypt PII:**

- Unauthenticated users
- Admins from other schools (multi-tenant isolation)
- External API calls (unless authenticated)

### Audit Trail

**All decryption operations should be logged:**

```typescript
await prisma.log.create({
  data: {
    level: 'INFO',
    message: 'PII decrypted for display',
    metadata: {
      adminId: admin.id,
      registrationId: reg.id,
      action: 'decrypt_phone',
    },
    source: 'admin_dashboard',
  },
})
```

---

## Testing

### Unit Tests (Encryption Library)

```typescript
// Test file: __tests__/lib/encryption.test.ts
import {
  encrypt,
  decrypt,
  encryptPhone,
  decryptPhone,
  encryptEmail,
  decryptEmail,
} from '@/lib/encryption'

describe('Encryption Library', () => {
  it('should encrypt and decrypt text correctly', () => {
    const plaintext = 'sensitive data'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext for same plaintext', () => {
    const plaintext = 'test'
    const encrypted1 = encrypt(plaintext)
    const encrypted2 = encrypt(plaintext)
    expect(encrypted1).not.toBe(encrypted2) // Different salt/IV
  })

  it('should encrypt Israeli phone numbers', () => {
    const phone = '0521234567'
    const encrypted = encryptPhone(phone)
    const decrypted = decryptPhone(encrypted)
    expect(decrypted).toBe(phone)
  })

  it('should encrypt emails with lowercase', () => {
    const email = 'User@Example.COM'
    const encrypted = encryptEmail(email)
    const decrypted = decryptEmail(encrypted)
    expect(decrypted).toBe('user@example.com')
  })
})
```

### Integration Tests (Breach Tracking)

```typescript
// Test file: __tests__/api/breach-incidents.test.ts
import { PrismaClient } from '@prisma/client'

describe('Breach Incident Tracking', () => {
  it('should create breach incident record', async () => {
    const prisma = new PrismaClient()
    const incident = await prisma.breachIncident.create({
      data: {
        incidentType: 'data_leak',
        severity: 'high',
        description: 'Test breach',
        affectedUsers: 10,
        dataTypes: JSON.stringify(['phone_numbers']),
        detectedAt: new Date(),
        notifiedPPA: false,
        notifiedUsers: false,
      },
    })
    expect(incident.id).toBeDefined()
    expect(incident.severity).toBe('high')
  })
})
```

---

## Support & Resources

### Legal References

- **Israeli Privacy Protection Law (חוק הגנת הפרטיות, התשמ״א-1981)**
  - [Full text (Hebrew)](https://www.nevo.co.il/law_html/law01/286_001.htm)
  - Amendment 13: Effective August 14, 2025

- **Privacy Protection Authority (רשות הגנת הפרטיות)**
  - Website: https://www.gov.il/he/Departments/DPA
  - Breach reporting email: info@justice.gov.il

### Technical Documentation

- **NIST Special Publication 800-38D:** GCM Mode (AES-GCM)
- **OWASP Cryptographic Storage Cheat Sheet**
- **Israeli Government Cyber Directorate:** https://www.gov.il/he/departments/ILNCD

### Internal Contacts

- **Data Protection Officer (DPO):** privacy@ticketcap.co.il
- **Technical Lead:** (to be assigned)
- **Legal Counsel:** (to be assigned)

---

## Changelog

### 2026-01-12

- ✅ Created encryption library (`/lib/encryption.ts`)
- ✅ Updated privacy policy with DPO section
- ✅ Added `BreachIncident` model to Prisma schema
- ✅ Updated `.env.example` with `ENCRYPTION_KEY` variable
- ✅ Created comprehensive compliance documentation

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026
**Next Review Date:** August 1, 2025 (before Amendment 13 deadline)
