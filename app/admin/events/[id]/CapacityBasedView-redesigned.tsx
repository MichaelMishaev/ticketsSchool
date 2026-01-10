'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar, MapPin, Users, Clock, Trash2, UserCheck,
  Download, Search, ChevronDown, ChevronUp,
  ExternalLink, Copy, Check, Edit, X, Ban, Eye, BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import CheckInLinkSection from '@/components/admin/CheckInLinkSection'

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

export default function EventManagementPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'>('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [cancelModal, setCancelModal] = useState<{ show: boolean; registrationId: string | null }>({ show: false, registrationId: null })
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    fetchEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

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

  const handleStatusChange = async (newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handlePromoteToConfirmed = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
      })
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error('Error promoting registration:', error)
    }
  }

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

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('האם למחוק הרשמה זו לצמיתות? פעולה זו אינה ניתנת לביטול.')) return

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchEvent()
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
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-bold text-gray-900">האירוע לא נמצא</h2>
        <p className="text-gray-500">ייתכן שהאירוע נמחק או שאין לך הרשאה לצפות בו</p>
        <button
          onClick={() => router.push('/admin/events')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          חזרה לרשימת האירועים
        </button>
      </div>
    )
  }

  const filteredRegistrations = event.registrations.filter(reg => {
    const matchesSearch = searchTerm === '' ||
      JSON.stringify(reg.data).toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phoneNumber?.includes(searchTerm) ||
      reg.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || reg.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const confirmedCount = event.registrations.filter(r => r.status === 'CONFIRMED')
    .reduce((sum, r) => sum + r.spotsCount, 0)
  const waitlistCount = event.registrations.filter(r => r.status === 'WAITLIST')
    .reduce((sum, r) => sum + r.spotsCount, 0)
  const totalCapacity = event.totalCapacity || event.capacity
  const spotsLeft = totalCapacity - confirmedCount

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string; icon: string }> = {
      OPEN: { text: 'פתוח', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: '✅' },
      PAUSED: { text: 'מושהה', className: 'bg-amber-50 text-amber-700 border border-amber-200', icon: '⏸️' },
      CLOSED: { text: 'סגור', className: 'bg-slate-50 text-slate-700 border border-slate-200', icon: '🚫' },
    }
    const { text, className, icon } = statusMap[status] || statusMap.CLOSED
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${className}`}>
        <span>{icon}</span>
        <span>{text}</span>
      </span>
    )
  }

  const getRegistrationStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      CONFIRMED: { text: 'אושר', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      WAITLIST: { text: 'רשימת המתנה', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
      CANCELLED: { text: 'בוטל', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
    }
    const { text, className } = statusMap[status] || statusMap.CANCELLED
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${className}`}>
        {text}
      </span>
    )
  }

  // Helper function to get field label from fieldsSchema
  const getFieldLabel = (fieldKey: string): string => {
    if (!event?.fieldsSchema) return fieldKey

    // Check if this is a custom field (starts with "field_")
    if (fieldKey.startsWith('field_')) {
      const field = event.fieldsSchema.find((f: FieldSchema) => f.id === fieldKey)
      return field?.label || fieldKey
    }

    // Return common field labels in Hebrew
    const commonFields: Record<string, string> = {
      name: 'שם',
      phone: 'טלפון',
      email: 'אימייל',
      spotsCount: 'מספר מקומות',
      message: 'הודעה',
      notes: 'הערות'
    }

    return commonFields[fieldKey] || fieldKey
  }

  const capacityPercentage = (confirmedCount / totalCapacity) * 100

  return (
    <div className="space-y-6" dir="rtl">
      {/* ============================================
          REDESIGNED HEADER SECTION
          ============================================ */}

      {/* Event Title & Key Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-l from-blue-50 via-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Event Info */}
            <div className="flex-1 space-y-3">
              {/* Title & Status */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{event.title}</h1>
                {getStatusBadge(event.status)}
              </div>

              {/* School Badge */}
              {event.school && (
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-200 shadow-sm">
                  <span className="text-purple-600 font-semibold">🏢</span>
                  <span className="text-sm font-semibold text-purple-900">{event.school.name}</span>
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="font-medium">{event.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Capacity Stats Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 lg:min-w-[280px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">תפוסה</span>
                  <span className="text-2xl font-bold text-gray-900">{confirmedCount}/{totalCapacity}</span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 right-0 h-full rounded-full transition-all duration-500 ${
                      capacityPercentage >= 90 ? 'bg-gradient-to-l from-red-500 to-red-600' :
                      capacityPercentage >= 70 ? 'bg-gradient-to-l from-amber-500 to-amber-600' :
                      'bg-gradient-to-l from-emerald-500 to-emerald-600'
                    }`}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {spotsLeft > 0 ? `${spotsLeft} מקומות פנויים` : 'אין מקומות פנויים'}
                  </span>
                  <span className="font-semibold text-gray-700">{capacityPercentage.toFixed(0)}%</span>
                </div>

                {waitlistCount > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {waitlistCount} ברשימת המתנה
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            ACTION BUTTONS & CONTROLS
            ============================================ */}
        <div className="px-6 py-5 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: Primary Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                פעולות ראשיות
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Primary CTA: Edit Event */}
                <button
                  onClick={() => router.push(`/admin/events/${eventId}/edit`)}
                  className="group relative px-5 py-3.5 bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-xl
                           hover:from-blue-700 hover:to-blue-800 active:scale-95
                           focus:outline-none focus:ring-4 focus:ring-blue-300
                           transition-all duration-200 shadow-md hover:shadow-lg
                           flex items-center justify-center gap-2.5 text-sm font-semibold"
                  title="ערוך פרטי אירוע"
                >
                  <Edit className="w-5 h-5" />
                  <span>ערוך אירוע</span>
                </button>

                {/* Secondary: Preview */}
                <a
                  href={`/p/${event.school?.slug}/${event.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative px-5 py-3.5 bg-white text-gray-700 border-2 border-gray-300 rounded-xl
                           hover:border-gray-400 hover:bg-gray-50 active:scale-95
                           focus:outline-none focus:ring-4 focus:ring-gray-200
                           transition-all duration-200 shadow-sm hover:shadow-md
                           flex items-center justify-center gap-2.5 text-sm font-semibold"
                  title="צפה בעמוד הציבורי"
                >
                  <Eye className="w-5 h-5" />
                  <span>תצוגה מקדימה</span>
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>
              </div>

              {/* Tertiary: Attendance Management */}
              <button
                onClick={() => router.push(`/admin/events/${eventId}/attendance`)}
                className="w-full px-5 py-3.5 bg-gradient-to-l from-purple-600 to-purple-700 text-white rounded-xl
                         hover:from-purple-700 hover:to-purple-800 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-purple-300
                         transition-all duration-200 shadow-md hover:shadow-lg
                         flex items-center justify-center gap-2.5 text-sm font-semibold"
                title="ניהול נוכחות ורישום הגעה"
              >
                <BarChart3 className="w-5 h-5" />
                <span>ניהול נוכחות</span>
              </button>
            </div>

            {/* RIGHT: Registration Control */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                שליטה בהרשמות
              </h3>

              {/* Status Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-semibold">פתוח:</span> מאפשר הרשמה חדשה
                  <br />
                  <span className="font-semibold">מושהה:</span> חסום זמנית
                  <br />
                  <span className="font-semibold">סגור:</span> הושלם / בוטל
                </p>
              </div>

              {/* Status Selector */}
              <div className="relative">
                <select
                  value={event.status}
                  onChange={(e) => handleStatusChange(e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED')}
                  className="w-full appearance-none px-4 py-3.5 pr-10 border-2 border-gray-300 rounded-xl
                           text-base font-semibold text-gray-900 bg-white
                           hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200
                           transition-all duration-200 cursor-pointer shadow-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="סטטוס הרשמה לאירוע"
                >
                  <option value="OPEN">✅ פתוח להרשמה</option>
                  <option value="PAUSED">⏸️ מושהה זמנית</option>
                  <option value="CLOSED">🚫 סגור</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-600">סטטוס נוכחי:</span>
                {getStatusBadge(event.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Link Section - Redesigned */}
      <div className="bg-gradient-to-l from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ExternalLink className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">קישור להרשמה</p>
                <p className="text-xs text-emerald-700">שתף עם משתתפים פוטנציאליים</p>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border-2 border-emerald-300 p-3.5 font-mono text-sm text-gray-800 break-all select-all shadow-inner">
              {`${window.location.origin}/p/${event?.school?.slug}/${event?.slug}`}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="w-full lg:w-auto px-6 py-3.5 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white rounded-xl
                     hover:from-emerald-700 hover:to-emerald-800 active:scale-95
                     focus:outline-none focus:ring-4 focus:ring-emerald-300
                     transition-all duration-200 shadow-md hover:shadow-lg
                     flex items-center justify-center gap-2.5 text-sm font-bold whitespace-nowrap min-h-[44px]"
            aria-label="העתק קישור להרשמה"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>הועתק בהצלחה!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>העתק קישור</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Check-In Link Section */}
      <CheckInLinkSection eventId={eventId} />

      {/* ============================================
          SEARCH & FILTERS - REDESIGNED
          ============================================ */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
          חיפוש וסינון
        </h3>

        {searchTerm && searchTerm.length >= 5 && searchTerm.match(/^[A-Z0-9]+$/i) && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>מחפש לפי קוד אישור: <span className="font-mono font-bold">{searchTerm.toUpperCase()}</span></span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-7">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, טלפון או קוד אישור..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-11 pl-4 py-3 border-2 border-gray-300 rounded-xl
                         text-gray-900 bg-white placeholder-gray-400
                         hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200
                         transition-all duration-200"
                aria-label="חיפוש הרשמות"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3 relative">
            <select
              name="status"
              data-testid="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED')}
              className="w-full appearance-none px-4 py-3 pr-4 pl-10 border-2 border-gray-300 rounded-xl
                       text-gray-900 bg-white font-medium
                       hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200
                       transition-all duration-200 cursor-pointer"
              aria-label="סינון לפי סטטוס"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="CONFIRMED">✅ אושר</option>
              <option value="WAITLIST">⏳ רשימת המתנה</option>
              <option value="CANCELLED">❌ בוטל</option>
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Export Button */}
          <div className="lg:col-span-2">
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-3 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white rounded-xl
                       hover:from-emerald-700 hover:to-emerald-800 active:scale-95
                       focus:outline-none focus:ring-4 focus:ring-emerald-300
                       transition-all duration-200 shadow-md hover:shadow-lg
                       flex items-center justify-center gap-2 text-sm font-semibold min-h-[44px]"
              title="ייצא רשימת הרשמות ל-CSV"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">ייצוא CSV</span>
              <span className="sm:hidden">ייצוא</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            מציג <span className="font-bold text-gray-900">{filteredRegistrations.length}</span> מתוך <span className="font-bold text-gray-900">{event.registrations.length}</span> הרשמות
          </p>
        </div>
      </div>

      {/* ============================================
          REGISTRATIONS TABLE (Keep existing)
          ============================================ */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  פרטים
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  מקומות
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  קוד אישור
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  נרשם ב
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration, index) => (
                <React.Fragment key={registration.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => setExpandedRow(expandedRow === registration.id ? null : registration.id)}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-semibold text-gray-900">{String(registration.data.name || '')}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{registration.phoneNumber || String(registration.data.phone || '')}</div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {registration.spotsCount}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {getRegistrationStatusBadge(registration.status)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-mono">
                      <span className={`${searchTerm && registration.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-200 px-2 py-1 rounded font-bold text-gray-900' : 'text-gray-900'}`}>
                        {registration.confirmationCode}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(registration.createdAt), 'dd/MM HH:mm')}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        {registration.status === 'WAITLIST' && spotsLeft >= registration.spotsCount && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePromoteToConfirmed(registration.id)
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="אשר הרשמה"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {registration.status !== 'CANCELLED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCancelModal({ show: true, registrationId: registration.id })
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="בטל הרשמה"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRegistration(registration.id)
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="מחק לצמיתות"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {expandedRow === registration.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === registration.id && (
                    <tr>
                      <td colSpan={7} className="px-4 lg:px-6 py-4 bg-gray-50">
                        <div className="space-y-2 text-sm">
                          {Object.entries(registration.data).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-semibold text-gray-700 min-w-[100px]">{getFieldLabel(key)}:</span>
                              <span className="text-gray-900">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הרשמות</h3>
            <p className="text-gray-500">עדיין לא נרשמו משתתפים לאירוע זה</p>
          </div>
        )}
      </div>

      {/* ============================================
          CANCEL MODAL (Keep existing styling)
          ============================================ */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">ביטול הרשמה</h2>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">
              האם לבטל הרשמה זו? ההרשמה תישמר במערכת אך תסומן כמבוטלת.
            </p>

            <div className="mb-6">
              <label htmlFor="cancelReason" className="block text-sm font-semibold text-gray-700 mb-2">
                סיבת ביטול (אופציונלי)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl
                         text-gray-900 bg-white placeholder-gray-400
                         focus:border-amber-500 focus:ring-4 focus:ring-amber-200
                         transition-all duration-200"
                placeholder="למשל: נרשם ביקש לבטל בטלפון"
              />
              <p className="text-xs text-gray-500 mt-2">
                הסיבה תישמר לצורך רישום ומעקב
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelRegistration}
                className="flex-1 bg-gradient-to-l from-amber-600 to-amber-700 text-white py-3 px-4 rounded-xl
                         hover:from-amber-700 hover:to-amber-800 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-amber-300
                         transition-all duration-200 font-semibold shadow-md"
              >
                בטל הרשמה
              </button>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl
                         hover:bg-gray-300 active:scale-95
                         focus:outline-none focus:ring-4 focus:ring-gray-300
                         transition-all duration-200 font-semibold"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
