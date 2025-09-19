'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FieldBuilder, { defaultFields } from '@/components/field-builder'
import { EventFormData, FieldSchema } from '@/types'

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    gameType: '',
    location: '',
    startAt: '',
    endAt: '',
    capacity: 50,
    maxSpotsPerPerson: 1,
    fieldsSchema: defaultFields,
    conditions: '',
    requireAcceptance: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const event = await response.json()
        router.push(`/admin/events/${event.id}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">יצירת אירוע חדש</h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h2 className="text-lg font-medium text-gray-900">פרטי האירוע</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כותרת האירוע *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="משחק כדורגל נגד בית ספר..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תיאור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="פרטים נוספים על האירוע..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סוג משחק
              </label>
              <select
                value={formData.gameType}
                onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">בחר סוג</option>
                <option value="כדורגל">כדורגל</option>
                <option value="כדורסל">כדורסל</option>
                <option value="כדורעף">כדורעף</option>
                <option value="אחר">אחר</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מיקום
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="אולם ספורט / מגרש..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תאריך ושעת התחלה *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תאריך ושעת סיום
              </label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">הגדרות כמות</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מספר מקומות כולל *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מקסימום מקומות לנרשם *
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.maxSpotsPerPerson}
                onChange={(e) => setFormData({ ...formData, maxSpotsPerPerson: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <FieldBuilder
            fields={formData.fieldsSchema}
            onChange={(fields) => setFormData({ ...formData, fieldsSchema: fields })}
          />
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">תנאים והגבלות</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תנאי השתתפות
            </label>
            <textarea
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="תנאים מיוחדים, הגבלות גיל, דרישות..."
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requireAcceptance}
              onChange={(e) => setFormData({ ...formData, requireAcceptance: e.target.checked })}
              className="rounded"
            />
            דרוש אישור תנאי השתתפות בעת ההרשמה
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'יוצר אירוע...' : 'צור אירוע'}
          </button>
        </div>
      </form>
    </div>
  )
}