export const SESSION_COOKIE_NAME = 'admin_session'

/**
 * Check if authenticated (for client-side)
 * Note: Since we use HTTP-only cookies, we can't read them from JavaScript
 * Instead, we make a lightweight API call to verify the session
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const response = await fetch('/api/admin/me', {
      method: 'GET',
      credentials: 'include' // Important: include cookies
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Synchronous check - less reliable but faster
 * Uses localStorage as a client-side hint (not for security)
 */
export function isAuthenticatedSync(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin_logged_in') === 'true'
}

/**
 * Mark as logged in (client-side hint only)
 */
export function markLoggedIn(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_logged_in', 'true')
  }
}

/**
 * Mark as logged out (client-side hint only)
 */
export function markLoggedOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_logged_in')
  }
}

/**
 * Client-side logout
 */
export function clientLogout(): void {
  if (typeof window !== 'undefined') {
    // Mark as logged out (clear localStorage hint)
    markLoggedOut()
    // Note: HTTP-only cookie will be cleared by server /api/admin/logout
    // Redirect to login
    window.location.href = '/admin/login'
  }
}
