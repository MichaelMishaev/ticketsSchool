/**
 * Enhanced Logging System with Pino + Database Persistence
 *
 * Features:
 * - High-performance Pino logging (5-10x faster than console)
 * - Database persistence for ERROR/WARN levels (queryable)
 * - Request ID tracking via AsyncLocalStorage
 * - Auto-extract context (userId, schoolId from session)
 * - Environment-aware (pretty in dev, JSON in prod)
 *
 * Usage:
 *   import { logger } from '@/lib/logger-v2'
 *   logger.info('Payment processed', { eventId, amount })
 *   logger.error('Payment failed', { error: err.message, eventId })
 */

import pino from 'pino'
import { prisma } from '@/lib/prisma'
import { requestContext } from './request-context'

// Log levels matching Prisma enum
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

// Context that can be passed to logger
export interface LogContext {
  source?: string
  userId?: string
  eventId?: string
  schoolId?: string
  requestId?: string
  error?: unknown
  [key: string]: unknown
}

// Map Pino levels to our LogLevel enum
const pinoLevelToLogLevel: Record<string, LogLevel> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'ERROR'
}

// Configure Pino based on environment
const isDev = process.env.NODE_ENV !== 'production'
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')

// Create Pino instance
const pinoLogger = pino({
  level: logLevel,
  // Use pino-pretty in development for readable logs
  transport: isDev && process.env.PINO_PRETTY !== 'false'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss.l'
        }
      }
    : undefined,
  // Add base fields
  base: {
    env: process.env.NODE_ENV
  },
  // Format timestamp as ISO string
  timestamp: pino.stdTimeFunctions.isoTime
})

/**
 * Persist logs to database (async, non-blocking)
 * Only persists WARN and ERROR levels to avoid DB bloat
 */
async function persistToDatabase(
  level: LogLevel,
  message: string,
  context: LogContext
): Promise<void> {
  // Only persist WARN and ERROR to database
  if (level !== 'WARN' && level !== 'ERROR') {
    return
  }

  try {
    // Build metadata object, extracting error details
    const metadata: Record<string, string | number | boolean | null> = {}

    for (const [key, value] of Object.entries(context)) {
      // Skip fields that have their own columns
      if (['source', 'userId', 'eventId'].includes(key)) continue

      // Handle error specially
      if (key === 'error') {
        if (value instanceof Error) {
          metadata.error = value.message
          metadata.stack = value.stack || null
        } else if (typeof value === 'string') {
          metadata.error = value
        } else {
          metadata.error = String(value)
        }
        continue
      }

      // Only include serializable values
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        metadata[key] = value
      } else if (value !== undefined) {
        metadata[key] = String(value)
      }
    }

    await prisma.log.create({
      data: {
        level,
        message,
        source: context.source || 'system',
        userId: context.userId,
        eventId: context.eventId,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      }
    })
  } catch (error) {
    // Silent fail - don't let logging errors break the app
    pinoLogger.error({ err: error }, 'Failed to persist log to database')
  }
}

/**
 * Enrich context with request ID and other automatic fields
 */
function enrichContext(context: LogContext): LogContext {
  const enriched: LogContext = { ...context }

  // Add request ID from AsyncLocalStorage if available
  const reqId = requestContext.getRequestId()
  if (reqId) {
    enriched.requestId = reqId
  }

  // Add school ID from context if available
  const schoolId = requestContext.getSchoolId()
  if (schoolId && !enriched.schoolId) {
    enriched.schoolId = schoolId
  }

  // Add user ID from context if available
  const userId = requestContext.getUserId()
  if (userId && !enriched.userId) {
    enriched.userId = userId
  }

  return enriched
}

/**
 * Create the main logger interface
 */
function createLogger() {
  const log = (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context: LogContext = {}
  ) => {
    const enrichedContext = enrichContext(context)

    // Extract error for Pino's error serialization
    const { error, ...rest } = enrichedContext
    const pinoContext: Record<string, unknown> = { ...rest }

    if (error !== undefined) {
      if (error instanceof Error) {
        pinoContext.err = error
      } else if (typeof error === 'string') {
        pinoContext.error = error
      } else {
        pinoContext.error = String(error)
      }
    }

    // Log to Pino (console output)
    pinoLogger[level](pinoContext, message)

    // Persist to database (async, non-blocking)
    const logLevel = pinoLevelToLogLevel[level]
    persistToDatabase(logLevel, message, enrichedContext).catch(() => {
      // Swallow errors - already logged via Pino
    })
  }

  return {
    /**
     * Debug level - detailed information for debugging
     * NOT persisted to database
     */
    debug(message: string, context?: LogContext) {
      log('debug', message, context)
    },

    /**
     * Info level - general operational information
     * NOT persisted to database (too much volume)
     */
    info(message: string, context?: LogContext) {
      log('info', message, context)
    },

    /**
     * Warn level - something unexpected but recoverable
     * PERSISTED to database for review
     */
    warn(message: string, context?: LogContext) {
      log('warn', message, context)
    },

    /**
     * Error level - something went wrong
     * PERSISTED to database for investigation
     */
    error(message: string, context?: LogContext) {
      log('error', message, context)
    },

    /**
     * Create a child logger with preset context
     * Useful for adding source/eventId to all logs in a request handler
     */
    child(context: LogContext) {
      return {
        debug: (msg: string, ctx?: LogContext) =>
          log('debug', msg, { ...context, ...ctx }),
        info: (msg: string, ctx?: LogContext) =>
          log('info', msg, { ...context, ...ctx }),
        warn: (msg: string, ctx?: LogContext) =>
          log('warn', msg, { ...context, ...ctx }),
        error: (msg: string, ctx?: LogContext) =>
          log('error', msg, { ...context, ...ctx })
      }
    },

    /**
     * Get the underlying Pino instance for advanced usage
     */
    get pino() {
      return pinoLogger
    }
  }
}

// Export singleton logger
export const logger = createLogger()

// Convenience exports for common patterns
export function createSourceLogger(source: string) {
  return logger.child({ source })
}

// Payment-specific logger
export const paymentLogger = createSourceLogger('payment')

// Auth-specific logger
export const authLogger = createSourceLogger('auth')

// Registration-specific logger
export const registrationLogger = createSourceLogger('registration')

// Middleware-specific logger
export const middlewareLogger = createSourceLogger('middleware')
