import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export interface AuthSession {
  adminId: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN'
  schoolId?: string
  schoolName?: string
}

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

// Simple JWT-like encoding (for production, use proper JWT library)
function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64')
}

function decodeSession(token: string): AuthSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    return JSON.parse(decoded) as AuthSession
  } catch {
    return null
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthSession | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
      include: { school: true }
    })

    if (!admin) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash)
    if (!isValidPassword) {
      return null
    }

    const session: AuthSession = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      schoolId: admin.schoolId || undefined,
      schoolName: admin.school?.name || undefined,
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    })

    return session
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

/**
 * Get current authenticated admin session
 */
export async function getCurrentAdmin(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const session = decodeSession(token)
    if (!session) {
      return null
    }

    // Optionally: Verify admin still exists in database
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      include: { school: true }
    })

    if (!admin) {
      // Admin was deleted, clear session
      await logout()
      return null
    }

    return session
  } catch (error) {
    console.error('Get current admin error:', error)
    return null
  }
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAdmin(): Promise<AuthSession> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error('Unauthorized')
  }
  return admin
}

/**
 * Require super admin role (throws if not super admin)
 */
export async function requireSuperAdmin(): Promise<AuthSession> {
  const admin = await requireAdmin()
  if (admin.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super admin required')
  }
  return admin
}

/**
 * Check if admin has access to a school
 */
export async function requireSchoolAccess(schoolId: string): Promise<AuthSession> {
  const admin = await requireAdmin()

  // Super admins have access to all schools
  if (admin.role === 'SUPER_ADMIN') {
    return admin
  }

  // School admins can only access their own school
  if (admin.schoolId !== schoolId) {
    throw new Error('Forbidden: No access to this school')
  }

  return admin
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Check if authenticated (for client-side)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  // For client-side, we'll check if cookie exists (simple check)
  return document.cookie.includes(SESSION_COOKIE_NAME)
}

/**
 * Client-side logout
 */
export function clientLogout(): void {
  if (typeof window !== 'undefined') {
    // Clear cookie
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
    // Redirect to login
    window.location.href = '/admin/login'
  }
}
