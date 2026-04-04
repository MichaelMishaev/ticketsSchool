import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isAuthenticated,
  isAuthenticatedSync,
  markLoggedIn,
  markLoggedOut,
  clientLogout,
} from '@/lib/auth.client'

/**
 * @vitest-environment jsdom
 */

describe('auth.client.ts - Client-Side Authentication Helpers', () => {
  let originalFetch: typeof global.fetch
  let originalLocation: Location

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()

    // Reset document.cookie
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })

    // Save original fetch and location
    originalFetch = global.fetch
    originalLocation = window.location

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original fetch and location
    global.fetch = originalFetch
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  describe('isAuthenticated() - Async Authentication Check', () => {
    it('should return false in SSR (window undefined)', async () => {
      // Mock window as undefined
      const originalWindow = global.window
      // @ts-expect-error Testing SSR behavior
      delete global.window

      const result = await isAuthenticated()

      expect(result).toBe(false)

      // Restore window
      global.window = originalWindow
    })

    it('should return true when /api/admin/me returns 200', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })

      const result = await isAuthenticated()

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
      })
    })

    it('should return false when /api/admin/me returns 401', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })

      const result = await isAuthenticated()

      expect(result).toBe(false)
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
      })
    })

    it('should return false when fetch throws error (network failure)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false when fetch times out', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'))

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('isAuthenticatedSync() - Synchronous Authentication Check', () => {
    it('should return false in SSR (window undefined)', () => {
      // Mock window as undefined
      const originalWindow = global.window
      // @ts-expect-error Testing SSR behavior
      delete global.window

      const result = isAuthenticatedSync()

      expect(result).toBe(false)

      // Restore window
      global.window = originalWindow
    })

    it('should return true when localStorage has admin_logged_in=true', () => {
      localStorage.setItem('admin_logged_in', 'true')

      const result = isAuthenticatedSync()

      expect(result).toBe(true)
    })

    it('should return false when localStorage has admin_logged_in=false', () => {
      localStorage.setItem('admin_logged_in', 'false')

      const result = isAuthenticatedSync()

      expect(result).toBe(false)
    })

    it('should return false when localStorage is empty', () => {
      const result = isAuthenticatedSync()

      expect(result).toBe(false)
    })

    it('should check cookie when localStorage is empty and cookie exists', () => {
      document.cookie = 'admin_logged_in=true; path=/'

      const result = isAuthenticatedSync()

      expect(result).toBe(true)
      // Should sync to localStorage
      expect(localStorage.getItem('admin_logged_in')).toBe('true')
    })

    it('should return false when cookie is admin_logged_in=false', () => {
      document.cookie = 'admin_logged_in=false; path=/'

      const result = isAuthenticatedSync()

      expect(result).toBe(false)
      expect(localStorage.getItem('admin_logged_in')).toBeNull()
    })

    it('should handle multiple cookies correctly', () => {
      document.cookie = 'other_cookie=value1; path=/'
      document.cookie = 'admin_logged_in=true; path=/'
      document.cookie = 'another_cookie=value2; path=/'

      const result = isAuthenticatedSync()

      expect(result).toBe(true)
      expect(localStorage.getItem('admin_logged_in')).toBe('true')
    })

    it('should return false when no cookies exist', () => {
      // Cookies cleared in beforeEach

      const result = isAuthenticatedSync()

      expect(result).toBe(false)
    })
  })

  describe('markLoggedIn() - Client-Side Login Marker', () => {
    it('should set localStorage to true', () => {
      markLoggedIn()

      expect(localStorage.getItem('admin_logged_in')).toBe('true')
    })

    it('should not throw error in SSR (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error Testing SSR behavior
      delete global.window

      expect(() => markLoggedIn()).not.toThrow()

      // Restore window
      global.window = originalWindow
    })

    it('should overwrite existing false value', () => {
      localStorage.setItem('admin_logged_in', 'false')

      markLoggedIn()

      expect(localStorage.getItem('admin_logged_in')).toBe('true')
    })
  })

  describe('markLoggedOut() - Client-Side Logout Marker', () => {
    it('should remove admin_logged_in from localStorage', () => {
      localStorage.setItem('admin_logged_in', 'true')

      markLoggedOut()

      expect(localStorage.getItem('admin_logged_in')).toBeNull()
    })

    it('should not throw error when localStorage is already empty', () => {
      expect(() => markLoggedOut()).not.toThrow()
      expect(localStorage.getItem('admin_logged_in')).toBeNull()
    })

    it('should not throw error in SSR (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error Testing SSR behavior
      delete global.window

      expect(() => markLoggedOut()).not.toThrow()

      // Restore window
      global.window = originalWindow
    })

    it('should not affect other localStorage items', () => {
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('other_item', 'value')

      markLoggedOut()

      expect(localStorage.getItem('admin_logged_in')).toBeNull()
      expect(localStorage.getItem('other_item')).toBe('value')
    })
  })

  describe('clientLogout() - Full Client-Side Logout', () => {
    it('should clear localStorage and redirect to /admin/login', () => {
      localStorage.setItem('admin_logged_in', 'true')

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      clientLogout()

      expect(localStorage.getItem('admin_logged_in')).toBeNull()
      expect(window.location.href).toBe('/admin/login')
    })

    it('should not throw error in SSR (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error Testing SSR behavior
      delete global.window

      expect(() => clientLogout()).not.toThrow()

      // Restore window
      global.window = originalWindow
    })

    it('should clear localStorage even if already empty', () => {
      // localStorage already empty from beforeEach

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      clientLogout()

      expect(localStorage.getItem('admin_logged_in')).toBeNull()
      expect(window.location.href).toBe('/admin/login')
    })

    it('should not affect other localStorage items when logging out', () => {
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('other_setting', 'persist')

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      clientLogout()

      expect(localStorage.getItem('admin_logged_in')).toBeNull()
      expect(localStorage.getItem('other_setting')).toBe('persist')
    })
  })

  describe('SESSION_COOKIE_NAME export', () => {
    it('should export SESSION_COOKIE_NAME constant', async () => {
      // Import is already at the top, just verify it's exported
      const authModule = await import('@/lib/auth.client')
      expect(authModule.SESSION_COOKIE_NAME).toBe('admin_session')
    })
  })
})
