'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Trash2,
  UserCheck,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Edit,
  X,
  Ban,
  Link2,
  Building2,
  Info,
  Loader2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import CheckInLinkSection from '@/components/admin/CheckInLinkSection'
import { Button } from '@/components/ui/Button'
import {
  typography,
  badgeVariants,
  iconButton,
  statusDots,
  inputVariants,
} from '@/lib/design-tokens'

// Helper function to convert Israeli phone to WhatsApp URL
function formatWhatsAppUrl(phone: string | undefined): string | null {
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

interface FieldSchema {
  id: string
  label: string
  type: string
  required?: boolean
}

interface Registration {
  id: string
  data: Record<string, unknown>
  spotsCount: number
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
  confirmationCode: string
  phoneNumber?: string
  email?: string
  createdAt: string
}

interface Event {
  id: string
  slug: string
  title: string
  description?: string
  gameType?: string
  location?: string
  startAt: string
  endAt?: string
  capacity: number
  totalCapacity?: number
  spotsReserved: number
  status: string
  maxSpotsPerPerson: number
  fieldsSchema: FieldSchema[]
  conditions?: string
  requireAcceptance: boolean
  registrations: Registration[]
  school?: {
    id: string
    name: string
    slug: string
  }
}

export default function EventManagementPageImproved() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'>(
    'all'
  )
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [cancelModal, setCancelModal] = useState<{ show: boolean; registrationId: string | null }>({
    show: false,
    registrationId: null,
  })
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; registrationId: string | null }>({
    show: false,
    registrationId: null,
  })
  const [cancelReason, setCancelReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        handleExportCSV()
      }
      if (e.key === 'Escape' && searchTerm) {
        setSearchInput('')
        setSearchTerm('')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const handleStatusChange = async (newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        showSuccess('סטטוס האירוע עודכן בהצלחה')
        fetchEvent()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePromoteToConfirmed = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (response.ok) {
        showSuccess('ההרשמה אושרה בהצלחה')
        fetchEvent()
      }
    } catch (error) {
      console.error('Error promoting registration:', error)
    }
  }

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
        fetchEvent()
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

  const handleDeleteRegistration = (registrationId: string) => {
    setDeleteModal({ show: true, registrationId })
  }

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
        fetchEvent()
        setDeleteModal({ show: false, registrationId: null })
      }
    } catch (error) {
      console.error('Error deleting registration:', error)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `event_${event?.slug}_registrations.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess('הקובץ יוצא בהצלחה')
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/p/${event?.school?.slug}/${event?.slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-base text-gray-600">טוען פרטי אירוע...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className={typography.h3}>האירוע לא נמצא</h2>
      </div>
    )
  }

  const filteredRegistrations = event.registrations.filter((reg) => {
    const matchesSearch =
      searchTerm === '' ||
      JSON.stringify(reg.data).toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phoneNumber?.includes(searchTerm) ||
      reg.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || reg.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const confirmedCount = event.registrations
    .filter((r) => r.status === 'CONFIRMED')
    .reduce((sum, r) => sum + r.spotsCount, 0)
  const waitlistCount = event.registrations
    .filter((r) => r.status === 'WAITLIST')
    .reduce((sum, r) => sum + r.spotsCount, 0)
  const totalCapacity = event.totalCapacity || event.capacity
  const spotsLeft = totalCapacity - confirmedCount

  const getFieldLabel = (fieldKey: string): string => {
    if (!event?.fieldsSchema) return fieldKey

    if (fieldKey.startsWith('field_')) {
      const field = event.fieldsSchema.find((f: FieldSchema) => f.id === fieldKey)
      return field?.label || fieldKey
    }

    const commonFields: Record<string, string> = {
      name: 'שם',
      phone: 'טלפון',
      email: 'אימייל',
      spotsCount: 'מספר מקומות',
      message: 'הודעה',
      notes: 'הערות',
    }

    return commonFields[fieldKey] || fieldKey
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_300ms_ease-out]">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* PRIMARY CTA: Registration Link */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-blue-900">קישור הרשמה לאירוע</h2>
        </div>
        <p className="text-sm text-blue-700 mb-4">שתף קישור זה עם המשתתפים כדי לאפשר להם להירשם</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-white rounded-lg border-2 border-blue-400 p-3 font-mono text-sm text-gray-900 font-medium break-all select-all">
            {`${window.location.origin}/p/${event?.school?.slug}/${event?.slug}`}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={copyLink}
            icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          >
            {copied ? 'הקישור הועתק!' : 'העתק קישור'}
          </Button>
        </div>
      </div>

      {/* Check-In Link Section */}
      <CheckInLinkSection eventId={eventId} />

      {/* Event Header */}
      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className={`${typography.h2} mb-4`}>{event.title}</h1>

            <div className="space-y-3 text-base text-gray-700">
              {event.school && (
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="text-base font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg border-2 border-purple-200">
                    {event.school.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {confirmedCount} / {totalCapacity} נרשמים
                </span>
                <span className="text-sm text-gray-600" data-testid="spots-reserved">
                  ({event.spotsReserved} תפוסים)
                </span>
              </div>
              {waitlistCount > 0 && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-700">{waitlistCount} ברשימת המתנה</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[300px] space-y-4">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="success"
                size="md"
                icon={<Edit className="w-5 h-5" />}
                onClick={() => router.push(`/admin/events/${eventId}/edit`)}
                fullWidth
              >
                ערוך אירוע
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<ExternalLink className="w-5 h-5" />}
                onClick={() => window.open(`/p/${event.school?.slug}/${event.slug}`, '_blank')}
                fullWidth
              >
                תצוגה מקדימה
              </Button>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<UserCheck className="w-5 h-5" />}
              onClick={() => router.push(`/admin/events/${eventId}/attendance`)}
              fullWidth
            >
              ניהול נוכחות
            </Button>

            {/* Status Control */}
            <div>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  מצבי הרשמה
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={statusDots.open}></div>
                    <span className="font-medium text-gray-900">פתוח:</span>
                    <span className="text-gray-700">משתמשים יכולים להירשם</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={statusDots.paused}></div>
                    <span className="font-medium text-gray-900">מושהה:</span>
                    <span className="text-gray-700">הרשמה חסומה זמנית</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={statusDots.closed}></div>
                    <span className="font-medium text-gray-900">סגור:</span>
                    <span className="text-gray-700">הרשמה חסומה לצמיתות</span>
                  </div>
                </div>
              </div>
              <select
                value={event.status}
                onChange={(e) => handleStatusChange(e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED')}
                disabled={isUpdating}
                className={inputVariants.default}
              >
                <option value="OPEN">✅ פתוח להרשמה</option>
                <option value="PAUSED">⏸️ מושהה זמנית</option>
                <option value="CLOSED">🔒 סגור</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-200">
        {searchTerm && searchTerm.length >= 5 && searchTerm.match(/^[A-Z0-9]+$/i) && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              מחפש לפי קוד אישור:{' '}
              <span className="font-mono font-bold">{searchTerm.toUpperCase()}</span>
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="חיפוש לפי שם, טלפון או קוד אישור..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${inputVariants.default} pr-10`}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                Ctrl
              </kbd>
              +
              <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                K
              </kbd>
              לחיפוש מהיר
            </div>
          </div>

          <select
            name="status"
            data-testid="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className={inputVariants.default}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="CONFIRMED">אושר</option>
            <option value="WAITLIST">רשימת המתנה</option>
            <option value="CANCELLED">בוטל</option>
          </select>

          <Button
            variant="success"
            size="md"
            icon={<Download className="w-5 h-5" />}
            onClick={handleExportCSV}
          >
            ייצוא לאקסל
          </Button>
        </div>
      </div>

      {/* Registrations - Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredRegistrations.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            onClearFilters={() => {
              setSearchInput('')
              setSearchTerm('')
              setFilterStatus('all')
            }}
            onCopyLink={copyLink}
          />
        ) : (
          filteredRegistrations.map((registration) => (
            <MobileRegistrationCard
              key={registration.id}
              registration={registration}
              searchTerm={searchTerm}
              spotsLeft={spotsLeft}
              onPromote={() => handlePromoteToConfirmed(registration.id)}
              onCancel={() => setCancelModal({ show: true, registrationId: registration.id })}
              onDelete={() => handleDeleteRegistration(registration.id)}
            />
          ))
        )}
      </div>

      {/* Registrations - Desktop Table */}
      <div className="hidden lg:block bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">נרשם</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  פרטי קשר
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">סטטוס</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      searchTerm={searchTerm}
                      filterStatus={filterStatus}
                      onClearFilters={() => {
                        setSearchInput('')
                        setSearchTerm('')
                        setFilterStatus('all')
                      }}
                      onCopyLink={copyLink}
                    />
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((registration) => (
                  <DesktopRegistrationRow
                    key={registration.id}
                    registration={registration}
                    spotsLeft={spotsLeft}
                    expandedRow={expandedRow}
                    onToggleExpand={() =>
                      setExpandedRow(expandedRow === registration.id ? null : registration.id)
                    }
                    onPromote={() => handlePromoteToConfirmed(registration.id)}
                    onCancel={() => setCancelModal({ show: true, registrationId: registration.id })}
                    onDelete={() => handleDeleteRegistration(registration.id)}
                    getFieldLabel={getFieldLabel}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-[fadeIn_200ms_ease-out]">
            <div className="flex justify-between items-center mb-4">
              <h2 className={typography.h3}>ביטול הרשמה</h2>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className={iconButton.ghost}
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-base text-gray-700 mb-4">
              האם לבטל הרשמה זו? ההרשמה תישמר במערכת אך תסומן כמבוטלת.
            </p>

            <div className="mb-6">
              <label htmlFor="cancelReason" className={`${typography.label} block mb-2`}>
                סיבת ביטול (אופציונלי)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className={inputVariants.default}
                placeholder="למשל: נרשם ביקש לבטל בטלפון"
              />
              <p className="text-xs text-gray-500 mt-2">הסיבה תישמר לצורך רישום ומעקב</p>
            </div>

            <div className="flex gap-3">
              <Button variant="warning" size="lg" onClick={handleCancelRegistration} fullWidth>
                בטל הרשמה
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                fullWidth
              >
                ביטול
              </Button>
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
              <Button variant="danger" size="lg" onClick={handleConfirmDelete} fullWidth>
                מחק לצמיתות
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setDeleteModal({ show: false, registrationId: null })}
                fullWidth
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components
function EmptyState({
  searchTerm,
  filterStatus,
  onClearFilters,
  onCopyLink,
}: {
  searchTerm: string
  filterStatus: string
  onClearFilters: () => void
  onCopyLink: () => void
}) {
  const hasFilters = searchTerm || filterStatus !== 'all'

  return (
    <div className="text-center py-12">
      {hasFilters ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gray-100 rounded-full">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">לא נמצאו תוצאות</h3>
            <p className="text-gray-600 mb-4">נסה לשנות את מילות החיפוש או הסינון</p>
            <Button variant="secondary" onClick={onClearFilters}>
              נקה סינונים
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">עדיין אין נרשמים לאירוע</h3>
            <p className="text-gray-600 mb-4">שתף את קישור ההרשמה כדי להתחיל לקבל נרשמים</p>
            <Button
              variant="primary"
              size="lg"
              icon={<Copy className="w-5 h-5" />}
              onClick={onCopyLink}
            >
              העתק קישור הרשמה
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function MobileRegistrationCard({
  registration,
  searchTerm,
  spotsLeft,
  onPromote,
  onCancel,
  onDelete,
}: {
  registration: Registration
  searchTerm: string
  spotsLeft: number
  onPromote: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const getRegistrationStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { variant: keyof typeof badgeVariants; text: string; dotClass: string }
    > = {
      CONFIRMED: { variant: 'success', text: 'אושר', dotClass: statusDots.confirmed },
      WAITLIST: { variant: 'warning', text: 'רשימת המתנה', dotClass: statusDots.waitlist },
      CANCELLED: { variant: 'error', text: 'בוטל', dotClass: statusDots.cancelled },
    }
    const { variant, text, dotClass } = statusMap[status] || statusMap.CANCELLED
    return (
      <span className={badgeVariants[variant]}>
        <div className={dotClass}></div>
        {text}
      </span>
    )
  }

  const phoneNumber = registration.phoneNumber || String(registration.data.phone || '')
  const whatsappUrl = formatWhatsAppUrl(phoneNumber)

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Status + Name + Number */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getRegistrationStatusBadge(registration.status)}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-gray-900">
              {String(registration.data.name || '')}
            </div>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-green-600 hover:text-green-700 hover:underline flex items-center gap-1.5 w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="w-4 h-4" />
                {phoneNumber}
              </a>
            ) : (
              <div className="text-base text-gray-600">{phoneNumber}</div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 font-bold text-lg rounded-full flex-shrink-0">
          {registration.spotsCount}
        </div>
      </div>

      {/* Single line: Code + Registration Date */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="text-base">
          <span className="text-gray-600">קוד: </span>
          <span
            className={`font-mono font-semibold ${searchTerm && registration.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-200 px-1 py-0.5 rounded' : 'text-gray-900'}`}
          >
            {registration.confirmationCode}
          </span>
        </div>
        <div className="text-base">
          <span className="text-gray-600">נרשם: </span>
          <span className="text-gray-900">
            {format(new Date(registration.createdAt), 'dd/MM/yyyy HH:mm')}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {registration.status === 'WAITLIST' && spotsLeft >= registration.spotsCount && (
          <button
            onClick={onPromote}
            className="flex-1 px-4 py-2.5 bg-green-50 text-green-700 border-2 border-green-200 rounded-lg hover:bg-green-100 active:scale-[0.98] transition-all font-medium text-sm"
          >
            <UserCheck className="w-5 h-5 inline ml-2" />
            אשר
          </button>
        )}
        {registration.status !== 'CANCELLED' && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-amber-50 text-amber-700 border-2 border-amber-200 rounded-lg hover:bg-amber-100 active:scale-[0.98] transition-all font-medium text-sm"
          >
            <Ban className="w-5 h-5 inline ml-2" />
            ביטול
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-4 py-2.5 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 active:scale-[0.98] transition-all min-w-[48px] flex items-center justify-center"
          aria-label="מחק"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function DesktopRegistrationRow({
  registration,
  spotsLeft,
  expandedRow,
  onToggleExpand,
  onPromote,
  onCancel,
  onDelete,
  getFieldLabel,
}: {
  registration: Registration
  spotsLeft: number
  expandedRow: string | null
  onToggleExpand: () => void
  onPromote: () => void
  onCancel: () => void
  onDelete: () => void
  getFieldLabel: (key: string) => string
}) {
  const getRegistrationStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { variant: keyof typeof badgeVariants; text: string; dotClass: string }
    > = {
      CONFIRMED: { variant: 'success', text: 'אושר', dotClass: statusDots.confirmed },
      WAITLIST: { variant: 'warning', text: 'רשימת המתנה', dotClass: statusDots.waitlist },
      CANCELLED: { variant: 'error', text: 'בוטל', dotClass: statusDots.cancelled },
    }
    const { variant, text, dotClass } = statusMap[status] || statusMap.CANCELLED
    return (
      <span className={badgeVariants[variant]}>
        <div className={dotClass}></div>
        {text}
      </span>
    )
  }

  const phoneNumber = registration.phoneNumber || String(registration.data.phone || '')
  const whatsappUrl = formatWhatsAppUrl(phoneNumber)

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={onToggleExpand}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-full">
              {registration.spotsCount}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {String(registration.data.name || '')}
              </div>
              <div className="text-sm text-gray-600 font-mono">{registration.confirmationCode}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm">
          <div className="space-y-1">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 hover:underline flex items-center gap-1.5 w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="w-4 h-4" />
                {phoneNumber}
              </a>
            ) : (
              <div className="text-gray-900">{phoneNumber}</div>
            )}
            {registration.email && <div className="text-gray-600">{registration.email}</div>}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="space-y-1">
            {getRegistrationStatusBadge(registration.status)}
            <div className="text-xs text-gray-600">
              {format(new Date(registration.createdAt), 'dd/MM HH:mm')}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {registration.status === 'WAITLIST' && spotsLeft >= registration.spotsCount && (
              <button
                onClick={onPromote}
                className={iconButton.success}
                title="אשר הרשמה"
                aria-label="אשר הרשמה"
              >
                <UserCheck className="w-5 h-5" />
              </button>
            )}
            {registration.status !== 'CANCELLED' && (
              <button
                onClick={onCancel}
                className={iconButton.warning}
                title="בטל הרשמה"
                aria-label="בטל הרשמה"
              >
                <Ban className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className={iconButton.danger}
              title="מחק לצמיתות"
              aria-label="מחק לצמיתות"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              className={iconButton.ghost}
              aria-label={expandedRow === registration.id ? 'סגור פרטים' : 'הצג פרטים'}
            >
              {expandedRow === registration.id ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </td>
      </tr>
      {expandedRow === registration.id && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-gray-50">
            <div className="space-y-2 text-sm">
              {Object.entries(registration.data).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <span className="font-medium text-gray-900 min-w-[120px]">
                    {getFieldLabel(key)}:
                  </span>
                  <span className="text-gray-700">{String(value)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

import React from 'react'
