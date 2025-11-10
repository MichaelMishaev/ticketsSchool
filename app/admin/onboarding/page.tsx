'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Link as LinkIcon, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolSlug: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/me', {
          credentials: 'include', // IMPORTANT: Include cookies in fetch
        })
        if (!response.ok) {
          router.push('/admin/login')
          return
        }
        const data = await response.json()

        // If already completed onboarding, redirect to dashboard
        if (data.schoolId && data.onboardingCompleted) {
          router.push('/admin')
          return
        }
      } catch (err) {
        router.push('/admin/login')
        return
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

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

    if (!formData.schoolName || !formData.schoolSlug) {
      setError('נא למלא את כל השדות')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/onboarding', {
        method: 'POST',
        credentials: 'include', // IMPORTANT: Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          schoolSlug: formData.schoolSlug,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('[Onboarding] Success! Redirecting to dashboard...')
        // Redirect to dashboard
        router.push('/admin')
      } else {
        console.error('[Onboarding] Error:', data.error)
        setError(data.error || 'שגיאה ביצירת הארגון')
      }
    } catch (err) {
      console.error('[Onboarding] Network error:', err)
      setError('שגיאה בהתחברות לשרת. אנא נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            בואו נגדיר את הארגון שלך
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            רק עוד שלב אחד קטן ותוכל להתחיל
          </p>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 inline-block">
              💡 אין לך ארגון? השתמש בשם שלך (למשל: "דני כהן" → <span className="font-mono" dir="ltr">ticketcap.com/p/dny-khn</span>)
            </p>
          </div>
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
              <p className="mt-1 text-xs text-gray-500 text-right">
                שם הארגון/בית הספר שלך (יכול להיות כל שם - אפילו השם שלך)
              </p>
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
                  placeholder="my-organization"
                  dir="ltr"
                />
              </div>
              <div className="mt-2 space-y-1 text-right">
                <p className="text-xs text-gray-700">
                  הקישור שלך: <span className="font-mono font-semibold text-blue-600" dir="ltr">ticketcap.com/p/{formData.schoolSlug || 'my-organization'}</span>
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-gray-600">
                  <p className="font-semibold text-yellow-800 mb-1">⚠️ חשוב!</p>
                  <p>
                    <strong>רק אותיות אנגליות קטנות</strong> (a-z), <strong>מספרים</strong> (0-9) ו<strong>מקף</strong> (-)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    יוצר ארגון...
                  </>
                ) : (
                  'המשך לדשבורד'
                )}
              </button>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-400 p-3 text-right">
              <p className="text-xs text-blue-800">
                💡 הקישור יווצר אוטומטית מהשם שתכתוב למעלה. אפשר לערוך אותו בכל זמן בהגדרות.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
