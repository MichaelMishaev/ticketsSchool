import { PrismaClient, Prisma } from '@prisma/client'
import { registerPrismaGuards } from './prisma-guards'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()
export { Prisma }

// Register runtime invariant guards
// Guards enforce critical data integrity constraints:
// - Events MUST have schoolId (multi-tenant isolation)
// - Registrations MUST have eventId (data integrity)
// - No hard deletes on Event, Registration, School (prevent data loss)
registerPrismaGuards(prisma)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma