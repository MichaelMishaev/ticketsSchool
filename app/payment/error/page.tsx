'use client'

import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Info, Home } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'אירעה שגיאה לא צפויה'
  const details = searchParams.get('details')
  const returnUrl = searchParams.get('return') || '/'

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            אירעה שגיאה בעיבוד התשלום
          </h1>
          <p className="text-gray-600">
            משהו השתבש בתהליך התשלום
          </p>
        </div>

        {/* Error Message */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                פרטי השגיאה:
              </p>
              <p className="text-sm text-yellow-700">
                {error}
              </p>
              {details && (
                <p className="text-xs text-yellow-600 mt-2">
                  {details}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* What Happened */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            מה קרה?
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            התשלום לא הושלם עקב שגיאה טכנית. אל דאגה - כרטיס האשראי שלך לא חויב.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            ניתן לנסות שוב, או ליצור קשר עם התמיכה הטכנית לקבלת עזרה.
          </p>
        </div>

        {/* What to Do */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-3">
            מה עושים עכשיו?
          </p>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>בדוק את החיבור לאינטרנט</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>נסה שוב בעוד כמה דקות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>אם השגיאה חוזרת, צור קשר עם התמיכה</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={returnUrl}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-bold rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all"
          >
            <Home className="w-4 h-4" />
            חזור לדף האירוע
          </a>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            השגיאה ממשיכה להופיע?
          </p>
          <a
            href="mailto:support@ticketcap.com"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            צור קשר עם התמיכה הטכנית
          </a>
        </div>

        {/* Error Code (if provided) */}
        {details && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              קוד שגיאה: {details}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
