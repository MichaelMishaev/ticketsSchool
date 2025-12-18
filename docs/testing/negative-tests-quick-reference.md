# Negative Tests Quick Reference

## 🚀 Quick Start

```bash
# 1. Start dev server
npm run dev

# 2. Run negative tests
npx playwright test tests/critical/negative-tests.spec.ts --project=chromium
```

## 📊 Test Coverage (38 Tests)

```
Category                    Tests   Status Codes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Authentication              5       401 Unauthorized
Authorization (RBAC)        8       403 Forbidden
Input Validation            7       400 Bad Request
Data Integrity              5       400/404/409
Business Logic              5       400
Cross-Tenant Isolation      8       403 Forbidden
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                      38       -
```

## 🔐 Critical Paths Protected

### 1. Authentication (401)
```
❌ /api/events without JWT
❌ /api/admin/* without JWT
❌ Invalid/expired tokens
❌ Malformed tokens
```

### 2. Multi-Tenant Isolation (403)
```
❌ School A → School B events
❌ School A → School B registrations
❌ schoolId manipulation in API
✓ Auto-filter by admin.schoolId
```

### 3. RBAC (403)
```
Role         Can Create  Can Edit  Can Delete  Can View
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPER_ADMIN  ✓ All      ✓ All     ✓ All       ✓ All
OWNER        ✓ Own      ✓ Own     ✓ Own       ✓ Own
ADMIN        ✓ Own      ✓ Own     ✓ Own       ✓ Own
MANAGER      ❌         ✓ Own     ❌          ✓ Own
VIEWER       ❌         ❌        ❌          ✓ Own
```

### 4. Input Validation (400)
```
❌ Missing required fields (title, name)
❌ Negative/zero capacity
❌ Invalid date formats
❌ Invalid Israeli phone
❌ Invalid email format
```

### 5. Data Integrity (400/409)
```
❌ Delete event with registrations
❌ Reduce capacity below confirmed spots
❌ Change event schoolId after creation
❌ Invalid foreign keys
```

### 6. Business Rules (400)
```
❌ Register for CLOSED event
❌ Register for past event
❌ Exceed maxSpotsPerPerson
❌ Cancel already-cancelled registration
```

## 🎯 Run Specific Tests

```bash
# By category
--grep "Authentication"
--grep "Authorization"
--grep "Input Validation"
--grep "Data Integrity"
--grep "Business Logic"
--grep "Cross-Tenant"

# By test ID
--grep "N1.1"    # Unauth access to /api/events
--grep "N2.1"    # Cross-school event access
--grep "N3.1"    # Missing title validation
--grep "N4.1"    # Delete with registrations
--grep "N5.1"    # Register for CLOSED event
--grep "N6.1"    # Cross-tenant data leak
```

## ⚠️ Common Failures

### Test Fails: 200 instead of 403
**Fix:** Add school access check
```typescript
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Test Fails: Data Leak Detected
**Fix:** Add schoolId filter
```typescript
const where: any = {}
if (admin.role !== 'SUPER_ADMIN') {
  where.schoolId = admin.schoolId
}
const events = await prisma.event.findMany({ where })
```

### Test Fails: Invalid Input Accepted
**Fix:** Add validation
```typescript
if (!data.title || data.title.trim() === '') {
  return NextResponse.json({ error: 'Title is required' }, { status: 400 })
}
```

## 📝 Test Pattern

```typescript
test('Description of what CANNOT be done', async ({ browser }) => {
  // 1. Setup test data
  const school1 = await createSchool().create()
  const admin1 = await createAdmin().withSchool(school1.id).create()

  // 2. Try forbidden operation
  const context = await browser.newContext()
  await loginViaAPI(context, admin1.email, admin1.password)
  const response = await context.request.post('/api/forbidden')

  // 3. Assert blocked
  expect(response.status()).toBe(403)
  expect(body.error).toContain('Forbidden')
})
```

## 📦 Files

```
tests/critical/negative-tests.spec.ts       # Main test file
docs/testing/negative-tests-guide.md        # Complete guide
docs/testing/NEGATIVE_TESTS_SUMMARY.md      # Implementation summary
```

## 🔄 CI/CD Integration

```yaml
- name: Negative Tests
  run: |
    npm run dev &
    sleep 10
    npx playwright test tests/critical/negative-tests.spec.ts
```

## ✅ Success Criteria

```
38 passed (114 total across 3 browsers)
```

**If any test fails → Security regression detected!**

## 🆘 Help

See full guide: `/docs/testing/negative-tests-guide.md`

---

**Remember:** Run before every commit to prevent security regressions!
