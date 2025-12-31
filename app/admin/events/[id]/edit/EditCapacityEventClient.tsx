'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Clock, Save, X } from 'lucide-react'

interface Props {
  eventId: string
  initialData: {
    title: string
    description?: string | null
    gameType?: string | null
    location?: string | null
    startAt: string
    endAt?: string | null
    capacity: number
    maxSpotsPerPerson: number
    status: 'OPEN' | 'PAUSED' | 'CLOSED'
    fieldsSchema: any[]
    conditions?: string | null
    requireAcceptance: boolean
    completionMessage?: string | null
    spotsReserved: number
  }
}

export default function EditCapacityEventClient({ eventId, initialData }: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description || '',
    gameType: initialData.gameType || '',
    location: initialData.location || '',
    startAt: initialData.startAt,
    endAt: initialData.endAt || '',
    capacity: initialData.capacity,
    maxSpotsPerPerson: initialData.maxSpotsPerPerson,
    status: initialData.status,
    conditions: initialData.conditions || '',
    requireAcceptance: initialData.requireAcceptance,
    completionMessage: initialData.completionMessage || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper: Format datetime-local input
  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Client-side validation
      if (formData.capacity < initialData.spotsReserved) {
        setError(
          `לא ניתן להקטין נפח ל-${formData.capacity} כאשר כבר ${initialData.spotsReserved} מקומות תפוסים`
        )
        setLoading(false)
        return
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          endAt: formData.endAt || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'שגיאה בעדכון האירוע')
        return
      }

      // Success - redirect to event detail
      router.push(`/admin/events/${eventId}`)
      router.refresh()
    } catch (err) {
      console.error('Error updating event:', err)
      setError('שגיאה בעדכון האירוע')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">ערוך אירוע</h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Basic Details */}
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">פרטי האירוע</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              כותרת <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              תיאור
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              מיקום
            </label>
            <div className="relative">
              <MapPin className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-1">
              סוג אירוע
            </label>
            <input
              id="gameType"
              type="text"
              value={formData.gameType}
              onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
              placeholder="כדורגל, כדורסל, הרצאה..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Timing */}
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            תזמון
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 mb-1">
                תאריך ושעת התחלה <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="startAt"
                  type="datetime-local"
                  value={formatDatetimeLocal(formData.startAt)}
                  onChange={(e) =>
                    setFormData({ ...formData, startAt: new Date(e.target.value).toISOString() })
                  }
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 mb-1">
                תאריך ושעת סיום (אופציונלי)
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt ? formatDatetimeLocal(formData.endAt) : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endAt: e.target.value ? new Date(e.target.value).toISOString() : '',
                    })
                  }
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Settings */}
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            הגדרות נפח
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                מספר מקומות כולל <span className="text-red-500">*</span>
              </label>
              <input
                id="capacity"
                type="number"
                min={initialData.spotsReserved}
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                מינימום: {initialData.spotsReserved} (נרשמים מאושרים כרגע)
              </p>
            </div>

            <div>
              <label
                htmlFor="maxSpotsPerPerson"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                מקסימום מקומות לנרשם <span className="text-red-500">*</span>
              </label>
              <input
                id="maxSpotsPerPerson"
                type="number"
                min="1"
                max="50"
                value={formData.maxSpotsPerPerson}
                onChange={(e) =>
                  setFormData({ ...formData, maxSpotsPerPerson: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          {/* Capacity Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{initialData.spotsReserved}</span> מקומות תפוסים כרגע
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-medium">
                {Math.max(0, formData.capacity - initialData.spotsReserved)}
              </span>{' '}
              מקומות פנויים לאחר שינוי
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">סטטוס</h2>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              סטטוס הרשמה
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED' })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="OPEN">פתוח להרשמה</option>
              <option value="PAUSED">מושהה</option>
              <option value="CLOSED">סגור</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.status === 'OPEN' && 'המערכת תקבל הרשמות חדשות'}
              {formData.status === 'PAUSED' && 'הרשמות חדשות מושהות זמנית'}
              {formData.status === 'CLOSED' && 'הרשמות חדשות נחסמות'}
            </p>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">הגדרות מתקדמות</h2>

          <div>
            <label htmlFor="conditions" className="block text-sm font-medium text-gray-700 mb-1">
              תנאי השתתפות
            </label>
            <textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              rows={3}
              placeholder="תנאי השתתפות באירוע..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireAcceptance"
              checked={formData.requireAcceptance}
              onChange={(e) => setFormData({ ...formData, requireAcceptance: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="requireAcceptance" className="text-sm text-gray-700">
              דרוש אישור תנאי השתתפות בעת ההרשמה
            </label>
          </div>

          <div>
            <label
              htmlFor="completionMessage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              הודעה לאחר השלמת הרשמה
            </label>
            <textarea
              id="completionMessage"
              value={formData.completionMessage}
              onChange={(e) => setFormData({ ...formData, completionMessage: e.target.value })}
              rows={2}
              placeholder="הודעה שתוצג לנרשמים לאחר רישום מוצלח..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Note about fieldsSchema */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            📝 <span className="font-medium">שים לב:</span> עריכת שדות טופס מותאמים אישית אינה זמינה
            כרגע. ניתן לערוך רק את פרטי האירוע.
          </p>
        </div>
      </form>
    </div>
  )
}
