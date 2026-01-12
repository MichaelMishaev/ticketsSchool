# 📋 Advanced Table Management Features

**Complete guide to duplicate, template, and bulk edit features for managing 30-40+ tables efficiently**

---

## 🎯 Overview

Managing large events with 30-40 tables is now effortless with three powerful features:

1. **🔄 Duplicate Tables** - Create 1 table, duplicate it 29 times → Done in 30 seconds
2. **✨ Templates** - Save/reuse common table configurations
3. **📝 Bulk Edit** - Update or delete multiple tables at once

---

## 🔄 Feature 1: Duplicate Tables

### Quick Start (30 Tables in 30 Seconds)

```
Step 1: Create first table
  → Table Name: "1"
  → Capacity: 8 guests
  → Minimum: 4 guests

Step 2: Click purple Copy icon (📋)

Step 3: Enter "29" in duplicate modal

Step 4: Click "צור 29 שולחנות ✨"

Result: Tables 1-30 created automatically!
```

### Features

- **Smart Auto-Naming**: Extracts numbers and auto-increments
  - "שולחן 5" → Creates "שולחן 6", "שולחן 7", "שולחן 8"...
  - "Table-5" → Creates "Table-6", "Table-7", "Table-8"...
  - Works with any naming pattern containing numbers

- **Live Preview**: Shows first 3 table names before creating
- **Bulk Limits**: Create 1-100 tables per operation
- **Capacity Calculation**: Shows total additional seating

### API Endpoint

```typescript
POST /api/events/[id]/tables/[tableId]/duplicate
Body: { count: 29 }

Response: {
  success: true,
  count: 29,
  tables: [ /* array of created tables */ ]
}
```

### Usage Examples

**Wedding (40 tables, 8 seats each):**
```
1. Create "שולחן 1" with 8 seats
2. Duplicate × 39
3. Total capacity: 320 guests
```

**Gala (50 tables, 6 seats each):**
```
1. Create "Table 1" with 6 seats
2. Duplicate × 49
3. Total capacity: 300 guests
```

---

## ✨ Feature 2: Template System

### What Are Templates?

Reusable table configurations you can apply to any event with one click.

### Creating Templates

#### Method 1: Save Current Tables

```
1. Configure tables for an event
2. Click "שמור שולחנות נוכחיים כתבנית"
3. Enter name: e.g., "חתונה 200 אורחים"
4. Optional description
5. Click "שמור תבנית"
```

**What Gets Saved:**
- Number of tables
- Capacity per table
- Minimum order per table
- Naming pattern (e.g., "{n}" becomes "1", "2", "3"...)

#### Method 2: Manual Creation (API)

```typescript
POST /api/templates
Body: {
  name: "Wedding 200",
  description: "40 tables, 8 seats each",
  config: [
    {
      capacity: 8,
      minOrder: 4,
      count: 40,
      namePattern: "שולחן {n}"
    }
  ]
}
```

### Applying Templates

```
1. Go to event with no tables
2. Click "תבניות מוכנות" card
3. Browse available templates
4. Click desired template
5. Tables created instantly!
```

### Template Types

- **Private** (🔒): Only visible to your school
- **Public** (🌐): Available to all schools (SUPER_ADMIN only)

### Template Management

**View Templates:**
- Shows: Name, description, table count, capacity, times used
- Filters: Your templates + public templates

**Delete Template:**
- Hover over template → Click trash icon
- Only private templates can be deleted
- Public templates: SUPER_ADMIN only

### API Endpoints

```typescript
// List templates
GET /api/templates
Response: { templates: Template[] }

// Create template
POST /api/templates
Body: { name, description?, config }

// Apply template to event
POST /api/events/[id]/tables/from-template
Body: { templateId }

// Save current tables as template
POST /api/events/[id]/tables/save-as-template
Body: { name, description? }

// Delete template
DELETE /api/templates/[templateId]
```

### Popular Template Examples

