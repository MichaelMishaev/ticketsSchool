'use client'

import { useSearchParams } from 'next/navigation'
import { XCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { Suspense } from 'react'

// Error code mapping to prevent XSS
const ERROR_MESSAGES: Record<string, string> = {
  'card_declined': 'כרטיס האשראי נדחה על ידי החברה המנפיקה',
  'insufficient_funds': 'יתרה לא מספקת בכרטיס',
  'invalid_card': 'פרטי הכרטיס שגויים או לא תקינים',
  'expired_card': 'תוקף הכרטיס פג',
  'generic': 'התשלום נדחה - אנא נסה שוב',
  'timeout': 'פג הזמן לביצוע התשלום',
  'amount_mismatch': 'שגיאה בסכום התשלום - אנא נסה שוב',
  'default': 'התשלום לא עבר בהצלחה'
}

function isValidReturnUrl(url: string): boolean {
  if (!url || url === '/') return true

  // Only allow relative paths
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }

  // Or same-origin URLs
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    return parsed.origin === (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  } catch {
    return false
  }
}

function FailedContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('code') || searchParams.get('error') || 'default'
  const error = ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default
  const rawReturnUrl = searchParams.get('return') || '/'
  const returnUrl = isValidReturnUrl(rawReturnUrl) ? rawReturnUrl : '/'
  const rawRetryUrl = searchParams.get('retry') || returnUrl
  const retryUrl = isValidReturnUrl(rawRetryUrl) ? rawRetryUrl : returnUrl

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            התשלום נכשל
          </h1>
          <p className="text-gray-600">
            לא הצלחנו לבצע את התשלום
          </p>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                סיבת הכשל:
              </p>
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>

        {/* Common Reasons */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            סיבות אפשריות לכשל:
          </p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>יתרה לא מספקת בכרטיס</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>פרטי כרטיס שגויים</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>הכרטיס נחסם או פג תוקף</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>בעיית תקשורת עם חברת האשראי</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={retryUrl}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            נסה שוב
          </a>
          <a
            href={returnUrl}
            className="block w-full py-3 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            חזור לדף האירוע
          </a>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            צריך עזרה? צור קשר עם התמיכה שלנו
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    }>
      <FailedContent />
    </Suspense>
  )
}
