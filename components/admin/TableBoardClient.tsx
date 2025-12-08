'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TableCard from './TableCard'
import { X } from 'lucide-react'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  hasWaitlistMatch: boolean
  reservation?: {
    id: string
    confirmationCode: string
    guestsCount: number | null
    phoneNumber: string | null
    data: any
  } | null
}

interface TableBoardClientProps {
  tables: Table[]
  eventId: string
}

export default function TableBoardClient({ tables, eventId }: TableBoardClientProps) {
  const router = useRouter()
  const [cancelModal, setCancelModal] = useState<{ show: boolean; registrationId: string | null }>({
    show: false,
    registrationId: null
  })
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const handleCancelReservation = async () => {
    if (!cancelModal.registrationId) return

    setCancelling(true)

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${cancelModal.registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: cancelReason.trim() || undefined
        })
      })

      if (response.ok) {
        setCancelModal({ show: false, registrationId: null })
        setCancelReason('')
        router.refresh() // Refresh server component data
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה בביטול ההזמנה')
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      alert('שגיאה בביטול ההזמנה')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            hasWaitlistMatch={table.hasWaitlistMatch}
            onCancel={(reservationId) => {
              setCancelModal({ show: true, registrationId: reservationId })
            }}
            readOnly={false}
          />
        ))}
      </div>

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">ביטול הזמנת שולחן</h2>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={cancelling}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              האם לבטל הזמנה זו? השולחן ישוחרר ויהפוך להיות זמין לאורחים אחרים.
            </p>

            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                סיבת ביטול (אופציונלי)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                disabled={cancelling}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
                placeholder="למשל: נרשם ביקש לבטל בטלפון"
              />
              <p className="text-xs text-gray-500 mt-1">
                הסיבה תישמר לצורך רישום ומעקב
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelReservation}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'מבטל...' : 'בטל הזמנה'}
              </button>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                disabled={cancelling}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
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
