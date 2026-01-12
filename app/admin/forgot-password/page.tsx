'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      // Always show success (security: don't reveal if email exists)
      if (response.ok) {
        setSent(true)
      }
    } catch (err) {
      setSent(true) // Still show success to avoid email enumeration
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 mb-4">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                בדוק את המייל שלך
              </h2>
              <p className="text-gray-600 mb-6">
                אם כתובת המייל קיימת במערכת, שלחנו אליה הוראות לאיפוס הסיסמה.
              </p>
              <p className="text-lg font-semibold text-purple-600 mb-6 break-all">
                {email}
              </p>
              <div className="bg-purple-50 border-r-4 border-purple-400 p-4 mb-6 text-right">
                <p className="text-sm text-purple-700">
                  <strong>שים לב:</strong> הקישור לאיפוס הסיסמה תקף לשעה אחת בלבד.
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  לא קיבלת מייל? בדוק את תיקיית הספאם
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/login"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100">
            <Mail className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            שכחת סיסמה?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            נשלח לך מייל עם הוראות לאיפוס הסיסמה
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-right">
                כתובת אימייל <span className="text-red-500">*</span>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-right"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'שולח...' : 'שלח הוראות איפוס'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/admin/login"
                className="text-sm font-medium text-purple-600 hover:text-purple-500 flex items-center justify-center"
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
