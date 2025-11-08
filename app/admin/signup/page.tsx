'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Building2, Mail, Lock, User, Link as LinkIcon } from 'lucide-react'

export default function AdminSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    schoolName: '',
    schoolSlug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSchoolNameChange = (name: string) => {
    setFormData({
      ...formData,
      schoolName: name,
      schoolSlug: generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להיות לפחות 8 תווים')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    if (!formData.schoolSlug) {
      setError('נא להזין שם ארגון')
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
          schoolName: formData.schoolName,
          schoolSlug: formData.schoolSlug,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  לדף ההתחברות
                </button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            הרשמה למערכת
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            צור חשבון חדש לארגון שלך
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-r-4 border-red-400 p-4">
                <div className="flex">
                  <div className="mr-3">
                    <p className="text-sm text-red-700 text-right">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-right">פרטים אישיים</h3>

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
                    className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
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
                    className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
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
                      className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
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
                      className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* School Info */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 text-right">פרטי הארגון</h3>

              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 text-right">
                  שם הארגון <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => handleSchoolNameChange(e.target.value)}
                    className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                    placeholder="בית ספר דוגמה"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="schoolSlug" className="block text-sm font-medium text-gray-700 text-right">
                  קישור הארגון <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="schoolSlug"
                    name="schoolSlug"
                    type="text"
                    required
                    value={formData.schoolSlug}
                    onChange={(e) => setFormData({ ...formData, schoolSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right font-mono"
                    placeholder="school-name"
                    dir="ltr"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 text-right">
                  הקישור שלך יהיה: <span className="font-mono" dir="ltr">ticketcap.com/p/{formData.schoolSlug || 'school-name'}</span>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700 text-right">
                <strong>תוכנית חינם:</strong> תקבל 14 ימי ניסיון חינם עם עד 3 אירועים ו-100 רישומים לחודש.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'נרשם...' : 'צור חשבון'}
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
