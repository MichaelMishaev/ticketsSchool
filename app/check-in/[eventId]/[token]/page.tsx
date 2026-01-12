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
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'waitlist'>('confirmed')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Check if check-ins are allowed (only on event day)
  const isCheckInAllowed = () => {
    if (!event) return false

    const now = new Date()
    const eventDate = new Date(event.startAt)

    // Compare dates (ignore time)
    return (
      now.getFullYear() === eventDate.getFullYear() &&
      now.getMonth() === eventDate.getMonth() &&
      now.getDate() === eventDate.getDate()
    )
  }

  const getCheckInStatusMessage = () => {
    if (!event) return null

    const now = new Date()
    const eventDate = new Date(event.startAt)

    if (now < eventDate) {
      const daysUntil = Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        message: `האירוע מתחיל בעוד ${daysUntil} ${daysUntil === 1 ? 'יום' : 'ימים'}. עמוד הנוכחות יפתח ביום האירוע.`,
        type: 'info' as const
      }
    } else if (!isCheckInAllowed()) {
      return {
        message: 'האירוע הסתיים. לא ניתן לרשום נוכחות.',
        type: 'warning' as const
      }
    }

    return null
  }

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Handle QR code from URL parameter (when scanned with phone camera)
  useEffect(() => {
    if (!resolvedParams) return

    const urlParams = new URLSearchParams(window.location.search)
    const qrParam = urlParams.get('qr')

    if (qrParam) {
      // Auto-process QR code from URL
      handleQRScan(qrParam)

      // Remove qr parameter from URL to prevent re-processing
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('qr')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [resolvedParams])

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
      const errorMessage = (err instanceof Error ? err.message : "שגיאה") || 'שגיאה ברישום נוכחות'

      // Special handling for "Already checked in" - refresh silently without error toast
      if (errorMessage.includes('Already checked in') || errorMessage.includes('כבר נכח')) {
        // Just refresh to sync UI - don't show error since user is already checked in
        // Add small delay to ensure DB is consistent
        await new Promise(resolve => setTimeout(resolve, 100))
        await fetchData()
      } else {
        // Show error for other types of errors
        showToast(errorMessage, 'error')
        // Refresh data from server to sync UI with database state
        await fetchData()
      }
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

      // Refresh data from server to sync UI with database state
      await fetchData()
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
    // Registration status filter (FIRST PRIORITY - CONFIRMED vs WAITLIST)
    if (statusFilter === 'confirmed' && reg.status !== 'CONFIRMED') {
      return false
    } else if (statusFilter === 'waitlist' && reg.status !== 'WAITLIST') {
      return false
    }
    // statusFilter === 'all' means show both CONFIRMED and WAITLIST

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

    // Check-in status filter (checked in vs not checked in)
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
              disabled={!isCheckInAllowed()}
              className={`p-3 rounded-lg transition-colors shadow-md min-h-[48px] min-w-[48px] flex items-center justify-center ${
                isCheckInAllowed()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-label="סרוק QR"
            >
              <span className="text-2xl">📷</span>
            </button>
          </div>
        </div>
      </div>

      {/* Check-in Status Banner */}
      {getCheckInStatusMessage() && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div
            className={`rounded-lg p-4 text-center font-medium ${
              getCheckInStatusMessage()?.type === 'info'
                ? 'bg-blue-50 border-2 border-blue-200 text-blue-800'
                : 'bg-amber-50 border-2 border-amber-200 text-amber-800'
            }`}
            dir="rtl"
          >
            <div className="text-lg mb-1">
              {getCheckInStatusMessage()?.type === 'info' ? 'ℹ️' : '⚠️'}
            </div>
            <div>{getCheckInStatusMessage()?.message}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <CheckInStats
          eventId={resolvedParams.eventId}
          token={resolvedParams.token}
          initialStats={{
            total: registrations.filter(r => r.status === 'CONFIRMED').length,
            checkedIn: registrations.filter((r) => r.status === 'CONFIRMED' && r.checkIn && !r.checkIn.undoneAt).length,
            percentageCheckedIn: Math.round(
              (registrations.filter((r) => r.status === 'CONFIRMED' && r.checkIn && !r.checkIn.undoneAt).length /
                (registrations.filter(r => r.status === 'CONFIRMED').length || 1)) *
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

      {/* Registration Status Filter Tabs (NEW) */}
      <div className="max-w-4xl mx-auto px-4 pb-3" dir="rtl">
        <div className="bg-white rounded-lg p-2 border-2 border-gray-200">
          <div className="text-xs text-gray-600 font-medium mb-2 px-2">סינון לפי סטטוס:</div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ מאושרים ({registrations.filter(r => r.status === 'CONFIRMED').length})
            </button>
            <button
              onClick={() => setStatusFilter('waitlist')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'waitlist'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ רשימת המתנה ({registrations.filter(r => r.status === 'WAITLIST').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              הכל ({registrations.length})
            </button>
          </div>
        </div>
      </div>

      {/* Check-In Status Filter Tabs */}
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
              disabled={!isCheckInAllowed()}
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
