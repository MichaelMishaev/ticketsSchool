'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    if (!token) {
      setError('קוד איפוס חסר')
      setValidating(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/reset-password?token=${token}`)
      const data = await response.json()

      if (data.valid) {
        setTokenValid(true)
        setUserInfo({ email: data.email, name: data.name })
      } else {
        setError(data.error || 'קוד איפוס לא תקין')
      }
    } catch (err) {
      setError('שגיאה בבדיקת קוד האיפוס')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('הסיסמה חייבת להיות לפחות 8 תווים')
      return
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/admin/login?message=password_reset')
        }, 3000)
      } else {
        setError(data.error || 'שגיאה באיפוס הסיסמה')
      }
    } catch (err) {
      setError('שגיאה בהתחברות לשרת. נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">בודק קוד איפוס...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                קוד איפוס לא תקין
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'קוד האיפוס פג תוקף או לא תקין'}
              </p>
              <div className="space-y-3">
                <Link
                  href="/admin/forgot-password"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
                >
                  בקש קוד איפוס חדש
                </Link>
                <Link
                  href="/admin/login"
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  חזרה להתחברות
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                הסיסמה שונתה בהצלחה! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                ניתן עכשיו להתחבר עם הסיסמה החדשה
              </p>
              <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-6 text-right">
                <p className="text-sm text-blue-700">
                  מעביר אותך לדף ההתחברות...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-pink-100">
            <Lock className="h-6 w-6 text-pink-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            איפוס סיסמה
          </h2>
          {userInfo && (
            <p className="mt-2 text-center text-sm text-gray-600">
              שלום {userInfo.name}
            </p>
          )}
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-r-4 border-red-400 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 ml-3" />
                  <p className="text-sm text-red-700 text-right">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-right">
                סיסמה חדשה <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-right"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">לפחות 8 תווים</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 text-right">
                אימות סיסמה <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-right"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'משנה סיסמה...' : 'שנה סיסמה'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/admin/login"
                className="text-sm font-medium text-pink-600 hover:text-pink-500 flex items-center justify-center"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                חזרה להתחברות
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">טוען...</p>
      </div>
    </div>
  )
}

// Main export wrapped in Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
