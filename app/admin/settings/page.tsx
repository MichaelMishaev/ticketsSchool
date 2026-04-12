'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface School {
  id: string
  name: string
  slug: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [school, setSchool] = useState<School | null>(null)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/me', {
        credentials: 'include'
      })

      if (!response.ok) {
        router.push('/admin/login')
        return
      }

      const data = await response.json()

      if (data.school) {
        setSchool(data.school)
        setNewSchoolName(data.school.name)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSchoolName = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSchoolName.trim()) {
      setMessage({ type: 'error', text: 'שם הארגון לא יכול להיות ריק' })
      return
    }

    if (newSchoolName === school?.name) {
      setMessage({ type: 'error', text: 'השם החדש זהה לשם הנוכחי' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/update-school-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newName: newSchoolName })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'שגיאה בעדכון שם הארגון' })
        return
      }

      setMessage({ type: 'success', text: 'שם הארגון עודכן בהצלחה!' })
      setSchool(data.school)

      // Refresh the page after 1 second to update all references
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error updating school name:', error)
      setMessage({ type: 'error', text: 'שגיאה בעדכון שם הארגון' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">לא נמצא ארגון משויך למשתמש זה</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-600 mt-1">ניהול פרטי הארגון שלך</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">פרטי הארגון</h2>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleUpdateSchoolName} className="space-y-6">
            {/* Current School Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">מידע נוכחי</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">שם הארגון:</span>
                  <span className="text-sm font-medium text-gray-900">{school.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">קישור הארגון:</span>
                  <span className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                    {school.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Update School Name */}
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                שם ארגון חדש
              </label>
              <input
                type="text"
                id="schoolName"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הזן שם ארגון חדש"
                disabled={isSaving}
              />
              <p className="mt-2 text-sm text-gray-500">
                💡 שינוי שם הארגון לא ישפיע על הקישור שלך ({school.slug})
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-lg p-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving || newSchoolName === school.name}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isSaving ? 'שומר...' : 'עדכן שם ארגון'}
              </button>
              <button
                type="button"
                onClick={() => setNewSchoolName(school.name)}
                disabled={isSaving}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">פעולות מהירות</h2>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/settings/bans')}
              className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚫</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">ניהול חסימות</div>
                  <div className="text-sm text-gray-500">רשימת משתמשים חסומים</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📝 שים לב</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• שינוי שם הארגון יעודכן בכל מקום באפליקציה</li>
          <li>• הקישור של הארגון ({school.slug}) לא ישתנה</li>
          <li>• המשתמשים שלך יראו את השם החדש מיד</li>
        </ul>
      </div>
    </div>
  )
}
