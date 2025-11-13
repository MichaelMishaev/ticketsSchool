'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, User, Home } from 'lucide-react'
import { trackSignup } from '@/lib/analytics'
import { markLoggedIn } from '@/lib/auth.client'

export default function AdminSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const router = useRouter()

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/admin/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage('✓ המייל נשלח מחדש! בדוק את תיבת הדואר שלך.')
      } else {
        setResendMessage(data.error || '✗ שגיאה בשליחת המייל')
      }
    } catch (err) {
      setResendMessage('✗ שגיאה בהתחברות לשרת')
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name) {
      setError('נא למלא את שמך המלא')
      return
    }

    if (!formData.email) {
      setError('נא למלא כתובת אימייל')
      return
    }

    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להיות לפחות 8 תווים')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Track successful signup
        trackSignup('email')

        // TEMPORARY: Auto-redirect to onboarding (skip email verification)
        if (data.requiresOnboarding) {
          markLoggedIn() // Update client-side auth state
          router.push('/admin/onboarding')
          router.refresh()
        } else {
          setSuccess(true)
        }
      } else {
        setError(data.error || 'שגיאה ביצירת החשבון')
      }
    } catch (err) {
      setError('שגיאה בהתחברות לשרת. אנא נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        {/* Home Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 group"
        >
          <Home className="h-5 w-5 text-green-600 group-hover:text-green-700" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">חזרה לדף הבית</span>
        </Link>

        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                נרשמת בהצלחה! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                שלחנו לך מייל לכתובת:
              </p>
              <p className="text-lg font-semibold text-blue-600 mb-6 break-all">
                {formData.email}
              </p>
              <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-6 text-right">
                <p className="text-sm text-blue-700">
                  <strong>שלב נוסף:</strong> כדי להפעיל את החשבון, לחץ על הקישור במייל שקיבלת.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  הקישור תקף ל-24 שעות
                </p>
              </div>

              <div className="bg-purple-50 border-r-4 border-purple-400 p-4 mb-6 text-right">
                <p className="text-sm text-purple-700">
                  <strong>מה הלאה?</strong> לאחר אימות המייל תועבר להשלמת הגדרת הארגון שלך
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  לדף ההתחברות
                </button>

                {/* Resend Email Button */}
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? 'שולח...' : 'שלח מייל שוב'}
                </button>

                {resendMessage && (
                  <p className={`text-xs ${resendMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {resendMessage}
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  לא קיבלת מייל? בדוק את תיקיית הספאם
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Home Button */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 group"
      >
        <Home className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">חזרה לדף הבית</span>
      </Link>

      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            הרשמה למערכת
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            צור חשבון חדש ותתחיל לנהל אירועים
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-r-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="mr-3">
                  <p className="text-sm text-red-700 text-right">{error}</p>
                </div>
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
              <span className="px-2 bg-white text-gray-500">או הרשם עם אימייל</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-right">
                שם מלא <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right text-gray-900 bg-white"
                  placeholder="ישראל ישראלי"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-right">
                אימייל <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right text-gray-900 bg-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-right">
                  סיסמה <span className="text-red-500">*</span>
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right text-gray-900 bg-white"
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
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right text-gray-900 bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    נרשם...
                  </>
                ) : (
                  <>
                    צור חשבון
                    <UserPlus className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                כבר יש לך חשבון?{' '}
                <Link href="/admin/login" className="font-medium text-blue-600 hover:text-blue-500">
                  התחבר כאן
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
