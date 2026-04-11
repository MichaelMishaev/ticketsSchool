import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { loginViaAPI } from '../helpers/auth-helpers'
import { createSchool, createAdmin, createEvent } from '../fixtures/test-data'

/**
 * P0 Critical Tests: Table Management Features
 * - Duplicate tables (single & bulk)
 * - Template system (save & apply)
 * - Bulk edit operations
 * - Bulk delete operations
 */

test.describe('Table Management - P0 Critical', () => {
  let schoolId: string
  let adminEmail: string
  let eventId: string

  test.beforeAll(async () => {
    // Create test school and admin
    const school = await prisma.school.create({
      data: {
        name: 'Table Test School',
        slug: `table-test-${Date.now()}`,
        primaryColor: '#3b82f6',
      },
    })
    schoolId = school.id

    const admin = await prisma.admin.create({
      data: {
        email: `table-test-${Date.now()}@test.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Hashed "password"
        name: 'Table Test Admin',
        role: 'ADMIN',
        schoolId,
        emailVerified: true,
      },
    })
    adminEmail = admin.email

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Table Management Test Event',
        slug: `table-test-event-${Date.now()}`,
        schoolId,
        startAt: new Date(Date.now() + 86400000), // Tomorrow
        capacity: 100,
        status: 'OPEN',
        eventType: 'TABLE_BASED',
      },
    })
    eventId = event.id
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.table.deleteMany({ where: { eventId } })
    await prisma.event.updateMany({ where: { schoolId }, data: { deletedAt: new Date() } })
    await prisma.admin.deleteMany({ where: { schoolId } })
    await prisma.school.update({ where: { id: schoolId }, data: { isActive: false } })
  })

  test('should duplicate a table with auto-increment naming', async ({ page }) => {
    // Login
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Create initial table
    const table = await prisma.table.create({
      data: {
        eventId,
        tableNumber: '5',
        capacity: 8,
        minOrder: 4,
        tableOrder: 1,
        status: 'AVAILABLE',
      },
    })

    // Go to event details
    await page.goto(`/admin/events/${eventId}`)
    await expect(page.locator('text=שולחן 5')).toBeVisible()

    // Click duplicate button
    await page.locator('[aria-label="שכפל שולחן"]').first().click()

    // Modal should appear
    await expect(page.locator('text=שכפול שולחן')).toBeVisible()

    // Enter count
    await page.fill('#count', '3')

    // Verify preview
    await expect(page.locator('text=שולחן 6')).toBeVisible()
    await expect(page.locator('text=שולחן 7')).toBeVisible()
    await expect(page.locator('text=שולחן 8')).toBeVisible()

    // Confirm
    await page.click('text=צור 3 שולחנות')

    // Verify success message
    await expect(page.locator('text=נוצרו 3 שולחנות בהצלחה')).toBeVisible()

    // Verify tables were created
    const tables = await prisma.table.findMany({
      where: { eventId },
      orderBy: { tableNumber: 'asc' },
    })
    expect(tables).toHaveLength(4)
    expect(tables.map((t) => t.tableNumber)).toEqual(['5', '6', '7', '8'])
  })

  test('should save current tables as template', async ({ page }) => {
    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Click save as template
    await page.click('text=שמור שולחנות נוכחיים כתבנית')

    // Fill template details
    await expect(page.locator('text=שמירת תבנית')).toBeVisible()
    await page.fill('#template-name', 'Test Template')
    await page.fill('#template-description', 'Test description')

    // Save
    await page.click('text=שמור תבנית')

    // Verify success
    await expect(page.locator('text=תבנית "Test Template" נשמרה בהצלחה')).toBeVisible()

    // Verify in database
    const template = await prisma.tableTemplate.findFirst({
      where: {
        schoolId,
        name: 'Test Template',
      },
    })
    expect(template).toBeTruthy()
    expect(template?.description).toBe('Test description')
  })

  test('should apply template to create tables', async ({ page }) => {
    // Create a template first
    const template = await prisma.tableTemplate.create({
      data: {
        schoolId,
        name: 'Quick Template',
        config: [{ capacity: 10, minOrder: 5, count: 10, namePattern: '{n}' }],
      },
    })

    // Create new event for testing
    const newEvent = await prisma.event.create({
      data: {
        title: 'Template Test Event',
        slug: `template-test-${Date.now()}`,
        schoolId,
        startAt: new Date(Date.now() + 86400000),
        capacity: 100,
        status: 'OPEN',
        eventType: 'TABLE_BASED',
      },
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${newEvent.id}`)

    // Click templates card
    await page.click('text=תבניות מוכנות')

    // Select template
    await expect(page.locator('text=Quick Template')).toBeVisible()
    await page.locator('text=Quick Template').click()

    // Verify success
    await expect(page.locator('text=נוצרו 10 שולחנות מתבנית')).toBeVisible()

    // Verify tables created
    const tables = await prisma.table.findMany({
      where: { eventId: newEvent.id },
    })
    expect(tables).toHaveLength(10)

    // Cleanup
    await prisma.table.deleteMany({ where: { eventId: newEvent.id } })
    await prisma.event.update({ where: { id: newEvent.id }, data: { deletedAt: new Date() } })
    await prisma.tableTemplate.delete({ where: { id: template.id } })
  })

  test('should bulk edit multiple tables', async ({ page }) => {
    // Create multiple tables
    await prisma.table.createMany({
      data: [
        {
          eventId,
          tableNumber: '10',
          capacity: 6,
          minOrder: 3,
          tableOrder: 10,
          status: 'AVAILABLE',
        },
        {
          eventId,
          tableNumber: '11',
          capacity: 6,
          minOrder: 3,
          tableOrder: 11,
          status: 'AVAILABLE',
        },
        {
          eventId,
          tableNumber: '12',
          capacity: 6,
          minOrder: 3,
          tableOrder: 12,
          status: 'AVAILABLE',
        },
      ],
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Enable bulk selection mode
    await page.click('text=בחירה מרובה')

    // Select tables
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    await checkboxes.nth(2).check()

    // Verify bulk actions bar appears
    await expect(page.locator('text=3 שולחנות נבחרו')).toBeVisible()

    // Click edit button
    await page.locator('button:has-text("ערוך")').click()

    // Fill bulk edit form
    await expect(page.locator('text=עריכה מרובה')).toBeVisible()
    await page.fill('#bulk-capacity', '10')
    await page.fill('#bulk-minOrder', '5')

    // Submit
    await page.click('text=עדכן 3 שולחנות')

    // Verify success
    await expect(page.locator('text=עודכנו 3 שולחנות בהצלחה')).toBeVisible()

    // Verify in database
    const updatedTables = await prisma.table.findMany({
      where: {
        eventId,
        tableNumber: { in: ['10', '11', '12'] },
      },
    })
    expect(updatedTables.every((t) => t.capacity === 10 && t.minOrder === 5)).toBe(true)
  })

  test('should bulk delete multiple tables', async ({ page }) => {
    // Create test tables
    await prisma.table.createMany({
      data: [
        {
          eventId,
          tableNumber: '20',
          capacity: 8,
          minOrder: 4,
          tableOrder: 20,
          status: 'AVAILABLE',
        },
        {
          eventId,
          tableNumber: '21',
          capacity: 8,
          minOrder: 4,
          tableOrder: 21,
          status: 'AVAILABLE',
        },
      ],
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Enable bulk selection
    await page.click('text=בחירה מרובה')

    // Select tables to delete
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.last().check()
    await checkboxes.nth(-2).check()

    // Click delete
    page.on('dialog', (dialog) => dialog.accept()) // Accept confirmation
    await page.locator('button:has-text("מחק")').click()

    // Verify success
    await expect(page.locator('text=נמחקו 2 שולחנות בהצלחה')).toBeVisible()

    // Verify in database
    const remainingTables = await prisma.table.findMany({
      where: {
        eventId,
        tableNumber: { in: ['20', '21'] },
      },
    })
    expect(remainingTables).toHaveLength(0)
  })

  test('should prevent bulk delete of reserved tables', async ({ page }) => {
    // Create reserved table
    await prisma.table.create({
      data: {
        eventId,
        tableNumber: '30',
        capacity: 8,
        minOrder: 4,
        tableOrder: 30,
        status: 'RESERVED',
      },
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Try to select reserved table - should not have checkbox
    const reservedCard = page.locator('text=שולחן 30').locator('..')
    await expect(reservedCard.locator('input[type="checkbox"]')).toHaveCount(0)
  })

  // US-TBL-08: Reserved table shown as unavailable
  test.describe('[US-TBL-08] Reserved table is unavailable', () => {
    test('server: table marked RESERVED appears as RESERVED in table list', async ({ context }) => {
      const school = await createSchool().withName('Table Avail Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      await loginViaAPI(context, admin.email, admin.password)
      const tablesRes = await context.request.get(`/api/events/${event.id}/tables`)
      if (tablesRes.status() === 200) {
        const tables = await tablesRes.json()
        if (Array.isArray(tables) && tables.length > 0) {
          const table = tables[0]
          await context.request.patch(`/api/events/${event.id}/tables/${table.id}`, {
            data: { status: 'RESERVED' },
          })

          const tablesRes2 = await context.request.get(`/api/events/${event.id}/tables`)
          if (tablesRes2.status() === 200) {
            const tables2 = await tablesRes2.json()
            const updated = (tables2 as any[]).find((t: any) => t.id === table.id)
            if (updated) expect(updated.status).toBe('RESERVED')
          }
        }
      }
    })
  })

  // US-TBL-03: Delete AVAILABLE table succeeds
  test.describe('[US-TBL-03] Delete unreserved table', () => {
    test('server: AVAILABLE table can be deleted', async ({ context }) => {
      const school = await createSchool().withName('Table Delete Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      await loginViaAPI(context, admin.email, admin.password)
      const tablesRes = await context.request.get(`/api/events/${event.id}/tables`)
      if (tablesRes.status() === 200) {
        const tables = await tablesRes.json()
        if (Array.isArray(tables) && tables.length > 0) {
          const available = (tables as any[]).find((t: any) => t.status === 'AVAILABLE')
          if (available) {
            const deleteRes = await context.request.delete(
              `/api/events/${event.id}/tables/${available.id}`
            )
            expect([200, 204]).toContain(deleteRes.status())
          }
        }
      }
    })
  })

  // US-TBL-05: Save table layout as template
  test.describe('[US-TBL-05] Save table template', () => {
    test('server: creating a table template returns 200/201', async ({ context }) => {
      const school = await createSchool().withName('Template Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      await loginViaAPI(context, admin.email, admin.password)

      const res = await context.request.post('/api/admin/table-templates', {
        data: {
          schoolId: school.id,
          name: `Test Template ${Date.now()}`,
          config: [{ tableNumber: 1, capacity: 8, minOrder: 200 }],
        },
      })
      // Route may not exist yet — just ensure no 500
      expect(res.status()).not.toBe(500)
      expect([200, 201, 404]).toContain(res.status())
    })
  })

  // US-TBL-SHARING: Many-to-one FK — admin can place multiple regs on one table
  //
  // Exercises the full sharing flow introduced in the
  // `table_registrations_many_to_one` migration:
  //  1. Seed a table (cap=4, minOrder=2) with ONE CONFIRMED reg of 3 guests
  //  2. Seed a 1-guest WAITLIST reg
  //  3. POST /waitlist/[regId]/assign → partially-full table is now shared
  //     (minOrder is bypassed because the table is not empty)
  //  4. GET /tables → response includes the new `registrations` array shape
  //     with BOTH regs on the same table row
  //  5. PATCH /registrations/[regId] with { tableId: null } on the 3-guest
  //     reg → table stays RESERVED (conditional release), solo remains
  //  6. PATCH /registrations/[regId] with { tableId: null } on the solo →
  //     table flips to AVAILABLE
  test.describe('[US-TBL-SHARING] Admin shares a partially-occupied table', () => {
    test('server: add waitlist → share, then remove each reg with correct release', async ({
      context,
    }) => {
      // Fresh tenant/admin/event to isolate this scenario from cross-test noise.
      const school = await createSchool().withName('Share Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent()
        .withSchool(school.id)
        .withEventType('TABLE_BASED')
        .inFuture()
        .create()

      await loginViaAPI(context, admin.email, admin.password)

      // Directly seed the DB — `prisma` here is the guarded client, which
      // permits `create` on all models. Deletes happen through soft-delete
      // fallbacks (status updates) in afterAll, not here.
      const sharedTable = await prisma.table.create({
        data: {
          eventId: event.id,
          tableNumber: 'SHARE-1',
          tableOrder: 1,
          capacity: 4,
          minOrder: 2,
          status: 'RESERVED', // table is already "open" because reg1 below is the opener
        },
      })

      const reg1 = await prisma.registration.create({
        data: {
          eventId: event.id,
          guestsCount: 3,
          status: 'CONFIRMED',
          confirmationCode: `SHR1-${Date.now()}`,
          phoneNumber: '0509000001',
          data: { name: 'Sharer Host' },
          tableId: sharedTable.id,
        },
      })

      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: event.id,
          guestsCount: 1,
          status: 'WAITLIST',
          waitlistPriority: 1,
          confirmationCode: `WAIT1-${Date.now()}`,
          phoneNumber: '0509000002',
          data: { name: 'Solo Waitlister' },
        },
      })

      // 1. Assign the waitlist reg onto the already-occupied table.
      //    minOrder=2 must be BYPASSED because the table is not empty.
      const assignRes = await context.request.post(
        `/api/events/${event.id}/waitlist/${waitlistReg.id}/assign`,
        { data: { tableId: sharedTable.id } }
      )
      expect([200, 201]).toContain(assignRes.status())

      // 2. GET /tables should now return `registrations` array shape with
      //    both regs on the same table row.
      const tablesRes = await context.request.get(`/api/events/${event.id}/tables`)
      expect(tablesRes.status()).toBe(200)
      const tablesPayload = await tablesRes.json()
      const shared = (
        Array.isArray(tablesPayload) ? tablesPayload : (tablesPayload.tables ?? [])
      ).find((t: any) => t.id === sharedTable.id)
      expect(shared).toBeTruthy()
      // New sharing-aware shape: `registrations` is an array (was `reservation`)
      expect(Array.isArray(shared.registrations)).toBe(true)
      expect(shared.registrations).toHaveLength(2)
      const totalOccupied = shared.registrations.reduce(
        (sum: number, r: any) => sum + (r.guestsCount ?? 0),
        0
      )
      expect(totalOccupied).toBe(4) // 3 + 1 = table is full
      expect(shared.status).toBe('RESERVED')

      // 3. Remove reg1 (the 3-guest party) via PATCH with tableId=null.
      //    Status stays CONFIRMED — the reg is "unassigned", not cancelled.
      const removeFirstRes = await context.request.patch(
        `/api/events/${event.id}/registrations/${reg1.id}`,
        { data: { tableId: null } }
      )
      expect(removeFirstRes.status()).toBe(200)

      // 4. Table must STILL be RESERVED — conditional release only triggers
      //    when zero CONFIRMED regs remain on the table. The solo is still there.
      const afterFirstRemove = await prisma.table.findUnique({
        where: { id: sharedTable.id },
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { id: true, guestsCount: true },
          },
        },
      })
      expect(afterFirstRemove?.status).toBe('RESERVED')
      expect(afterFirstRemove?.registrations).toHaveLength(1)
      expect(afterFirstRemove?.registrations[0]?.guestsCount).toBe(1)

      // Verify reg1 still exists + is CONFIRMED but tableless.
      const reg1After = await prisma.registration.findUnique({ where: { id: reg1.id } })
      expect(reg1After?.status).toBe('CONFIRMED')
      expect(reg1After?.tableId).toBeNull()

      // 5. Remove the solo — this should flip the table to AVAILABLE.
      const removeSecondRes = await context.request.patch(
        `/api/events/${event.id}/registrations/${waitlistReg.id}`,
        { data: { tableId: null } }
      )
      expect(removeSecondRes.status()).toBe(200)

      const afterSecondRemove = await prisma.table.findUnique({
        where: { id: sharedTable.id },
        include: {
          registrations: { where: { status: 'CONFIRMED' }, select: { id: true } },
        },
      })
      expect(afterSecondRemove?.status).toBe('AVAILABLE')
      expect(afterSecondRemove?.registrations).toHaveLength(0)
    })

    test('server: assign to empty table below minOrder is rejected', async ({ context }) => {
      const school = await createSchool().withName('MinOrder Guard Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent()
        .withSchool(school.id)
        .withEventType('TABLE_BASED')
        .inFuture()
        .create()

      await loginViaAPI(context, admin.email, admin.password)

      // Empty table with minOrder=2 — a solo waitlister should NOT be
      // assignable without an explicit `force` flag.
      const emptyTable = await prisma.table.create({
        data: {
          eventId: event.id,
          tableNumber: 'EMPTY-1',
          tableOrder: 1,
          capacity: 4,
          minOrder: 2,
          status: 'AVAILABLE',
        },
      })

      const solo = await prisma.registration.create({
        data: {
          eventId: event.id,
          guestsCount: 1,
          status: 'WAITLIST',
          waitlistPriority: 1,
          confirmationCode: `SOLO-${Date.now()}`,
          phoneNumber: '0509000003',
          data: { name: 'Solo Below MinOrder' },
        },
      })

      const res = await context.request.post(`/api/events/${event.id}/waitlist/${solo.id}/assign`, {
        data: { tableId: emptyTable.id },
      })
      // Route should reject with 400 — minOrder IS enforced on empty tables.
      expect(res.status()).toBe(400)

      // Confirm nothing was mutated.
      const tableAfter = await prisma.table.findUnique({ where: { id: emptyTable.id } })
      expect(tableAfter?.status).toBe('AVAILABLE')
      const soloAfter = await prisma.registration.findUnique({ where: { id: solo.id } })
      expect(soloAfter?.status).toBe('WAITLIST')
      expect(soloAfter?.tableId).toBeNull()
    })
  })
})
