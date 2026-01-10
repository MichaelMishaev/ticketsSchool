---
name: green-api-builder
description: 🟢 GREEN - API endpoint builder for kartis.info. Use PROACTIVELY to create/modify Next.js API routes with multi-tenant isolation, authentication, validation, and proper error handling. Creates secure, production-ready endpoints following kartis.info patterns.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# 🟢 Green API Builder (Code Generation)

**Purpose:** Create secure Next.js API routes with multi-tenant isolation and proper validation.

**When to use:** User asks to create/modify API endpoints, add new routes, or implement API features.

**Model:** Sonnet (⚡⚡ Balanced, 💰💰 Fair)

---

## MANDATORY READING BEFORE CODE GENERATION

**CRITICAL:** Before writing ANY code, you MUST read these documents:

1. `/docs/infrastructure/baseRules-kartis.md` - Development rules and patterns
2. `/docs/infrastructure/GOLDEN_PATHS.md` - Business-critical flows (LOCKED)
3. `/docs/infrastructure/invariants.md` - System invariants

**If you violate any rule in these documents, the solution is INVALID.**

---

## Instructions

### 1. Pre-Implementation Checklist

Before creating an API route:

- [ ] Read existing API routes to understand patterns
- [ ] Check if endpoint exists (don't duplicate)
- [ ] Verify authentication requirements
- [ ] Understand multi-tenant isolation needs
- [ ] Check if this modifies a LOCKED Golden Path
- [ ] Plan validation rules
- [ ] Identify error cases

### 2. API Route Template (kartis.info)

All API routes follow this structure:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List resources (multi-tenant isolated)
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const admin = await requireAdmin()

    // 2. Multi-tenant isolation
    const where: any = {}
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
      where.schoolId = admin.schoolId
    }

    // 3. Query database
    const results = await prisma.model.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // 4. Return response
    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create resource (multi-tenant isolated)
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const admin = await requireAdmin()

    // 2. Parse and validate input
    const body = await request.json()
    const { field1, field2 } = body

    if (!field1 || !field2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 3. Multi-tenant isolation
    let schoolId = admin.schoolId
    if (admin.role === 'SUPER_ADMIN') {
      schoolId = body.schoolId
      if (!schoolId) {
        return NextResponse.json(
          { error: 'SUPER_ADMIN must specify schoolId' },
          { status: 400 }
        )
      }
    } else {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
    }

    // 4. Create resource
    const result = await prisma.model.create({
      data: {
        schoolId,
        field1,
        field2,
        // ... other fields
      }
    })

    // 5. Return response
    return NextResponse.json(result, { status: 201 })

  } catch (error: any) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. Multi-Tenant Isolation Pattern (MANDATORY)

**For GET/LIST endpoints:**
```typescript
const where: any = { /* your filters */ }

if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have a school assigned' },
      { status: 403 }
    )
  }
  where.schoolId = admin.schoolId
}

const results = await prisma.model.findMany({ where })
```

**For POST/CREATE endpoints:**
```typescript
let schoolId = admin.schoolId

if (admin.role === 'SUPER_ADMIN') {
  schoolId = body.schoolId
  if (!schoolId) {
    return NextResponse.json(
      { error: 'SUPER_ADMIN must specify schoolId' },
      { status: 400 }
    )
  }
} else {
  if (!admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have a school assigned' },
      { status: 403 }
    )
  }
}

const result = await prisma.model.create({
  data: { schoolId, ... }
})
```

**For PUT/UPDATE endpoints:**
```typescript
// First, verify ownership
const existing = await prisma.model.findUnique({
  where: { id: params.id }
})

if (!existing) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// Multi-tenant check
if (admin.role !== 'SUPER_ADMIN' && existing.schoolId !== admin.schoolId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Update
const updated = await prisma.model.update({
  where: { id: params.id },
  data: { ... }
})
```

**For DELETE endpoints:**
```typescript
// Same as UPDATE - verify ownership first
const existing = await prisma.model.findUnique({
  where: { id: params.id }
})

if (!existing) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

if (admin.role !== 'SUPER_ADMIN' && existing.schoolId !== admin.schoolId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

await prisma.model.delete({ where: { id: params.id } })
```

### 4. Validation Patterns

**Phone Number Validation:**
```typescript
import { normalizePhone } from '@/lib/utils'

// In handler
try {
  const normalized = normalizePhone(body.phone)
  // Use normalized value
} catch (error) {
  return NextResponse.json(
    { error: 'מספר טלפון לא תקין' },
    { status: 400 }
  )
}
```

**Email Validation:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(body.email)) {
  return NextResponse.json(
    { error: 'Invalid email format' },
    { status: 400 }
  )
}
```

**Required Fields:**
```typescript
const requiredFields = ['name', 'email', 'phone']
const missing = requiredFields.filter(field => !body[field])

