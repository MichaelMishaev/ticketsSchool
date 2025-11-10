'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { markLoggedIn } from '@/lib/auth.client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Read search params from URL on client-side to avoid Suspense
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const message = urlParams.get('message')
      const errorParam = urlParams.get('error')

      if (message === 'verified') {
        setSuccess('המייל אומת בהצלחה! ניתן להתחבר עכשיו.')
      } else if (message === 'already_verified') {
        setSuccess('המייל כבר אומת. ניתן להתחבר.')
      } else if (message === 'password_reset') {
        setSuccess('הסיסמה שונתה בהצלחה! ניתן להתחבר עכשיו.')
      }

      if (errorParam === 'missing_token') {
        setError('קוד האימות חסר')
      } else if (errorParam === 'invalid_token') {
        setError('קוד אימות לא תקין')
      } else if (errorParam === 'token_expired') {
        setError('קוד האימות פג תוקף. נא לבקש קוד חדש.')
      } else if (errorParam === 'verification_failed') {
        setError('שגיאה באימות המייל. נסה שוב.')
      } else if (errorParam === 'email_exists_with_password') {
        setError('כתובת המייל הזאת כבר קיימת עם סיסמה. אנא התחבר עם סיסמה במקום Google.')
      } else if (errorParam === 'oauth_failed') {
        setError('שגיאה בהתחברות עם Google. נסה שוב.')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        markLoggedIn()

        // Check onboarding status and redirect appropriately
        if (!data.admin.onboardingCompleted || !data.admin.schoolId) {
          router.push('/admin/onboarding')
        } else {
          router.push('/admin')
        }
        router.refresh()
      } else {
        setError(data.error || 'אימייל או סיסמה שגויים')
      }
    } catch (err) {
      setError('שגיאה בהתחברות. אנא נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            כניסת מנהלים
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            kartis.info Admin Panel
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {success && (
            <div className="bg-green-50 border-r-4 border-green-400 p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 ml-3" />
                <p className="text-sm text-green-700 text-right">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-r-4 border-red-400 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 ml-3" />
                <p className="text-sm text-red-700 text-right">{error}</p>
              </div>
            </div>
          )}

          {/* Google Sign-in */}
          <div className="mb-6">
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              המשך עם Google
            </a>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">או התחבר עם אימייל</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-right">
                שם משתמש או אימייל
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-right">
                סיסמה
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm" data-version="v4-onclick">
            <a
              href="/admin/forgot-password"
              onClick={(e) => {
                e.preventDefault()
                router.push('/admin/forgot-password')
              }}
              className="font-medium text-blue-600 hover:text-blue-500 underline cursor-pointer"
              data-testid="forgot-password-link"
            >
              שכחתי סיסמה
            </a>
            <a
              href="/admin/signup"
              onClick={(e) => {
                e.preventDefault()
                router.push('/admin/signup')
              }}
              className="font-medium text-blue-600 hover:text-blue-500 underline cursor-pointer"
              data-testid="signup-link"
            >
              הרשמה
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