```json
{
  "name": "חתונה 200 אורחים",
  "config": [
    { "capacity": 10, "minOrder": 8, "count": 20, "namePattern": "שולחן {n}" }
  ]
}

{
  "name": "גאלה 40 שולחנות",
  "config": [
    { "capacity": 8, "minOrder": 4, "count": 40, "namePattern": "Table {n}" }
  ]
}

{
  "name": "Mixed Seating",
  "config": [
    { "capacity": 10, "minOrder": 8, "count": 20, "namePattern": "Large-{n}" },
    { "capacity": 6, "minOrder": 4, "count": 10, "namePattern": "Small-{n}" }
  ]
}
```

---

## 📝 Feature 3: Bulk Edit

### Activation

```
1. Click "בחירה מרובה" button
2. Checkboxes appear on tables
3. Select tables to edit
4. Bulk actions bar appears
```

### Features

#### Select Operations

- **בחר הכל** (Select All): Select all available tables
- **בטל בחירה** (Deselect All): Clear selection
- Individual checkboxes on each table

**Note**: Reserved tables cannot be selected

#### Bulk Edit

**Editable Fields:**
- ✏️ **Capacity** (Maximum guests per table)
- ✏️ **Minimum Order** (Minimum guests required)
- ✏️ **Status** (Available / Inactive)

**How It Works:**
```
1. Select 10 tables
2. Click "ערוך" (Edit)
3. Enter new capacity: "10"
4. Leave other fields empty (unchanged)
5. Click "עדכן 10 שולחנות"
6. Only capacity updates, rest stays same
```

**Smart Validation:**
- Prevents minOrder > capacity
- Shows preview of changes
- Only filled fields update

#### Bulk Delete

```
1. Select tables to delete
2. Click "מחק" (Delete)
3. Confirm deletion
4. Tables removed instantly
```

**Restrictions:**
- ❌ Cannot delete reserved tables
- ✅ Can delete available/inactive tables
- 🔒 Confirmation required

### API Endpoints

```typescript
// Bulk edit
PATCH /api/events/[id]/tables/bulk-edit
Body: {
  tableIds: string[],
  updates: {
    capacity?: number,
    minOrder?: number,
    status?: 'AVAILABLE' | 'INACTIVE'
  }
}

// Bulk delete
DELETE /api/events/[id]/tables/bulk-delete
Body: { tableIds: string[] }
```

### Use Cases

**Scenario 1: Increase All Capacities**
```
Problem: Event sells better than expected
Solution:
  1. Select all tables
  2. Bulk edit capacity from 8 → 10
  3. +80 seats instantly (40 tables)
```

**Scenario 2: Mark VIP Tables**
```
Problem: Need to reserve 10 tables for VIPs
Solution:
  1. Select tables 1-10
  2. Bulk edit status → "Inactive" (reserved)
  3. Public can't see/book them
```

**Scenario 3: Clean Up Unused Tables**
```
Problem: Created too many tables
Solution:
  1. Select tables 31-50
  2. Bulk delete
  3. 20 tables removed instantly
```

---

## 🎨 UI/UX Design

### Mobile-First (375px)

All features work on mobile:
- ✅ Large touch targets (44px)
- ✅ Hebrew RTL layout
- ✅ Responsive modals
- ✅ Accessible checkboxes

### Visual Feedback

- **Selection**: Blue ring around selected tables
- **Actions Bar**: Sticky blue bar when tables selected
- **Modals**: Beautiful Hebrew UI with animations
- **Success Messages**: Toast notifications with counts

### Accessibility

- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast

---

## 🔒 Security

### Multi-Tenant Isolation

```typescript
// ALL endpoints verify schoolId
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json({ error: 'No school assigned' }, { status: 403 })
  }
  if (event.schoolId !== admin.schoolId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
}
```

### Validation

- ✅ Count limits (1-100)
- ✅ Capacity > 0
- ✅ MinOrder ≤ Capacity
- ✅ Reserved tables protected
- ✅ Input sanitization

### Permissions

