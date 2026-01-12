# Claude Code Skills for kartis.info

This directory contains specialized skills for the kartis.info project, following the color-coded intelligence system.

## 🌈 Color-Coded Skills

### 🔵 Blue Skills (Fast & Cheap)
**Use for:** Quick searches, finding code, exploring schema
- ⚡ **Fast** (seconds)
- 💰 **Cheap** (Haiku model)
- 📖 **Read-only** (no code changes)

### 🟢 Green Skills (Balanced)
**Use for:** Writing code, creating features, fixing bugs
- ⚡⚡ **Medium speed**
- 💰💰 **Fair cost** (Sonnet model)
- ✍️ **Read + Write** (creates/modifies code)

### 🔴 Red Skills (Deep & Expensive)
**Use for:** Architecture decisions, comprehensive audits
- ⚡⚡⚡ **Slow** (minutes)
- 💰💰💰💰💰 **Very expensive** (Opus model - 25x cost!)
- 🧠 **Deep analysis** (system-wide)

---

## 📚 Available Skills

### 🔵 Blue Skills (60% of tasks)

#### 1. **blue-schema-explorer**
**Trigger:** Database, schema, models, fields, relationships, Prisma
**Purpose:** Quickly find and explain Prisma schema models
**Example:** "What fields does Registration have?"

#### 2. **blue-registration-finder**
**Trigger:** Registration, capacity, waitlist, confirmation codes, atomic
**Purpose:** Find registration logic and capacity enforcement code
**Example:** "How does capacity enforcement work?"

#### 3. **blue-security-scanner**
**Trigger:** Security, vulnerabilities, SQL injection, XSS, multi-tenant
**Purpose:** Quickly scan for common security issues
**Example:** "Check for security vulnerabilities"

---

### 🟢 Green Skills (35% of tasks)

#### 4. **green-api-builder**
**Trigger:** API, endpoint, route, create API, multi-tenant isolation
**Purpose:** Create secure Next.js API routes with proper patterns
**Example:** "Create an API endpoint for events"

#### 5. **green-form-builder**
**Trigger:** Form, Hebrew, RTL, validation, mobile-first
**Purpose:** Build Hebrew RTL forms with validation
**Example:** "Create a registration form"

#### 6. **green-test-writer**
**Trigger:** Test, Playwright, E2E, regression, Golden Path
**Purpose:** Write comprehensive E2E tests
**Example:** "Write tests for the registration flow"

#### 7. **green-bug-fixer**
**Trigger:** Bug, error, fix, issue, not working
**Purpose:** Fix bugs, document fixes, write regression tests
**Example:** "Fix the login bug"

---

### 🔴 Red Skills (5% of tasks)

#### 8. **red-architect**
**Trigger:** Architecture, refactor, audit, performance, system-wide
**Purpose:** Deep analysis for critical decisions
**Example:** "Perform comprehensive security audit"
**⚠️ WARNING:** 25x more expensive than Blue! Use sparingly.

---

## 🎯 Quick Decision Guide

```
Need to find something? ────➤ 🔵 Blue
Need to write code? ────────➤ 🟢 Green
Need deep analysis? ────────➤ 🔴 Red (think twice!)
```

---

## 📖 How Claude Uses Skills

Skills are **automatically activated** by Claude based on your request. You don't need to explicitly invoke them.

**Example workflow:**

```
You: "What fields does Event have?"
     ↓
Claude recognizes keywords: "fields", "Event" (model)
     ↓
Claude activates: blue-schema-explorer
     ↓
Skill reads Prisma schema and explains Event model
```

---

## 🔧 Skill Structure

Each skill directory contains:

```
skill-name/
└── SKILL.md          # Main skill instructions (YAML frontmatter + guide)
```

### SKILL.md Format

```yaml
---
name: skill-name
description: What this skill does and when to use it
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: haiku|sonnet|opus
---

# Skill Name

## Instructions
[Detailed guidance for Claude]

## Examples
[Usage examples]
```

---

## 🎨 kartis.info Patterns

All skills are configured to follow kartis.info patterns:

### Multi-Tenant Isolation
```typescript
if (admin.role !== 'SUPER_ADMIN') {
  where.schoolId = admin.schoolId
}
```

### Atomic Capacity Enforcement
```typescript
await prisma.$transaction(async (tx) => {
  // Atomic operations here
})
```

### Hebrew RTL
```tsx
<div dir="rtl">
  {/* Hebrew content */}
</div>
```

### Phone Normalization
```typescript
const normalized = normalizePhone(phone)
```

---

## 📊 Usage Patterns (Optimal)

Your typical day should look like:

```
🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵 (60% Blue - searches)
🟢🟢🟢🟢🟢🟢🟢 (35% Green - code creation)
🔴 (5% Red - critical decisions)
```

**Avoid:**
```
🔴🔴🔴🔴🔴 (Too expensive!)
```

---

## 🛠️ Customizing Skills

To modify a skill:

1. Edit `.claude/skills/[skill-name]/SKILL.md`
2. Restart Claude Code for changes to take effect

To add a new skill:

1. Create directory: `.claude/skills/new-skill/`
2. Create file: `.claude/skills/new-skill/SKILL.md`
3. Add YAML frontmatter and instructions
4. Restart Claude Code

---

## 📚 Documentation References

Each skill references these core documents:

- **`/docs/infrastructure/baseRules-kartis.md`** - Primary development guide
- **`/docs/infrastructure/GOLDEN_PATHS.md`** - Business-critical flows
- **`/docs/infrastructure/invariants.md`** - System invariants
- **`/docs/bugs/bugs.md`** - Bug tracking
- **`/tests/README.md`** - Testing guide

---

## ✅ Skill Development Checklist

When creating new skills:

- [ ] Name follows color-code (blue-*, green-*, red-*)
- [ ] Description includes trigger keywords
- [ ] `allowed-tools` matches skill purpose
- [ ] `model` appropriate (haiku/sonnet/opus)
- [ ] Instructions reference kartis.info docs
- [ ] Examples show real use cases
- [ ] Patterns match existing codebase
- [ ] Constraints clearly defined

---

## 🚀 Getting Started

Claude will automatically use these skills based on your requests. Just ask naturally:

- "What's in the Event model?" → blue-schema-explorer
- "Create an API for schools" → green-api-builder
- "Fix the registration bug" → green-bug-fixer
- "Audit security" → red-architect

---

## 💡 Tips

1. **Be specific** - Clear requests help Claude pick the right skill
2. **Use keywords** - Mention "schema", "API", "bug", etc.
3. **Trust automation** - Let Claude decide which skill to use
4. **Cost awareness** - Avoid triggering Red unless necessary

---

## 📞 Support

- **Documentation:** `/docs/infrastructure/baseRules-kartis.md`
- **Testing:** `/tests/README.md`
- **Bug Tracking:** `/docs/bugs/bugs.md`
- **Claude Code Help:** `/help` command

---

**Created:** 2025-12-29
**Project:** kartis.info (Multi-tenant event registration system)
**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, Playwright
