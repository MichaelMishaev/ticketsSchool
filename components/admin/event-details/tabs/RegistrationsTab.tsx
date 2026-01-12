'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Download, Users as UsersIcon, UserCheck, Ban, Trash2, X, Check, ChevronDown, ChevronUp, Wifi, WifiOff, Zap, FileDown, MessageCircle, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { useEventStream } from '@/hooks/useEventStream'
import MobileBottomSheet from '../MobileBottomSheet'
import FloatingActionButton from '../FloatingActionButton'

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
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
  confirmationCode: string
  createdAt: Date | string
}

interface RegistrationsTabProps {
  eventId: string
  registrations: Registration[]
  onRegistrationUpdate: () => void
}

export default function RegistrationsTab({
  eventId,
  registrations,
  onRegistrationUpdate,
}: RegistrationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'>('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ show: boolean; registrationId: string | null }>({ show: false, registrationId: null })
  const [cancelReason, setCancelReason] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [newRegistrationIds, setNewRegistrationIds] = useState<Set<string>>(new Set())
  const [mobileActionsSheet, setMobileActionsSheet] = useState<{ show: boolean; registration: Registration | null }>({ show: false, registration: null })

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

  // Real-time updates via SSE
  const { newRegistrations, isConnected, stats } = useEventStream(eventId, true)

  // Merge new registrations with existing ones
  const allRegistrations = useMemo(() => {
    // Convert new registrations to match interface (createdAt from string to Date)
    const normalizedNew = newRegistrations.map(r => ({
      ...r,
      createdAt: typeof r.createdAt === 'string' ? new Date(r.createdAt) : r.createdAt
    }))

    // Track IDs of new registrations for highlighting
    const newIds = new Set(normalizedNew.map(r => r.id))

    // Merge: new registrations first, then existing (avoiding duplicates)
    const existingIds = new Set(normalizedNew.map(r => r.id))
    const uniqueExisting = registrations.filter(r => !existingIds.has(r.id))

    return [...normalizedNew, ...uniqueExisting]
  }, [newRegistrations, registrations])

  // Show toast when new registration arrives
  useEffect(() => {
    if (newRegistrations.length > 0) {
      const latest = newRegistrations[0]
      const name = latest.data.studentName || latest.data.name || 'משתתף'
      showSuccess(`${name} נרשם זה עתה! 🎉`)

      // Add to highlight set
      setNewRegistrationIds(prev => new Set([...prev, latest.id]))

      // Remove highlight after 10 seconds
      setTimeout(() => {
        setNewRegistrationIds(prev => {
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
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r => {
        const name = r.data.studentName || r.data.name || ''
        const phone = r.phoneNumber || ''
        return name.toLowerCase().includes(term) || phone.includes(term) || r.confirmationCode.toLowerCase().includes(term.toLowerCase())
      })
    }

    // Sort: CONFIRMED first, then WAITLIST, then CANCELLED
    filtered = filtered.sort((a, b) => {
      const statusOrder = { CONFIRMED: 1, WAITLIST: 2, CANCELLED: 3 }
      return statusOrder[a.status] - statusOrder[b.status]
    })

    return filtered
  }, [allRegistrations, filterStatus, searchTerm])

  // Count by status (use merged list) - Sum spotsCount for total people
  const counts = useMemo(() => {
    const confirmed = allRegistrations.filter(r => r.status === 'CONFIRMED')
    const waitlist = allRegistrations.filter(r => r.status === 'WAITLIST')
    const cancelled = allRegistrations.filter(r => r.status === 'CANCELLED')

    return {
      all: allRegistrations.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      confirmed: confirmed.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      waitlist: waitlist.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
      cancelled: cancelled.reduce((sum, r) => sum + (r.spotsCount || 0), 0),
    }
  }, [allRegistrations])

  // Show success toast
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 5000) // Increased from 3s to 5s for SSE tests
  }

  // Listen for filter events from overview cards
  useEffect(() => {
    const handleFilter = (event: Event) => {
      const customEvent = event as CustomEvent<{ status: 'CONFIRMED' | 'WAITLIST' }>
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
        body: JSON.stringify({ status: 'CONFIRMED' })
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
        body: JSON.stringify({ status: 'CONFIRMED' })
      })

      if (response.ok) {
        showSuccess('ההרשמה שוחזרה בהצלחה ✅')
        onRegistrationUpdate()
      } else {
        const error = await response.json()

        // Check if error is due to capacity
        if (error.error && error.error.includes('Cannot promote')) {
          // Event is full - offer to add to waitlist
          const addToWaitlist = confirm(
            `האירוע מלא! ${error.error}\n\nהאם להוסיף את ההרשמה לרשימת המתנה במקום?`
          )

          if (addToWaitlist) {
            // Add to waitlist instead
            const waitlistResponse = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'WAITLIST' })
            })

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
      const response = await fetch(`/api/events/${eventId}/registrations/${cancelModal.registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: cancelReason.trim() || undefined
        })
      })
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
  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('האם למחוק הרשמה זו לצמיתות? פעולה זו אינה ניתנת לביטול.')) return

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        showSuccess('ההרשמה נמחקה')
        onRegistrationUpdate()
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            מאושר
          </span>
        )
      case 'WAITLIST':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            המתנה
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            בוטל
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir="rtl">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_300ms_ease-out]">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header - Improved layout */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title section */}
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-gray-900">רשימת הרשמות</h2>

            {/* Real-time connection indicator - moved below title for better mobile layout */}
            <div className={`inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isConnected
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
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

          {/* Export button - hidden on mobile, FAB shows instead */}
          <button
            onClick={handleExportCSV}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-sm"
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
          </div>
        </div>
      </div>

      {/* Registrations list */}
      <div className="space-y-3">
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
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  isNew
                    ? 'border-green-500 bg-green-50 animate-[slideIn_500ms_ease-out]'
                    : 'border-gray-200'
                }`}
              >
                {/* Main row */}
                <div
                  className="p-4 hover:bg-gray-50 transition-colors md:cursor-default cursor-pointer active:bg-gray-100 md:active:bg-gray-50"
                  onClick={() => {
                    // On mobile, tap opens bottom sheet
                    if (window.innerWidth < 768) {
                      setMobileActionsSheet({ show: true, registration })
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {registration.data.studentName || registration.data.name || 'לא צוין'}
                        </h3>
                        {getStatusBadge(registration.status)}

                        {/* NEW badge for recently arrived registrations */}
                        {isNew && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full animate-pulse">
                            <Zap className="w-3 h-3" />
                            חדש
                          </span>
                        )}
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        {formatWhatsAppUrl(registration.phoneNumber) ? (
                          <a
                            href={formatWhatsAppUrl(registration.phoneNumber)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:underline font-medium"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {formatPhoneDisplay(registration.phoneNumber)}
                          </a>
                        ) : (
                          <>
                            <span>📞</span>
                            <span className="font-medium">{formatPhoneDisplay(registration.phoneNumber)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>👥</span>
                        <span>{registration.spotsCount} מקומות</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>🔑</span>
                        <span className="font-mono">{registration.confirmationCode}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      נרשם: {format(new Date(registration.createdAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>

                  {/* Action buttons - Desktop only */}
                  <div className="hidden md:flex items-center gap-2 mr-4">
                    <button
                      onClick={() => setExpandedRow(expandedRow === registration.id ? null : registration.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={expandedRow === registration.id ? "סגור פרטים" : "הצג פרטים"}
                    >
                      {expandedRow === registration.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>

                    {registration.status === 'WAITLIST' && (
                      <button
                        onClick={() => handlePromoteToConfirmed(registration.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="אשר הרשמה"
                        aria-label="אשר הרשמה"
                      >
                        <UserCheck className="w-5 h-5" />
                      </button>
                    )}

                    {registration.status === 'CANCELLED' && (
                      <button
                        onClick={() => handleRestoreCancelled(registration.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="שחזר הרשמה מבוטלת"
                        aria-label="שחזר הרשמה"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    )}

                    {registration.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setCancelModal({ show: true, registrationId: registration.id })}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="בטל הרשמה"
                        aria-label="בטל הרשמה"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteRegistration(registration.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק לצמיתות"
                      aria-label="מחק לצמיתות"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedRow === registration.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {/* Registration Details with proper Hebrew labels */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">פרטי הרשמה</h4>

                      {registration.data.studentName && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-500">שם התלמיד</span>
                          <span className="text-base text-gray-900">{registration.data.studentName}</span>
                        </div>
                      )}

                      {registration.data.parentName && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-500">שם ההורה</span>
                          <span className="text-base text-gray-900">{registration.data.parentName}</span>
                        </div>
                      )}

                      {registration.data.grade && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-500">כיתה</span>
                          <span className="text-base text-gray-900">{registration.data.grade}</span>
                        </div>
                      )}

                      {registration.data.email && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-500">דוא״ל</span>
                          <span className="text-base text-gray-900 font-mono text-sm">{registration.data.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">פרטים נוספים</h4>

                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-500">סטטוס</span>
                        <span className="text-base text-gray-900">
                          {registration.status === 'CONFIRMED' ? 'מאושר' :
                           registration.status === 'WAITLIST' ? 'רשימת המתנה' : 'בוטל'}
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
                        <span className="text-base text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded inline-block">
                          {registration.confirmationCode}
                        </span>
                      </div>

                      {registration.data.notes && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-500">הערות</span>
                          <span className="text-base text-gray-900">{registration.data.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
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
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-900 mb-2">
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
              <p className="text-xs text-gray-500 mt-2">
                הסיבה תישמר לצורך רישום ומעקב
              </p>
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

      {/* Mobile Bottom Sheet for Actions */}
      <MobileBottomSheet
        isOpen={mobileActionsSheet.show}
        onClose={() => setMobileActionsSheet({ show: false, registration: null })}
        title={mobileActionsSheet.registration ? (mobileActionsSheet.registration.data.studentName || mobileActionsSheet.registration.data.name || 'פעולות') : 'פעולות'}
      >
        {mobileActionsSheet.registration && (
          <div className="space-y-3">
            {/* Registration Details */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  {mobileActionsSheet.registration.data.studentName || mobileActionsSheet.registration.data.name}
                </h3>
                {getStatusBadge(mobileActionsSheet.registration.status)}
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium">
                  {formatWhatsAppUrl(mobileActionsSheet.registration.phoneNumber) ? (
                    <a
                      href={formatWhatsAppUrl(mobileActionsSheet.registration.phoneNumber)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {formatPhoneDisplay(mobileActionsSheet.registration.phoneNumber)}
                    </a>
                  ) : (
                    <>📞 {formatPhoneDisplay(mobileActionsSheet.registration.phoneNumber)}</>
                  )}
                </p>
                <p>👥 {mobileActionsSheet.registration.spotsCount} מקומות</p>
                <p className="font-mono">🔑 {mobileActionsSheet.registration.confirmationCode}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* View Details */}
              <button
                onClick={() => {
                  setExpandedRow(
                    expandedRow === mobileActionsSheet.registration?.id
                      ? null
                      : mobileActionsSheet.registration?.id || null
                  )
                  setMobileActionsSheet({ show: false, registration: null })
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-right bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {expandedRow === mobileActionsSheet.registration?.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
                <span className="font-medium text-gray-900">
                  {expandedRow === mobileActionsSheet.registration?.id ? 'הסתר פרטים' : 'הצג פרטים מלאים'}
                </span>
              </button>

              {/* Promote from Waitlist */}
              {mobileActionsSheet.registration.status === 'WAITLIST' && (
                <button
                  onClick={() => {
                    if (mobileActionsSheet.registration) {
                      handlePromoteToConfirmed(mobileActionsSheet.registration.id)
                      setMobileActionsSheet({ show: false, registration: null })
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-right bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">אשר הרשמה</span>
                </button>
              )}

              {/* Restore Cancelled Registration */}
              {mobileActionsSheet.registration.status === 'CANCELLED' && (
                <button
                  onClick={() => {
                    if (mobileActionsSheet.registration) {
                      handleRestoreCancelled(mobileActionsSheet.registration.id)
                      setMobileActionsSheet({ show: false, registration: null })
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-right bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">שחזר הרשמה</span>
                </button>
              )}

              {/* Cancel Registration */}
              {mobileActionsSheet.registration.status !== 'CANCELLED' && (
                <button
                  onClick={() => {
                    if (mobileActionsSheet.registration) {
                      setCancelModal({ show: true, registrationId: mobileActionsSheet.registration.id })
                      setMobileActionsSheet({ show: false, registration: null })
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-right bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Ban className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-700">בטל הרשמה</span>
                </button>
              )}

              {/* Delete Registration */}
              <button
                onClick={() => {
                  if (mobileActionsSheet.registration) {
                    handleDeleteRegistration(mobileActionsSheet.registration.id)
                    setMobileActionsSheet({ show: false, registration: null })
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-right bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-700">מחק לצמיתות</span>
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>

      {/* FAB for Mobile */}
      <FloatingActionButton
        icon={FileDown}
        label="ייצוא"
        onClick={handleExportCSV}
        variant="success"
      />

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
