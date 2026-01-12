'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, Calendar, MapPin, Users, Ticket, AlertCircle, CheckCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { ToastContainer, toast } from '@/components/ui/Toast'

interface CancellationData {
  canCancel: boolean
  error?: string
  registration?: {
    id: string
    confirmationCode: string
    status: 'CONFIRMED' | 'WAITLIST'
    guestsCount: number | null
    spotsCount: number | null
    phoneNumber: string | null
    data: any
  }
  event?: {
    title: string
    startAt: string
    location: string | null
    eventType: 'CAPACITY_BASED' | 'TABLE_BASED'
    requireCancellationReason: boolean
  }
  hoursUntilEvent?: number
}

export default function CancellationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CancellationData | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  // Modal state
  const [confirmModal, setConfirmModal] = useState(false)
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({ isOpen: false, title: '', message: '' })

  // Load cancellation preview
  useEffect(() => {
    async function loadCancellationData() {
      try {
        const response = await fetch(`/api/cancel/${token}`)
        const result = await response.json()
        setData(result)
      } catch (error) {
        setData({
          canCancel: false,
          error: 'Failed to load cancellation details'
        })
      } finally {
        setLoading(false)
      }
    }

    loadCancellationData()
  }, [token])

  // Open confirmation modal
  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data?.canCancel) return
    setConfirmModal(true)
  }

  // Actually perform cancellation
  const performCancellation = async () => {
    setConfirmModal(false)
    setSubmitting(true)

    try {
      const response = await fetch(`/api/cancel/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined })
      })

      const result = await response.json()

      if (response.ok) {
        setCancelled(true)
        toast.success('ההזמנה בוטלה בהצלחה')
      } else {
        setErrorModal({
          isOpen: true,
          title: 'שגיאה בביטול',
          message: result.error || 'לא ניתן לבטל את ההזמנה. אנא נסה שוב.'
        })
        setSubmitting(false)
      }
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: 'שגיאת חיבור',
        message: 'שגיאה בביטול ההזמנה. אנא בדוק את החיבור לאינטרנט ונסה שוב.'
      })
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ההזמנה בוטלה בהצלחה
            </h1>
            <p className="text-gray-600">
              קיבלנו את ביטול ההזמנה שלך
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              {data?.event?.eventType === 'TABLE_BASED'
                ? 'השולחן שלך שוחרר והפך להיות זמין לאורחים אחרים'
                : 'המקומות שלך שוחררו והפכו להיות זמינים לאורחים אחרים'}
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    )
  }

  // Error state
  if (!data?.canCancel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            לא ניתן לבטל הזמנה
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{data?.error}</p>
          </div>

          {data?.hoursUntilEvent !== undefined && (
            <p className="text-sm text-gray-600 mb-6">
              זמן עד תחילת האירוע: {data.hoursUntilEvent} שעות
            </p>
          )}

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

  // Cancellation form
  const { registration, event } = data

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">ביטול הזמנה</h1>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{event?.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(event!.startAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {event?.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700">{event.location}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Ticket className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-gray-700">
                  קוד אישור: <span className="font-mono font-semibold">{registration?.confirmationCode}</span>
                </p>
                <p className="text-sm text-gray-600">
                  סטטוס:{' '}
                  <span className={registration?.status === 'CONFIRMED' ? 'text-green-600' : 'text-amber-600'}>
                    {registration?.status === 'CONFIRMED' ? 'מאושר' : 'רשימת המתנה'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                {event?.eventType === 'TABLE_BASED'
                  ? `${registration?.guestsCount} אורחים`
                  : `${registration?.spotsCount} מקומות`}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                זמן עד תחילת האירוע: {data.hoursUntilEvent} שעות
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">שים לב:</p>
                <p>לאחר ביטול ההזמנה, לא תוכל לשחזר אותה.</p>
                {event?.eventType === 'TABLE_BASED' && (
                  <p className="mt-1">השולחן ישוחרר ויהיה זמין לאורחים אחרים.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleCancel} className="space-y-6">
            {/* Reason (optional or required) */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                סיבת ביטול {event?.requireCancellationReason && <span className="text-red-600">*</span>}
              </label>
              <textarea
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={event?.requireCancellationReason}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="למה אתה מבטל את ההזמנה? (אופציונלי)"
              />
              <p className="mt-1 text-xs text-gray-500">
                {event?.requireCancellationReason
                  ? 'נא לציין סיבת ביטול'
                  : 'ציון סיבה עוזר לנו לשפר את השירות'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (event?.requireCancellationReason && !reason.trim())}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'מבטל...' : 'בטל הזמנה'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              חזרה
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={performCancellation}
        type="confirmation"
        title="אישור ביטול"
        message="האם אתה בטוח שברצונך לבטל את ההזמנה? פעולה זו אינה ניתנת לביטול."
        confirmText="כן, בטל הזמנה"
        cancelText="לא, חזור"
        dir="rtl"
      />

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        type="error"
        title={errorModal.title}
        message={errorModal.message}
        dir="rtl"
      />

      {/* Toast notifications */}
      <ToastContainer position="top-center" dir="rtl" />
    </div>
  )
}
