# 🎨 TicketCap Agents - Quick Reference Card

## 🚦 Color System

```
┌─────────────────────────────────────────────────────┐
│  🔵 BLUE  = Search & Find    (60% tasks) Haiku     │
│  🟢 GREEN = Code & Create    (35% tasks) Sonnet    │
│  🔴 RED   = Deep Analysis    (5% tasks)  Opus      │
└─────────────────────────────────────────────────────┘
```

## 📋 The 8 Agents

| Color | Agent Name | Use When... | Cost | Speed |
|-------|------------|-------------|------|-------|
| 🔵 | **blue-registration-finder** | Find registration/table logic | $0.20 | ⚡⚡⚡ |
| 🔵 | **blue-schema-explorer** | Check database schema | $0.20 | ⚡⚡⚡ |
| 🔵 | **blue-security-scanner** | Scan for vulnerabilities | $0.20 | ⚡⚡⚡ |
| 🟢 | **green-api-builder** | Create API endpoints | $1.00 | ⚡⚡ |
| 🟢 | **green-bug-fixer** | Fix bugs + document | $1.00 | ⚡⚡ |
| 🟢 | **green-form-builder** | Create React forms (RTL) | $1.00 | ⚡⚡ |
| 🟢 | **green-test-writer** | Write Playwright tests | $1.00 | ⚡⚡ |
| 🔴 | **red-architect** | Architecture decisions | $5.00 | ⚡ |

## 🎯 Quick Decision Tree

```
┌─ Need to find something? ────────────┐
│  ├─ Registration/table logic? ──➤ 🔵 blue-registration-finder
│  ├─ Database model/fields? ─────➤ 🔵 blue-schema-explorer
│  └─ Security issues? ───────────➤ 🔵 blue-security-scanner
│
┌─ Need to create/modify code? ────────┐
│  ├─ API endpoint? ──────────────➤ 🟢 green-api-builder
│  ├─ React form? ────────────────➤ 🟢 green-form-builder
│  ├─ Bug fix? ───────────────────➤ 🟢 green-bug-fixer
│  └─ E2E test? ──────────────────➤ 🟢 green-test-writer
│
└─ Critical architecture decision? ────➤ 🔴 red-architect (EXPENSIVE!)
```

## 💰 Cost Examples

| Task | Wrong Agent | Right Agent | Savings |
|------|-------------|-------------|---------|
| Find registration endpoint | 🔴 Red $5.00 | 🔵 Blue $0.20 | **96%** |
| Create API route | 🔴 Red $5.00 | 🟢 Green $1.00 | **80%** |
| Security scan | 🔴 Red $5.00 | 🔵 Blue $0.20 | **96%** |

## ⚡ Performance Tips

1. **Always start Blue** 🔵 - Search/scan first before coding
2. **Use Green for all code** 🟢 - APIs, forms, tests, fixes
3. **Red only for critical** 🔴 - Major refactoring, security audits
4. **Parallel Blues** 🔵🔵🔵 - Run multiple search agents at once

## 🎬 Real-World Workflow Examples

### Example 1: Adding New Feature (Table Duplication)
```
Step 1: 🔵 blue-schema-explorer
        "Show me Table model and relationships"

Step 2: 🔵 blue-registration-finder
        "Find existing table creation code"

Step 3: 🟢 green-api-builder
        "Create /api/events/[id]/tables/[tableId]/duplicate endpoint"

Step 4: 🟢 green-test-writer
        "Write E2E test for table duplication"

Step 5: 🔵 blue-security-scanner
        "Scan new endpoint for security issues"
```
**Total Cost:** $0.20 + $0.20 + $1.00 + $1.00 + $0.20 = **$2.60**
**If you used Red for everything:** $5 × 5 = **$25.00** (10x more!)

### Example 2: Fixing Registration Bug
```
Step 1: 🔵 blue-registration-finder
        "Find registration endpoint and capacity logic"

Step 2: 🟢 green-bug-fixer
        "Fix race condition in capacity check"

Step 3: 🟢 green-test-writer
        "Add test for concurrent registrations"
```
**Total Cost:** $0.20 + $1.00 + $1.00 = **$2.20**

### Example 3: Security Audit Before Launch
```
Step 1: 🔵 blue-security-scanner
        "Quick scan for common vulnerabilities"

Step 2: 🔴 red-architect (ONLY if Step 1 finds critical issues)
        "Comprehensive security audit with recommendations"
```
**Total Cost:** $0.20 + $5.00 = **$5.20**
**(But only use Red if really needed!)**

## 📖 Agent Details