if (missing.length > 0) {
  return NextResponse.json(
    { error: `Missing required fields: ${missing.join(', ')}` },
    { status: 400 }
  )
}
```

### 5. Error Handling Pattern

**Standard error response:**
```typescript
try {
  // ... your code
} catch (error: any) {
  console.error('Error description:', error)

  // Known errors (validation, business logic)
  if (error.message === 'Known error') {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Unknown errors (500)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### 6. Atomic Operations Pattern

For operations affecting capacity or money:

```typescript
await prisma.$transaction(async (tx) => {
  // Read
  const event = await tx.event.findUnique({
    where: { id: eventId }
  })

  // Check
  if (event.spotsReserved + spotsCount > event.capacity) {
    throw new Error('Event is full')
  }

  // Update
  await tx.event.update({
    where: { id: eventId },
    data: { spotsReserved: { increment: spotsCount } }
  })

  // Create
  const registration = await tx.registration.create({
    data: { eventId, status: 'CONFIRMED', ... }
  })

  return registration
})
```

### 7. Response Status Codes

Use correct HTTP status codes:

- `200` - OK (GET, PUT successful)
- `201` - Created (POST successful)
- `204` - No Content (DELETE successful)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not allowed)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (unexpected error)

---

## Common API Patterns

### 1. List Resources (GET /api/resources)

```typescript
export async function GET(request: NextRequest) {
  const admin = await requireAdmin()

  const where: any = {}
  if (admin.role !== 'SUPER_ADMIN') {
    if (!admin.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    where.schoolId = admin.schoolId
  }

  const results = await prisma.resource.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(results)
}
```

### 2. Get Single Resource (GET /api/resources/[id])

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()

  const resource = await prisma.resource.findUnique({
    where: { id: params.id }
  })

  if (!resource) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Multi-tenant check
  if (admin.role !== 'SUPER_ADMIN' && resource.schoolId !== admin.schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(resource)
}
```

### 3. Create Resource (POST /api/resources)

```typescript
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  const body = await request.json()

  // Validation
  if (!body.name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    )
  }

  // Multi-tenant
  let schoolId = admin.schoolId
  if (admin.role === 'SUPER_ADMIN') {
    schoolId = body.schoolId
    if (!schoolId) {
      return NextResponse.json(
        { error: 'SUPER_ADMIN must specify schoolId' },
        { status: 400 }
      )
    }
  }

  const resource = await prisma.resource.create({
    data: {
      schoolId,
      name: body.name,
    }
  })

  return NextResponse.json(resource, { status: 201 })
}
```

### 4. Update Resource (PUT /api/resources/[id])

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  const body = await request.json()

  // Find and verify ownership
  const existing = await prisma.resource.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (admin.role !== 'SUPER_ADMIN' && existing.schoolId !== admin.schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update
  const updated = await prisma.resource.update({
    where: { id: params.id },
    data: {
      name: body.name,
    }
  })

  return NextResponse.json(updated)
}
```

### 5. Delete Resource (DELETE /api/resources/[id])

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()

  const existing = await prisma.resource.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (admin.role !== 'SUPER_ADMIN' && existing.schoolId !== admin.schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.resource.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true }, { status: 204 })
}
```

---

## Implementation Workflow

### Step 1: Plan the Endpoint

1. What HTTP methods? (GET, POST, PUT, DELETE)
2. What route? (`/app/api/[resource]/route.ts` or `/app/api/[resource]/[id]/route.ts`)
3. Authentication required? (Yes, always use `requireAdmin()`)
4. Multi-tenant? (Yes, always enforce `schoolId`)
5. Validation rules?
6. Atomic operations needed?

### Step 2: Create the File

```bash
# For collection routes
touch app/api/[resource]/route.ts

# For single resource routes
mkdir -p app/api/[resource]/[id]
touch app/api/[resource]/[id]/route.ts
```

### Step 3: Implement Handlers

1. Copy template from this skill
2. Add multi-tenant isolation
3. Add validation
4. Add database operations
5. Add error handling

### Step 4: Test the Endpoint

1. Write Playwright test (see green-test-writer skill)
2. Test authentication
3. Test multi-tenant isolation
4. Test validation
5. Test error cases

### Step 5: Document (if needed)

Update `/docs/` if this is a new feature or modifies Golden Path.

---

## Example: Create Events API

**User request:** "Create an API endpoint to manage events"

**Implementation:**

```typescript
// File: app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/events - List events
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    const where: any = {}
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
      where.schoolId = admin.schoolId
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        school: { select: { name: true } }
      }
    })

    return NextResponse.json(events)

  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    // Validation
    const required = ['title', 'date', 'capacity']
    const missing = required.filter(f => !body[f])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    if (body.capacity < 1) {
      return NextResponse.json(
        { error: 'Capacity must be at least 1' },
        { status: 400 }
      )
    }

    // Multi-tenant
    let schoolId = admin.schoolId
    if (admin.role === 'SUPER_ADMIN') {
      schoolId = body.schoolId
      if (!schoolId) {
        return NextResponse.json(
          { error: 'SUPER_ADMIN must specify schoolId' },
          { status: 400 }
        )
      }
    } else {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
    }

    // Create
    const event = await prisma.event.create({
      data: {
        schoolId,
        title: body.title,
        description: body.description || '',
        date: new Date(body.date),
        capacity: body.capacity,
        spotsReserved: 0,
        isActive: true,
      },
      include: {
        school: { select: { name: true } }
      }
    })

    return NextResponse.json(event, { status: 201 })

  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Testing Checklist

After creating an API:

- [ ] Test with valid data (should succeed)
- [ ] Test without authentication (should return 401)
- [ ] Test as different school admin (should not see other schools' data)
- [ ] Test as SUPER_ADMIN (should see all data)
- [ ] Test with missing required fields (should return 400)
- [ ] Test with invalid data (should return 400)
- [ ] Test updating non-existent resource (should return 404)
- [ ] Test deleting resource from another school (should return 403)

---

## Constraints

- **Always enforce multi-tenant isolation** (CRITICAL)
- **Always use `requireAdmin()`** for protected routes
- **Always validate input** before database operations
- **Always use transactions** for atomic operations
- **Always handle errors** with appropriate status codes
- **Never delete data** without user confirmation
- **Never skip LOCKED path checks** (see GOLDEN_PATHS.md)

---

## After Implementation

1. **Write tests** - Use green-test-writer skill
2. **Update docs** - If modifying Golden Path
3. **Run tests** - `npm test` must pass
4. **Check security** - Use blue-security-scanner skill

---

**Remember:** Green = Code creation. Blue = Search. Red = Architecture.
