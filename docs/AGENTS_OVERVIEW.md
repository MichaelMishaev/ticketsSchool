# 🌈 TicketCap Agents - Color-Coded Intelligence System

## Quick Reference Card

```
╔═══════════════════════════════════════════════════╗
║  🔵 BLUE  = Search & Find (60% of tasks)          ║
║  🟢 GREEN = Code & Create (35% of tasks)          ║
║  🔴 RED   = Deep Analysis (5% of tasks - RARE!)   ║
╚═══════════════════════════════════════════════════╝
```

## 📊 Cost Comparison

| Color | Model  | Speed | Cost/Analysis | Use Case                  |
|-------|--------|-------|---------------|---------------------------|
| 🔵 BLUE | Haiku  | ⚡⚡⚡   | $0.20         | Search, Find, Scan        |
| 🟢 GREEN| Sonnet | ⚡⚡    | $1.00         | Code, Fix, Build, Test    |
| 🔴 RED  | Opus   | ⚡     | $5.00 (25x!)  | Architecture, Audit       |

## 🎯 The 8 Specialized Agents

### 🔵 BLUE AGENTS (Search & Find - Fast & Cheap)

#### 1. **blue-registration-finder**
- **Purpose:** Find registration flows, capacity checks, waitlists, confirmations
- **Use When:** "Where is registration logic?", "How does waitlist work?"
- **Key Searches:** `spotsReserved`, `confirmationCode`, `WAITLIST`, atomic transactions
- **Model:** Haiku (96% cheaper than Red)

#### 2. **blue-schema-explorer**
- **Purpose:** Explore Prisma database schema, models, fields, relationships
- **Use When:** "What fields does Event have?", "Show me Registration model"
- **Key Files:** `/prisma/schema.prisma`
- **Model:** Haiku (25x cheaper than Red)

#### 3. **blue-security-scanner**
- **Purpose:** Scan for security vulnerabilities (SQL injection, XSS, data leaks)
- **Use When:** "Check for security issues", "Scan for multi-tenant leaks"
- **Key Checks:** Multi-tenant isolation, exposed secrets, weak auth
- **Model:** Haiku (96% cheaper than Red)

---

### 🟢 GREEN AGENTS (Code & Create - Balanced)

#### 4. **green-api-builder**
- **Purpose:** Create/modify Next.js API routes with auth & multi-tenant isolation
- **Use When:** "Create new API endpoint", "Add event update route"
- **Key Patterns:** `requireAdmin()`, schoolId filtering, error handling
- **Model:** Sonnet (80% cheaper than Red)

#### 5. **green-bug-fixer**
- **Purpose:** Debug, fix bugs, document in `/docs/bugs/bugs.md`, verify
- **Use When:** "Fix this bug", "Login not working", "Registration failing"
- **Key Actions:** Find bug → Fix → Document → Test
- **Model:** Sonnet

#### 6. **green-form-builder**
- **Purpose:** Create/modify React forms with Hebrew RTL, mobile-first design
- **Use When:** "Create registration form", "Add validation to signup"
- **Key Features:** 44px touch targets, `text-gray-900 bg-white`, RTL support
- **Model:** Sonnet

#### 7. **green-test-writer**
- **Purpose:** Write Playwright E2E tests for features, bugs, critical flows
- **Use When:** "Write tests for this feature", "Test registration flow"
- **Key Tests:** Registration, capacity, multi-tenant, mobile
- **Model:** Sonnet

---

### 🔴 RED AGENTS (Deep Analysis - EXPENSIVE!)

#### 8. **red-architect**
- **Purpose:** Deep architectural analysis, security audits, scaling plans
- **Use When:** "Should we refactor to microservices?", "Production security audit"
- **⚠️ WARNING:** 25x MORE EXPENSIVE ($5 vs $0.20) - Use RARELY!
- **Model:** Opus

---

## 🚦 Decision Tree - Which Agent Should I Use?

```
Need to...
├── Find something? ──────────────➤ 🔵 BLUE
│   ├── Registration logic? ─────➤ blue-registration-finder
│   ├── Database schema? ────────➤ blue-schema-explorer
│   └── Security issues? ────────➤ blue-security-scanner
│
├── Create/modify code? ──────────➤ 🟢 GREEN
│   ├── API endpoint? ───────────➤ green-api-builder
│   ├── React form? ─────────────➤ green-form-builder
│   ├── Bug fix? ────────────────➤ green-bug-fixer
│   └── Tests? ──────────────────➤ green-test-writer
│
└── Major architectural decision? ➤ 🔴 RED (RARE!)
    └── Critical only! ──────────➤ red-architect
```

