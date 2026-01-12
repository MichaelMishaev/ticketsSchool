import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables for tests
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-min-32-characters-long'
process.env.RESEND_API_KEY = 're_test_key_for_testing'
process.env.EMAIL_FROM = 'test@example.com'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:9000'

// Extend Vitest matchers
expect.extend({})

// Cleanup after each test (for React components)
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock Next.js headers/cookies for server-side code
beforeAll(() => {
  // Mock server-only to allow importing server-side code in tests
  vi.mock('server-only', () => ({}))

  // Mock next/headers
  vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })),
    headers: vi.fn(() => ({
      get: vi.fn(),
      has: vi.fn(),
    })),
  }))

  // Mock next/navigation
  vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    redirect: vi.fn(),
  }))
})

afterAll(async () => {
  // Cleanup test database connections
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$disconnect()
  } catch (error) {
    // Prisma might not be initialized in all tests
    console.log('Skipping Prisma cleanup (not initialized)')
  }
})
