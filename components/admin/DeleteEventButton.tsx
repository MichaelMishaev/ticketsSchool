'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
  confirmedCount: number
  waitlistCount: number
}

export default function DeleteEventButton({
  eventId,
  eventTitle,
  confirmedCount,
  waitlistCount,
}: DeleteEventButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/events')
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה במחיקת האירוע')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('שגיאה במחיקת האירוע')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        data-testid="delete-event-button"
      >
        <Trash2 className="w-4 h-4" />
        <span>מחק אירוע</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">מחיקת אירוע</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={isDeleting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-900 mb-2">{eventTitle}</h3>
              <div className="space-y-1 text-sm text-red-800">
                <p>
                  <span className="font-medium">הרשמות מאושרות:</span> {confirmedCount}
                </p>
                <p>
                  <span className="font-medium">רשימת המתנה:</span> {waitlistCount}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-2 font-medium">
              ⚠️ פעולה זו תבטל את כל ההרשמות ותסתיר את האירוע
            </p>
            <p className="text-gray-600 text-sm mb-4">
              כל הנרשמים יקבלו סטטוס &quot;בוטל&quot; עם הסיבה: &quot;אירוע בוטל על ידי המארגן&quot;
            </p>
            <p className="text-gray-500 text-xs mb-4">
              💾 הנתונים נשמרים במערכת ולא נמחקים לצמיתות
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                data-testid="confirm-delete-event-button"
              >
                {isDeleting ? 'מוחק...' : 'מחק אירוע'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
