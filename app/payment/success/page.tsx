'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar, MapPin, Download } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

function isValidReturnUrl(url: string): boolean {
  if (!url || url === '/') return true

  // Only allow relative paths
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }

  // Or same-origin URLs
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    )
    return (
      parsed.origin ===
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    )
  } catch {
    return false
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''
  const qrCode = searchParams.get('qr')
  const eventTitle = searchParams.get('event') || 'האירוע'
  const eventDate = searchParams.get('date')
  const eventLocation = searchParams.get('location')
  const rawReturnUrl = searchParams.get('return') || '/'
  const returnUrl = isValidReturnUrl(rawReturnUrl) ? rawReturnUrl : '/'

  // Track payment completion in Google Analytics
  useEffect(() => {
    if (code) {
      trackEvent({
        action: 'payment_completed',
        category: 'payment',
        label: eventTitle,
        additionalParams: {
          confirmation_code: code,
          event_title: eventTitle,
        },
      })
    }
  }, [code, eventTitle])

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">התשלום בוצע בהצלחה!</h1>
          <p className="text-gray-600">ההזמנה שלך אושרה והמקום שלך נשמר</p>
        </div>

        {/* Confirmation Code */}
        {code && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-green-200">
            <p className="text-sm text-gray-500 mb-2 text-center">קוד אישור</p>
            <p className="text-3xl font-bold text-gray-900 font-mono text-center tracking-wider">
              {code}
            </p>
          </div>
        )}

        {/* QR Code */}
        {qrCode && (
          <div className="mb-6 bg-white border-2 border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-500 mb-3 text-center">QR לכניסה לאירוע</p>
            <div className="flex justify-center mb-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-48 h-48 border-4 border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mb-3">הצג קוד זה בכניסה לאירוע</p>
            <a
              href={qrCode}
              download={`ticket-${code}.png`}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              הורד QR כתמונה
            </a>
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-3 mb-6 text-right">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{eventTitle}</p>
              {eventDate && <p className="text-sm text-gray-600 mt-1">{eventDate}</p>}
            </div>
          </div>
          {eventLocation && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{eventLocation}</p>
            </div>
          )}
        </div>

        {/* Success Tips */}
        <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
          <p className="text-sm text-green-800 text-center">💡 מומלץ לצלם מסך זה לשמירה</p>
        </div>

        {/* Return Button */}
        <a
          href={returnUrl}
          className="block w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-center"
        >
          חזור לדף האירוע
        </a>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
