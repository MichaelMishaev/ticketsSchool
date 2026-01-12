import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  login,
  encodeSession,
  getCurrentAdmin,
  requireAdmin,
  requireSuperAdmin,
  requireSchoolAccess,
  logout,
  SESSION_COOKIE_NAME,
  type AuthSession,
} from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    admin: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}))

vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(),
  verify: vi.fn(),
}))

// Mock Next.js cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}))

describe('auth.server.ts - Authentication & Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure JWT_SECRET is set for tests
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-min-32-characters-long'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('encodeSession()', () => {
    it('should encode session as JWT with HS256 algorithm', () => {
      const session: AuthSession = {
        adminId: 'admin-123',
        email: 'test@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
        schoolName: 'Test School',
      }

      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as any)

      const token = encodeSession(session)

      expect(jwt.sign).toHaveBeenCalledWith(
        session,
        'test-jwt-secret-for-testing-min-32-characters-long',
        expect.objectContaining({
          expiresIn: '7d',
          algorithm: 'HS256',
        })
      )
      expect(token).toBe('mock-jwt-token')
    })

    it('should throw error if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET

      const session: AuthSession = {
        adminId: 'admin-123',
        email: 'test@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
      }

      expect(() => encodeSession(session)).toThrow('JWT_SECRET environment variable is not set')
    })

    it('should encode session without optional schoolId', () => {
      const session: AuthSession = {
        adminId: 'admin-456',
        email: 'super@test.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      }

      vi.mocked(jwt.sign).mockReturnValue('super-token' as any)

      const token = encodeSession(session)

      expect(jwt.sign).toHaveBeenCalledWith(
        session,
        expect.any(String),
        expect.any(Object)
      )
      expect(token).toBe('super-token')
    })
  })

  describe('login() - Email/Password Authentication', () => {
    const mockAdmin = {
      id: 'admin-123',
      email: 'test@test.com',
      name: 'Test Admin',
      passwordHash: '$2a$10$mockHashedPassword',
      emailVerified: true,
      role: 'ADMIN' as const,
      schoolId: 'school-123',
      school: { id: 'school-123', name: 'Test School' },
    }

    it('should login user with valid credentials and set session cookie', async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as any)

      const session = await login('test@test.com', 'password123')

      expect(session).toEqual({
        adminId: 'admin-123',
        email: 'test@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
        schoolName: 'Test School',
      })

      // Verify cookie was set with correct options
      expect(mockCookies.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 604800, // 7 days in seconds
        })
      )
    })

    it('should return null for non-existent user', async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(null)

      const session = await login('nonexistent@test.com', 'password123')

      expect(session).toBeNull()
      expect(mockCookies.set).not.toHaveBeenCalled()
    })

    it('should return null for invalid password', async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      const session = await login('test@test.com', 'wrong-password')

      expect(session).toBeNull()
      expect(mockCookies.set).not.toHaveBeenCalled()
    })

    it('should return null if email not verified (error caught internally)', async () => {
      const unverifiedAdmin = { ...mockAdmin, emailVerified: false }
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(unverifiedAdmin as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const session = await login('test@test.com', 'password123')

      expect(session).toBeNull()
      expect(mockCookies.set).not.toHaveBeenCalled()
    })

    it('should return null for OAuth users (no passwordHash)', async () => {
      const oauthAdmin = { ...mockAdmin, passwordHash: null }
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(oauthAdmin as any)

      const session = await login('oauth@test.com', 'password123')

      expect(session).toBeNull()
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should handle login for admin without schoolId (SUPER_ADMIN)', async () => {
      const superAdmin = {
        ...mockAdmin,
        role: 'SUPER_ADMIN' as const,
        schoolId: null,
        school: null,
      }
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(superAdmin as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(jwt.sign).mockReturnValue('super-token' as any)

      const session = await login('super@test.com', 'password123')

      expect(session).toEqual({
        adminId: 'admin-123',
        email: 'test@test.com',
        name: 'Test Admin',
        role: 'SUPER_ADMIN',
        schoolId: undefined,
        schoolName: undefined,
      })
    })

    it('should set secure cookie in production environment', async () => {
      process.env.NODE_ENV = 'production'
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(jwt.sign).mockReturnValue('prod-token' as any)

      await login('test@test.com', 'password123')

      expect(mockCookies.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'prod-token',
        expect.objectContaining({
          secure: true, // HTTPS-only in production
        })
      )

      process.env.NODE_ENV = 'test' // Reset
    })

    it('should set non-secure cookie in development environment', async () => {
      process.env.NODE_ENV = 'development'
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(jwt.sign).mockReturnValue('dev-token' as any)

      await login('test@test.com', 'password123')

      expect(mockCookies.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'dev-token',
        expect.objectContaining({
          secure: false, // HTTP allowed in dev
        })
      )

      process.env.NODE_ENV = 'test' // Reset
    })
  })

  describe('getCurrentAdmin() - Session Retrieval', () => {
    const mockSession: AuthSession = {
      adminId: 'admin-123',
      email: 'test@test.com',
      name: 'Test Admin',
      role: 'ADMIN',
      schoolId: 'school-123',
    }

    const mockAdmin = {
      id: 'admin-123',
      email: 'test@test.com',
      school: { name: 'Test School' },
    }

    it('should return session if valid cookie exists', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-token' })
      vi.mocked(jwt.verify).mockReturnValue(mockSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)

      const session = await getCurrentAdmin()

      expect(session).toEqual(mockSession)
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'test-jwt-secret-for-testing-min-32-characters-long',
        expect.objectContaining({
          algorithms: ['HS256'],
        })
      )
    })

    it('should return null if no cookie exists', async () => {
      mockCookies.get.mockReturnValue(undefined)

      const session = await getCurrentAdmin()

      expect(session).toBeNull()
      expect(jwt.verify).not.toHaveBeenCalled()
    })

    it('should return null and logout if JWT is invalid', async () => {
      mockCookies.get.mockReturnValue({ value: 'invalid-token' })
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const session = await getCurrentAdmin()

      expect(session).toBeNull()
    })

    it('should return null and logout if admin no longer exists in database', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-token' })
      vi.mocked(jwt.verify).mockReturnValue(mockSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(null) // Admin deleted

      const session = await getCurrentAdmin()

      expect(session).toBeNull()
      expect(mockCookies.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
      expect(mockCookies.delete).toHaveBeenCalledWith('admin_logged_in')
    })

    it('should return null if JWT verification throws error', async () => {
      mockCookies.get.mockReturnValue({ value: 'expired-token' })
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Token expired')
      })

      const session = await getCurrentAdmin()

      expect(session).toBeNull()
    })

    it('should return null if database throws error', async () => {
      const mockSession: AuthSession = {
        adminId: 'admin-123',
        email: 'test@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'valid-token' })
      vi.mocked(jwt.verify).mockReturnValue(mockSession as any)
      vi.mocked(prisma.admin.findUnique).mockRejectedValue(new Error('Database connection failed'))

      const session = await getCurrentAdmin()

      expect(session).toBeNull()
    })
  })

  describe('requireAdmin() - Authentication Guard', () => {
    it('should return session if authenticated', async () => {
      const mockSession: AuthSession = {
        adminId: 'admin-123',
        email: 'test@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'valid-token' })
      vi.mocked(jwt.verify).mockReturnValue(mockSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'admin-123' } as any)

      const session = await requireAdmin()

      expect(session).toEqual(mockSession)
    })

    it('should throw error if not authenticated', async () => {
      mockCookies.get.mockReturnValue(undefined)

      await expect(requireAdmin()).rejects.toThrow('Unauthorized')
    })

    it('should throw error if JWT is invalid', async () => {
      mockCookies.get.mockReturnValue({ value: 'invalid-token' })
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      await expect(requireAdmin()).rejects.toThrow('Unauthorized')
    })
  })

  describe('requireSuperAdmin() - Super Admin Guard', () => {
    it('should return session if user is SUPER_ADMIN', async () => {
      const superAdminSession: AuthSession = {
        adminId: 'super-123',
        email: 'super@test.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      }

      mockCookies.get.mockReturnValue({ value: 'super-token' })
      vi.mocked(jwt.verify).mockReturnValue(superAdminSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'super-123' } as any)

      const session = await requireSuperAdmin()

      expect(session).toEqual(superAdminSession)
    })

    it('should throw error if user is not SUPER_ADMIN', async () => {
      const regularAdminSession: AuthSession = {
        adminId: 'admin-123',
        email: 'admin@test.com',
        name: 'Regular Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'admin-token' })
      vi.mocked(jwt.verify).mockReturnValue(regularAdminSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'admin-123' } as any)

      await expect(requireSuperAdmin()).rejects.toThrow('Forbidden: Super admin required')
    })

    it('should throw error if not authenticated at all', async () => {
      mockCookies.get.mockReturnValue(undefined)

      await expect(requireSuperAdmin()).rejects.toThrow('Unauthorized')
    })
  })

  describe('requireSchoolAccess() - Multi-Tenant Data Isolation', () => {
    it('should allow SUPER_ADMIN to access any school', async () => {
      const superAdminSession: AuthSession = {
        adminId: 'super-123',
        email: 'super@test.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      }

      mockCookies.get.mockReturnValue({ value: 'super-token' })
      vi.mocked(jwt.verify).mockReturnValue(superAdminSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'super-123' } as any)

      const session = await requireSchoolAccess('school-123')

      expect(session).toEqual(superAdminSession)
    })

    it('should allow admin to access their own school', async () => {
      const adminSession: AuthSession = {
        adminId: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'admin-token' })
      vi.mocked(jwt.verify).mockReturnValue(adminSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'admin-123' } as any)

      const session = await requireSchoolAccess('school-123')

      expect(session).toEqual(adminSession)
    })

    it('should throw error if admin tries to access different school', async () => {
      const adminSession: AuthSession = {
        adminId: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'admin-token' })
      vi.mocked(jwt.verify).mockReturnValue(adminSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'admin-123' } as any)

      await expect(requireSchoolAccess('school-456')).rejects.toThrow(
        'Forbidden: No access to this school'
      )
    })

    it('should throw error if non-SUPER_ADMIN has no schoolId (data isolation violation)', async () => {
      const brokenAdminSession: AuthSession = {
        adminId: 'admin-broken',
        email: 'broken@test.com',
        name: 'Broken Admin',
        role: 'ADMIN',
        // Missing schoolId! This is a data integrity violation
      }

      mockCookies.get.mockReturnValue({ value: 'broken-token' })
      vi.mocked(jwt.verify).mockReturnValue(brokenAdminSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'admin-broken' } as any)

      await expect(requireSchoolAccess('school-123')).rejects.toThrow(
        'Data isolation violation: Admin missing schoolId'
      )
    })

    it('should allow OWNER role to access their school', async () => {
      const ownerSession: AuthSession = {
        adminId: 'owner-123',
        email: 'owner@test.com',
        name: 'Owner',
        role: 'OWNER',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'owner-token' })
      vi.mocked(jwt.verify).mockReturnValue(ownerSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'owner-123' } as any)

      const session = await requireSchoolAccess('school-123')

      expect(session).toEqual(ownerSession)
    })

    it('should allow MANAGER role to access their school', async () => {
      const managerSession: AuthSession = {
        adminId: 'manager-123',
        email: 'manager@test.com',
        name: 'Manager',
        role: 'MANAGER',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'manager-token' })
      vi.mocked(jwt.verify).mockReturnValue(managerSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'manager-123' } as any)

      const session = await requireSchoolAccess('school-123')

      expect(session).toEqual(managerSession)
    })

    it('should allow VIEWER role to access their school', async () => {
      const viewerSession: AuthSession = {
        adminId: 'viewer-123',
        email: 'viewer@test.com',
        name: 'Viewer',
        role: 'VIEWER',
        schoolId: 'school-123',
      }

      mockCookies.get.mockReturnValue({ value: 'viewer-token' })
      vi.mocked(jwt.verify).mockReturnValue(viewerSession as any)
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ id: 'viewer-123' } as any)

      const session = await requireSchoolAccess('school-123')

      expect(session).toEqual(viewerSession)
    })
  })

  describe('logout() - Session Termination', () => {
    it('should delete session cookies', async () => {
      await logout()

      expect(mockCookies.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
      expect(mockCookies.delete).toHaveBeenCalledWith('admin_logged_in')
    })

    it('should delete both cookies (session and client hint)', async () => {
      await logout()

      expect(mockCookies.delete).toHaveBeenCalledTimes(2)
    })
  })

  describe('Session Constants', () => {
    it('should export SESSION_COOKIE_NAME constant', () => {
      expect(SESSION_COOKIE_NAME).toBe('admin_session')
    })
  })
})