### 🔵 BLUE: blue-registration-finder
**When:** Finding registration/table/waitlist/confirmation logic
**Searches:**
- `spotsReserved.*increment` - Capacity logic
- `confirmationCode` - Confirmation generation
- `prisma.*table.*create` - Table creation (NEW!)
- `duplicate.*table` - Duplication logic (NEW!)

**Key Files:**
- `/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts`
- `/app/api/events/[id]/tables/*/route.ts` (NEW!)
- `/app/api/templates/route.ts` (NEW!)

---

### 🔵 BLUE: blue-schema-explorer
**When:** Need to understand database structure
**Searches:** Prisma schema for models, fields, relationships
**Key File:** `/prisma/schema.prisma`

---

### 🔵 BLUE: blue-security-scanner
**When:** Security check before deployment/commit
**Checks:**
- Multi-tenant data leaks (schoolId filtering)
- SQL injection, XSS, exposed secrets
- Weak authentication, missing auth checks
- OWASP Top 10 vulnerabilities

---

### 🟢 GREEN: green-api-builder
**When:** Creating/modifying API endpoints
**Creates:**
- Next.js API routes with auth
- Multi-tenant isolation (schoolId filtering)
- Table management endpoints (NEW!)
  - Duplicate: `/api/events/[id]/tables/[tableId]/duplicate`
  - Bulk edit: `/api/events/[id]/tables/bulk-edit`
  - Templates: `/api/templates`, `/api/events/[id]/tables/from-template`

**Includes:** Input validation, error handling, HTTP status codes

---

### 🟢 GREEN: green-bug-fixer
**When:** User reports bug or error
**Process:**
1. Find and understand bug
2. Implement minimal fix
3. Document in `/docs/bugs/bugs.md`
4. Run tests to verify fix
5. Update bug status to "Fixed"

---

### 🟢 GREEN: green-form-builder
**When:** Creating/modifying React forms
**Features:**
- Hebrew RTL support (`dir="rtl"`)
- Mobile-first (44px touch targets)
- Input styling (`text-gray-900 bg-white`) - prevents white-on-white
- Client-side validation with `getMissingFields()`
- Error messages in Hebrew

---

### 🟢 GREEN: green-test-writer
**When:** Writing E2E tests for features
**Creates:**
- Playwright tests in `/tests/suites/`
- Registration flow tests
- Multi-tenant isolation tests
- Mobile viewport tests (375px width)
- Table management tests (NEW!)
  - Duplicate tables
  - Template system
  - Bulk edit/delete

**Test Files:**
- `/tests/suites/01-auth-p0.spec.ts` - Authentication
- `/tests/suites/04-public-registration-p0.spec.ts` - Registration
- `/tests/suites/07-table-management-p0.spec.ts` - Tables (NEW!)

---

### 🔴 RED: red-architect
**When:** ONLY for critical decisions
**Use Cases:**
- Major refactoring (microservices, architecture changes)
- Comprehensive security audit (production launch)
- Performance optimization (scaling to 100k users)
- Technology decisions (which framework/library?)

**⚠️ WARNING:** 25x MORE EXPENSIVE than Blue!
**Cost:** $5.00 per analysis (vs $0.20 for Blue)

**DON'T USE FOR:**
- ❌ Simple searches → Use Blue
- ❌ Bug fixes → Use Green
- ❌ API creation → Use Green
- ❌ Finding files → Use Blue

---

## 🏆 Golden Rules

1. **One task per agent** - Keep it simple
2. **Blue first** - Search before you code
3. **Green for code** - APIs, forms, tests, fixes
4. **Red means stop** - Think twice, 25x cost!
5. **Parallel Blues** - Run 🔵🔵🔵 simultaneously for speed

## 📊 Daily Usage Target

```
Optimal Day:
🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵 (60% Blue)
🟢🟢🟢🟢🟢🟢🟢 (35% Green)
🔴 (5% Red - rarely!)

❌ Bad Day:
🔴🔴🔴🔴🔴 (Burning money!)
```

---

## 🚀 Getting Started

**New to the system?**
1. Start with 🔵 Blue agents for all searches
2. Use 🟢 Green agents when you need to write code
3. Avoid 🔴 Red unless absolutely critical
4. Run agents in parallel when possible

**Need help?**
- Full guide: `/docs/AGENTS_OVERVIEW.md`
- Project docs: `/CLAUDE.md`
- Bug tracking: `/docs/bugs/bugs.md`

---

## 💡 Pro Tips

- **Before using Red:** Ask "Can Blue or Green do this?" (Usually yes!)
- **Parallel execution:** Launch multiple Blue agents at once for speed
- **Cost awareness:** Red costs 5x Green, 25x Blue - use wisely
- **Test everything:** Green test-writer should follow all Green code changes

---

*Choose the right color, save time and money! 🎨*
