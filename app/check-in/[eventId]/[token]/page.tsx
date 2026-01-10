'use client'

import { useEffect, useState } from 'react'
import { CheckInStats } from '@/components/check-in/CheckInStats'
import { CheckInCard } from '@/components/check-in/CheckInCard'
import { QRScanner } from '@/components/check-in/QRScanner'
import { format } from 'date-fns'

interface Registration {
  id: string
  data: Record<string, unknown>
  spotsCount: number
  guestsCount: number
  status: string
  confirmationCode: string
  phoneNumber: string | null
  qrCode: string | null
  checkIn: {
    id: string
    checkedInAt: Date
    checkedInBy: string | null
    undoneAt: Date | null
  } | null
  banned?: {
    reason: string
    remainingGames: number | null
    expiresAt: Date | null
  } | null
}

interface Event {
  id: string
  title: string
  location: string | null
  startAt: Date
  endAt: Date | null
}

type FilterType = 'all' | 'checked-in' | 'not-checked-in'

export default function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string; token: string }>
}) {
  const [resolvedParams, setResolvedParams] = useState<{ eventId: string; token: string } | null>(
    null
  )
  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Fetch check-in data
  const fetchData = async () => {
    if (!resolvedParams) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/check-in/${resolvedParams.eventId}/${resolvedParams.token}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load check-in data')
      }

      const data = await response.json()
      setEvent(data.event)
      setRegistrations(data.registrations)
    } catch (err: unknown) {
      console.error('Error fetching check-in data:', err)
      setError((err instanceof Error ? err.message : "שגיאה") || 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedParams) {
      fetchData()
    }
  }, [resolvedParams])

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Check in a registration
  const handleCheckIn = async (registrationId: string) => {
    if (!resolvedParams) return

    setLoadingId(registrationId)

    try {
      const response = await fetch(
        `/api/check-in/${resolvedParams.eventId}/${resolvedParams.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check in')
      }

      const data = await response.json()

      // Update registration optimistically
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === registrationId
            ? {
                ...reg,
                checkIn: {
                  id: data.checkIn.id,
                  checkedInAt: data.checkIn.checkedInAt,
                  checkedInBy: data.checkIn.checkedInBy,
                  undoneAt: null,
                },
              }
            : reg
        )
      )

      showToast('נוכחות נרשמה בהצלחה!', 'success')
    } catch (err: unknown) {
      console.error('Error checking in:', err)
      showToast((err instanceof Error ? err.message : "שגיאה") || 'שגיאה ברישום נוכחות', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  // Undo check-in
  const handleUndo = async (registrationId: string) => {
    if (!resolvedParams) return

    setLoadingId(registrationId)

    try {
      const response = await fetch(
        `/api/check-in/${resolvedParams.eventId}/${resolvedParams.token}/${registrationId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to undo check-in')
      }

      // Update registration optimistically
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === registrationId
            ? {
                ...reg,
                checkIn: reg.checkIn
                  ? {
                      ...reg.checkIn,
                      undoneAt: new Date(),
                    }
                  : null,
              }
            : reg
        )
      )

      showToast('נוכחות בוטלה בהצלחה', 'success')
    } catch (err: unknown) {
      console.error('Error undoing check-in:', err)
      showToast((err instanceof Error ? err.message : "שגיאה") || 'שגיאה בביטול נוכחות', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  // Handle QR scan
  const handleQRScan = async (qrCode: string) => {
    if (!resolvedParams) return

    try {
      const response = await fetch(
        `/api/check-in/${resolvedParams.eventId}/${resolvedParams.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid QR code')
      }

      const data = await response.json()

      // Fetch fresh data to update UI
      await fetchData()

      showToast('נוכחות נרשמה בהצלחה מקוד QR!', 'success')
    } catch (err: unknown) {
      console.error('Error processing QR code:', err)
      showToast((err instanceof Error ? err.message : "שגיאה") || 'קוד QR לא תקין', 'error')
    }
  }

  // Filter registrations
  const filteredRegistrations = registrations.filter((reg) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const dataName = reg.data && typeof reg.data === 'object' && 'name' in reg.data ? reg.data.name : ''
      const name = typeof dataName === 'string' ? dataName.toLowerCase() : ''
      const dataChildName = reg.data && typeof reg.data === 'object' && 'childName' in reg.data ? reg.data.childName : ''
      const childName = typeof dataChildName === 'string' ? dataChildName.toLowerCase() : ''
      const phone = reg.phoneNumber || ''
      const code = reg.confirmationCode?.toLowerCase() || ''

      if (
        !name.includes(query) &&
        !childName.includes(query) &&
        !phone.includes(query) &&
        !code.includes(query)
      ) {
        return false
      }
    }

    // Status filter
    const isCheckedIn = reg.checkIn && !reg.checkIn.undoneAt

    if (filterType === 'checked-in') {
      return isCheckedIn
    } else if (filterType === 'not-checked-in') {
      return !isCheckedIn
    }

    return true
  })

  if (!resolvedParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center" dir="rtl">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-gray-600">טוען נתוני נוכחות...</div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md text-center" dir="rtl">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="text-red-800 font-medium mb-2">שגיאה</div>
          <div className="text-red-700 text-sm">{error || 'אירוע לא נמצא'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-medium animate-fade-in-out`}
          dir="rtl"
        >
          {toast.message}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleQRScan} />

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4" dir="rtl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
              {event.location && <div className="text-sm text-gray-600">📍 {event.location}</div>}
              <div className="text-xs text-gray-500 mt-1">
                {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-md min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="סרוק QR"
            >
              <span className="text-2xl">📷</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <CheckInStats
          eventId={resolvedParams.eventId}
          token={resolvedParams.token}
          initialStats={{
            total: registrations.length,
            checkedIn: registrations.filter((r) => r.checkIn && !r.checkIn.undoneAt).length,
            percentageCheckedIn: Math.round(
              (registrations.filter((r) => r.checkIn && !r.checkIn.undoneAt).length /
                registrations.length) *
                100
            ),
          }}
        />
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 pb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או קוד אישור..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
          dir="rtl"
        />
      </div>

      {/* Filter Tabs */}
      <div className="max-w-4xl mx-auto px-4 pb-4" dir="rtl">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            הכל ({registrations.length})
          </button>
          <button
            onClick={() => setFilterType('checked-in')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filterType === 'checked-in'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            הגיעו ✅ ({registrations.filter((r) => r.checkIn && !r.checkIn.undoneAt).length})
          </button>
          <button
            onClick={() => setFilterType('not-checked-in')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filterType === 'not-checked-in'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            לא הגיעו ⏳ ({registrations.filter((r) => !r.checkIn || r.checkIn.undoneAt).length})
          </button>
        </div>
      </div>

      {/* Registration List */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12 text-gray-500" dir="rtl">
            <div className="text-4xl mb-3">🔍</div>
            <div>לא נמצאו תוצאות</div>
          </div>
        ) : (
          filteredRegistrations.map((registration) => (
            <CheckInCard
              key={registration.id}
              registration={registration}
              onCheckIn={handleCheckIn}
              onUndo={handleUndo}
              loading={loadingId === registration.id}
            />
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          90% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
