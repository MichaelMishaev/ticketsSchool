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
        router.push('/admin')
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {success && (
              <div className="bg-green-50 border-r-4 border-green-400 p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 ml-3" />
                  <p className="text-sm text-green-700 text-right">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-r-4 border-red-400 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 ml-3" />
                  <p className="text-sm text-red-700 text-right">{error}</p>
                </div>
              </div>
            )}

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
