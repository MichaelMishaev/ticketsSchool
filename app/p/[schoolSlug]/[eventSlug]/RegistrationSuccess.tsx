'use client'

import dynamic from 'next/dynamic'
import { Calendar, MapPin, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import FeedbackInline from '@/components/FeedbackInline'

const TicketGenerator = dynamic(() => import('./TicketGenerator'), { ssr: false })

interface RegistrationSuccessProps {
  event: {
    title: string
    startAt: string
    location?: string
    completionMessage?: string
    allowCancellation?: boolean
    school: {
      name: string
      primaryColor: string
    }
  }
  confirmationCode: string
  cancellationToken: string
  isWaitlist: boolean
  qrCodeImage: string | null
}

export default function RegistrationSuccess({
  event,
  confirmationCode,
  cancellationToken,
  isWaitlist,
  qrCodeImage,
}: RegistrationSuccessProps) {
  if (isWaitlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center" role="status" aria-live="polite" aria-atomic="true">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">נרשמת לרשימת המתנה</h1>
            <p className="text-lg text-gray-700 mb-3">הבקשה שלך נקלטה בהצלחה.</p>
            <p className="text-lg text-gray-700 mb-6">אם יתפנה מקום באירוע, ניצור איתך קשר.</p>

            <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
              <p className="text-base text-gray-800">
                📱 במידה ויתפנה מקום, נעדכן אותך באמצעות פרטי הקשר שהזנת.
              </p>
            </div>

            {event.completionMessage && (
              <div className="mt-6 bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <p className="text-blue-900 text-center font-bold text-lg leading-relaxed whitespace-pre-wrap">
                  {event.completionMessage}
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                קוד אישור לרשימת המתנה:{' '}
                <span className="font-mono font-bold">{confirmationCode}</span>
              </p>
            </div>

            {qrCodeImage && (
              <div className="mt-6 bg-white border-2 border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-3 text-center">
                  📱 QR לכניסה (אם יתפנה מקום)
                </p>
                <div className="flex justify-center">
                  <img
                    src={qrCodeImage}
                    alt="QR Code"
                    className="w-48 h-48 border-4 border-gray-300 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  שמור קוד זה למקרה שיתפנה מקום
                </p>
                <a
                  href={qrCodeImage}
                  download={`waitlist-${confirmationCode}.png`}
                  className="mt-3 block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                >
                  💾 הורד QR כתמונה
                </a>
              </div>
            )}

            {/* Download Full Ticket Button */}
            <TicketGenerator
              event={event}
              confirmationCode={confirmationCode}
              qrCodeImage={qrCodeImage}
              variant="waitlist"
            />

            {cancellationToken && event?.allowCancellation && (
              <div className="mt-4">
                <a
                  href={`/cancel/${cancellationToken}`}
                  className="block text-center text-sm text-red-600 hover:text-red-700 underline"
                >
                  לביטול ההזמנה לחץ כאן
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center" role="status" aria-live="polite" aria-atomic="true">
          <div
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה הושלמה בהצלחה!</h1>
          <p className="text-gray-600 mb-6">המקום שלך נשמר לאירוע</p>

          {event.completionMessage && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
              <p className="text-blue-900 text-center font-bold text-lg leading-relaxed whitespace-pre-wrap">
                {event.completionMessage}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">קוד אישור</p>
            <p
              className="text-3xl font-bold text-gray-900 font-mono"
              data-testid="confirmation-code"
            >
              {confirmationCode}
            </p>
          </div>

          {qrCodeImage && (
            <div className="mb-6 bg-white border-2 border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-3 text-center">📱 QR לכניסה לאירוע</p>
              <div className="flex justify-center">
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  className="w-48 h-48 border-4 border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">הצג קוד זה בכניסה לאירוע</p>
              <a
                href={qrCodeImage}
                download={`ticket-${confirmationCode}.png`}
                className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                💾 הורד QR כתמונה
              </a>
            </div>
          )}

          <div className="text-right space-y-2">
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', {
                    locale: he,
                  })}
                </p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{event.location}</p>
              </div>
            )}
          </div>

          {/* Download Full Ticket Button */}
          <TicketGenerator
            event={event}
            confirmationCode={confirmationCode}
            qrCodeImage={qrCodeImage}
            variant="confirmed"
          />

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">💡 מומלץ להוריד את הכרטיס לשמירה במכשיר</p>
          </div>

          {cancellationToken && event.allowCancellation && (
            <div className="mt-4">
              <a
                href={`/cancel/${cancellationToken}`}
                className="block text-center text-sm text-red-600 hover:text-red-700 underline"
              >
                לביטול ההזמנה לחץ כאן
              </a>
            </div>
          )}

          <div className="mt-4">
            <FeedbackInline />
          </div>
        </div>
      </div>
    </div>
  )
}
