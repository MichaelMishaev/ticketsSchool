/**
 * Request Context using AsyncLocalStorage
 *
 * Provides request-scoped context that's automatically available
 * throughout the entire request lifecycle without explicit passing.
 *
 * Usage:
 *   // In middleware or API route:
 *   await requestContext.run({ requestId: 'abc123' }, async () => {
 *     // ... handle request
 *   })
 *
 *   // Anywhere in the code:
 *   const requestId = requestContext.getRequestId()
 */

import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

interface RequestContextStore {
  requestId: string
  userId?: string
  schoolId?: string
  startTime: number
}

// Create AsyncLocalStorage instance
const asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>()

/**
 * Generate a unique request ID
 * Uses UUID v4 for guaranteed uniqueness
 */
function generateRequestId(): string {
  return randomUUID().split('-')[0] // Short 8-char ID for readability
}

/**
 * Request context utilities
 */
export const requestContext = {
  /**
   * Run a function with request context
   * All code within the callback will have access to the context
   */
  async run<T>(
    context: Partial<RequestContextStore>,
    callback: () => Promise<T>
  ): Promise<T> {
    const store: RequestContextStore = {
      requestId: context.requestId || generateRequestId(),
      userId: context.userId,
      schoolId: context.schoolId,
      startTime: context.startTime || Date.now()
    }
    return asyncLocalStorage.run(store, callback)
  },

  /**
   * Get the current request ID
   * Returns undefined if not in a request context
   */
  getRequestId(): string | undefined {
    return asyncLocalStorage.getStore()?.requestId
  },

  /**
   * Get the current user ID
   */
  getUserId(): string | undefined {
    return asyncLocalStorage.getStore()?.userId
  },

  /**
   * Get the current school ID
   */
  getSchoolId(): string | undefined {
    return asyncLocalStorage.getStore()?.schoolId
  },

  /**
   * Get request duration in milliseconds
   */
  getDuration(): number | undefined {
    const store = asyncLocalStorage.getStore()
    if (!store) return undefined
    return Date.now() - store.startTime
  },

  /**
   * Get the full context store
   */
  getStore(): RequestContextStore | undefined {
    return asyncLocalStorage.getStore()
  },

  /**
   * Set user context (call this after authentication)
   */
  setUser(userId: string, schoolId?: string): void {
    const store = asyncLocalStorage.getStore()
    if (store) {
      store.userId = userId
      if (schoolId) {
        store.schoolId = schoolId
      }
    }
  },

  /**
   * Generate and return a new request ID
   * Can be used before run() to pass to response headers
   */
  generateId: generateRequestId
}

/**
 * Helper to wrap an API route handler with request context
 *
 * Usage:
 *   export const POST = withRequestContext(async (request) => {
 *     // requestId is automatically available via logger
 *     logger.info('Processing request')
 *     return NextResponse.json({ success: true })
 *   })
 */
export function withRequestContext<T>(
  handler: (request: Request, ...args: unknown[]) => Promise<T>
): (request: Request, ...args: unknown[]) => Promise<T> {
  return async (request: Request, ...args: unknown[]) => {
    const requestId = request.headers.get('x-request-id') || generateRequestId()

    return requestContext.run({ requestId }, async () => {
      return handler(request, ...args)
    })
  }
}

/**
 * Create X-Request-ID header for response
 */
export function getRequestIdHeader(): Record<string, string> {
  const requestId = requestContext.getRequestId()
  if (requestId) {
    return { 'X-Request-ID': requestId }
  }
  return {}
}
