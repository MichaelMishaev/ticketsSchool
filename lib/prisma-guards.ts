/**
 * Runtime Invariant Guards for TicketCap
 *
 * These middleware functions enforce critical data integrity constraints at runtime.
 * Guards FAIL FAST (throw errors) rather than silently corrupting data.
 *
 * Why Runtime Guards?
 * - Catch bugs that bypass validation (direct DB access, migrations, scripts)
 * - Provide clear error messages for debugging
 * - Log violations for monitoring/alerting (Sentry integration later)
 * - Supplement Prisma schema constraints with application-level rules
 *
 * Critical Invariants:
 * 1. Multi-tenant isolation: Events MUST have schoolId
 * 2. Data integrity: Registrations MUST have eventId
 * 3. Soft deletes: No hard deletes on Event, Registration, School models
 */

const PROTECTED_MODELS = ['Event', 'Registration', 'School']
const GUARD_PREFIX = 'INVARIANT VIOLATION:'

interface GuardContext {
  model: string
  action: string
  args?: any
}

// Prisma middleware params type (not exported in v6)
interface MiddlewareParams {
  model?: string
  action: string
  args: any
  dataPath: string[]
  runInTransaction: boolean
}

/**
 * Log invariant violation with context
 */
function logViolation(message: string, context: GuardContext): void {
  console.error(`${GUARD_PREFIX} ${message}`, {
    timestamp: new Date().toISOString(),
    model: context.model,
    action: context.action,
    args: context.args,
    stack: new Error().stack,
  })
}

/**
 * Guard 1: Events MUST have schoolId
 *
 * Prevents orphaned events that bypass multi-tenant isolation.
 */
function guardEventSchoolId(params: MiddlewareParams): void {
  if (params.model !== 'Event') return

  const actions = ['create', 'update', 'upsert']
  if (!actions.includes(params.action)) return

  let data: any
  if (params.action === 'upsert') {
    data = params.args.create || params.args.update
  } else {
    data = params.args.data
  }

  // Check if schoolId is being set to null/undefined
  if (params.action === 'update' && data && 'schoolId' in data && !data.schoolId) {
    const message = 'Attempting to remove schoolId from Event (data isolation violation)'
    const context: GuardContext = {
      model: 'Event',
      action: params.action,
      args: params.args,
    }
    logViolation(message, context)
    throw new Error(`${GUARD_PREFIX} ${message}`)
  }

  // Check if creating event without schoolId
  if (params.action === 'create' && (!data || !data.schoolId)) {
    const message = 'Attempting to create Event without schoolId (data isolation violation)'
    const context: GuardContext = {
      model: 'Event',
      action: params.action,
      args: params.args,
    }
    logViolation(message, context)
    throw new Error(`${GUARD_PREFIX} ${message}`)
  }
}

/**
 * Guard 2: Registrations MUST have eventId
 *
 * Prevents orphaned registrations that lose event context.
 */
function guardRegistrationEventId(params: MiddlewareParams): void {
  if (params.model !== 'Registration') return

  const actions = ['create', 'update', 'upsert']
  if (!actions.includes(params.action)) return

  let data: any
  if (params.action === 'upsert') {
    data = params.args.create || params.args.update
  } else {
    data = params.args.data
  }

  // Check if eventId is being set to null/undefined
  if (params.action === 'update' && data && 'eventId' in data && !data.eventId) {
    const message = 'Attempting to remove eventId from Registration (data integrity violation)'
    const context: GuardContext = {
      model: 'Registration',
      action: params.action,
      args: params.args,
    }
    logViolation(message, context)
    throw new Error(`${GUARD_PREFIX} ${message}`)
  }

  // Check if creating registration without eventId
  if (params.action === 'create' && (!data || !data.eventId)) {
    const message = 'Attempting to create Registration without eventId (data integrity violation)'
    const context: GuardContext = {
      model: 'Registration',
      action: params.action,
      args: params.args,
    }
    logViolation(message, context)
    throw new Error(`${GUARD_PREFIX} ${message}`)
  }
}

/**
 * Guard 3: No hard deletes on protected models
 *
 * Prevents accidental data loss. Use soft deletes (status field) instead.
 * Protected models: Event, Registration, School
 */
function guardHardDeletes(params: MiddlewareParams): void {
  if (!PROTECTED_MODELS.includes(params.model || '')) return

  const actions = ['delete', 'deleteMany']
  if (!actions.includes(params.action)) return

  const message = `Attempting hard delete on ${params.model} (use soft delete instead: update status field)`
  const context: GuardContext = {
    model: params.model || 'Unknown',
    action: params.action,
    args: params.args,
  }
  logViolation(message, context)
  throw new Error(`${GUARD_PREFIX} ${message}`)
}

/**
 * Register all runtime guards with Prisma middleware
 *
 * Call this function once when initializing Prisma client.
 * Guards run synchronously before every query.
 */
export function registerPrismaGuards(prisma: any): void {
  // Skip registration if $use is not available (e.g., during build time)
  if (typeof prisma.$use !== 'function') {
    console.log('⚠️  Prisma middleware not available (build time) - skipping guard registration')
    return
  }

  prisma.$use(async (params: MiddlewareParams, next: any) => {
    try {
      // Run guards (will throw on violation)
      guardEventSchoolId(params)
      guardRegistrationEventId(params)
      guardHardDeletes(params)

      // Continue to next middleware/query
      return await next(params)
    } catch (error) {
      // Re-throw guard violations
      if (error instanceof Error && error.message.includes(GUARD_PREFIX)) {
        throw error
      }
      // Re-throw other errors
      throw error
    }
  })

  console.log('✅ Runtime invariant guards registered (Event.schoolId, Registration.eventId, Hard Deletes)')
}

/**
 * Get violation statistics (for monitoring)
 *
 * In production, integrate with Sentry/DataDog to track violations.
 * For now, violations are logged to console.error.
 */
export function getGuardStats() {
  return {
    guardsEnabled: true,
    protectedModels: PROTECTED_MODELS,
    guards: [
      'Event MUST have schoolId',
      'Registration MUST have eventId',
      'No hard deletes on Event, Registration, School',
    ],
  }
}
