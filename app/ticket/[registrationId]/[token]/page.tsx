'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  ArrowRight,
} from 'lucide-react'
import QRCode from 'qrcode'
import { generateQRCodeData } from '@/lib/qr-code'

interface TicketData {
  ticket: {
    id: string
    confirmationCode: string
    status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
    spotsCount: number
    createdAt: string
    name: string
    data: Record<string, unknown>
    paymentStatus: string
    amountDue: number | null
    amountPaid: number | null
    checkIn: {
      checkedInAt: string
      isLate: boolean
    } | null
    isCancelled: boolean
    cancelledAt: string | null
    cancellationToken: string
  }
  event: {
    id: string
    title: string
    startAt: string
    endAt: string
    location: string | null
    description: string | null
    checkInToken: string | null
  }
  school: {
    name: string
    slug: string
    logoUrl: string | null
  }
}

export default function TicketPage() {
  const params = useParams()
  const router = useRouter()
  const registrationId = params.registrationId as string
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)

  // Load ticket data
  useEffect(() => {
    async function loadTicket() {
      try {
        const response = await fetch(`/api/ticket/${registrationId}/${token}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to load ticket')
          return
        }

        setTicketData(result)

        // Generate QR code for staff scanning
        // The QR contains data that staff can scan to check in this user
        if (result.ticket && result.event) {
          const qrData = generateQRCodeData(result.ticket.id, result.event.id)
          const qrImage = await QRCode.toDataURL(qrData, {
            width: 280,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          })
          setQrCodeImage(qrImage)
        }
      } catch (err) {
        setError('Failed to load ticket')
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [registrationId, token])

  // Format date for Hebrew display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען כרטיס...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">כרטיס לא נמצא</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">ייתכן שהקישור פג תוקף או שהכרטיס לא קיים.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    )
  }

  if (!ticketData) return null

  const { ticket, event, school } = ticketData
  const isCheckedIn = ticket.checkIn !== null
  const isCancelled = ticket.status === 'CANCELLED'
  const isWaitlist = ticket.status === 'WAITLIST'
  const eventStarted = new Date(event.startAt) <= new Date()

  // Determine status color and icon
  const getStatusInfo = () => {
    if (isCancelled) {
      return {
        color: 'bg-gray-500',
        icon: <XCircle className="w-6 h-6" />,
        text: 'בוטל',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
      }
    }
    if (isCheckedIn) {
      return {
        color: 'bg-green-500',
        icon: <CheckCircle2 className="w-6 h-6" />,
        text: ticket.checkIn?.isLate ? 'נכנס באיחור' : 'נכנס',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
      }
    }
    if (isWaitlist) {
      return {
        color: 'bg-amber-500',
        icon: <Clock className="w-6 h-6" />,
        text: 'רשימת המתנה',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
      }
    }
    return {
      color: 'bg-blue-500',
      icon: <Ticket className="w-6 h-6" />,
      text: 'מאושר',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className={`${statusInfo.color} p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {school.logoUrl ? (
                  <Image
                    src={school.logoUrl}
                    alt={school.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full bg-white object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm opacity-90">{school.name}</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 ${statusInfo.bgColor} ${statusInfo.textColor} px-3 py-1.5 rounded-full text-sm font-medium`}
              >
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold">{event.title}</h1>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-gray-100">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{formatDate(event.startAt)}</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(event.startAt)}
                    {event.endAt && ` - ${formatTime(event.endAt)}`}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{event.location}</p>
                </div>
              )}

              {ticket.spotsCount > 1 && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{ticket.spotsCount} מקומות</p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Code */}
          <div className="p-6 border-b border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-2">קוד אישור</p>
            <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
              {ticket.confirmationCode}
            </p>
          </div>

          {/* QR Code Section */}
          {!isCancelled && qrCodeImage && (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                {isCheckedIn ? 'נכנסת לאירוע' : 'הצג קוד זה בכניסה'}
              </p>

              <div
                className={`inline-block p-4 bg-white rounded-xl shadow-inner border-2 ${isCheckedIn ? 'border-green-200 opacity-75' : 'border-gray-200'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  className={`w-[200px] h-[200px] ${isCheckedIn ? 'grayscale' : ''}`}
                />
              </div>

              {isCheckedIn && ticket.checkIn && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      נכנסת בשעה {formatTime(ticket.checkIn.checkedInAt)}
                    </span>
                  </div>
                  {ticket.checkIn.isLate && (
                    <p className="text-sm text-amber-600 mt-1">כניסה באיחור</p>
                  )}
                </div>
              )}

              {isWaitlist && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-700 text-sm">
                    הנך ברשימת ההמתנה. אם יתפנה מקום נעדכן אותך.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cancelled Notice */}
          {isCancelled && (
            <div className="p-6 text-center">
              <div className="bg-gray-100 rounded-lg p-4">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">כרטיס זה בוטל</p>
                {ticket.cancelledAt && (
                  <p className="text-sm text-gray-500 mt-1">{formatDate(ticket.cancelledAt)}</p>
                )}
              </div>
            </div>
          )}

          {/* Registrant Info */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">שם הנרשם</p>
            <p className="font-medium text-gray-900">{ticket.name}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {/* Cancel Button - only show if not cancelled and event hasn't started */}
          {!isCancelled && !isCheckedIn && !eventStarted && ticket.cancellationToken && (
            <button
              onClick={() => router.push(`/cancel/${ticket.cancellationToken}`)}
              className="w-full bg-white text-red-600 border border-red-200 py-3 px-4 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              ביטול הרשמה
            </button>
          )}

          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-white text-gray-700 border border-gray-200 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה לדף הבית
          </button>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>כרטיס אישי - אל תשתף קישור זה עם אחרים</p>
        </div>
      </div>
    </div>
  )
}