| Action | ADMIN | MANAGER | VIEWER |
|--------|-------|---------|--------|
| Duplicate | ✅ | ❌ | ❌ |
| Template Save | ✅ | ❌ | ❌ |
| Template Apply | ✅ | ❌ | ❌ |
| Bulk Edit | ✅ | ❌ | ❌ |
| Bulk Delete | ✅ | ❌ | ❌ |

---

## 📊 Database Schema

```prisma
model Table {
  id           String      @id @default(cuid())
  eventId      String
  event        Event       @relation(fields: [eventId], references: [id])

  tableNumber  String      // "1", "שולחן 5", "VIP-3"
  tableOrder   Int         // Display order
  capacity     Int         // Max guests
  minOrder     Int         // Min guests required

  status       TableStatus @default(AVAILABLE)
  reservedById String?     @unique
  reservation  Registration? @relation("TableReservation")

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model TableTemplate {
  id          String   @id @default(cuid())
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id])

  name        String   // "חתונה 200 אורחים"
  description String?
  isPublic    Boolean  @default(false)

  config      Json     // Array of table configs
  timesUsed   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🧪 Testing

### E2E Tests

**Location**: `/tests/suites/07-table-management-p0.spec.ts`

**Coverage**:
- ✅ Duplicate single table
- ✅ Duplicate with auto-increment
- ✅ Save as template
- ✅ Apply template
- ✅ Bulk edit capacity
- ✅ Bulk delete tables
- ✅ Reserved table protection

**Run Tests:**
```bash
npm test tests/suites/07-table-management-p0.spec.ts
```

---

## 🚀 Performance

### Benchmarks

| Operation | Tables | Time | Cost |
|-----------|--------|------|------|
| Duplicate 30 | 30 | ~2s | 1 API call |
| Apply Template | 50 | ~3s | 1 API call |
| Bulk Edit | 20 | ~1s | 1 API call |
| Bulk Delete | 10 | ~1s | 1 API call |

### Optimizations

- ✅ `createMany` for bulk operations
- ✅ Single transaction per operation
- ✅ Indexed queries
- ✅ Minimal re-renders
- ✅ Optimistic UI updates

---

## 📖 User Workflows

### Workflow 1: Setup 40-Table Wedding

```
Time: 2 minutes

1. Create event → "חתונה בני ומיכל"
2. Create first table:
   - Name: "1"
   - Capacity: 10 guests
   - Minimum: 8 guests
3. Click Copy icon → Duplicate 39
4. Done! 400 seats ready
5. (Optional) Save as template for next wedding
```

### Workflow 2: Reuse Conference Setup

```
Time: 30 seconds

1. Create new conference event
2. Click "תבניות מוכנות"
3. Select "Conference 30 Tables"
4. Done! All tables created
```

### Workflow 3: Adjust Capacities

```
Time: 1 minute

1. Enable "בחירה מרובה"
2. Select tables 1-20
3. Click "ערוך"
4. Change capacity: 8 → 10
5. Done! +40 seats added
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Duplicate button not visible
- **Fix**: Table must be AVAILABLE or INACTIVE (not RESERVED)

**Issue**: Template not appearing
- **Fix**: Check schoolId - private templates only show to your school

**Issue**: Bulk edit fails
- **Fix**: Ensure minOrder ≤ capacity for all selected tables

**Issue**: Can't delete tables
- **Fix**: Reserved tables cannot be deleted - move registrations to waitlist first

---

## 🔮 Future Enhancements

Potential features for next iteration:

1. **Visual Floor Plan** - Drag-drop table layout designer
2. **Table Sections** - Group tables by areas (VIP, Main, Balcony)
3. **QR Codes** - Generate QR per table for quick check-in
4. **Capacity Heat Map** - Visual representation of occupancy
5. **Template Marketplace** - Share templates with community

---

## 📚 Additional Resources

- [API Documentation](/docs/api/tables.md)
- [E2E Test Guide](/tests/README.md)
- [CLAUDE.md - Developer Guide](/CLAUDE.md)
- [Multi-Tenant Architecture](/docs/architecture/multi-tenant.md)

---

**Questions?** Contact: michael@ticketcap.com

**Version**: 1.0 (December 2025)
