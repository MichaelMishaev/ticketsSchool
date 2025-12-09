'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TableCard from './TableCard'
import { X, Plus } from 'lucide-react'
import Link from 'next/link'

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
  const [togglingHold, setTogglingHold] = useState(false)

  const handleToggleHold = async (tableId: string) => {
    setTogglingHold(true)

    try {
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const newStatus = table.status === 'INACTIVE' ? 'AVAILABLE' : 'INACTIVE'

      const response = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        router.refresh() // Refresh server component data
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        alert(error.error || 'שגיאה בעדכון סטטוס שולחן')
      }
    } catch (error) {
      console.error('Error toggling hold:', error)
      alert('שגיאה בעדכון סטטוס שולחן')
    } finally {
      setTogglingHold(false)
    }
  }

  const handleCancelReservation = async () => {
    if (!cancelModal.registrationId) return

    setCancelling(true)

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${cancelModal.registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Explicitly include cookies
        body: JSON.stringify({
          status: 'WAITLIST', // Move to waitlist instead of cancelling
          cancellationReason: cancelReason.trim() || undefined,
          moveToWaitlist: true, // Flag to indicate this was removed from table
          removedFromTable: true // Add metadata to registration
        })
      })

      if (response.ok) {
        setCancelModal({ show: false, registrationId: null })
        setCancelReason('')
        router.refresh() // Refresh server component data
      } else {
        const error = await response.json()
        console.error('API Error:', error)

        // If unauthorized, redirect to login
        if (response.status === 401) {
          alert('הפג תוקף ההתחברות. אנא התחבר מחדש.')
          window.location.href = '/admin/login'
          return
        }

        alert(error.error || 'שגיאה בהעברה לרשימת המתנה')
      }
    } catch (error) {
      console.error('Error moving to waitlist:', error)
      alert('שגיאה בהעברה לרשימת המתנה')
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
            onToggleHold={handleToggleHold}
            readOnly={false}
          />
        ))}

        {/* Add Table Card */}
        <Link
          href={`/admin/events/${eventId}/edit`}
          className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] group"
          dir="rtl"
        >
          <div className="w-12 h-12 bg-blue-500 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900 group-hover:text-blue-950 transition-colors">
              הוסף שולחן
            </div>
            <div className="text-sm text-blue-700 mt-1">
              לחץ להוספת שולחן חדש
            </div>
          </div>
        </Link>
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
              האם להסיר הזמנה זו משולחן זה? האורחים יועברו לרשימת ההמתנה והשולחן ישוחרר.
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
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'מעביר לרשימת המתנה...' : 'העבר לרשימת המתנה'}
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
