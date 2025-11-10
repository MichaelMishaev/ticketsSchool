'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar, MapPin, Users, Clock, Trash2, UserCheck,
  Download, Search, ChevronDown, ChevronUp,
  ExternalLink, Copy, Check, Edit
} from 'lucide-react'
import { format } from 'date-fns'

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

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('האם למחוק הרשמה זו?')) return

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
    const link = `${window.location.origin}/p/${event?.slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">טוען פרטי אירוע...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center">
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
      OPEN: { text: 'פתוח', className: 'bg-green-100 text-green-800' },
      PAUSED: { text: 'מושהה', className: 'bg-yellow-100 text-yellow-800' },
      CLOSED: { text: 'סגור', className: 'bg-gray-100 text-gray-800' },
    }
    const { text, className } = statusMap[status] || statusMap.CLOSED
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{text}</span>
  }

  const getRegistrationStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      CONFIRMED: { text: 'אושר', className: 'bg-green-100 text-green-800' },
      WAITLIST: { text: 'רשימת המתנה', className: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { text: 'בוטל', className: 'bg-red-100 text-red-800' },
    }
    const { text, className } = statusMap[status] || statusMap.CANCELLED
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{text}</span>
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{event.title}</h1>
              {getStatusBadge(event.status)}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {event.school && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200">
                    🏫 בית ספר: {event.school.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {confirmedCount} / {event.capacity} נרשמים ({spotsLeft} מקומות פנויים)
              </div>
              {waitlistCount > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {waitlistCount} מקומות ברשימת המתנה
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/events/${eventId}/edit`)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                ערוך
              </button>
              <button
                onClick={copyLink}
                className="flex-1 sm:flex-initial px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'הועתק!' : 'העתק קישור'}
              </button>
              <a
                href={`/p/${event.slug}`}
                target="_blank"
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                צפה
              </a>
            </div>

            <select
              value={event.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="OPEN">פתוח להרשמה</option>
              <option value="PAUSED">מושהה</option>
              <option value="CLOSED">סגור</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        {searchTerm && searchTerm.length >= 5 && searchTerm.match(/^[A-Z0-9]+$/i) && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              🔍 מחפש לפי קוד אישור: <span className="font-mono font-bold">{searchTerm.toUpperCase()}</span>
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, טלפון או קוד אישור (כמו OF9ZEC)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="CONFIRMED">אושר</option>
            <option value="WAITLIST">רשימת המתנה</option>
            <option value="CANCELLED">בוטל</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            ייצא CSV
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פרטים
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מקומות
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קוד אישור
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נרשם ב
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration, index) => (
                <React.Fragment key={registration.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRow(expandedRow === registration.id ? null : registration.id)}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{registration.data.name}</div>
                        <div className="text-gray-500 text-xs">{registration.phoneNumber || registration.data.phone}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.spotsCount}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getRegistrationStatusBadge(registration.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono">
                      <span className={`${searchTerm && registration.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-200 px-1 py-0.5 rounded font-bold text-gray-900' : 'text-gray-900'}`}>
                        {registration.confirmationCode}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(registration.createdAt), 'dd/MM HH:mm')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        {registration.status === 'WAITLIST' && spotsLeft >= registration.spotsCount && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePromoteToConfirmed(registration.id)
                            }}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="אשר הרשמה"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRegistration(registration.id)
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-gray-600"
                        >
                          {expandedRow === registration.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === registration.id && (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-6 py-4 bg-gray-50">
                        <div className="space-y-2 text-sm">
                          {Object.entries(registration.data).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium text-gray-700">{key}:</span>
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
          <div className="text-center py-8 text-gray-500">
            אין נרשמים
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'