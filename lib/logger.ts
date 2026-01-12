import { prisma } from '@/lib/prisma'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogOptions {
  level?: LogLevel
  source?: string
  userId?: string
  eventId?: string
  metadata?: Record<string, any>
}

export class Logger {
  static async log(message: string, options: LogOptions = {}) {
    try {
      // Also log to console for development
      const logLevel = options.level || 'INFO'
      const logMethod = logLevel === 'ERROR' ? 'error' :
                       logLevel === 'WARN' ? 'warn' :
                       logLevel === 'DEBUG' ? 'debug' : 'log'

      console[logMethod](`[${logLevel}] ${options.source ? `[${options.source}] ` : ''}${message}`, options.metadata || '')

      // Save to database
      await prisma.log.create({
        data: {
          level: logLevel,
          message,
          source: options.source || 'system',
          userId: options.userId,
          eventId: options.eventId,
          metadata: options.metadata
        }
      })
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', error)
      console.log(`[${options.level || 'INFO'}] ${message}`)
    }
  }

  static async debug(message: string, options: Omit<LogOptions, 'level'> = {}) {
    return this.log(message, { ...options, level: 'DEBUG' })
  }

  static async info(message: string, options: Omit<LogOptions, 'level'> = {}) {
    return this.log(message, { ...options, level: 'INFO' })
  }

  static async warn(message: string, options: Omit<LogOptions, 'level'> = {}) {
    return this.log(message, { ...options, level: 'WARN' })
  }

  static async error(message: string, options: Omit<LogOptions, 'level'> = {}) {
    return this.log(message, { ...options, level: 'ERROR' })
  }
}

// Export convenience functions
export const logger = Logger
export const log = Logger.log
export const logDebug = Logger.debug
export const logInfo = Logger.info
export const logWarn = Logger.warn
export const logError = Logger.error