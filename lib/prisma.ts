import { PrismaClient, Prisma } from '@prisma/client'
import { registerPrismaGuards } from './prisma-guards'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isPerfLogging = process.env.PERF_QUERY_LOG === 'true'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isPerfLogging ? [{ emit: 'event', level: 'query' }] : [],
  })

export { Prisma }

if (isPerfLogging) {
  // Log slow queries to stdout ONLY when PERF_QUERY_LOG=true.
  // CRITICAL: Never commit .env with PERF_QUERY_LOG=true.
  // Revert this env var to false (or remove it) before committing.
  ;(prisma as any).$on('query', (e: { duration: number; query: string; params: string }) => {
    if (e.duration > 100) {
      console.log(`[SLOW QUERY] ${e.duration}ms | ${e.query} | params: ${e.params}`)
    }
  })
}

// Register runtime invariant guards
// Guards enforce critical data integrity constraints:
// - Events MUST have schoolId (multi-tenant isolation)
// - Registrations MUST have eventId (data integrity)
// - No hard deletes on Event, Registration, School (prevent data loss)
registerPrismaGuards(prisma)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma