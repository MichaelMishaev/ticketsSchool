'use client'

import Link from 'next/link'
import { Calendar, Home, Plus, Menu, X, HelpCircle, LogOut, MessageSquare, Shield, Settings, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticatedSync, clientLogout } from '@/lib/auth.client'

interface AdminInfo {
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN'
  schoolId?: string
  schoolName?: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check if current page is public BEFORE any state initialization
  const publicPages = ['/admin/login', '/admin/signup', '/admin/forgot-password', '/admin/onboarding']
  const isPublicPage = publicPages.includes(pathname)

  const [isChecking, setIsChecking] = useState(!isPublicPage)
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)

  useEffect(() => {
    // Skip auth check on public admin pages
    if (isPublicPage) {
      return
    }

    // Check authentication using sync check (localStorage hint)
    // This is just a UX optimization - server will verify the HTTP-only cookie
    if (!isAuthenticatedSync()) {
      router.push('/admin/login')
    } else {
      // Fetch admin info
      fetch('/api/admin/me')
        .then(res => res.json())
        .then(data => {
          if (data.authenticated && data.admin) {
            setAdminInfo(data.admin)
          }
        })
        .catch(err => console.error('Failed to fetch admin info:', err))
        .finally(() => setIsChecking(false))
    }
  }, [router, pathname, isPublicPage])

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    // Client-side logout (clears cookie and redirects)
    clientLogout()
  }

  // Don't show layout on public pages (login, signup, forgot password)
  if (isPublicPage) {
    return <>{children}</>
  }

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex flex-1">
              <div className="flex-shrink-0 flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  {adminInfo?.role === 'SUPER_ADMIN'
                    ? 'לוח ניהול'
                    : (adminInfo?.schoolName || 'kartis.info')
                  }
                </h1>
                {adminInfo?.role === 'SUPER_ADMIN' && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                    Super Admin
                  </span>
                )}
              </div>
              <div className="hidden sm:mr-6 sm:flex sm:space-x-reverse sm:space-x-8">
                {adminInfo?.role === 'SUPER_ADMIN' ? (
                  <Link
                    href="/admin/super"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-purple-600 hover:text-purple-800 border-b-2 border-purple-600"
                  >
                    <Shield className="w-4 h-4 ml-2" />
                    לוח בקרה Super Admin
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/admin"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-600"
                    >
                      <Home className="w-4 h-4 ml-2" />
                      ראשי
                    </Link>
                    <Link
                      href="/admin/events"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      <Calendar className="w-4 h-4 ml-2" />
                      אירועים
                    </Link>
                    <Link
                      href="/admin/events/new"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      אירוע חדש
                    </Link>
                    <Link
                      href="/admin/help"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      <HelpCircle className="w-4 h-4 ml-2" />
                      הסבר איך להוסיף אירוע
                    </Link>
                    <Link
                      href="/admin/team"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      <Users className="w-4 h-4 ml-2" />
                      צוות
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      הגדרות
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition"
              >
                <LogOut className="w-4 h-4 ml-2" />
                התנתק
              </button>
            </div>
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 min-w-[44px] min-h-[44px]"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {adminInfo?.role === 'SUPER_ADMIN' ? (
                <Link
                  href="/admin/super"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block pr-4 py-3 border-r-4 border-purple-600 text-base font-medium text-purple-600 bg-purple-50 min-h-[44px]"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 ml-3" />
                    לוח בקרה Super Admin
                  </div>
                </Link>
              ) : (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <Home className="w-5 h-5 ml-3" />
                      ראשי
                    </div>
                  </Link>
                  <Link
                    href="/admin/events"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 ml-3" />
                      אירועים
                    </div>
                  </Link>
                  <Link
                    href="/admin/events/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <Plus className="w-5 h-5 ml-3" />
                      אירוע חדש
                    </div>
                  </Link>
                  <Link
                    href="/admin/help"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <HelpCircle className="w-5 h-5 ml-3" />
                      הסבר איך להוסיף אירוע
                    </div>
                  </Link>
                  <Link
                    href="/admin/team"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <Users className="w-5 h-5 ml-3" />
                      צוות
                    </div>
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 ml-3" />
                      הגדרות
                    </div>
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full text-right block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 hover:border-red-300 min-h-[44px]"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 ml-3" />
                  התנתק
                </div>
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="py-4 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}