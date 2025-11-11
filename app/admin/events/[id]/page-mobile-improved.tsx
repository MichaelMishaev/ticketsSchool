'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar, MapPin, Users, Clock, Trash2, UserCheck,
  Download, Search, ChevronDown, ChevronUp,
  ExternalLink, Copy, Check, Edit, MoreVertical, X
} from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface Registration {
  id: string
  data: any
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
  status: string
  maxSpotsPerPerson: number
  fieldsSchema: any[]
  conditions?: string
  requireAcceptance: boolean
  registrations: Registration[]
  school?: {
    id: string
    name: string
    slug: string
  }
}

export default function EventManagementPageMobile() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'>('all')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    fetchEvent()
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

  const copyLink = () => {
    const url = `${window.location.origin}/p/${event?.school?.slug}/${event?.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCSV = () => {
    // CSV export logic
  }

  const handleDelete = async (registrationId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הרשמה זו?')) return

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">האירוע לא נמצא</p>
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
  const spotsLeft = event.capacity - confirmedCount

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      OPEN: { text: 'פתוח', className: 'bg-green-500 text-white' },
      PAUSED: { text: 'מושהה', className: 'bg-yellow-500 text-white' },
      CLOSED: { text: 'סגור', className: 'bg-gray-500 text-white' },
    }
    const { text, className } = statusMap[status] || statusMap.CLOSED
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${className}`}>{text}</span>
  }

  const getRegistrationStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      CONFIRMED: { text: 'אושר', className: 'bg-green-100 text-green-800 border-green-300' },
      WAITLIST: { text: 'המתנה', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      CANCELLED: { text: 'בוטל', className: 'bg-red-100 text-red-800 border-red-300' },
    }
    const { text, className } = statusMap[status] || statusMap.CANCELLED
    return <span className={`px-3 py-1 rounded-full text-sm font-medium border ${className}`}>{text}</span>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Compact Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="p-4 space-y-3">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{event.title}</h1>
              {event.gameType && (
                <p className="text-sm text-purple-600 mt-0.5">🏷️ {event.gameType}</p>
              )}
            </div>
            {getStatusBadge(event.status)}
          </div>

          {/* Organization Badge */}
          {event.school && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-purple-800">
                🏢 ארגון: {event.school.name}
              </p>
            </div>
          )}

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* Date/Time */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">מתי?</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(event.startAt)}
              </p>
            </div>

            {/* Capacity */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">מקומות</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {confirmedCount} / {event.capacity}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {spotsLeft} פנויים
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Waitlist */}
          {waitlistCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{waitlistCount} ברשימת המתנה</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom of header */}
        <div className="border-t border-gray-200 p-3 flex gap-2">
          <button
            onClick={() => router.push(`/admin/events/${eventId}/edit`)}
            className="flex-1 bg-green-600 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 active:bg-green-700"
          >
            <Edit className="w-5 h-5" />
            ערוך
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 active:bg-blue-700"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Menu */}
        <AnimatePresence>
          {showActions && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-20"
                onClick={() => setShowActions(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 p-4 space-y-2 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">פעולות</h3>
                  <button
                    onClick={() => setShowActions(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    copyLink()
                    setShowActions(false)
                  }}
                  className="w-full bg-blue-50 text-blue-700 rounded-lg py-4 font-medium flex items-center justify-center gap-3"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'הקישור הועתק!' : 'העתק קישור'}
                </button>

                <a
                  href={`/p/${event.school?.slug}/${event.slug}`}
                  target="_blank"
                  className="w-full bg-gray-100 text-gray-700 rounded-lg py-4 font-medium flex items-center justify-center gap-3"
                  onClick={() => setShowActions(false)}
                >
                  <ExternalLink className="w-5 h-5" />
                  צפה בעמוד ציבורי
                </a>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שנה סטטוס
                  </label>
                  <select
                    value={event.status}
                    onChange={(e) => {
                      handleStatusChange(e.target.value as any)
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium"
                  >
                    <option value="OPEN">✅ פתוח להרשמה</option>
                    <option value="PAUSED">⏸️ מושהה</option>
                    <option value="CLOSED">🚫 סגור</option>
                  </select>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Filters Section */}
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון או קוד..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters Row */}
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="CONFIRMED">✅ אושר</option>
            <option value="WAITLIST">⏳ המתנה</option>
            <option value="CANCELLED">❌ בוטל</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white rounded-lg px-5 py-3 font-medium flex items-center gap-2 active:bg-green-700"
          >
            <Download className="w-5 h-5" />
            ייצא
          </button>
        </div>
      </div>

      {/* Registration Cards (NOT table!) */}
      <div className="px-4 space-y-3">
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">אין נרשמים</p>
          </div>
        ) : (
          filteredRegistrations.map((reg, index) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedCard(expandedCard === reg.id ? null : reg.id)}
                className="p-4 active:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-xs font-mono text-gray-500">{reg.confirmationCode}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {reg.data.fullName || 'לא צוין'}
                    </h3>
                    {reg.phoneNumber && (
                      <p className="text-sm text-gray-600 mt-0.5 direction-ltr text-right">
                        📱 {reg.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getRegistrationStatusBadge(reg.status)}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <UserCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">{reg.spotsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(reg.createdAt)}</span>
                  {expandedCard === reg.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedCard === reg.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-gray-200"
                  >
                    <div className="p-4 bg-gray-50 space-y-3">
                      {Object.entries(reg.data).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-sm text-gray-600 min-w-[80px]">{key}:</span>
                          <span className="text-sm font-medium text-gray-900 flex-1">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}

                      <button
                        onClick={() => handleDelete(reg.id)}
                        className="w-full mt-3 bg-red-50 text-red-700 rounded-lg py-3 font-medium flex items-center justify-center gap-2 active:bg-red-100"
                      >
                        <Trash2 className="w-5 h-5" />
                        מחק הרשמה
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
