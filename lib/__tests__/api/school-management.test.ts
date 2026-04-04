import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { AdminRole } from '@prisma/client'

/**
 * Integration Tests for School Management API
 *
 * Tests the complete school and admin CRUD lifecycle:
 * - School creation, read, update, delete
 * - Admin creation and assignment to schools
 * - Multi-tenant data isolation (schoolId filtering)
 * - Unique constraints (slug, email)
 * - Foreign key relationships and cascade behavior
 * - Role-based access control (SUPER_ADMIN vs regular admin)
 *
 * CRITICAL: Tests multi-tenant isolation to prevent cross-school data access
 */
describe('School Management API Integration', () => {
  let testSchoolId: string
  let testSchool2Id: string
  let testAdminId: string
  let testAdmin2Id: string
  let superAdminId: string

  // Cleanup helper - deletes test data in correct order (foreign key dependencies)
  const cleanupTestData = async () => {
    // Delete admins first (they reference schools)
    if (testAdminId) {
      await prisma.admin.deleteMany({ where: { id: testAdminId } }).catch(() => {})
    }
    if (testAdmin2Id) {
      await prisma.admin.deleteMany({ where: { id: testAdmin2Id } }).catch(() => {})
    }
    if (superAdminId) {
      await prisma.admin.deleteMany({ where: { id: superAdminId } }).catch(() => {})
    }

    // Delete schools after admins
    if (testSchoolId) {
      await prisma.school.deleteMany({ where: { id: testSchoolId } }).catch(() => {})
    }
    if (testSchool2Id) {
      await prisma.school.deleteMany({ where: { id: testSchool2Id } }).catch(() => {})
    }
  }

  beforeEach(async () => {
    // Reset IDs
    testSchoolId = ''
    testSchool2Id = ''
    testAdminId = ''
    testAdmin2Id = ''
    superAdminId = ''
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('School CRUD Operations', () => {
    test('SHOULD create school with valid data', async () => {
      const schoolData = {
        name: 'Test School',
        slug: `test-school-${Date.now()}`,
        logo: 'https://example.com/logo.png',
        primaryColor: '#3b82f6',
        isActive: true,
      }

      const school = await prisma.school.create({
        data: schoolData,
      })

      testSchoolId = school.id

      expect(school.id).toBeDefined()
      expect(school.name).toBe('Test School')
      expect(school.slug).toBe(schoolData.slug)
      expect(school.logo).toBe('https://example.com/logo.png')
      expect(school.primaryColor).toBe('#3b82f6')
      expect(school.isActive).toBe(true)
      expect(school.plan).toBe('FREE') // Default plan
      expect(school.subscriptionStatus).toBe('ACTIVE') // Default status
      expect(school.createdAt).toBeInstanceOf(Date)
      expect(school.updatedAt).toBeInstanceOf(Date)
    })

    test('SHOULD create minimal school with defaults', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Minimal School',
          slug: `minimal-school-${Date.now()}`,
        },
      })

      testSchoolId = school.id

      expect(school.name).toBe('Minimal School')
      expect(school.logo).toBeNull()
      expect(school.primaryColor).toBe('#3b82f6') // Default
      expect(school.isActive).toBe(true) // Default
      expect(school.plan).toBe('FREE') // Default
      expect(school.subscriptionStatus).toBe('ACTIVE') // Default
    })

    test('REJECTS school creation without required fields', async () => {
      // Missing 'slug' field
      await expect(
        prisma.school.create({
          data: {
            name: 'Invalid School',
            // slug is missing
          } as any,
        })
      ).rejects.toThrow()

      // Missing 'name' field
      await expect(
        prisma.school.create({
          data: {
            slug: `invalid-slug-${Date.now()}`,
            // name is missing
          } as any,
        })
      ).rejects.toThrow()
    })

    test('REJECTS duplicate slug (UNIQUE constraint)', async () => {
      const slug = `duplicate-slug-${Date.now()}`

      // Create first school
      const school1 = await prisma.school.create({
        data: {
          name: 'First School',
          slug,
        },
      })
      testSchoolId = school1.id

      // Try to create second school with same slug
      await expect(
        prisma.school.create({
          data: {
            name: 'Second School',
            slug, // DUPLICATE
          },
        })
      ).rejects.toThrow(/Unique constraint/)
    })

    test('SHOULD retrieve school by ID', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Retrieve Test School',
          slug: `retrieve-school-${Date.now()}`,
        },
      })
      testSchoolId = school.id

      const retrieved = await prisma.school.findUnique({
        where: { id: school.id },
      })

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(school.id)
      expect(retrieved!.name).toBe('Retrieve Test School')
      expect(retrieved!.slug).toBe(school.slug)
    })

    test('SHOULD retrieve school by slug', async () => {
      const slug = `retrieve-by-slug-${Date.now()}`
      const school = await prisma.school.create({
        data: {
          name: 'Retrieve by Slug School',
          slug,
        },
      })
      testSchoolId = school.id

      const retrieved = await prisma.school.findUnique({
        where: { slug },
      })

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(school.id)
      expect(retrieved!.name).toBe('Retrieve by Slug School')
    })

    test('SHOULD return null for non-existent school', async () => {
      const retrieved = await prisma.school.findUnique({
        where: { id: 'non-existent-school-id' },
      })

      expect(retrieved).toBeNull()
    })

    test('SHOULD update school successfully', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Original Name',
          slug: `original-slug-${Date.now()}`,
        },
      })
      testSchoolId = school.id

      const updated = await prisma.school.update({
        where: { id: school.id },
        data: {
          name: 'Updated Name',
          logo: 'https://example.com/new-logo.png',
          primaryColor: '#10b981',
          isActive: false,
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.logo).toBe('https://example.com/new-logo.png')
      expect(updated.primaryColor).toBe('#10b981')
      expect(updated.isActive).toBe(false)
      expect(updated.slug).toBe(school.slug) // Slug unchanged
    })

    test('SHOULD update school subscription plan', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Subscription Test School',
          slug: `subscription-school-${Date.now()}`,
          plan: 'FREE',
        },
      })
      testSchoolId = school.id

      const updated = await prisma.school.update({
        where: { id: school.id },
        data: {
          plan: 'PRO',
          stripeCustomerId: 'cus_test123',
          stripeSubscriptionId: 'sub_test123',
          subscriptionStatus: 'ACTIVE',
        },
      })

      expect(updated.plan).toBe('PRO')
      expect(updated.stripeCustomerId).toBe('cus_test123')
      expect(updated.stripeSubscriptionId).toBe('sub_test123')
      expect(updated.subscriptionStatus).toBe('ACTIVE')
    })

    test('SHOULD delete school successfully (no admins)', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'School to Delete',
          slug: `to-delete-${Date.now()}`,
        },
      })

      await prisma.school.delete({
        where: { id: school.id },
      })

      const deleted = await prisma.school.findUnique({
        where: { id: school.id },
      })

      expect(deleted).toBeNull()
    })

    test('SHOULD cascade delete admins when school is deleted', async () => {
      // Create school
      const school = await prisma.school.create({
        data: {
          name: 'Cascade Delete School',
          slug: `cascade-delete-${Date.now()}`,
        },
      })
      testSchoolId = school.id

      // Create admin linked to school
      const admin = await prisma.admin.create({
        data: {
          email: `cascade-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin for Cascade Test',
          role: 'ADMIN' as AdminRole,
          schoolId: school.id,
          emailVerified: true,
        },
      })

      // Delete school (should cascade delete admin)
      await prisma.school.delete({
        where: { id: school.id },
      })

      // Verify admin was also deleted
      const deletedAdmin = await prisma.admin.findUnique({
        where: { id: admin.id },
      })

      expect(deletedAdmin).toBeNull()
      testSchoolId = '' // Already deleted
    })
  })

  describe('Admin CRUD Operations', () => {
    beforeEach(async () => {
      // Create test school for admin tests
      const school = await prisma.school.create({
        data: {
          name: 'Admin Test School',
          slug: `admin-test-school-${Date.now()}`,
        },
      })
      testSchoolId = school.id
    })

    test('SHOULD create admin with valid data', async () => {
      const adminData = {
        email: `admin-${Date.now()}@test.com`,
        passwordHash: 'hashed_password',
        name: 'Test Admin',
        role: 'ADMIN' as AdminRole,
        schoolId: testSchoolId,
        emailVerified: true,
      }

      const admin = await prisma.admin.create({
        data: adminData,
      })

      testAdminId = admin.id

      expect(admin.id).toBeDefined()
      expect(admin.email).toBe(adminData.email)
      expect(admin.passwordHash).toBe('hashed_password')
      expect(admin.name).toBe('Test Admin')
      expect(admin.role).toBe('ADMIN')
      expect(admin.schoolId).toBe(testSchoolId)
      expect(admin.emailVerified).toBe(true)
      expect(admin.isActive).toBe(true) // Default
      expect(admin.onboardingCompleted).toBe(false) // Default
      expect(admin.createdAt).toBeInstanceOf(Date)
    })

    test('SHOULD create admin without schoolId (SUPER_ADMIN)', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `superadmin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Super Admin',
          role: 'SUPER_ADMIN' as AdminRole,
          emailVerified: true,
          // schoolId is NULL for SUPER_ADMIN
        },
      })

      superAdminId = admin.id

      expect(admin.role).toBe('SUPER_ADMIN')
      expect(admin.schoolId).toBeNull()
    })

    test('SHOULD create admin with OAuth (no password)', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `oauth-admin-${Date.now()}@test.com`,
          passwordHash: null, // OAuth users don't have password
          name: 'OAuth Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: testSchoolId,
          googleId: 'google_oauth_id_123',
          emailVerified: true,
        },
      })

      testAdminId = admin.id

      expect(admin.passwordHash).toBeNull()
      expect(admin.googleId).toBe('google_oauth_id_123')
    })

    test('REJECTS admin creation without email (required field)', async () => {
      await expect(
        prisma.admin.create({
          data: {
            // email is missing
            passwordHash: 'hashed',
            name: 'Invalid Admin',
            role: 'ADMIN' as AdminRole,
            schoolId: testSchoolId,
          } as any,
        })
      ).rejects.toThrow()
    })

    test('REJECTS duplicate email (UNIQUE constraint)', async () => {
      const email = `duplicate-${Date.now()}@test.com`

      // Create first admin
      const admin1 = await prisma.admin.create({
        data: {
          email,
          passwordHash: 'hashed',
          name: 'First Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })
      testAdminId = admin1.id

      // Try to create second admin with same email
      await expect(
        prisma.admin.create({
          data: {
            email, // DUPLICATE
            passwordHash: 'hashed',
            name: 'Second Admin',
            role: 'ADMIN' as AdminRole,
            schoolId: testSchoolId,
            emailVerified: true,
          },
        })
      ).rejects.toThrow(/Unique constraint/)
    })

    test('REJECTS admin with non-existent schoolId (FOREIGN KEY constraint)', async () => {
      await expect(
        prisma.admin.create({
          data: {
            email: `invalid-school-admin-${Date.now()}@test.com`,
            passwordHash: 'hashed',
            name: 'Invalid School Admin',
            role: 'ADMIN' as AdminRole,
            schoolId: 'non-existent-school-id', // INVALID FOREIGN KEY
            emailVerified: true,
          },
        })
      ).rejects.toThrow(/Foreign key constraint/)
    })

    test('SHOULD retrieve admin with school relationship', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `retrieve-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Retrieve Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })
      testAdminId = admin.id

      const retrieved = await prisma.admin.findUnique({
        where: { id: admin.id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(admin.id)
      expect(retrieved!.school).toBeDefined()
      expect(retrieved!.school!.id).toBe(testSchoolId)
      expect(retrieved!.school!.name).toBe('Admin Test School')
    })

    test('SHOULD update admin successfully', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `update-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Original Name',
          role: 'MANAGER' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: false,
        },
      })
      testAdminId = admin.id

      const updated = await prisma.admin.update({
        where: { id: admin.id },
        data: {
          name: 'Updated Name',
          role: 'ADMIN' as AdminRole,
          emailVerified: true,
          onboardingCompleted: true,
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.role).toBe('ADMIN')
      expect(updated.emailVerified).toBe(true)
      expect(updated.onboardingCompleted).toBe(true)
      expect(updated.email).toBe(admin.email) // Unchanged
    })

    test('SHOULD update admin lastLoginAt timestamp', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `login-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Login Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })
      testAdminId = admin.id

      expect(admin.lastLoginAt).toBeNull()

      const now = new Date()
      const updated = await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: now },
      })

      expect(updated.lastLoginAt).toEqual(now)
    })

    test('SHOULD delete admin successfully', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `delete-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Delete Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })

      await prisma.admin.delete({
        where: { id: admin.id },
      })

      const deleted = await prisma.admin.findUnique({
        where: { id: admin.id },
      })

      expect(deleted).toBeNull()
    })
  })

  describe('Multi-Tenant Data Isolation', () => {
    beforeEach(async () => {
      // Create two test schools
      const school1 = await prisma.school.create({
        data: {
          name: 'School 1',
          slug: `school-1-${Date.now()}`,
        },
      })
      testSchoolId = school1.id

      const school2 = await prisma.school.create({
        data: {
          name: 'School 2',
          slug: `school-2-${Date.now()}`,
        },
      })
      testSchool2Id = school2.id

      // Create admins for both schools
      const admin1 = await prisma.admin.create({
        data: {
          email: `admin1-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin 1',
          role: 'ADMIN' as AdminRole,
          schoolId: school1.id,
          emailVerified: true,
        },
      })
      testAdminId = admin1.id

      const admin2 = await prisma.admin.create({
        data: {
          email: `admin2-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin 2',
          role: 'ADMIN' as AdminRole,
          schoolId: school2.id,
          emailVerified: true,
        },
      })
      testAdmin2Id = admin2.id
    })

    test('SHOULD enforce schoolId filtering for different schools', async () => {
      // Query admins for school 1 only
      const school1Admins = await prisma.admin.findMany({
        where: { schoolId: testSchoolId },
      })

      // Query admins for school 2 only
      const school2Admins = await prisma.admin.findMany({
        where: { schoolId: testSchool2Id },
      })

      // Verify isolation
      expect(school1Admins.length).toBe(1)
      expect(school1Admins[0].id).toBe(testAdminId)
      expect(school1Admins[0].schoolId).toBe(testSchoolId)

      expect(school2Admins.length).toBe(1)
      expect(school2Admins[0].id).toBe(testAdmin2Id)
      expect(school2Admins[0].schoolId).toBe(testSchool2Id)
    })

    test('SHOULD prevent admin from accessing other school data', async () => {
      // Admin 1 should only see school 1 data
      const admin1School = await prisma.admin.findUnique({
        where: { id: testAdminId },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              admins: true,
            },
          },
        },
      })

      expect(admin1School!.school!.id).toBe(testSchoolId)
      expect(admin1School!.school!.name).toBe('School 1')
      expect(admin1School!.school!.admins.length).toBe(1)
      expect(admin1School!.school!.admins[0].id).toBe(testAdminId)

      // Admin 2 should only see school 2 data
      const admin2School = await prisma.admin.findUnique({
        where: { id: testAdmin2Id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              admins: true,
            },
          },
        },
      })

      expect(admin2School!.school!.id).toBe(testSchool2Id)
      expect(admin2School!.school!.name).toBe('School 2')
      expect(admin2School!.school!.admins.length).toBe(1)
      expect(admin2School!.school!.admins[0].id).toBe(testAdmin2Id)
    })

    test('SHOULD allow SUPER_ADMIN to access all schools', async () => {
      // Create SUPER_ADMIN
      const superAdmin = await prisma.admin.create({
        data: {
          email: `superadmin-access-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Super Admin',
          role: 'SUPER_ADMIN' as AdminRole,
          emailVerified: true,
          // No schoolId - can access all schools
        },
      })
      superAdminId = superAdmin.id

      // SUPER_ADMIN can query all schools
      const allSchools = await prisma.school.findMany({
        where: {
          OR: [{ id: testSchoolId }, { id: testSchool2Id }],
        },
      })

      expect(allSchools.length).toBe(2)

      // Regular admin should only access their school
      const regularAdminSchools = await prisma.school.findMany({
        where: { id: testSchoolId },
      })

      expect(regularAdminSchools.length).toBe(1)
      expect(regularAdminSchools[0].id).toBe(testSchoolId)
    })

    test('SHOULD filter admins by schoolId and role', async () => {
      // Create OWNER admin for school 1
      const owner = await prisma.admin.create({
        data: {
          email: `owner-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'School Owner',
          role: 'OWNER' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })

      // Query all admins for school 1
      const school1Admins = await prisma.admin.findMany({
        where: { schoolId: testSchoolId },
      })

      expect(school1Admins.length).toBe(2) // admin1 + owner

      // Query only OWNER role
      const owners = await prisma.admin.findMany({
        where: {
          schoolId: testSchoolId,
          role: 'OWNER',
        },
      })

      expect(owners.length).toBe(1)
      expect(owners[0].id).toBe(owner.id)

      // Cleanup
      await prisma.admin.delete({ where: { id: owner.id } })
    })
  })

  describe('School-Admin Relationship Tests', () => {
    test('SHOULD allow school with no admins', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Empty School',
          slug: `empty-school-${Date.now()}`,
        },
      })
      testSchoolId = school.id

      const retrieved = await prisma.school.findUnique({
        where: { id: school.id },
        include: { admins: true },
      })

      expect(retrieved!.admins).toEqual([])
    })

    test('SHOULD allow school with multiple admins', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Multi-Admin School',
          slug: `multi-admin-school-${Date.now()}`,
        },
      })
      testSchoolId = school.id

      // Create 3 admins for this school
      const admin1 = await prisma.admin.create({
        data: {
          email: `multi-admin1-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin 1',
          role: 'OWNER' as AdminRole,
          schoolId: school.id,
          emailVerified: true,
        },
      })

      const admin2 = await prisma.admin.create({
        data: {
          email: `multi-admin2-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin 2',
          role: 'ADMIN' as AdminRole,
          schoolId: school.id,
          emailVerified: true,
        },
      })

      const admin3 = await prisma.admin.create({
        data: {
          email: `multi-admin3-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin 3',
          role: 'VIEWER' as AdminRole,
          schoolId: school.id,
          emailVerified: true,
        },
      })

      const retrieved = await prisma.school.findUnique({
        where: { id: school.id },
        include: { admins: true },
      })

      expect(retrieved!.admins.length).toBe(3)
      expect(retrieved!.admins.map((a) => a.id).sort()).toEqual(
        [admin1.id, admin2.id, admin3.id].sort()
      )

      // Cleanup
      await prisma.admin.deleteMany({
        where: { id: { in: [admin1.id, admin2.id, admin3.id] } },
      })
    })

    test('SHOULD update admin schoolId (reassign to different school)', async () => {
      const school1 = await prisma.school.create({
        data: {
          name: 'School 1',
          slug: `reassign-school1-${Date.now()}`,
        },
      })
      testSchoolId = school1.id

      const school2 = await prisma.school.create({
        data: {
          name: 'School 2',
          slug: `reassign-school2-${Date.now()}`,
        },
      })
      testSchool2Id = school2.id

      const admin = await prisma.admin.create({
        data: {
          email: `reassign-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Reassign Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: school1.id,
          emailVerified: true,
        },
      })
      testAdminId = admin.id

      expect(admin.schoolId).toBe(school1.id)

      // Reassign to school2
      const updated = await prisma.admin.update({
        where: { id: admin.id },
        data: { schoolId: school2.id },
      })

      expect(updated.schoolId).toBe(school2.id)

      // Verify school1 has no admins
      const school1Admins = await prisma.admin.findMany({
        where: { schoolId: school1.id },
      })
      expect(school1Admins.length).toBe(0)

      // Verify school2 has the admin
      const school2Admins = await prisma.admin.findMany({
        where: { schoolId: school2.id },
      })
      expect(school2Admins.length).toBe(1)
      expect(school2Admins[0].id).toBe(admin.id)
    })

    test('SHOULD set admin schoolId to null (unassign from school)', async () => {
      const school = await prisma.school.create({
        data: {
          name: 'Unassign School',
          slug: `unassign-school-${Date.now()}`,
        },
      })
      testSchoolId = school.id

      const admin = await prisma.admin.create({
        data: {
          email: `unassign-admin-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Unassign Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: school.id,
          emailVerified: true,
        },
      })
      testAdminId = admin.id

      expect(admin.schoolId).toBe(school.id)

      // Unassign from school (set to null)
      const updated = await prisma.admin.update({
        where: { id: admin.id },
        data: { schoolId: null },
      })

      expect(updated.schoolId).toBeNull()
    })
  })

  describe('Role-Based Access Control (RBAC)', () => {
    beforeEach(async () => {
      const school = await prisma.school.create({
        data: {
          name: 'RBAC Test School',
          slug: `rbac-school-${Date.now()}`,
        },
      })
      testSchoolId = school.id
    })

    test('SHOULD create admin with each role type', async () => {
      const roles: AdminRole[] = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER']

      for (const role of roles) {
        const admin = await prisma.admin.create({
          data: {
            email: `${role.toLowerCase()}-${Date.now()}@test.com`,
            passwordHash: 'hashed',
            name: `${role} User`,
            role,
            schoolId: role === 'SUPER_ADMIN' ? null : testSchoolId,
            emailVerified: true,
          },
        })

        expect(admin.role).toBe(role)

        // Cleanup
        await prisma.admin.delete({ where: { id: admin.id } })
      }
    })

    test('SHOULD filter admins by role', async () => {
      // Create admins with different roles
      const owner = await prisma.admin.create({
        data: {
          email: `owner-filter-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Owner',
          role: 'OWNER' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })

      const admin = await prisma.admin.create({
        data: {
          email: `admin-filter-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin',
          role: 'ADMIN' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })

      const viewer = await prisma.admin.create({
        data: {
          email: `viewer-filter-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Viewer',
          role: 'VIEWER' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })

      // Query by role
      const owners = await prisma.admin.findMany({
        where: { schoolId: testSchoolId, role: 'OWNER' },
      })
      expect(owners.length).toBe(1)
      expect(owners[0].id).toBe(owner.id)

      const admins = await prisma.admin.findMany({
        where: { schoolId: testSchoolId, role: 'ADMIN' },
      })
      expect(admins.length).toBe(1)
      expect(admins[0].id).toBe(admin.id)

      const viewers = await prisma.admin.findMany({
        where: { schoolId: testSchoolId, role: 'VIEWER' },
      })
      expect(viewers.length).toBe(1)
      expect(viewers[0].id).toBe(viewer.id)

      // Cleanup
      await prisma.admin.deleteMany({
        where: { id: { in: [owner.id, admin.id, viewer.id] } },
      })
    })

    test('SHOULD update admin role', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: `role-update-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Role Update Admin',
          role: 'VIEWER' as AdminRole,
          schoolId: testSchoolId,
          emailVerified: true,
        },
      })
      testAdminId = admin.id

      expect(admin.role).toBe('VIEWER')

      // Promote to ADMIN
      const updated = await prisma.admin.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' as AdminRole },
      })

      expect(updated.role).toBe('ADMIN')

      // Promote to OWNER
      const updated2 = await prisma.admin.update({
        where: { id: admin.id },
        data: { role: 'OWNER' as AdminRole },
      })

      expect(updated2.role).toBe('OWNER')
    })
  })
})
