'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Download,
  Users as UsersIcon,
  UserCheck,
  Ban,
  Trash2,
  X,
  Check,
  ChevronDown,
  Wifi,
  WifiOff,
  Zap,
  MessageCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

// Helper function to convert Israeli phone to WhatsApp URL
function formatWhatsAppUrl(phone: string): string | null {
  if (!phone) return null

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')

  // Handle Israeli format: remove leading 0 and add country code 972
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1)
  } else if (!cleaned.startsWith('972')) {
    // If doesn't start with 972 and not with 0, assume it needs 972
    cleaned = '972' + cleaned
  }

  return `https://wa.me/${cleaned}`
}

interface Registration {
  id: string
  data: Record<string, any>
  phoneNumber: string
  spotsCount: number
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'PAYMENT_PENDING'
  confirmationCode: string
  createdAt: Date | string
}

interface LiveStats {
  confirmed: number
  waitlist: number
  cancelled: number
  paymentPending: number
}

interface StreamedRegistration {
  id: string
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'PAYMENT_PENDING'
  spotsCount: number
  phoneNumber: string
  data: Record<string, unknown>
  confirmationCode: string
  createdAt: string
}

interface RegistrationsTabProps {
  eventId: string
  registrations: Registration[]
  onRegistrationUpdate: () => void
  /**
   * Real-time stream props — owned by the parent (EventDetailsTabbed) so the
   * chime + document.title counter keep working when the admin is on a
   * different tab. This tab is a *consumer* of the stream, not the producer.
   */
  newRegistrations?: StreamedRegistration[]
  isConnected?: boolean
  liveStats?: LiveStats | null
}

