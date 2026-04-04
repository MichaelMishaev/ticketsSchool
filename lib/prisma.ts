import { PrismaClient, Prisma } from '@prisma/client'
import { applyPrismaGuards } from './prisma-guards'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Base client stored globally to survive hot-reload in dev
const basePrisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma

// Extended client with runtime invariant guards (Prisma v6 $extends API):
// - Events MUST have schoolId (multi-tenant isolation)
// - Registrations MUST have eventId (data integrity)
// - No hard deletes on Event, Registration, School (prevent data loss)
export const prisma = applyPrismaGuards(basePrisma)
export { Prisma }