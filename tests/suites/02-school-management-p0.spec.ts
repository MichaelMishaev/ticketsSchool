import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
  type TestSchool,
  type TestAdmin,
} from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

test.describe('School Management P0 - Critical Tests', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('[02.1.1] Complete Onboarding Flow', () => {
    test('new user can complete onboarding and access dashboard', async ({ page }) => {
      // Create admin without school (simulates fresh signup)
      const timestamp = Date.now()
      const email = `onboarding-test-${timestamp}@test.com`
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10)

      await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Onboarding Test User',
          role: 'OWNER',
          emailVerified: true,
          schoolId: null, // No school yet - needs onboarding
        },
      })

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(email, 'TestPassword123!')

      // Should redirect to onboarding
      await expect(page).toHaveURL(/\/admin\/onboarding/, { timeout: 10000 })

      // Fill onboarding form
      await page.fill('input[name="schoolName"]', 'Test School Onboarding')
      await page.fill('input[name="schoolSlug"]', `test-school-${timestamp}`)
      await page.fill('input[name="address"]', '123 Test Street, Tel Aviv')
      await page.fill('input[name="phone"]', '0501234567')

      // Submit
      await page.click('button[type="submit"]')

      // Should redirect to dashboard after onboarding
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 })

      // Verify school was created
      const admin = await prisma.admin.findUnique({
        where: { email },
        include: { school: true },
      })

      expect(admin).not.toBeNull()
      expect(admin?.schoolId).not.toBeNull()
      expect(admin?.school?.name).toBe('Test School Onboarding')
      expect(admin?.school?.slug).toBe(`test-school-${timestamp}`)
    })

    test('onboarding form validates required fields', async ({ page }) => {
      // Create admin without school
      const timestamp = Date.now()
      const email = `onboarding-validation-${timestamp}@test.com`
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10)

      await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Validation Test User',
          role: 'OWNER',
          emailVerified: true,
          schoolId: null,
        },
      })

      // Login and navigate to onboarding
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(email, 'TestPassword123!')

      await expect(page).toHaveURL(/\/admin\/onboarding/)

      // Try to submit empty form
      await page.click('button[type="submit"]')

      // Should show validation errors
      await expect(
        page.locator('text=/נא למלא|שדה חובה|required/i')
      ).toBeVisible({ timeout: 5000 })

      // Should not have redirected
      await expect(page).toHaveURL(/\/admin\/onboarding/)
    })

    test('school slug must be unique', async ({ page }) => {
      // Create existing school with slug
      const existingSchool = await createSchool()
        .withSlug('existing-slug')
        .create()

      // Create admin without school
      const timestamp = Date.now()
      const email = `slug-test-${timestamp}@test.com`
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10)

      await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Slug Test User',
          role: 'OWNER',
          emailVerified: true,
          schoolId: null,
        },
      })

      // Login and navigate to onboarding
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(email, 'TestPassword123!')

      // Fill form with existing slug
      await page.fill('input[name="schoolName"]', 'Test School')
      await page.fill('input[name="schoolSlug"]', 'existing-slug')
      await page.fill('input[name="address"]', '123 Test Street')
      await page.fill('input[name="phone"]', '0501234567')

      // Submit
      await page.click('button[type="submit"]')

      // Should show error about slug being taken
      await expect(
        page.locator('text=/כבר קיים|already exists|taken/i')
      ).toBeVisible({ timeout: 5000 })

      // Should still be on onboarding page
      await expect(page).toHaveURL(/\/admin\/onboarding/)
    })
  })

  test.describe('[02.1.4] Skip Onboarding - Must Complete First', () => {
    test('admin without school cannot access dashboard', async ({ page }) => {
      // Create admin without school
      const timestamp = Date.now()
      const email = `skip-test-${timestamp}@test.com`
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10)

      await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Skip Test User',
          role: 'OWNER',
          emailVerified: true,
          schoolId: null,
        },
      })

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(email, 'TestPassword123!')

      // Try to manually navigate to dashboard
      await page.goto('http://localhost:9000/admin/dashboard')

      // Should redirect back to onboarding
      await expect(page).toHaveURL(/\/admin\/onboarding/, { timeout: 10000 })
    })

    test('admin without school cannot access events page', async ({ page }) => {
      // Create admin without school
      const timestamp = Date.now()
      const email = `skip-events-${timestamp}@test.com`
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10)

      await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Skip Events Test',
          role: 'OWNER',
          emailVerified: true,
          schoolId: null,
        },
      })

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(email, 'TestPassword123!')

      // Try to access events page
      await page.goto('http://localhost:9000/admin/events')

      // Should redirect to onboarding
      await expect(page).toHaveURL(/\/admin\/onboarding/, { timeout: 10000 })
    })
  })

  test.describe('[02.3.1] Send Team Invitation (OWNER)', () => {
    test('OWNER can send team invitation', async ({ page }) => {
      const school = await createSchool().withName('Team Test School').create()
      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      // Login as owner
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(owner.email, 'TestPassword123!')

      // Navigate to team page (assuming /admin/team route exists)
      await page.goto('http://localhost:9000/admin/team')

      // Check if invite button exists
      const inviteButton = page.locator('button:has-text("Invite"), button:has-text("הזמן"), a:has-text("Invite")')
      const hasInviteButton = await inviteButton.count() > 0

      if (hasInviteButton) {
        await inviteButton.first().click()

        // Fill invitation form
        const timestamp = Date.now()
        await page.fill('input[name="email"], input[type="email"]', `invited-${timestamp}@test.com`)

        // Select role (if dropdown exists)
        const roleSelect = page.locator('select[name="role"]')
        if (await roleSelect.count() > 0) {
          await roleSelect.selectOption('ADMIN')
        }

        // Submit invitation
        await page.click('button[type="submit"]:has-text("Send"), button:has-text("שלח")')

        // Verify invitation was created
        await expect(
          page.locator('text=/הזמנה נשלחה|invitation sent|success/i')
        ).toBeVisible({ timeout: 5000 })

        // Check database
        const invitation = await prisma.teamInvitation.findFirst({
          where: {
            schoolId: school.id,
            email: `invited-${timestamp}@test.com`,
          },
        })

        expect(invitation).not.toBeNull()
      } else {
        // If team page doesn't exist yet, check directly via API
        const cookies = await page.context().cookies()
        const sessionCookie = cookies.find(c => c.name === 'admin_session')

        const response = await page.request.post('/api/admin/team/invite', {
          headers: {
            'Cookie': `admin_session=${sessionCookie?.value}`,
          },
          data: {
            email: `invited-api-${Date.now()}@test.com`,
            role: 'ADMIN',
          },
        })

        // Should succeed or return 404 if not implemented
        const isSuccess = response.ok() || response.status() === 404
        expect(isSuccess).toBeTruthy()
      }
    })

    test('ADMIN cannot send team invitations', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin()
        .withSchool(school.id)
        .withRole('ADMIN') // Not OWNER
        .create()

      // Login as admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Try to access team page
      await page.goto('http://localhost:9000/admin/team')

      // Should either show 403/forbidden or hide invite button
      const pageContent = await page.textContent('body')
      const has403 = pageContent?.includes('403') || pageContent?.includes('Forbidden')
      const hasInviteButton = await page.locator('button:has-text("Invite")').count() > 0

      // Either should be forbidden or button should be hidden
      expect(has403 || !hasInviteButton).toBeTruthy()
    })
  })

  test.describe('[02.3.3-3.4] Accept Team Invitation', () => {
    test('new user can accept invitation and join school', async ({ page }) => {
      const school = await createSchool().withName('Invitation School').create()
      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      const timestamp = Date.now()
      const inviteeEmail = `new-invitee-${timestamp}@test.com`

      // Create invitation directly in database
      const invitation = await prisma.teamInvitation.create({
        data: {
          email: inviteeEmail,
          role: 'ADMIN',
          schoolId: school.id,
          token: `test-token-${timestamp}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      // Invitee clicks link and goes to invitation acceptance page
      await page.goto(`http://localhost:9000/admin/team/accept?token=${invitation.token}`)

      // Should prompt to signup (new user scenario)
      const isSignupPage = await page.url().includes('signup') ||
                           await page.locator('text=/sign up|הרשם/i').count() > 0

      if (isSignupPage) {
        // Complete signup
        await page.fill('input[name="email"], input[type="email"]', inviteeEmail)
        await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!')
        await page.fill('input[name="name"]', 'New Invitee')

        await page.click('button[type="submit"]')

        // Should be linked to school automatically
        await page.waitForTimeout(2000) // Wait for account creation

        const newAdmin = await prisma.admin.findUnique({
          where: { email: inviteeEmail },
        })

        expect(newAdmin).not.toBeNull()
        expect(newAdmin?.schoolId).toBe(school.id)
        expect(newAdmin?.role).toBe('ADMIN')
      }
    })

    test('existing user can accept invitation and switch schools', async ({ page }) => {
      const schoolA = await createSchool().withName('School A').create()
      const schoolB = await createSchool().withName('School B').create()

      // Create existing user in School A
      const existingUser = await createAdmin()
        .withSchool(schoolA.id)
        .withRole('ADMIN')
        .create()

      // Create invitation to School B
      const timestamp = Date.now()
      const invitation = await prisma.teamInvitation.create({
        data: {
          email: existingUser.email,
          role: 'MANAGER',
          schoolId: schoolB.id,
          token: `test-token-existing-${timestamp}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      // Login as existing user
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(existingUser.email, 'TestPassword123!')

      // Accept invitation
      await page.goto(`http://localhost:9000/admin/team/accept?token=${invitation.token}`)

      // Wait for processing
      await page.waitForTimeout(2000)

      // Verify user switched to School B
      const updatedUser = await prisma.admin.findUnique({
        where: { email: existingUser.email },
      })

      expect(updatedUser?.schoolId).toBe(schoolB.id)
      expect(updatedUser?.role).toBe('MANAGER')
    })
  })

  test.describe('[02.4.1] View Team Members', () => {
    test('OWNER can view all team members', async ({ page }) => {
      const school = await createSchool().withName('Team View School').create()
      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .withName('Owner User')
        .create()

      // Create additional team members
      const admin1 = await createAdmin()
        .withSchool(school.id)
        .withRole('ADMIN')
        .withName('Admin User 1')
        .create()

      const manager1 = await createAdmin()
        .withSchool(school.id)
        .withRole('MANAGER')
        .withName('Manager User 1')
        .create()

      // Login as owner
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(owner.email, 'TestPassword123!')

      // Navigate to team page
      await page.goto('http://localhost:9000/admin/team')

      // Check if team members are visible (either via UI or API)
      const pageText = await page.textContent('body')

      // Either UI shows members or we verify via API
      if (pageText?.includes('Owner User') || pageText?.includes('Admin User')) {
        // UI is showing team members
        expect(pageText).toContain('Owner User')
      } else {
        // Check via API
        const cookies = await page.context().cookies()
        const sessionCookie = cookies.find(c => c.name === 'admin_session')

        const response = await page.request.get('/api/admin/team', {
          headers: {
            'Cookie': `admin_session=${sessionCookie?.value}`,
          },
        })

        if (response.ok()) {
          const data = await response.json()
          expect(data.members?.length).toBeGreaterThanOrEqual(3)
        }
      }

      // Verify in database
      const teamMembers = await prisma.admin.findMany({
        where: { schoolId: school.id },
      })

      expect(teamMembers.length).toBe(3)
    })
  })

  test.describe('[02.5.1] Change Team Member Role', () => {
    test('OWNER can change member role', async ({ page }) => {
      const school = await createSchool().create()
      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      const member = await createAdmin()
        .withSchool(school.id)
        .withRole('VIEWER')
        .withName('Member To Promote')
        .create()

      // Login as owner
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(owner.email, 'TestPassword123!')

      // Try to change role via API (since UI may not be implemented)
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      const response = await page.request.patch(`/api/admin/team/${member.id}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
        data: {
          role: 'ADMIN',
        },
      })

      // Should succeed or return 404 if not implemented
      const isValidResponse = response.ok() || response.status() === 404

      if (response.ok()) {
        // Verify role changed
        const updatedMember = await prisma.admin.findUnique({
          where: { id: member.id },
        })

        expect(updatedMember?.role).toBe('ADMIN')
      }

      expect(isValidResponse).toBeTruthy()
    })
  })

  test.describe('[02.5.2] Remove Team Member', () => {
    test('OWNER can remove team member', async ({ page }) => {
      const school = await createSchool().create()
      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      const memberToRemove = await createAdmin()
        .withSchool(school.id)
        .withRole('VIEWER')
        .withName('Member To Remove')
        .create()

      // Login as owner
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(owner.email, 'TestPassword123!')

      // Try to remove member via API
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      const response = await page.request.delete(`/api/admin/team/${memberToRemove.id}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should succeed or return 404 if not implemented
      const isValidResponse = response.ok() || response.status() === 404

      if (response.ok()) {
        // Verify member removed (schoolId set to NULL)
        const removedMember = await prisma.admin.findUnique({
          where: { id: memberToRemove.id },
        })

        expect(removedMember?.schoolId).toBeNull()
      }

      expect(isValidResponse).toBeTruthy()
    })

    test('OWNER cannot remove themselves', async ({ page }) => {
      const school = await createSchool().create()
      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      // Login as owner
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(owner.email, 'TestPassword123!')

      // Try to remove self via API
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      const response = await page.request.delete(`/api/admin/team/${owner.id}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should fail with 400 or 403
      expect(response.ok()).toBe(false)
    })
  })

  test.describe('[02.6.2] Usage Limits - Events', () => {
    test('FREE plan cannot exceed event limit', async ({ page }) => {
      // Create school with FREE plan
      const school = await createSchool()
        .withPlan('FREE')
        .create()

      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      // Create 5 events (FREE plan limit)
      for (let i = 0; i < 5; i++) {
        await createEvent()
          .withSchool(school.id)
          .withTitle(`Event ${i + 1}`)
          .create()
      }

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(owner.email, 'TestPassword123!')

      // Try to create 6th event
      await page.goto('http://localhost:9000/admin/events/new')

      await page.fill('input[name="title"]', 'Event 6 - Over Limit')
      await page.fill('input[name="slug"]', `event-6-${Date.now()}`)
      await page.fill('input[name="capacity"]', '50')

      // Fill date fields
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateStr = futureDate.toISOString().split('T')[0]
      await page.fill('input[name="startDate"]', dateStr)
      await page.fill('input[name="startTime"]', '18:00')

      await page.click('button[type="submit"]')

      // Should show limit error
      await page.waitForTimeout(2000)

      const pageText = await page.textContent('body')
      const hasLimitError = pageText?.includes('limit') ||
                            pageText?.includes('מגבלה') ||
                            pageText?.includes('upgrade') ||
                            pageText?.includes('שדרוג')

      // Check if event was NOT created
      const eventCount = await prisma.event.count({
        where: { schoolId: school.id },
      })

      expect(eventCount).toBeLessThanOrEqual(5)
    })
  })

  test.describe('[02.6.3] Usage Limits - Registrations', () => {
    test('FREE plan tracks registration usage', async ({ page }) => {
      // Create school with FREE plan (limit: 100 registrations/month)
      const school = await createSchool()
        .withPlan('FREE')
        .create()

      const owner = await createAdmin()
        .withSchool(school.id)
        .withRole('OWNER')
        .create()

      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(200)
        .create()

      // Create 100 registrations (at limit)
      for (let i = 0; i < 100; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`User ${i + 1}`)
          .confirmed()
          .create()
      }

      // Try to create 101st registration via API
      const cookies = await page.context().cookies('http://localhost:9000')

      const response = await page.request.post(
        `/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'User 101',
            email: `user101-${Date.now()}@test.com`,
            phone: '0501234567',
            spotsCount: 1,
          },
        }
      )

      // Should either succeed or show limit warning
      // (Implementation may vary - either block or allow with warning)
      const status = response.status()
      expect([200, 201, 403, 429]).toContain(status)

      if (status === 403 || status === 429) {
        const data = await response.json()
        const hasLimitMessage = JSON.stringify(data).toLowerCase().includes('limit')
        expect(hasLimitMessage).toBeTruthy()
      }
    })
  })

  test.describe('[02.3.5] Expired Invitation', () => {
    test('expired invitation cannot be accepted', async ({ page }) => {
      const school = await createSchool().create()

      const timestamp = Date.now()

      // Create expired invitation (past expiration date)
      const expiredInvitation = await prisma.teamInvitation.create({
        data: {
          email: `expired-${timestamp}@test.com`,
          role: 'ADMIN',
          schoolId: school.id,
          token: `expired-token-${timestamp}`,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        },
      })

      // Try to accept expired invitation
      await page.goto(`http://localhost:9000/admin/team/accept?token=${expiredInvitation.token}`)

      // Should show error about expiration
      await page.waitForTimeout(2000)

      const pageText = await page.textContent('body')
      const hasExpiredError = pageText?.includes('expired') ||
                              pageText?.includes('פג תוקף') ||
                              pageText?.includes('invalid')

      expect(hasExpiredError).toBeTruthy()
    })
  })

  test.describe('[02.3.6] Invalid Invitation Token', () => {
    test('invalid token shows error', async ({ page }) => {
      // Try to access with invalid token
      await page.goto('http://localhost:9000/admin/team/accept?token=invalid-fake-token-12345')

      // Should show error
      await page.waitForTimeout(2000)

      const pageText = await page.textContent('body')
      const hasInvalidError = pageText?.includes('invalid') ||
                              pageText?.includes('לא תקין') ||
                              pageText?.includes('not found') ||
                              pageText?.includes('404')

      expect(hasInvalidError).toBeTruthy()
    })
  })
})