export default function RegistrationsTab({
  eventId,
  registrations,
  onRegistrationUpdate,
  newRegistrations = [],
  isConnected = false,
}: RegistrationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'PAYMENT_PENDING'
  >('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ show: boolean; registrationId: string | null }>({
    show: false,
    registrationId: null,
  })
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; registrationId: string | null }>({
    show: false,
    registrationId: null,
  })
  const [cancelReason, setCancelReason] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [newRegistrationIds, setNewRegistrationIds] = useState<Set<string>>(new Set())

  // Format phone number for display (Israeli format: 050-123-4567)
  const formatPhoneDisplay = (phone: string): string => {
    if (!phone) return ''
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')

    // Handle Israeli format (10 digits starting with 0)
    if (digits.length === 10 && digits.startsWith('0')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    // Handle international format (+972 or 972)
    if (digits.length === 12 && digits.startsWith('972')) {
      return `0${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`
    }
    if (digits.length === 11 && digits.startsWith('972')) {
      return `0${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`
    }

    // Fallback: return as-is
    return phone
  }

  // Real-time stream now owned by the parent (EventDetailsTabbed) and passed
  // down as props — see the hoist in 2026-04-11 so the chime + title counter
  // work on every tab, not just this one. This tab only consumes
  // `newRegistrations` and `isConnected`; the `liveStats` counts are used by
  // OverviewTab's banner, not here — local `counts` (derived from the merged
  // list) stays the source of truth for the filter tabs below.

  // Merge new registrations with existing ones
  const allRegistrations = useMemo(() => {
    // Convert new registrations to match interface (createdAt from string to Date)
    const normalizedNew = newRegistrations.map((r) => ({
      ...r,
      createdAt: typeof r.createdAt === 'string' ? new Date(r.createdAt) : r.createdAt,
    }))

    // Track IDs of new registrations for highlighting
    const newIds = new Set(normalizedNew.map((r) => r.id))

    // Merge: new registrations first, then existing (avoiding duplicates)
    const existingIds = new Set(normalizedNew.map((r) => r.id))
    const uniqueExisting = registrations.filter((r) => !existingIds.has(r.id))

    return [...normalizedNew, ...uniqueExisting]
  }, [newRegistrations, registrations])

  // Show toast when new registration arrives
  useEffect(() => {
    if (newRegistrations.length > 0) {
      const latest = newRegistrations[0]
      const name = latest.data.studentName || latest.data.name || 'משתתף'
      showSuccess(`${name} נרשם זה עתה! 🎉`)

      // Add to highlight set
      setNewRegistrationIds((prev) => new Set([...prev, latest.id]))

      // Remove highlight after 10 seconds
      setTimeout(() => {
        setNewRegistrationIds((prev) => {
          const next = new Set(prev)
          next.delete(latest.id)
          return next
        })
      }, 10000)
    }
  }, [newRegistrations])

  // Filter registrations (use merged list)
  const filteredRegistrations = useMemo(() => {
    let filtered = allRegistrations

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((r) => {
        const name = r.data.studentName || r.data.name || ''
        const phone = r.phoneNumber || ''
        return (
          name.toLowerCase().includes(term) ||
          phone.includes(term) ||
          r.confirmationCode.toLowerCase().includes(term.toLowerCase())
        )
      })
    }

    // Sort: CONFIRMED, WAITLIST, PAYMENT_PENDING (needs attention), CANCELLED
    filtered = filtered.sort((a, b) => {
      const statusOrder = { CONFIRMED: 0, WAITLIST: 1, PAYMENT_PENDING: 2, CANCELLED: 3 }
      return statusOrder[a.status] - statusOrder[b.status]
    })

    return filtered
  }, [allRegistrations, filterStatus, searchTerm])

  // Count by status (use merged list) - Sum spotsCount for total people
  const counts = useMemo(() => {
    const confirmed = allRegistrations.filter((r) => r.status === 'CONFIRMED')
    const waitlist = allRegistrations.filter((r) => r.status === 'WAITLIST')
    const cancelled = allRegistrations.filter((r) => r.status === 'CANCELLED')
    const pending = allRegistrations.filter((r) => r.status === 'PAYMENT_PENDING')

    return {
      // "all" excludes PAYMENT_PENDING — they are not confirmed participants
      all: allRegistrations
        .filter((r) => r.status !== 'PAYMENT_PENDING')
        .reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      confirmed: confirmed.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      waitlist: waitlist.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      cancelled: cancelled.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      pending: pending.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
    }
  }, [allRegistrations])

  // NOTE: The document.title `(N⏳)` counter effect moved up to EventDetailsTabbed.
  // Previously lived here, but it was scoped to this tab — admins on the
  // Overview tab wouldn't see the badge. The parent now owns it.

  // Show success toast
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 5000) // Increased from 3s to 5s for SSE tests
  }

  // Listen for filter events from overview cards. The PAYMENT_PENDING banner
  // in OverviewTab dispatches with `status: 'PAYMENT_PENDING'` — the type
  // union here must include it or the banner click would be a no-op.
  useEffect(() => {
    const handleFilter = (event: Event) => {
      const customEvent = event as CustomEvent<{
        status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'PAYMENT_PENDING'
      }>
      if (customEvent.detail && customEvent.detail.status) {
        setFilterStatus(customEvent.detail.status)
      }
    }

    window.addEventListener('filterRegistrations', handleFilter)
    return () => window.removeEventListener('filterRegistrations', handleFilter)
  }, [])

  // Promote from waitlist
  const handlePromoteToConfirmed = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (response.ok) {
        showSuccess('ההרשמה אושרה בהצלחה')
        onRegistrationUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה באישור ההרשמה')
      }
    } catch (error) {
      console.error('Error promoting registration:', error)
      alert('שגיאה באישור ההרשמה')
    }
  }

  // Restore cancelled registration
  const handleRestoreCancelled = async (registrationId: string) => {
    try {
      // Try to restore as CONFIRMED first
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })

      if (response.ok) {
        showSuccess('ההרשמה שוחזרה בהצלחה ✅')
        onRegistrationUpdate()
      } else {
        const error = await response.json()

        // Check if error is due to capacity (supports both English and Hebrew messages)
        if (
          error.error &&
          (error.error.includes('Cannot promote') || error.error.includes('לא ניתן לאשר'))
        ) {
          // Event is full - offer to add to waitlist
          const addToWaitlist = confirm(
            `האירוע מלא! ${error.error}\n\nהאם להוסיף את ההרשמה לרשימת המתנה במקום?`
          )

          if (addToWaitlist) {
            // Add to waitlist instead
            const waitlistResponse = await fetch(
              `/api/events/${eventId}/registrations/${registrationId}`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'WAITLIST' }),
              }
            )

            if (waitlistResponse.ok) {
              showSuccess('ההרשמה נוספה לרשימת המתנה ⏳')
              onRegistrationUpdate()
            } else {
              alert('שגיאה בהוספה לרשימת המתנה')
            }
          }
        } else {
          alert(error.error || 'שגיאה בשחזור ההרשמה')
        }
      }
    } catch (error) {
      console.error('Error restoring registration:', error)
      alert('שגיאה בשחזור ההרשמה')
    }
  }

  // Cancel registration
  const handleCancelRegistration = async () => {
    if (!cancelModal.registrationId) return

    try {
      const response = await fetch(
        `/api/events/${eventId}/registrations/${cancelModal.registrationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'CANCELLED',
            cancellationReason: cancelReason.trim() || undefined,
          }),
        }
      )
      if (response.ok) {
        showSuccess('ההרשמה בוטלה בהצלחה')
        onRegistrationUpdate()
        setCancelModal({ show: false, registrationId: null })
        setCancelReason('')
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה בביטול ההרשמה')
      }
    } catch (error) {
      console.error('Error cancelling registration:', error)
      alert('שגיאה בביטול ההרשמה')
    }
  }

  // Delete registration
  const handleConfirmDelete = async () => {
    if (!deleteModal.registrationId) return

    try {
      const response = await fetch(
        `/api/events/${eventId}/registrations/${deleteModal.registrationId}`,
        {
          method: 'DELETE',
        }
      )
      if (response.ok) {
        showSuccess('ההרשמה נמחקה')
        onRegistrationUpdate()
        setDeleteModal({ show: false, registrationId: null })
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה במחיקת ההרשמה')
      }
    } catch (error) {
      console.error('Error deleting registration:', error)
      alert('שגיאה במחיקת ההרשמה')
    }
  }

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `event_registrations_${eventId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess('הקובץ יוצא בהצלחה')
      } else {
        alert('שגיאה בייצוא הקובץ')
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('שגיאה בייצוא הקובץ')
    }
  }

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-full shadow-sm ring-1 ring-green-200/50">
            <div className="w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full animate-pulse shadow-sm"></div>
            מאושר
          </span>
        )
      case 'WAITLIST':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-bold rounded-full shadow-sm ring-1 ring-amber-200/50">
            <div className="w-2 h-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full animate-pulse shadow-sm"></div>
            המתנה
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 text-xs font-bold rounded-full shadow-sm ring-1 ring-red-200/50">
            <div className="w-2 h-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-full shadow-sm"></div>
            בוטל
          </span>
        )
      case 'PAYMENT_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 text-xs font-bold rounded-full shadow-sm ring-1 ring-yellow-300/50">
            <div className="w-2 h-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full animate-pulse shadow-sm"></div>
            ממתין לתשלום
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-44 md:pb-6" dir="rtl">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-40 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_300ms_ease-out]">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Persistent pending-payment banner — clicking jumps to the filtered view.
          Auto-dismisses when counts.pending drops to 0 (after admin approves
          or registration auto-expires). */}
      {counts.pending > 0 && (
        <button
          type="button"
          onClick={() => setFilterStatus('PAYMENT_PENDING')}
          className="w-full mb-4 flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 border-2 border-amber-400 shadow-md hover:shadow-lg transition-all animate-pulse focus:outline-none focus:ring-4 focus:ring-amber-500/30"
          aria-label={`הצג ${counts.pending} הרשמות הממתינות לתשלום`}
        >
          <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
          <div className="flex-1 text-right">
            <p className="text-base font-bold text-amber-900">
              ⚠️ יש {counts.pending} הרשמות הממתינות לתשלום — נדרש אישור ידני
            </p>
            <p className="text-xs text-amber-800 mt-0.5">לחץ/י לסינון והצגת הרשימה</p>
          </div>
        </button>
      )}

      {/* Stats grid — 4 prominent cards at a glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
          <p className="text-xs text-gray-500 mt-0.5">{'סה"כ'}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{counts.confirmed}</p>
          <p className="text-xs text-green-600 mt-0.5">מאושרים</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.waitlist}</p>
          <p className="text-xs text-amber-600 mt-0.5">המתנה</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{counts.cancelled}</p>
          <p className="text-xs text-red-500 mt-0.5">בוטלו</p>
        </div>
      </div>

      {/* Header - Improved layout */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title section */}
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-gray-900">רשימת הרשמות</h2>

            {/* Real-time connection indicator - moved below title for better mobile layout */}
            <div
              className={`inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isConnected
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 animate-pulse" />
                  <span>עדכונים בזמן אמת</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>לא מחובר</span>
                </>
              )}
            </div>
          </div>

          {/* Export button - visible on all screen sizes */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>ייצוא לאקסל</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="חפש לפי שם, טלפון או קוד אישור..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              הכל ({counts.all})
            </button>
            <button
              onClick={() => setFilterStatus('CONFIRMED')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'CONFIRMED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              מאושרים ({counts.confirmed})
            </button>
            <button
              onClick={() => setFilterStatus('WAITLIST')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'WAITLIST'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              המתנה ({counts.waitlist})
            </button>
            {counts.pending > 0 && (
              <button
                onClick={() => setFilterStatus('PAYMENT_PENDING')}
                className={`px-4 py-2 rounded-lg font-bold transition-all animate-pulse ring-2 ring-amber-400/60 ${
                  filterStatus === 'PAYMENT_PENDING'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md'
                    : 'bg-gradient-to-r from-yellow-200 to-amber-200 text-amber-900 hover:from-yellow-300 hover:to-amber-300 border border-amber-400'
                }`}
              >
                ⚠️ ממתין לתשלום ({counts.pending})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Registrations list */}
      <div className="space-y-2">
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הרשמות</h3>
            <p className="text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'לא נמצאו תוצאות תואמות'
                : 'עדיין לא נרשמו משתתפים לאירוע'}
            </p>
          </div>
        ) : (
          filteredRegistrations.map((registration) => {
            const isNew = newRegistrationIds.has(registration.id)

            return (
              <div
                key={registration.id}
                data-testid="registration-row"
                className={`group relative bg-white rounded-xl transition-all duration-300 ease-out overflow-hidden ${
                  isNew
                    ? 'shadow-lg shadow-green-500/20 ring-2 ring-green-500 bg-gradient-to-br from-green-50 via-white to-white animate-[slideIn_500ms_ease-out]'
                    : expandedRow === registration.id
                      ? 'shadow-xl shadow-blue-500/10 ring-2 ring-blue-500'
                      : 'shadow-sm hover:shadow-lg border border-gray-200/80 hover:border-blue-300'
                }`}
              >
                {/* Accent bar - Left side gradient */}
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                    registration.status === 'CONFIRMED'
                      ? 'bg-gradient-to-b from-green-500 to-emerald-500'
                      : registration.status === 'WAITLIST'
                        ? 'bg-gradient-to-b from-amber-500 to-orange-500'
                        : registration.status === 'PAYMENT_PENDING'
                          ? 'bg-gradient-to-b from-yellow-400 to-amber-500'
                          : 'bg-gradient-to-b from-red-500 to-rose-500'
                  }`}
                />

                {/* Main row - Always visible */}
                <div
                  className="p-4 cursor-pointer select-none transition-all duration-200 hover:bg-gray-50/50 active:scale-[0.99]"
                  onClick={() =>
                    setExpandedRow(expandedRow === registration.id ? null : registration.id)
                  }
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-bold text-gray-900 text-base truncate leading-tight">
                            {registration.data.studentName || registration.data.name || 'לא צוין'}
                          </h3>
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full animate-pulse flex-shrink-0 shadow-sm">
                              <Zap className="w-3 h-3" />
                              חדש
                            </span>
                          )}
                        </div>
                        {getStatusBadge(registration.status)}
                      </div>

                      {/* Expand/Collapse Indicator */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedRow(expandedRow === registration.id ? null : registration.id)
                        }}
                        className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-xl transition-all duration-200 group-hover:bg-blue-50/50"
                        aria-label={expandedRow === registration.id ? 'סגור פרטים' : 'הצג פרטים'}
                      >
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all duration-300 ${
                            expandedRow === registration.id ? 'rotate-180 text-blue-600' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Compact Info - Always visible */}
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        {formatWhatsAppUrl(registration.phoneNumber) ? (
                          <a
                            href={formatWhatsAppUrl(registration.phoneNumber)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-green-600 font-semibold hover:text-green-700 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {formatPhoneDisplay(registration.phoneNumber)}
                            </span>
                          </a>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="font-semibold truncate">
                              {formatPhoneDisplay(registration.phoneNumber)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700 bg-blue-50 px-2.5 py-1.5 rounded-lg justify-end font-semibold">
                        <span className="text-base">👥</span>
                        <span>{registration.spotsCount} מקומות</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                          {registration.data.studentName || registration.data.name || 'לא צוין'}
                        </h3>
                        {getStatusBadge(registration.status)}

                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full animate-pulse shadow-sm">
                            <Zap className="w-3 h-3" />
                            חדש
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                          {formatWhatsAppUrl(registration.phoneNumber) ? (
                            <a
                              href={formatWhatsAppUrl(registration.phoneNumber)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-semibold transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{formatPhoneDisplay(registration.phoneNumber)}</span>
                            </a>
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-gray-700">
                                {formatPhoneDisplay(registration.phoneNumber)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg text-gray-700 font-semibold">
                          <span className="text-base">👥</span>
                          <span>{registration.spotsCount} מקומות</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1.5 rounded-lg text-gray-700 font-semibold">
                          <span className="text-base">🔑</span>
                          <span className="font-mono text-xs">{registration.confirmationCode}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 mt-2 font-medium">
                        {format(new Date(registration.createdAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>

                    {/* Expand button - Desktop only */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedRow(expandedRow === registration.id ? null : registration.id)
                      }}
                      className="hidden md:flex items-center justify-center p-2 hover:bg-blue-50 rounded-xl transition-all duration-200 group-hover:bg-blue-50/50"
                      aria-label={expandedRow === registration.id ? 'סגור פרטים' : 'הצג פרטים'}
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all duration-300 ${
                          expandedRow === registration.id ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Section - Inline with smooth animation */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    expandedRow === registration.id
                      ? 'max-h-[600px] opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  {expandedRow === registration.id && (
                    <div className="px-4 pb-4 bg-gradient-to-b from-blue-50/30 to-white border-t border-blue-200/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                        {/* Registration Details with proper Hebrew labels */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                            פרטי הרשמה
                          </h4>

                          {registration.data.studentName && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-500">שם התלמיד</span>
                              <span className="text-base text-gray-900">
                                {registration.data.studentName}
                              </span>
                            </div>
                          )}

                          {registration.data.parentName && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-500">שם ההורה</span>
                              <span className="text-base text-gray-900">
                                {registration.data.parentName}
                              </span>
                            </div>
                          )}

                          {registration.data.grade && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-500">כיתה</span>
                              <span className="text-base text-gray-900">
                                {registration.data.grade}
                              </span>
                            </div>
                          )}

                          {registration.data.email && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-500">דוא״ל</span>
                              <span className="text-base text-gray-900 font-mono text-sm">
                                {registration.data.email}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3">פרטים נוספים</h4>

                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-500">סטטוס</span>
                            <span className="text-base text-gray-900">
                              {registration.status === 'CONFIRMED'
                                ? 'מאושר'
                                : registration.status === 'WAITLIST'
                                  ? 'רשימת המתנה'
                                  : registration.status === 'PAYMENT_PENDING'
                                    ? 'ממתין לתשלום'
                                    : 'בוטל'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-500">תאריך הרשמה</span>
                            <span className="text-base text-gray-900">
                              {format(new Date(registration.createdAt), 'dd/MM/yyyy בשעה HH:mm')}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-500">קוד אישור</span>
                            <span className="text-base text-gray-900 font-mono font-bold bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-lg inline-block ring-1 ring-purple-200/50 shadow-sm">
                              {registration.confirmationCode}
                            </span>
                          </div>

                          {registration.data.notes && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-500">הערות</span>
                              <span className="text-base text-gray-900">
                                {registration.data.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Shown when expanded */}
                      <div className="mt-5 pt-5 border-t border-blue-200/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Promote from Waitlist */}
                          {registration.status === 'WAITLIST' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePromoteToConfirmed(registration.id)
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>אשר הרשמה</span>
                            </button>
                          )}

                          {/* Manual approval for pending payment (e.g. paid by phone/cash) */}
                          {registration.status === 'PAYMENT_PENDING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePromoteToConfirmed(registration.id)
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-amber-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>אישור ידני</span>
                            </button>
                          )}

                          {/* Restore Cancelled */}
                          {registration.status === 'CANCELLED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestoreCancelled(registration.id)
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>שחזר הרשמה</span>
                            </button>
                          )}

                          {/* Cancel Registration */}
                          {registration.status !== 'CANCELLED' &&
                            registration.status !== 'PAYMENT_PENDING' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCancelModal({ show: true, registrationId: registration.id })
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
                              >
                                <Ban className="w-4 h-4" />
                                <span>בטל הרשמה</span>
                              </button>
                            )}

                          {/* Delete Registration */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteModal({ show: true, registrationId: registration.id })
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-rose-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>מחק</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Results count */}
      {filteredRegistrations.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          מציג {filteredRegistrations.length} מתוך {allRegistrations.length} הרשמות
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-[fadeIn_200ms_ease-out]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">ביטול הרשמה</h2>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-base text-gray-700 mb-4">
              האם לבטל הרשמה זו? ההרשמה תישמר במערכת אך תסומן כמבוטלת.
            </p>

            <div className="mb-6">
              <label
                htmlFor="cancelReason"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                סיבת ביטול (אופציונלי)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-none"
                placeholder="למשל: נרשם ביקש לבטל בטלפון"
              />
              <p className="text-xs text-gray-500 mt-2">הסיבה תישמר לצורך רישום ומעקב</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelRegistration}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors focus:outline-none focus:ring-4 focus:ring-amber-500/20"
              >
                בטל הרשמה
              </button>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {deleteModal.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-[fadeIn_200ms_ease-out] relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 w-full text-right flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                מחיקת הרשמה
              </h2>
              <button
                onClick={() => setDeleteModal({ show: false, registrationId: null })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors absolute top-4 left-4"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-base text-gray-700 mb-6 text-right">
              האם למחוק הרשמה זו לצמיתות? <br />
              <span className="text-red-600 font-semibold mt-2 inline-block">
                פעולה זו אינה ניתנת לביטול.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-red-500/20"
              >
                מחק לצמיתות
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, registrationId: null })}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