---

## 📈 Optimal Usage Pattern

Your daily workflow should look like:

```
🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵 (60% - Blue for searching)
🟢🟢🟢🟢🟢🟢🟢 (35% - Green for coding)
🔴 (5% - Red for critical architecture)
```

**NOT like:**
```
🔴🔴🔴🔴🔴 (Expensive mistake! Don't overuse Red!)
```

---

## 🎯 Real-World Examples

### Example 1: Adding Table Management Feature
```
1. 🔵 blue-schema-explorer → "Show me Table model"
2. 🔵 blue-registration-finder → "Where are tables used?"
3. 🟢 green-api-builder → "Create duplicate table endpoint"
4. 🟢 green-test-writer → "Write tests for table duplication"
5. 🟢 green-bug-fixer → "Fix table name increment bug"
```

### Example 2: Security Review Before Launch
```
1. 🔵 blue-security-scanner → "Scan for vulnerabilities" (Quick pass)
2. 🔴 red-architect → "Comprehensive security audit" (Deep analysis)
```

### Example 3: Bug Fix Workflow
```
1. 🔵 blue-registration-finder → "Find registration endpoint"
2. 🟢 green-bug-fixer → "Fix capacity race condition"
3. 🟢 green-test-writer → "Add test to prevent regression"
```

---

## ⚡ Performance Tips

1. **Always start with Blue** 🔵 - Search first, understand the code
2. **Use Green for implementation** 🟢 - Create, fix, test
3. **Think twice before Red** 🔴 - Is this truly critical? 25x cost!
4. **Run agents in parallel** when possible - 🔵🔵🔵 simultaneously

---

## 🛠️ TicketCap-Specific Features (December 2025)

### NEW! Table Management System
All agents have been updated to support the new table management features:

1. **Duplicate Tables** - Copy 1 table → Create 29 more in seconds
2. **Template System** - Save/apply table configurations
3. **Bulk Edit** - Update multiple tables at once

**Relevant Agents:**
- 🔵 `blue-schema-explorer` - Find Table model, relationships
- 🔵 `blue-registration-finder` - Find table-based registration logic
- 🟢 `green-api-builder` - Create table management endpoints
- 🟢 `green-test-writer` - Test table duplication, templates, bulk edit

**Key API Routes:**
- `POST /api/events/[id]/tables/[tableId]/duplicate`
- `POST /api/templates` (Create template)
- `GET /api/templates` (List templates)
- `POST /api/events/[id]/tables/from-template` (Apply template)
- `PATCH /api/events/[id]/tables/bulk-edit` (Bulk update)
- `DELETE /api/events/[id]/tables/bulk-delete` (Bulk delete)

**Documentation:**
- `/docs/features/table-management.md` - Full guide
- `/tests/suites/07-table-management-p0.spec.ts` - E2E tests

---

## 🎓 Best Practices

### ✅ DO:
- Start with Blue agents for exploration
- Use Green agents for all code changes
- Document bugs in `/docs/bugs/bugs.md`
- Write tests for every feature
- Test on mobile (375px width)
- Enforce multi-tenant isolation (schoolId filtering)

### ❌ DON'T:
- Use Red agent for simple searches
- Skip tests ("tests are optional")
- Forget to update session cookie after schoolId changes
- Ignore mobile styling (`text-gray-900 bg-white`)
- Deploy without running full test suite

---

## 📚 Additional Resources

- **Project Docs:** `/CLAUDE.md` - Complete development guide
- **Bug Tracking:** `/docs/bugs/bugs.md` - All documented bugs
- **Test Guide:** `/tests/README.md` - Testing infrastructure
- **Table Management:** `/docs/features/table-management.md`
- **API Patterns:** See `green-api-builder` agent for templates

---

## 🎯 Key Takeaways

1. **Blue is your friend** 🔵 - Use it most (60% of tasks)
2. **Green is your builder** 🟢 - Creates production code (35%)
3. **Red is expensive** 🔴 - Rarely needed (5%, critical only)
4. **Right tool for the job** - Don't use Red when Blue will do
5. **Parallel execution** - Run multiple Blues at once for speed

---

**Remember:** The color system exists to optimize cost and performance. Choose wisely! 🎨
