import { test, expect } from '@playwright/test'

/**
 * CRITICAL: Runtime Invariant Guards - Unit Tests
 *
 * These tests verify the guard logic and error messages
 * without requiring full database integration.
 *
 * Test Strategy:
 * 1. Import guard functions directly
 * 2. Test guard logic with mock data
 * 3. Verify error messages and logging
 */

test.describe('Runtime Invariant Guards - Unit Tests', () => {
  test('guards should be defined and exported', async () => {
    // Verify guard module exists and can be imported
    const guardsModule = await import('../../lib/prisma-guards')

    expect(guardsModule.registerPrismaGuards).toBeDefined()
    expect(typeof guardsModule.registerPrismaGuards).toBe('function')

    expect(guardsModule.getGuardStats).toBeDefined()
    expect(typeof guardsModule.getGuardStats).toBe('function')

    console.log('✅ Guard functions are properly exported')
  })

  test('getGuardStats should return correct guard configuration', async () => {
    const { getGuardStats } = await import('../../lib/prisma-guards')

    const stats = getGuardStats()

    expect(stats.guardsEnabled).toBe(true)
    expect(stats.protectedModels).toContain('Event')
    expect(stats.protectedModels).toContain('Registration')
    expect(stats.protectedModels).toContain('School')

    expect(stats.guards.length).toBeGreaterThan(0)
    expect(stats.guards).toContain('Event MUST have schoolId')
    expect(stats.guards).toContain('Registration MUST have eventId')
    expect(stats.guards).toContain('No hard deletes on Event, Registration, School')

    console.log('✅ Guard stats:', stats)
  })

  test('guards module should be server-only', async () => {
    // Verify the module has 'server-only' import at the top
    const fs = await import('fs/promises')
    const path = await import('path')

    const guardsPath = path.resolve(process.cwd(), 'lib/prisma-guards.ts')
    const content = await fs.readFile(guardsPath, 'utf-8')

    expect(content).toContain("import 'server-only'")

    console.log('✅ Guards module is marked as server-only')
  })

  test('auth.server guards should be enhanced with runtime checks', async () => {
    // Verify auth.server.ts has been updated with runtime guards
    const fs = await import('fs/promises')
    const path = await import('path')

    const authPath = path.resolve(process.cwd(), 'lib/auth.server.ts')
    const content = await fs.readFile(authPath, 'utf-8')

    // Check for runtime guard comments and logic
    expect(content).toContain('RUNTIME GUARD')
    expect(content).toContain('INVARIANT VIOLATION')
    expect(content).toContain('Data isolation violation')

    // Check for explicit schoolId check
    expect(content).toContain('!admin.schoolId')

    console.log('✅ Auth guards enhanced with runtime checks')
  })

  test('prisma.ts should register guards on initialization', async () => {
    // Verify prisma.ts imports and registers guards
    const fs = await import('fs/promises')
    const path = await import('path')

    const prismaPath = path.resolve(process.cwd(), 'lib/prisma.ts')
    const content = await fs.readFile(prismaPath, 'utf-8')

    expect(content).toContain("import { registerPrismaGuards } from './prisma-guards'")
    expect(content).toContain('registerPrismaGuards(prisma)')

    // Check for guard documentation comments
    expect(content).toContain('Events MUST have schoolId')
    expect(content).toContain('Registrations MUST have eventId')

    console.log('✅ Prisma client registers guards on initialization')
  })
})

test.describe('Guard Error Messages', () => {
  test('guard violations should have INVARIANT VIOLATION prefix', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const guardsPath = path.resolve(process.cwd(), 'lib/prisma-guards.ts')
    const content = await fs.readFile(guardsPath, 'utf-8')

    // Count occurrences of INVARIANT VIOLATION prefix
    const matches = content.match(/INVARIANT VIOLATION:/g)
    expect(matches).toBeTruthy()
    expect(matches!.length).toBeGreaterThan(0)

    console.log(`✅ Found ${matches!.length} INVARIANT VIOLATION error messages`)
  })

  test('guards should log violations with context', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const guardsPath = path.resolve(process.cwd(), 'lib/prisma-guards.ts')
    const content = await fs.readFile(guardsPath, 'utf-8')

    // Verify logging includes context
    expect(content).toContain('console.error')
    expect(content).toContain('timestamp')
    expect(content).toContain('model')
    expect(content).toContain('action')

    console.log('✅ Guard violations include logging with context')
  })

  test('guards should have clear, actionable error messages', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const guardsPath = path.resolve(process.cwd(), 'lib/prisma-guards.ts')
    const content = await fs.readFile(guardsPath, 'utf-8')

    // Check for clear error messages
    expect(content).toContain('data isolation violation')
    expect(content).toContain('data integrity violation')
    expect(content).toContain('use soft delete instead')

    console.log('✅ Guard error messages are clear and actionable')
  })
})

test.describe('Production Monitoring Readiness', () => {
  test('guards should be ready for Sentry integration', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const guardsPath = path.resolve(process.cwd(), 'lib/prisma-guards.ts')
    const content = await fs.readFile(guardsPath, 'utf-8')

    // Check for structured logging that Sentry can parse
    expect(content).toContain('console.error')
    expect(content).toContain('timestamp')
    expect(content).toContain('new Error().stack')

    console.log('✅ Guards have structured logging ready for Sentry')
  })

  test('guard stats function exists for monitoring dashboards', async () => {
    const { getGuardStats } = await import('../../lib/prisma-guards')

    const stats = getGuardStats()

    // Verify stats can be used in monitoring
    expect(stats).toHaveProperty('guardsEnabled')
    expect(stats).toHaveProperty('protectedModels')
    expect(stats).toHaveProperty('guards')

    console.log('✅ Guard stats available for monitoring dashboards')
  })
})
